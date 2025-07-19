import json
import logging
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from typing import List, Optional

from vanna.google import GoogleGeminiChat
from vanna.chromadb import ChromaDB_VectorStore

from src import config
from src.core.chain import get_embedding_from_google, retrieve_context_from_db, generate_answer_from_gemini
from src.models.schemas import ChatRequest, ChatMessage

router = APIRouter()
logger = logging.getLogger(__name__)

class MyVanna(ChromaDB_VectorStore, GoogleGeminiChat):
    def __init__(self, config=None):
        ChromaDB_VectorStore.__init__(self, config={'path': './chroma_db'})
        GoogleGeminiChat.__init__(self, config=config)

try:
    vn = MyVanna(config={
        'api_key': config.GEMINI_API_KEY,
        'model': config.LLM_MODEL_NAME
    })
    vn.connect_to_postgres(
        host=config.DB_HOST, dbname=config.DB_NAME,
        user=config.DB_USER, password=config.DB_PASSWORD, port=config.DB_PORT
    )
    logger.info("✅ Vanna initialized successfully with local ChromaDB.")
except Exception as e:
    logger.error(f"🔥 Failed to initialize Vanna: {e}")

def format_sse(data: dict, event: str) -> str:
    """Formats a dictionary into a Server-Sent Event string."""
    return f"event: {event}\ndata: {json.dumps(data)}\n\n"

async def stream_generator(question: str, history: Optional[List[ChatMessage]] = None):
    """
    Orchestrates the RAG and Text-to-SQL process, yielding SSE events.
    """
    formatted_history = ""
    if history:
        for msg in history:
            role = "Human" if msg.role == "user" else "AI"
            formatted_history += f"{role}: {msg.content}\n"
    
    try:
        yield format_sse({"message": "Checking for relevant data..."}, "thought")
        
        sql_query_result = vn.ask(question, print_results=False)
        
        # Vanna can return a tuple (sql, dataframe) or just the sql string.
        # We only care about the SQL string for this check.
        sql_query = sql_query_result[0] if isinstance(sql_query_result, tuple) else sql_query_result

        # Add an extra check to ensure sql_query is a string before calling .upper()
        if sql_query and isinstance(sql_query, str) and "SELECT" in sql_query.upper():
            yield format_sse({"message": "Found relevant data, running query..."}, "thought")
            yield format_sse({"sql": sql_query}, "sql_query")
            df = await vn.run_sql_async(sql=sql_query)
            if df is not None:
                df_markdown = df.to_markdown(index=False)
                context = f"Here is the data I retrieved from the database to answer your question:\n\n{df_markdown}"
                yield format_sse({"message": "Formatting results..."}, "thought")
                for chunk in generate_answer_from_gemini(context, question, formatted_history):
                    yield format_sse({"text": chunk}, "stream")
            else:
                yield format_sse({"error": "I found a query but failed to execute it."}, "error")
        else:
            yield format_sse({"message": "No specific data found, searching documents..."}, "thought")
            question_embedding = get_embedding_from_google(question)
            yield format_sse({"message": "Retrieving context from documents..."}, "thought")
            context = retrieve_context_from_db(question_embedding)
            if not context:
                context = "I could not find any relevant information in the uploaded documents to answer this question."
            yield format_sse({"message": "Generating final answer..."}, "thought")
            for chunk in generate_answer_from_gemini(context, question, formatted_history):
                yield format_sse({"text": chunk}, "stream")

    except Exception as e:
        logger.error(f"Error during stream: {e}", exc_info=True)
        yield format_sse({"error": "An unexpected error occurred in the Analyst's department."}, "error")
    finally:
        yield format_sse({}, "done")

@router.post("/chat")
async def analyse(chat_request: ChatRequest):
    """The main chat endpoint that orchestrates the analysis."""
    try:
        return StreamingResponse(
            stream_generator(chat_request.question, chat_request.history),
            media_type="text/event-stream"
        )
    except Exception as e:
        logger.error(f"Failed to start stream: {e}")
        raise HTTPException(status_code=500, detail="Failed to start analysis stream.")
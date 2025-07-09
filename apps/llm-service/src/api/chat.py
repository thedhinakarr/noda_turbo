# src/api/chat.py
import json
import logging
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse

from src.core.chain import (
    get_embedding_from_google,
    retrieve_context_from_db,
    generate_answer_from_gemini,
)
from src.models.schemas import ChatRequest

router = APIRouter()
logger = logging.getLogger(__name__)

def format_sse(data: dict, event: str) -> str:
    return f"event: {event}\ndata: {json.dumps(data)}\n\n"

async def stream_generator(question: str):
    """
    The generator that orchestrates the manual RAG process and yields SSE events.
    """
    try:
        # Step 1: Create the embedding (The point of failure)
        yield format_sse({"message": "Creating embedding for question..."}, "thought")
        question_embedding = get_embedding_from_google(question)

        # Step 2: Retrieve context from the database
        yield format_sse({"message": "Retrieving context from database..."}, "thought")
        context = retrieve_context_from_db(question_embedding)

        # Step 3: Generate the final answer
        yield format_sse({"message": "Generating final answer..."}, "thought")
        for chunk in generate_answer_from_gemini(context, question):
            yield format_sse({"text": chunk}, "stream")

    except Exception as e:
        logger.error(f"Error during stream: {e}", exc_info=True)
        yield format_sse({"error": "An error occurred in the Analyst's department."}, "error")

    finally:
        yield format_sse({"status": "complete"}, "done")

@router.post("/chat")
async def analyse(chat_request: ChatRequest):
    try:
        return StreamingResponse(
            stream_generator(chat_request.question),
            media_type="text/event-stream"
        )
    except Exception as e:
        logger.error(f"Failed to start stream: {e}")
        raise HTTPException(status_code=500, detail="Failed to start analysis stream.")
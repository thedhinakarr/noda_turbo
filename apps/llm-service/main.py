import os
import json
import uvicorn
import asyncpg
import google.generativeai as genai
from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import StreamingResponse
from pgvector.asyncpg import register_vector
from pydantic import BaseModel, Field
import logging

# --- Production-Grade Setup ---
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

DATABASE_URL = os.getenv("DATABASE_URL")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
PORT = int(os.getenv("PORT", 5001))

if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

class ChatRequest(BaseModel):
    message: str
    dashboardContext: dict = Field(default_factory=dict)

db_pool = None

async def get_db_pool():
    global db_pool
    if db_pool is None:
        try:
            db_pool = await asyncpg.create_pool(dsn=DATABASE_URL)
        except Exception as e:
            logger.error(f"FATAL: Could not connect to the database: {e}")
            raise
    return db_pool

# --- Core Functions ---
async def get_embedding(text: str) -> list[float]:
    result = await genai.embed_content_async(
        model="models/text-embedding-004", content=text, task_type="RETRIEVAL_QUERY"
    )
    return result['embedding']

async def query_vector_db(query_embedding: list[float], pool) -> list[str]:
    async with pool.acquire() as connection:
        await register_vector(connection)
        results = await connection.fetch(
            "SELECT content FROM knowledge_embeddings ORDER BY embedding <=> $1 LIMIT 5;",
            query_embedding
        )
        return [row['content'] for row in results]

def construct_prompt(req: ChatRequest, retrieved_knowledge: list[str]) -> str:
    context_str = json.dumps(req.dashboardContext, indent=2)
    knowledge_str = "\n".join(f"- {item}" for item in retrieved_knowledge)
    return f"""
    **Persona:** You are NODA's most senior Thermal Systems Analyst. Your goal is not just to answer questions, but to provide proactive, actionable insights. You are direct, concise, and always provide a recommendation.

    **Context:**
    1.  **User's Question:** "{req.message}"
    2.  **Retrieved Historical Data:**
        ```
        {knowledge_str}
        ```
    3.  **Real-Time Dashboard Context:**
        ```json
        {context_str}
        ```

    **Your Task:**
    1.  **Synthesize:** Do not just list the data. Synthesize all context into a single, coherent analysis.
    2.  **Formulate a Key Insight:** What is the single most important conclusion from this data? Start your response with this insight.
    3.  **Provide Actionable Recommendations:** Based on your insight, what should the user do next? What should they investigate?
    4.  **Structure Your Response:**
        - **Insight:** A one-sentence summary of your main finding.
        - **Analysis:** A brief explanation of how you reached this conclusion, referencing the data.
        - **Recommendation:** 1-2 bullet points for next steps.

    **Begin your response now.**
    """

# --- FastAPI Application ---
app = FastAPI(title="NODA LLM Service")

@app.get("/health", status_code=200)
async def health_check():
    return {"status": "ok"}

@app.on_event("startup")
async def startup_event():
    if not GEMINI_API_KEY:
        logger.error("FATAL: GEMINI_API_KEY environment variable not set.")
        raise ValueError("GEMINI_API_KEY environment variable not set.")
    await get_db_pool()
    logger.info("LLM Service is ready.")

@app.post("/api/v1/chat")
async def chat_endpoint(req: ChatRequest):
    try:
        # --- NEW LOGGING ---
        logger.info(f"Received new request: '{req.message}'")

        pool = await get_db_pool()
        query_embedding = await get_embedding(req.message)
        retrieved_knowledge = await query_vector_db(query_embedding, pool)

        # --- NEW LOGGING ---
        logger.info(f"Retrieved {len(retrieved_knowledge)} documents from the vector database.")
        for i, doc in enumerate(retrieved_knowledge):
            logger.info(f"  [Doc {i+1}]: {doc[:100]}...") # Log the first 100 chars of each doc

        final_prompt = construct_prompt(req, retrieved_knowledge)

        generation_model = genai.GenerativeModel('gemini-1.5-flash')

        async def stream_generator():
            stream = await generation_model.generate_content_async(final_prompt, stream=True)
            async for chunk in stream:
                if chunk.text:
                    yield f"data: {json.dumps({'text': chunk.text})}\n\n"

        return StreamingResponse(stream_generator(), media_type="text/event-stream")

    except Exception as e:
        logger.error(f"An error occurred in chat_endpoint: {e}", exc_info=True)
        async def error_stream():
            yield f"data: {json.dumps({'error': 'An internal error occurred in the LLM service.'})}\n\n"
        return StreamingResponse(error_stream(), media_type="text/event-stream", status_code=500)
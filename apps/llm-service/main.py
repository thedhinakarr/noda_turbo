import os
import json
import uvicorn
import asyncpg
import google.generativeai as genai
from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import StreamingResponse
from pgvector.asyncpg import register_vector
from pydantic import BaseModel, Field

# --- Configuration from docker-compose.yml ---
DATABASE_URL = os.getenv("DATABASE_URL")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
PORT = int(os.getenv("PORT", 5001))

# Configure the Gemini client
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

# --- Pydantic Models for Type-Safe Requests ---
class ChatRequest(BaseModel):
    message: str
    dashboardContext: dict = Field(default_factory=dict)

# --- Database Connection ---
db_pool = None

async def get_db_pool():
    global db_pool
    if db_pool is None:
        db_pool = await asyncpg.create_pool(dsn=DATABASE_URL)
    return db_pool

# --- Core Service Functions ---
async def get_embedding(text: str) -> list[float]:
    """Generates an embedding for the user's query."""
    result = await genai.embed_content_async(
        model="models/text-embedding-004",
        content=text,
        task_type="RETRIEVAL_QUERY"
    )
    return result['embedding']

async def query_vector_db(query_embedding: list[float], pool) -> list[str]:
    """Queries the vector DB to find relevant knowledge."""
    async with pool.acquire() as connection:
        await register_vector(connection)
        results = await connection.fetch(
            """
            SELECT text_chunk FROM knowledge_library
            ORDER BY embedding <=> $1
            LIMIT 5;
            """,
            query_embedding
        )
        return [row['text_chunk'] for row in results]

def construct_prompt(req: ChatRequest, retrieved_knowledge: list[str]) -> str:
    """Constructs the hyper-contextual prompt for Gemini."""
    context_str = json.dumps(req.dashboardContext, indent=2)
    knowledge_str = "\n".join(f"- {item}" for item in retrieved_knowledge)
    return f"""You are an expert AI assistant for NODA.
User's Question: {req.message}
Real-Time Dashboard Context: {context_str}
Retrieved Historical Knowledge: {knowledge_str}
Based on all this, provide a comprehensive answer."""

# --- FastAPI Application ---
app = FastAPI(title="NODA LLM Service")

@app.on_event("startup")
async def startup_event():
    if not GEMINI_API_KEY:
        raise ValueError("GEMINI_API_KEY environment variable not set.")
    await get_db_pool()
    print("LLM Service is ready.")

@app.post("/api/v1/chat")
async def chat_endpoint(req: ChatRequest):
    """Main entry point for the Expert Analyst."""
    pool = await get_db_pool()
    query_embedding = await get_embedding(req.message)
    retrieved_knowledge = await query_vector_db(query_embedding, pool)
    final_prompt = construct_prompt(req, retrieved_knowledge)

    generation_model = genai.GenerativeModel('gemini-1.5-flash')
    
    async def stream_generator():
        stream = await generation_model.generate_content_async(final_prompt, stream=True)
        async for chunk in stream:
            if chunk.text:
                yield f"data: {json.dumps({'text': chunk.text})}\n\n"

    return StreamingResponse(stream_generator(), media_type="text/event-stream")

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=PORT)
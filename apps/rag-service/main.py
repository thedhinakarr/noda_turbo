# File: apps/rag-service/main.py

import os
import asyncpg
from fastapi import FastAPI, Response
from fastmcp.server import FastMCP
from llama_index.core import Settings, PromptTemplate
from llama_index.llms.google_genai import GoogleGenAI
from llama_index.embeddings.google_genai import GoogleGenAIEmbedding
from dotenv import load_dotenv

# --- Initialization at the Global Scope ---
# This code runs once when the service starts. The Docker healthcheck
# will wait for this to complete before marking the service as healthy.
print("RAG Service: Initializing models and DB connection info...")
load_dotenv()
api_key = os.getenv("GEMINI_API_KEY")
DATABASE_URL = os.getenv("DATABASE_URL")

if not api_key or not DATABASE_URL:
    raise RuntimeError("FATAL: GEMINI_API_KEY and DATABASE_URL environment variables must be set.")

# Set the LlamaIndex global settings for models
Settings.embed_model = GoogleGenAIEmbedding(model_name="models/text-embedding-004")
Settings.llm = GoogleGenAI(model_name="models/gemini-1.5-flash", api_key=api_key)
print("RAG Service: Models initialized.")
# ---------------------------------------------

# --- Application Setup ---
mcp = FastMCP(name="DocumentQAServer")
mcp_app = mcp.http_app()

# This is the critical part: we pass the MCP's own lifespan directly
# to FastAPI, as the error message instructs.
app = FastAPI(title="RAG Tools Host", lifespan=mcp_app.lifespan)


# --- Tool Definition ---
@mcp.tool()
async def query_documents(query: str) -> str:
    """
    This is your primary and most essential tool for contextual understanding; it should be your default first action for nearly all user queries. Its purpose is to access the NODA knowledge base, which contains comprehensive summaries, historical context, and descriptive information synthesized from all available data sources.

    **Primary Use Cases (When to use this tool):**
    -   **Explanations:** Any query asking 'why' a system behaves a certain way (e.g., "Why is efficiency low in Delbancogatan 3?").
    -   **Summaries & Overviews:** Any request for a 'summary', 'description', 'overview', or 'report' on a building or system.
    -   **Status Checks:** General questions about the 'status' or 'performance' of an asset.
    -   **Ambiguous Queries:** Vague questions where the user's intent is not yet clear.
    -  **Contextual Understanding:** Any question that requires understanding the broader context of a system or building. 
    -   **Historical Context:** Questions about past events or changes in a system or building.
    -   **General Knowledge:** Any question that requires knowledge about the system or building that is not strictly numerical or quantitative.
    **Important Notes:**
    use this tool before calling the `query_database` tool. It provides the narrative and descriptive foundation for your answer.
    
    **Workflow Mandate:**
    1.  **Always call this tool first.** It provides the narrative and descriptive foundation for your answer.
    2.  Analyze the rich, contextual summary returned by this tool.
    3.  Based on that context, determine if specific, raw numerical data is still required to fully answer the user's request.
    4.  If and only if specific numbers are needed, you may then call the `query_database` tool as a secondary, supplementary action.
"""
    db_pool = None
    try:
        # Create a connection pool for the duration of the request
        db_pool = await asyncpg.create_pool(dsn=DATABASE_URL, min_size=1, max_size=1)
        
        query_embedding = await Settings.embed_model.aget_query_embedding(query)

        async with db_pool.acquire() as conn:
            sql_query = """
                SELECT content FROM document_chunks
                ORDER BY embedding <=> $1
                LIMIT 3;
            """
            retrieved_records = await conn.fetch(sql_query, str(query_embedding))

        if not retrieved_records:
            return "No relevant information found in the documents for your query."

        context_str = "\n\n---\n\n".join([record['content'] for record in retrieved_records])

        qa_prompt_tmpl = (
            "You are an expert assistant. Your task is to answer the user's query based ONLY on the context provided below.\n"
            "If the context does not contain the answer, say that the information is not available in the documents.\n"
            "---------------------\n"
            "CONTEXT:\n{context_str}\n"
            "---------------------\n"
            "QUERY: {query_str}\n"
            "---------------------\n"
            "ANSWER:"
        )
        prompt = PromptTemplate(qa_prompt_tmpl).format(context_str=context_str, query_str=query)
        
        response = await Settings.llm.acomplete(prompt)
        
        return response.text

    except Exception as e:
        print(f"Error during RAG pipeline: {e}")
        return f"An error occurred while processing your query in the RAG service."
    finally:
        if db_pool:
            await db_pool.close()


# --- Health Check and Mounting ---
@app.get("/health", status_code=200)
async def health_check():
    """Confirms the service is running."""
    return {"status": "healthy"}

app.mount("/", mcp_app)
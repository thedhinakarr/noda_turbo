# src/main.py
from fastapi import FastAPI
from src.api.chat import router as chat_router

app = FastAPI(
    title="NODA LLM Service",
    version="2.1.0",
    description="The Expert Analyst for NODA Copilot, powered by FastAPI and LangChain."
)

# All routes defined in chat.py will be prefixed with /api/v1
app.include_router(chat_router, prefix="/api/v1")

@app.get("/health", tags=["Monitoring"])
def health_check():
    """Health check endpoint to verify the service is running."""
    return {"status": "ok"}
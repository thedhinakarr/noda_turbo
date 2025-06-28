from fastapi import FastAPI
from pydantic import BaseModel
import time
import json
from typing import Optional # <-- FIX: Import 'Optional' for older Python versions

# Define the data model for the incoming request from the frontend.
class ChatRequest(BaseModel):
    message: str
    # FIX: Use Optional[str] for compatibility with Python 3.9
    context: Optional[str] = None

# Create the FastAPI application instance
app = FastAPI()

# Define the main chat endpoint
@app.post("/api/v1/chat")
async def chat(request: ChatRequest):
    """
    This endpoint receives a user's message and the dashboard context.
    For now, it returns a hardcoded placeholder response.
    """
    print("Received message:", request.message)
    if request.context:
        try:
            context_data = json.loads(request.context)
            print("Received context:", context_data.get('selectedSystem', {}).get('name'))
        except json.JSONDecodeError:
            print("Received invalid context format")

    time.sleep(1.5)

    return {
        "response": "This is a placeholder response from the Python LLM service. The connection is working!"
    }

# A simple root endpoint to confirm the service is running
@app.get("/")
def read_root():
    return {"status": "NODA LLM Service is running"}


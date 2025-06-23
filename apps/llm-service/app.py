# =================================================================
# FILE: apps/llm-service/app.py
# (Create this new file)
# =================================================================
from fastapi import FastAPI
from pydantic import BaseModel

# Initialize the FastAPI app
app = FastAPI()

# Define the request body model for the chat endpoint
class ChatRequest(BaseModel):
    message: str

@app.get("/")
def read_root():
    return {"message": "LLM Service is running"}

@app.post("/api/chat")
def chat_with_llm(request: ChatRequest):
    """
    Placeholder for chat functionality.
    In a real application, this is where you would:
    1. Get the user's message from request.message.
    2. Fetch context from the PostgreSQL database.
    3. Construct a detailed prompt.
    4. Call the external LLM (e.g., Gemini API).
    5. Return the LLM's response.
    """
    print(f"Received message: {request.message}")
    
    # Return a dummy response for now
    return {"response": f"The LLM has received your message: '{request.message}'"}
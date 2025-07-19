from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional

class ChatMessage(BaseModel):
    """Schema for a single message in the chat history."""
    role: str # Should be 'user' or 'assistant'
    content: str

class ChatRequest(BaseModel):
    """Schema for the incoming chat request."""
    # This tells Pydantic to ignore any extra fields in the request
    model_config = ConfigDict(extra='ignore')

    question: str = Field(..., min_length=1, description="The user's question to the AI.")
    # Add an optional field for the history, which is a list of ChatMessage objects
    history: Optional[List[ChatMessage]] = None
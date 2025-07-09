# src/models/schemas.py
from pydantic import BaseModel, Field, ConfigDict

class ChatRequest(BaseModel):
    """Schema for the incoming chat request."""
    # This tells Pydantic to ignore any extra fields in the request
    model_config = ConfigDict(extra='ignore')

    question: str = Field(..., min_length=1, description="The user's question to the AI.")
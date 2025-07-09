# src/config.py
import os

# Use the complete DATABASE_URL provided by docker-compose
DATABASE_URL = os.environ.get("DATABASE_URL")
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")

# --- Application Constants ---
# The name of your table in PostgreSQL
COLLECTION_NAME = "document_chunks"

# The model used for generation
LLM_MODEL_NAME = "gemini-2.5-pro"
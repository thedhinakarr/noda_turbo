import os

# --- Vanna Database Connection ---
DB_HOST = os.getenv("DB_HOST", "db")
DB_PORT = os.getenv("DB_PORT", "5432")
DB_USER = os.getenv("DB_USER")
DB_PASSWORD = os.getenv("DB_PASSWORD")
DB_NAME = os.getenv("DB_NAME")
DATABASE_URL = os.environ.get("DATABASE_URL", f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}")

# --- API Keys & Models ---
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")

# --- Application Constants ---
COLLECTION_NAME = "document_chunks"
# MODIFIED: Use a reliable, modern Gemini model
LLM_MODEL_NAME = "gemini-1.5-flash-latest"
VANNA_MODEL_NAME = "noda_turbo_model"
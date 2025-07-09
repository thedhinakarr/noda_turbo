# src/core/chain.py
import psycopg2
import google.generativeai as genai
from src import config

# Configure the Google client once
genai.configure(api_key=config.GEMINI_API_KEY)

def get_embedding_from_google(text: str) -> list[float]:
    """
    Generates an embedding for a given text using the Google GenAI SDK.
    This is the function that is currently timing out.
    """
    print(f"--- Calling Google to embed query: '{text[:50]}...' ---")
    result = genai.embed_content(
        model="models/text-embedding-004",
        content=text
    )
    return result['embedding']

def retrieve_context_from_db(question_embedding: list[float]) -> str:
    """
    Connects to Postgres and retrieves relevant documents using psycopg2.
    """
    print("--- Connecting to DB to retrieve context ---")
    conn = None
    try:
        conn = psycopg2.connect(config.DATABASE_URL)
        cur = conn.cursor()
        
        # The vector similarity search query
        cur.execute(
            f"SELECT content FROM {config.COLLECTION_NAME} ORDER BY embedding <=> %s::vector LIMIT 3",
            (str(question_embedding),)
        )
        results = [row[0] for row in cur.fetchall()]
        
        cur.close()
        return "\n".join(results)
    finally:
        if conn:
            conn.close()

def generate_answer_from_gemini(context: str, question: str):
    """
    Generates a streaming answer from the Gemini LLM using the Google GenAI SDK.
    """
    print("--- Calling Gemini to generate final answer ---")
    template = f"""
    You are an expert analyst. Answer the user's question based on the provided context.

    Context:
    {context}

    Question: {question}

    Answer:
    """
    llm = genai.GenerativeModel(config.LLM_MODEL_NAME)
    response_stream = llm.generate_content(template, stream=True)
    for chunk in response_stream:
        yield chunk.text
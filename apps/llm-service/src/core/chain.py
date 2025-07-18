import psycopg2
import google.generativeai as genai
from src import config

# Configure the Google client once
genai.configure(api_key=config.GEMINI_API_KEY)

def get_embedding_from_google(text: str) -> list[float]:
    """
    Generates an embedding for a given text using the Google GenAI SDK.
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

# MODIFIED: Added 'history' parameter with a default value
def generate_answer_from_gemini(context: str, question: str, history: str = ""):
    """
    Generates a streaming answer from the Gemini LLM, now including conversation history.
    """
    print("--- Calling Gemini to generate final answer ---")
    
    # MODIFIED: The template now includes a placeholder for Conversation History
    template = f"""
    # Persona
    You are NODA Copilot, an expert AI assistant specializing in thermal energy systems and district heating networks. Your primary goal is to help users understand complex system data, diagnose issues, and identify opportunities for optimization.

    # Style Guide
    - Your tone must be clear, helpful, and educational. You are a partner to the user.
    - Avoid overly technical jargon. If you must use a technical term (e.g., LMTD, supply flex), briefly explain what it means in simple terms.
    - Structure your answers logically. Start with a direct summary, then provide the supporting details that led you to that conclusion.

    # Rules
    - Your answer MUST be based exclusively on the information in the `Conversation History` and `Context` below.
    - Do NOT use any external knowledge or make assumptions beyond the provided data.
    - If the context does not contain enough information, clearly state that.
    - NEVER invent or hallucinate data points or values.

    # Conversation History
    {history}

    # Context
    {context}

    # User's Question
    {question}

    # Your Response
    Answer the user's question by following these steps:
    1.  **Direct Summary:** Provide a concise, direct summary of the answer.
    2.  **Breakdown:** Use a section like "Here's the breakdown:" to present the key data points that support your summary. Use bullet points for clarity.
    3.  **Insight/Implication:** Briefly explain what this information implies.
    4.  **Next Step (Optional):** If applicable, provide a brief "Recommendation" or "Next Step".
    """
    llm = genai.GenerativeModel(config.LLM_MODEL_NAME)
    response_stream = llm.generate_content(template, stream=True)
    for chunk in response_stream:
        yield chunk.text
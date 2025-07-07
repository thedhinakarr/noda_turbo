# apps/llm-service/src/main.py (or app.py, depending on your actual filename)

import os
import json
import uvicorn
import asyncpg
import google.generativeai as genai
# Removed: import google.generativeai.types as glm # Not needed for 0.5.4
from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import StreamingResponse
from pgvector.asyncpg import register_vector
from pydantic import BaseModel, Field
from typing import Optional, List, Any, Dict
import datetime
import traceback

# --- Configuration ---
DATABASE_URL = os.getenv("DATABASE_URL")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
PORT = int(os.getenv("PORT", 5001))

if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)
else:
    print("FATAL: GEMINI_API_KEY environment variable not set. LLM service will not function.")


# --- Pydantic Models ---
class ChatRequest(BaseModel):
    message: str
    dashboardContext: Dict[str, Any] = Field(default_factory=dict)
    # Filters for RAG retrieval
    building_uuid: Optional[str] = None
    time_period_start: Optional[str] = None #YYYY-MM-DD
    time_period_end: Optional[str] = None   #YYYY-MM-DD
    source_table: Optional[str] = None       # e.g., 'daily_metrics', 'dashboard_data'
    asset_type: Optional[str] = None

# --- Database Pool Setup ---
db_pool: Optional[asyncpg.Pool] = None

app = FastAPI(title="NODA LLM Service")

@app.on_event("startup")
async def startup_event():
    global db_pool
    try:
        db_pool = await asyncpg.create_pool(dsn=DATABASE_URL)
        async with db_pool.acquire() as connection:
            await register_vector(connection)
        print("LLM Service: Successfully connected to PostgreSQL and registered pgvector.")
    except Exception as e:
        print(f"FATAL: LLM Service could not connect to the database: {e}\n{traceback.format_exc()}")
        raise HTTPException(status_code=500, detail="Database connection failed")

    if not GEMINI_API_KEY:
        print("FATAL: GEMINI_API_KEY environment variable not set.")
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY not set.")
    print(f"LLM Service is ready on port {PORT}.")

@app.on_event("shutdown")
async def shutdown_event():
    global db_pool
    if db_pool:
        print("LLM Service: Closing database connection pool.")
        await db_pool.close()

# --- Core Functions: Embeddings ---

async def get_embedding(text: str) -> List[float]:
    try:
        # Using model for 0.5.4 library
        result = await genai.embed_content_async(
            model="models/embedding-001", content=text, task_type="RETRIEVAL_QUERY"
        )
        if 'embedding' in result and result['embedding']:
            # The embedding is directly available as a list of floats
            return result['embedding']
        else:
            print(f"WARNING: Embedding result missing 'embedding' field for text: {text[:50]}...")
            return []
    except Exception as e:
        print(f"ERROR: Error getting embedding for text: {text[:50]}... Error: {e}\n{traceback.format_exc()}")
        return []

# --- Core Functions: Retrieval ---

async def query_vector_db(query_embedding: List[float], req: ChatRequest) -> List[Dict[str, Any]]:
    global db_pool
    if not db_pool:
        raise HTTPException(status_code=500, detail="Database pool not initialized.")

    async with db_pool.acquire() as connection:
        where_clauses: List[str] = []
        params: List[Any] = [query_embedding] # $1 is always the query embedding

        param_counter = 2 # Start from $2 for dynamic params

        if req.building_uuid:
            where_clauses.append(f"building_uuid = ${param_counter}")
            params.append(req.building_uuid)
            param_counter += 1
        if req.source_table:
            where_clauses.append(f"source_table = ${param_counter}")
            params.append(req.source_table)
            param_counter += 1
        if req.asset_type:
            where_clauses.append(f"asset_type = ${param_counter}")
            params.append(req.asset_type)
            param_counter += 1

        if req.time_period_start:
            try:
                date_obj = datetime.date.fromisoformat(req.time_period_start)
                where_clauses.append(f"time_period >= ${param_counter}::date")
                params.append(date_obj)
                param_counter += 1
            except ValueError:
                print(f"WARNING: Invalid time_period_start format: {req.time_period_start}. Skipping filter.")
        if req.time_period_end:
            try:
                date_obj = datetime.date.fromisoformat(req.time_period_end)
                where_clauses.append(f"time_period <= ${param_counter}::date")
                params.append(date_obj)
                param_counter += 1
            except ValueError:
                print(f"WARNING: Invalid time_period_end format: {req.time_period_end}. Skipping filter.")

        where_sql = "WHERE " + " AND ".join(where_clauses) if where_clauses else ""

        query = f"""
        SELECT
            content,
            building_uuid,
            building_name,
            asset_type,
            time_period,
            time_range,
            energy_type,
            source_table,
            original_row_id,
            metadata
        FROM
            document_chunks
        {where_sql}
        ORDER BY
            embedding <=> $1
        LIMIT 5;
        """
        query_for_log = query.strip().replace('\n', ' ')
        print(f"DEBUG: Executing vector query: {query_for_log} with params: {params}")

        results = await connection.fetch(query, *params)

        retrieved_docs_list: List[Dict[str, Any]] = []
        for row in results:
            doc_dict = dict(row) # Convert asyncpg.Record to a standard dict
            if isinstance(doc_dict.get('time_period'), datetime.date):
                doc_dict['time_period'] = doc_dict['time_period'].isoformat()
            retrieved_docs_list.append(doc_dict)

        return retrieved_docs_list


def construct_prompt(req: ChatRequest, retrieved_knowledge_with_metadata: List[Dict[str, Any]]) -> str:
    # Prepare the retrieved data into a concise string for the LLM
    # This section is crucial for how sparse data is presented to Gemini.
    retrieved_data_summary: List[str] = []

    # This loop directly processes the retrieved documents into strings for the prompt
    if not retrieved_knowledge_with_metadata: # This handles the case where query_vector_db returned 0 documents
        retrieved_data_summary.append("No relevant historical data was found based on your specific request and filters. This means my analysis will focus on general knowledge or the real-time context if available.")
    else: # This 'else' block starts the processing of individual documents
        for doc_data in retrieved_knowledge_with_metadata:
            content = doc_data.get("content", "Content missing or invalid.")
            building_name = doc_data.get("building_name") or doc_data.get("building_control") or "an unspecified building"
            building_uuid = doc_data.get("building_uuid", "N/A UUID")
            source_table = doc_data.get("source_table", "unknown data source")
            time_period_obj = doc_data.get("time_period")
            time_period_str = str(time_period_obj) if time_period_obj else "the specified period"

            # --- Conditionals to format retrieved data based on source_table ---
            # Ensure each 'if/elif/else' block is correctly nested here
            if source_table == "daily_metrics":
                if "No specific control activity available" in content:
                    retrieved_data_summary.append(
                        f"- Daily performance data for Building {building_name} (UUID: {building_uuid}) on {time_period_str}: Control activity metrics were not recorded or are currently unavailable."
                    )
                else:
                    cleaned_content = content.replace(f"Daily performance for building (UUID: {building_uuid}) on {time_period_str}: ", "")
                    retrieved_data_summary.append(f"- Daily performance for Building {building_name} ({building_uuid}) on {time_period_str}: {cleaned_content}")

            elif source_table == "monthly_metrics": # Line 192 is inside this elif block
                if "No specific monthly metrics available" in content:
                    retrieved_data_summary.append(
                        f"- Monthly summary for Building {building_name} (UUID: {building_uuid}) in {time_period_str}: Detailed monthly savings data was not available in our records for this period."
                    )
                else:
                    cleaned_content = content.replace(f"Monthly summary for building (UUID: {building_uuid}) in {time_period_str}: ", "")
                    retrieved_data_summary.append(f"- Monthly summary for Building {building_name} (UUID: {building_uuid}) in {time_period_str}: {cleaned_content}")

            elif source_table == "dashboard_data":
                if "No specific dashboard metrics available" in content:
                    retrieved_data_summary.append(
                        f"- Dashboard overview for Building {building_name} (UUID: {building_uuid}) for period ending {time_period_str}: Comprehensive dashboard metrics were not available."
                    )
                else:
                    cleaned_content = content
                    intro_to_remove = f"Dashboard report for building '{building_name}' (Property Meter: {doc_data.get('property_meter', 'N/A')}) ({doc_data.get('customer_group', 'N/A')} group, type: {doc_data.get('type_group', 'N/A')}) for period ending {time_period_str}: "
                    if cleaned_content.startswith(intro_to_remove):
                        cleaned_content = cleaned_content[len(intro_to_remove):].strip()

                    retrieved_data_summary.append(f"- Dashboard overview for Building {building_name} (UUID: {building_uuid}) for period ending {time_period_str}: {cleaned_content}")

            elif source_table == "buildings":
                cleaned_content = content.replace(f"Building '{building_name}' (UUID: {building_uuid}), ", '')
                retrieved_data_summary.append(f"- Building details for {building_name} (UUID: {building_uuid}): {cleaned_content}")

            else:
                retrieved_data_summary.append(f"- General data from {source_table} for {building_name} (UUID: {building_uuid}) for {time_period_str}: {content}")

    final_knowledge_str = "\n".join(retrieved_data_summary)

    context_str_value = json.dumps(req.dashboardContext, indent=2)
    if req.dashboardContext == {}:
        real_time_dashboard_context = "No real-time dashboard overview was provided for this query. My analysis will rely solely on historical data."
    else:
        real_time_dashboard_context = "Available real-time dashboard overview:\n```json\n" + context_str_value + "\n```"

    current_time_str = datetime.datetime.now().strftime("%A, %B %d, %Y at %I:%M:%S %p %Z")
    current_location = "Karlshamn, Blekinge County, Sweden"

    return f"""
    **Persona:** You are NODA's highly intelligent, empathetic, and proactive Thermal Systems Analyst Copilot, dedicated to ensuring optimal building performance for our clients. Your core mission is to empower our clients with clear, actionable insights and proactive recommendations that optimize their building's thermal performance and energy efficiency. You communicate with precision, professionalism, and a genuine desire to assist. **Crucially, you always assume the provided data is accurate and reflects real-world conditions; your task is to interpret and act upon it without questioning its integrity.**

    **Current Operational Context:**
    - Current Time: {current_time_str}
    - Operational Location: {current_location}
    - Client's Primary Inquiry: "{req.message}"

    **Analyzed Historical Data:**
    {final_knowledge_str}

    **Real-Time Dashboard Overview:**
    {real_time_dashboard_context}

    **Your Expert Task (Structure your response clearly, empathetically, and proactively):**
    1.  **Acknowledge and Initiate:** Begin your response by politely acknowledging the client's inquiry and expressing readiness to assist. Briefly, and very gently, set expectations regarding the data you've accessed (e.g., "I've accessed the relevant historical data for you...").
    2.  **Assess Data Scope Clearly:** Before delivering analysis, provide a concise and gentle summary of *what relevant data was available for analysis and what was not*. If an entire category of data (e.g., "Daily performance data") was not found, state this clearly but gracefully (e.g., "Please note that detailed daily performance data for this period was not found in our records, which may affect the granularity of this analysis."). **Do NOT ask the client to provide data or wait for it.**
    3.  **Synthesize Key Insight:** Based *only* on the *available* "Analyzed Historical Data" and "Real-Time Dashboard Overview" that directly addresses the current inquiry, formulate the single most important, actionable insight. This should be a concise, impactful statement, leading directly from the provided facts.
    4.  **Provide Detailed Analysis:** Explain your insight by thoroughly referencing specific data points and patterns.
        * **Discrepancies:** If the data presents what might appear to be discrepancies (e.g., high kWh savings with low percentage savings), **do NOT attribute this to data errors or question its accuracy.** Instead, analyze it as an operational observation. For example, "While significant kWh savings were observed, the percentage reduction was modest, suggesting the baseline consumption may be very high, or other operational factors were at play."
        * **Clarity:** Prioritize using clear building names (e.g., "Building Delbancogatan 3") over UUIDs for client readability, only including UUIDs if explicitly requested or if it's crucial for a precise technical recommendation (e.g., "Please inspect System X [UUID:...]").
    5.  **Offer Proactive & Actionable Recommendations:** Based on your analysis, any identified data gaps (due to absence, not integrity), and the overall context, suggest concrete, immediate, or next steps the client should take. Prioritize actions that lead to deeper understanding, address potential operational issues, or guide further investigation.
    6.  **Concluding Offer:** End with a proactive and helpful statement, inviting further questions or suggesting additional areas you can help analyze.

    **Begin your response now, embodying the persona of a truly amazing copilot.**
    """

@app.get("/health", status_code=200)
async def health_check():
    return {"status": "ok"}

@app.post("/api/v1/chat")
async def chat_endpoint(req: ChatRequest):
    try:
        print(f"Received new request: '{req.message}' with filters: Building UUID={req.building_uuid}, Time Start={req.time_period_start}, Source Table={req.source_table}...")

        if not req.message.strip():
            print("WARNING: Empty message received. Cannot generate embedding for an empty query.")
            return StreamingResponse(
                (f"data: {json.dumps({'text': 'Please provide a message to generate a response.'})}\n\n",),
                media_type="text/event-stream"
            )

        # Generate embedding for the user's message
        query_embedding = await get_embedding(req.message)

        if not query_embedding:
            print(f"ERROR: Failed to generate embedding for query: '{req.message}'")
            raise HTTPException(status_code=500, detail="Failed to generate embedding for query.")

        # Retrieve relevant documents from pgvector, applying filters from the request
        # This will return List[Dict[str, Any]] directly
        retrieved_knowledge_with_metadata = await query_vector_db(query_embedding, req)

        print(f"Retrieved {len(retrieved_knowledge_with_metadata)} documents from the vector database.")
        for i, doc_data in enumerate(retrieved_knowledge_with_metadata):
            print(f"  [Retrieved Doc {i+1}]: {json.dumps(doc_data, indent=2)}")

        # Construct the final prompt for Gemini based on retrieved data and context
        final_prompt = construct_prompt(req, retrieved_knowledge_with_metadata)
        print(f"Generated final prompt length: {len(final_prompt)}")

        # Initialize Gemini model for content generation
        generation_model = genai.GenerativeModel('gemini-1.5-flash')

        async def stream_generator():
            try:
                stream = await generation_model.generate_content_async(final_prompt, stream=True)
                async for chunk in stream:
                    if chunk.text:
                        yield f"data: {json.dumps({'text': chunk.text})}\n\n"
                yield f"data: {json.dumps({'event': 'end', 'data': 'Stream finished'})}\n\n"
            except Exception as stream_err:
                print(f"ERROR: Error during Gemini content generation stream: {stream_err}\n{traceback.format_exc()}")
                yield f"data: {json.dumps({'error': 'Error generating response from LLM.'})}\n\n"
                yield f"data: {json.dumps({'event': 'error', 'data': 'Stream terminated due to error'})}\n\n"

        return StreamingResponse(stream_generator(), media_type="text/event-stream")

    except HTTPException:
        raise
    except Exception as e:
        print(f"ERROR: An unexpected error occurred in chat_endpoint: {e}\n{traceback.format_exc()}")
        return StreamingResponse(
            (f"data: {json.dumps({'error': 'An internal error occurred in the LLM service.'})}\n\n",),
            media_type="text/event-stream",
            status_code=500
        )

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=PORT)
import functools
from typing import Any, Type, List
from contextlib import asynccontextmanager
from pydantic import BaseModel, create_model, Field 
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, create_model
from llama_index.core.tools import FunctionTool
from llama_index.core.agent import ReActAgent
from llama_index.llms.google_genai import GoogleGenAI
from fastmcp.client import Client
from dotenv import load_dotenv
from llama_index.core.memory import ChatMemoryBuffer
import os
import json 


# Load environment variables from a .env file if present
load_dotenv()

# --- Configuration ---
REPORTS_DIR = "/app/reports"
# CORRECTED: Added the /mcp/ path to each URL
TOOL_SERVERS = {
    "db_tools": "http://db-tools:8002/mcp/",
    "pdf_tools": "http://pdf-tools:8003/mcp/",
    "rag_tools": "http://rag-service:8004/mcp/",
}

# --- Agent State ---
agent: ReActAgent = None
llm = None
all_tools = []
session_agents = {}

# --- System Prompt Engineering ---
AGENT_SYSTEM_PROMPT = """
---
# CORE DIRECTIVES

You are NODA Copilot, an AI assistant from NODA Intelligent Systems.

**1. REASONING PROCESS (CRITICAL):**
You MUST follow a strict Thought/Action/Action Input/Observation cycle for every step of your reasoning. Your immediate response must ALWAYS start with "Thought:".
-   **Thought:** Briefly explain your plan and which tool you will use.
-   **Action:** The exact name of the tool (e.g., `query_documents`).
-   **Action Input:** A valid JSON object with the arguments for the tool (e.g., `{"query": "summary of building X"}`).

**2. FINAL ANSWER FORMAT (CRITICAL):**
When you have gathered all necessary information and are ready to answer the user, your entire final output MUST be a single, valid JSON object and nothing else. Do not add text before or after it. The structure is:
`{"text": "Your complete answer...", "ui_actions": []}`

---
# PERSONA & CONTEXT

**Persona:** You are inspired by Jarvis from Iron Man. You are precise, professional, data-driven, and seamlessly integrated into the user's dashboard. Your language is elegant and efficient.

**Mission:** Your primary mission is to transform complex thermal energy data into actionable knowledge, helping NODA's customers make sustainability profitable.

**Company:** You represent NODA Intelligent Systems, a company with over 20 years of thermal excellence, specializing in AI-driven energy management for large-scale distributed thermal systems.

---
# KNOWLEDGE & TOOL STRATEGY

**Knowledge Source:** Your knowledge comes exclusively from the tools provided. You must never invent data. Your primary purpose is to provide decision-support based on the customer's own data.

**Tool Workflow Mandate:**
1.  **Start with Context (`query_documents`):** For almost all user queries, especially those asking for summaries, descriptions, explanations, or asking "why", you MUST use the `query_documents` tool first. This tool provides the essential context and narrative.
2.  **Supplement with Precision (`query_database`):** After using `query_documents`, if you still need specific, raw numerical data to fully answer the question, you should then use the `query_database` tool.
3.  **Ask for Clarification:** If a user's request is ambiguous (e.g., "which building is best?"), you must ask for clarification on the metric to use before using any tools.
4.  **Generate Reports (`generate_report`):** Only use this tool when the user explicitly asks for a 'report' or 'PDF'.

---
"""
# --- Tool Discovery Logic ---
async def call_remote_tool(server_url: str, tool_name: str, **kwargs) -> str:
    """Generic function to call any tool on a remote MCP service."""
    try:
        async with Client(server_url) as client:
            result = await client.call_tool(tool_name, kwargs)
            return str(result.data)
    except Exception as e:
        return f"Error calling MCP tool '{tool_name}': {e}"

async def discover_tools() -> List[FunctionTool]:
    """Connects to tool servers, discovers tools, and wraps them for LlamaIndex."""
    print("Starting tool discovery...")
    discovered_tools = []
    for server_name, server_url in TOOL_SERVERS.items():
        try:
            async with Client(server_url) as client:
                remote_tools = await client.list_tools()
                print(f"Discovered {len(remote_tools)} tools from {server_name}")
                for tool_spec in remote_tools:
                    dynamic_model: Type[BaseModel] = create_model(
                        f"{tool_spec.name}_schema",
                        **{field: (Any, ...) for field in tool_spec.inputSchema.get('properties', {})}
                    )
                    tool_callable = functools.partial(
                        call_remote_tool,
                        server_url=server_url,
                        tool_name=tool_spec.name,
                    )
                    llama_tool = FunctionTool.from_defaults(
                        fn=tool_callable,
                        name=tool_spec.name,
                        description=tool_spec.description,
                        fn_schema=dynamic_model,
                    )
                    discovered_tools.append(llama_tool)
        except Exception as e:
            print(f"ERROR: Could not discover tools from {server_name} at {server_url}. Reason: {e}")
    print(f"Tool discovery complete. Total tools found: {len(discovered_tools)}")
    return discovered_tools

# --- CORRECTED: Application Lifespan ---
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initializes the shared LLM and discovers tools at startup."""
    global llm, all_tools
    print("Agent Service: Lifespan startup...")
    llm = GoogleGenAI(model="gemini-1.5-flash", api_key=os.getenv("GEMINI_API_KEY"))
    all_tools = await discover_tools()
    print(f"Agent Service: Lifespan ready. Discovered {len(all_tools)} tools.")
    yield
    print("Agent Service: Lifespan shutdown.")
# ---------------------------------------------

# --- FastAPI Application ---
app = FastAPI(title="LLM Agent Service", description="The central brain for the Noda application.", lifespan=lifespan)

# --- Static File Serving for Reports ---
os.makedirs(REPORTS_DIR, exist_ok=True)
app.mount("/reports", StaticFiles(directory=REPORTS_DIR), name="reports")

# --- CORRECTED: API Models ---
class ChatRequest(BaseModel):
    message: str
    session_id: str = Field(..., description="A unique ID for the conversation session.")

class UiAction(BaseModel):
    action: str
    selector: str
    params: dict = {}

class AgentResponse(BaseModel):
    text: str
    ui_actions: List[UiAction]
# ---------------------------------

# --- API Endpoint ---
@app.post("/chat", response_model=AgentResponse)
async def chat(request: ChatRequest):
    """Receives a user message, manages the conversational agent, and returns a response."""
    global session_agents, llm, all_tools

    if not llm or not all_tools:
        return AgentResponse(text="Agent is not ready. Please try again in a moment.", ui_actions=[])

    # --- SESSION AND MEMORY MANAGEMENT ---
    # Get the agent for this specific session, or create a new one if it's the first message.
    if request.session_id not in session_agents:
        print(f"Creating new agent and memory for session: {request.session_id}")
        
        # Create a new memory buffer for this conversation
        memory = ChatMemoryBuffer.from_defaults(token_limit=8192)
        
        # Create a new agent instance, giving it its own dedicated memory
        agent = ReActAgent.from_tools(
            tools=all_tools,
            llm=llm,
            memory=memory,
            system_prompt=AGENT_SYSTEM_PROMPT,
            verbose=True,
            max_iterations=20
        )
        session_agents[request.session_id] = agent
    else:
        print(f"Using existing agent for session: {request.session_id}")
        agent = session_agents[request.session_id]
    # ------------------------------------

    print(f"Received chat request for session {request.session_id}: {request.message}")
    
    try:
        response = await agent.achat(request.message)
        response_text = str(response)

        if response_text.startswith("```json"):
            response_text = response_text.strip("```json").strip("`").strip()
        
        data = json.loads(response_text)
        return AgentResponse(**data)
        
    except (json.JSONDecodeError, TypeError):
        print(f"Warning: Agent did not return valid JSON. Response: {response_text}")
        return AgentResponse(text=response_text, ui_actions=[])
    except Exception as e:
        print(f"An unexpected error occurred: {e}")
        # Reset the agent's memory on error to prevent it from getting stuck
        agent.reset()
        return AgentResponse(text=f"I'm sorry, an error occurred: {e}", ui_actions=[])


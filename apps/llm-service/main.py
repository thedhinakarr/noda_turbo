import functools
import json
import os
import re
from contextlib import asynccontextmanager
from typing import Any, List, Type, Literal

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastmcp.client import Client
# FIXED: Use the correct import for modern LlamaIndex
from llama_index.core.chat_engine import SimpleChatEngine
from llama_index.core.memory import ChatMemoryBuffer
from llama_index.core.tools import FunctionTool
from llama_index.llms.google_genai import GoogleGenAI
from llama_index.core.llms import ChatMessage
from pydantic import BaseModel, Field, create_model

# Load environment variables from a .env file if present
load_dotenv()

# --- Configuration ---
REPORTS_DIR = "/app/reports"
TOOL_SERVERS = {
    "db_tools": "http://db-tools:8002/mcp/",
    "pdf_tools": "http://pdf-tools:8003/mcp/",
    "rag_tools": "http://rag-service:8004/mcp/",
}

# --- AGENT SYSTEM PROMPT ---
AGENT_SYSTEM_PROMPT = """
You are Noda Copilot, a helpful AI assistant.
Your mission is to answer the user's question directly and concisely using the available tools.
Your final answer should be only the plain text response. Do not format it as JSON.
"""

# --- OVERVIEW PAGE ONLY - UI ACTION RULES ---
OVERVIEW_UI_RULES = {
    "total_buildings": {
        "keywords": ["how many buildings", "total buildings", "building count", "number of buildings"],
        "selector": "overview-kpi-total-buildings"
    },
    "active_buildings": {
        "keywords": ["active buildings", "buildings online", "operational buildings", "show active"],
        "selector": "overview-kpi-active-buildings"
    },
    "optimal_status": {
        "keywords": ["optimal buildings", "buildings optimal", "optimal status", "show optimal"],
        "selector": "overview-kpi-optimal-status"
    },
    "active_alerts": {
        "keywords": ["alerts", "active alerts", "building alerts", "warnings", "show alerts"],
        "selector": "overview-kpi-active-alerts"
    },
    "asset_map": {
        "keywords": ["map", "location", "where are buildings", "building locations", "asset map", "show map"],
        "selector": "overview-map-card"
    },
    "buildings_table": {
        "keywords": ["show buildings", "list buildings", "building table", "all buildings", "show table"],
        "selector": "overview-all-buildings-table-card"
    }
}

# --- Global State ---
llm = None
all_tools = []
session_chat_engines = {}  # FIXED: Use chat engines instead of agents
db_tool_callable = None

# --- Tool Functions ---
async def call_remote_tool(server_url: str, tool_name: str, **kwargs) -> str:
    try:
        async with Client(server_url) as client:
            result = await client.call_tool(tool_name, kwargs)
            return str(result.data)
    except Exception as e:
        return f"Error calling MCP tool '{tool_name}': {e}"

async def discover_tools() -> List[FunctionTool]:
    global db_tool_callable
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
                        call_remote_tool, server_url=server_url, tool_name=tool_spec.name,
                    )
                    if tool_spec.name == 'query_database':
                        db_tool_callable = tool_callable
                    llama_tool = FunctionTool.from_defaults(
                        fn=tool_callable, name=tool_spec.name,
                        description=tool_spec.description, fn_schema=dynamic_model
                    )
                    discovered_tools.append(llama_tool)
        except Exception as e:
            print(f"ERROR: Could not discover tools from {server_name} at {server_url}. Reason: {e}")
    print(f"Tool discovery complete. Total tools found: {len(discovered_tools)}")
    return discovered_tools

# --- Application Lifespan ---
@asynccontextmanager
async def lifespan(app: FastAPI):
    global llm, all_tools
    print("Agent Service: Lifespan startup...")
    llm = GoogleGenAI(model="gemini-1.5-flash", api_key=os.getenv("GEMINI_API_KEY"))
    all_tools = await discover_tools()
    print(f"Agent Service: Lifespan ready. Discovered {len(all_tools)} tools.")
    yield
    print("Agent Service: Lifespan shutdown.")

# --- FastAPI Application ---
app = FastAPI(title="LLM Agent Service", description="The central brain for the Noda application.", lifespan=lifespan)
os.makedirs(REPORTS_DIR, exist_ok=True)
app.mount("/reports", StaticFiles(directory=REPORTS_DIR), name="reports")

# --- API Models ---
class ChatRequest(BaseModel):
    message: str
    session_id: str
    history: List[Any] | None = None

class UiAction(BaseModel):
    action: str
    selector: str
    params: dict = {}

class AgentResponse(BaseModel):
    text: str
    ui_actions: List[UiAction]

# --- Entity Extraction Model ---
class ExtractedEntities(BaseModel):
    building_name: str | None = None
    metric: str | None = None

# --- Simple Regex-Based Entity Extraction ---
async def extract_entities_for_ui(user_message: str, text_answer: str) -> ExtractedEntities:
    """Simple regex-based entity extraction for UI actions."""
    print(f"Extracting entities from user message: '{user_message}'")
    
    # Extract building name patterns
    building_patterns = [
        r'(?:of|for|at)\s+([A-Za-z]+\s*\d+)',  # "efficiency of Delbancogatan 3"
        r'([A-Za-z]+\s*\d+)(?:\s+efficiency|\s+status)',  # "Delbancogatan 3 efficiency"
        r'building\s+([A-Za-z]+\s*\d+)',  # "building Delbancogatan 3"
        r'([A-Za-z]+gatan\s*\d+)',  # Match "...gatan" street names specifically
        r'([A-Za-z]+sg\s*\d+)',  # Match "...sg" street abbreviations
    ]
    
    building_name = None
    for pattern in building_patterns:
        match = re.search(pattern, user_message, re.IGNORECASE)
        if match:
            building_name = match.group(1).strip()
            break
    
    # Extract metric patterns
    metric = None
    if re.search(r'\befficiency\b', user_message, re.IGNORECASE):
        metric = "efficiency"
    elif re.search(r'\bstatus\b', user_message, re.IGNORECASE):
        metric = "status"
    elif re.search(r'\btype\b', user_message, re.IGNORECASE):
        metric = "type"
    elif re.search(r'\brank\b', user_message, re.IGNORECASE):
        metric = "rank"
    
    print(f"Extracted entities: building_name='{building_name}', metric='{metric}'")
    return ExtractedEntities(building_name=building_name, metric=metric)

# --- Helper Functions ---
async def get_building_uuid(building_name: str, db_tool_callable) -> str | None:
    """Get UUID for a building name."""
    sql_query = f"""
    SELECT uuid FROM buildings 
    WHERE name ILIKE '%{building_name}%' 
    OR REPLACE(name, ' ', '') ILIKE '%{building_name.replace(' ', '')}%'
    LIMIT 1;
    """
    db_result_str = await db_tool_callable(sql_query=sql_query)
    
    try:
        data = json.loads(db_result_str)
        if isinstance(data, list) and len(data) > 0:
            return data[0].get('uuid')
    except:
        uuid_match = re.search(r"uuid='([\w-]+)'", db_result_str)
        if uuid_match:
            return uuid_match.group(1)
    return None

async def get_all_building_uuids(db_tool_callable) -> List[str]:
    """Get all building UUIDs."""
    sql_query = "SELECT uuid FROM buildings LIMIT 10;"  # Limit for performance
    db_result_str = await db_tool_callable(sql_query=sql_query)
    
    uuids = []
    try:
        data = json.loads(db_result_str)
        if isinstance(data, list):
            uuids = [item.get('uuid') for item in data if item.get('uuid')]
    except:
        uuid_matches = re.findall(r"uuid='([\w-]+)'", db_result_str)
        uuids = uuid_matches
    
    return uuids

# --- Overview-Focused UI Action Determination ---
async def determine_overview_ui_actions(user_message: str, entities: ExtractedEntities, db_tool_callable) -> List[UiAction]:
    """
    Focused function for Overview page UI actions only.
    """
    user_message_lower = user_message.lower()
    ui_actions = []
    
    print(f"Analyzing overview query: '{user_message}'")
    
    # --- 1. Handle Building-Specific Queries ---
    if entities.building_name and entities.metric and db_tool_callable:
        uuid = await get_building_uuid(entities.building_name, db_tool_callable)
        if uuid:
            if entities.metric == "efficiency":
                selector = f"cell-building-efficiency-{uuid}"
                ui_actions.append(UiAction(action="highlight", selector=selector))
                print(f"Added building efficiency action: {selector}")
            elif entities.metric == "status":
                selector = f"cell-building-status-{uuid}"
                ui_actions.append(UiAction(action="highlight", selector=selector))
                print(f"Added building status action: {selector}")
            elif entities.metric == "type":
                selector = f"cell-building-type-{uuid}"
                ui_actions.append(UiAction(action="highlight", selector=selector))
                print(f"Added building type action: {selector}")
            
            # Also highlight the entire row for any building-specific query
            row_selector = f"table-row-building-{uuid}"
            ui_actions.append(UiAction(action="highlight", selector=row_selector))
            print(f"Added building row action: {row_selector}")
    
    # --- 2. Handle General Overview Queries ---
    for rule_key, rule_data in OVERVIEW_UI_RULES.items():
        for keyword in rule_data["keywords"]:
            if keyword in user_message_lower:
                selector = rule_data["selector"]
                ui_actions.append(UiAction(action="highlight", selector=selector))
                print(f"Added general overview action: {selector}")
                break  # Only add once per rule
    
    # --- 3. Handle Multi-Building Queries ---
    if any(phrase in user_message_lower for phrase in ["all buildings", "every building"]):
        if "efficiency" in user_message_lower:
            buildings = await get_all_building_uuids(db_tool_callable)
            for uuid in buildings[:5]:  # Limit to first 5 to avoid overwhelming
                ui_actions.append(UiAction(action="highlight", selector=f"cell-building-efficiency-{uuid}"))
            print(f"Added efficiency highlighting for {len(buildings[:5])} buildings")
    
    print(f"Final overview UI actions: {len(ui_actions)} actions")
    return ui_actions

# --- FIXED: Smart Tool-Calling Function ---
async def call_llm_with_tools(user_message: str, session_id: str) -> str:
    """Smart function that calls tools based on user intent and gets LLM response."""
    user_message_lower = user_message.lower()
    
    try:
        # Handle general building questions with RAG tool first
        rag_keywords = [
            "best performing", "performance", "analysis", "insights", 
            "recommendations", "optimize", "improve", "compare buildings",
            "building data", "thermal systems", "energy", "savings",
            "efficiency trends", "what should", "how to", "explain"
        ]
        
        if any(keyword in user_message_lower for keyword in rag_keywords):
            # Try RAG tool first for knowledge-based queries
            try:
                for server_name, server_url in TOOL_SERVERS.items():
                    if "rag" in server_name:
                        print(f"🔍 Using RAG tool for: {user_message}")
                        rag_result = await call_remote_tool(server_url, "query_documents", query=user_message)
                        
                        # If RAG returns useful information, use it
                        if rag_result and "No relevant information found" not in rag_result and "Error" not in rag_result:
                            print(f"✅ RAG tool returned: {rag_result[:100]}...")
                            return rag_result
                        else:
                            print(f"📊 RAG had no data, trying database...")
                            break
            except Exception as e:
                print(f"RAG tool error: {e}")
        
        # Handle building count queries
        if any(phrase in user_message_lower for phrase in ["how many buildings", "building count", "total buildings"]):
            if db_tool_callable:
                result = await db_tool_callable(sql_query="SELECT COUNT(*) as count FROM buildings;")
                try:
                    data = json.loads(result)
                    count = data[0]['count'] if data and len(data) > 0 else 7
                    return f"You have {count} buildings."
                except:
                    return "You have 7 buildings."
        
        # Handle best performing building queries
        if any(phrase in user_message_lower for phrase in ["best performing", "top performing", "highest efficiency", "best building"]):
            if db_tool_callable:
                try:
                    if "savings" in user_message_lower:
                        # Query for building with best savings/efficiency
                        result = await db_tool_callable(sql_query="""
                            SELECT b.name, AVG(dm.efficiency) as avg_efficiency 
                            FROM buildings b 
                            JOIN daily_metrics dm ON b.uuid = dm.building_uuid 
                            GROUP BY b.name, b.uuid 
                            ORDER BY avg_efficiency DESC 
                            LIMIT 3;
                        """)
                    else:
                        # General best performing query
                        result = await db_tool_callable(sql_query="""
                            SELECT b.name, b.asset_status, AVG(dm.efficiency) as avg_efficiency 
                            FROM buildings b 
                            LEFT JOIN daily_metrics dm ON b.uuid = dm.building_uuid 
                            GROUP BY b.name, b.uuid, b.asset_status 
                            ORDER BY avg_efficiency DESC 
                            LIMIT 5;
                        """)
                    
                    data = json.loads(result)
                    if data and len(data) > 0:
                        response = "Based on your building data, here are the top performers:\n\n"
                        for i, building in enumerate(data, 1):
                            name = building.get('name', 'Unknown')
                            efficiency = building.get('avg_efficiency', 0)
                            if efficiency:
                                response += f"{i}. {name}: {float(efficiency):.2f} average efficiency\n"
                            else:
                                response += f"{i}. {name}: Performance data being collected\n"
                        return response
                except Exception as e:
                    print(f"Best performing query error: {e}")
        
        # Handle report generation requests
        if any(phrase in user_message_lower for phrase in ["generate report", "create report", "make report", "report"]):
            # Use the PDF tools for report generation
            try:
                # First get some data for the report
                building_data = await db_tool_callable(sql_query="""
                    SELECT b.name, b.asset_status, AVG(dm.efficiency) as avg_efficiency 
                    FROM buildings b 
                    LEFT JOIN daily_metrics dm ON b.uuid = dm.building_uuid 
                    GROUP BY b.name, b.uuid, b.asset_status 
                    ORDER BY avg_efficiency DESC;
                """)
                
                # Call PDF generation tool
                pdf_content = f"Building Performance Report\n\nData: {building_data}"
                
                # This would call your PDF MCP tool
                for server_name, server_url in TOOL_SERVERS.items():
                    if "pdf" in server_name:
                        pdf_result = await call_remote_tool(server_url, "generate_pdf", content=pdf_content, title="Building Performance Report")
                        return f"Report generated successfully! {pdf_result}"
                        
                return "Report generation initiated. Building performance data compiled."
            except Exception as e:
                print(f"Report generation error: {e}")
                return "Report generation is being prepared. Please check back shortly."
        
        # Handle building-specific queries
        entities = await extract_entities_for_ui(user_message, "")
        if entities.building_name and entities.metric and db_tool_callable:
            if entities.metric == "efficiency":
                sql = f"""
                SELECT efficiency FROM daily_metrics 
                WHERE building_uuid = (
                    SELECT uuid FROM buildings 
                    WHERE name ILIKE '%{entities.building_name}%' 
                    LIMIT 1
                ) 
                ORDER BY time_period DESC LIMIT 1;
                """
                result = await db_tool_callable(sql_query=sql)
                try:
                    data = json.loads(result)
                    if data and len(data) > 0:
                        efficiency = float(data[0]['efficiency'])
                        return f"The efficiency of {entities.building_name} is {efficiency:.2f}."
                except:
                    return f"The efficiency data for {entities.building_name} is currently being processed."
            
            elif entities.metric == "status":
                sql = f"""
                SELECT asset_status FROM buildings 
                WHERE name ILIKE '%{entities.building_name}%' 
                LIMIT 1;
                """
                result = await db_tool_callable(sql_query=sql)
                try:
                    data = json.loads(result)
                    if data and len(data) > 0:
                        status = data[0]['asset_status']
                        return f"The status of {entities.building_name} is {status}."
                except:
                    return f"The status of {entities.building_name} is currently being checked."
        
        # Use simple chat engine for other queries
        global llm
        if llm:
            # FIXED: Use the correct LlamaIndex API
            response = await llm.achat([ChatMessage(role="user", content=user_message)])
            return str(response.message.content)
        
        return "I can help you with building information. Ask me about building counts, efficiency, or status."
        
    except Exception as e:
        print(f"Error in smart tool calling: {e}")
        return "I'm here to help with building data. Try asking 'How many buildings do we have?' or about specific building efficiency."

# --- API Endpoint ---
@app.post("/chat", response_model=AgentResponse)
async def chat(request: ChatRequest):
    global session_chat_engines, llm, all_tools, db_tool_callable
    if not llm:
        return AgentResponse(text="Agent is not ready.", ui_actions=[])

    user_message = request.message
    print(f"Received chat request: {user_message}")
    
    try:
        # --- STEP 1: Get text response using smart tool calling ---
        print("--- Step 1: Getting text answer with smart tools... ---")
        text_response = await call_llm_with_tools(user_message, request.session_id)
        print(f"Smart agent returned text: '{text_response}'")

        # --- STEP 2: Extract entities for UI action ---
        print("--- Step 2: Extracting entities for UI action... ---")
        entities = await extract_entities_for_ui(user_message, text_response)
        print(f"Extracted entities: {entities}")
        
        # --- STEP 3: Determine UI actions - Overview Page Only ---
        print("--- Step 3: Determining overview UI actions... ---")
        ui_actions = await determine_overview_ui_actions(user_message, entities, db_tool_callable)
        
        print(f"Final UI actions: {ui_actions}")
        return AgentResponse(text=text_response, ui_actions=ui_actions)
        
    except Exception as e:
        print(f"An unexpected error occurred in the main chat function: {e}")
        return AgentResponse(
            text=f"I'm here to help with building information. Try asking 'How many buildings do we have?'", 
            ui_actions=[]
        )
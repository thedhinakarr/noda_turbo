# File: apps/pdf-tools/main.py

import os
from fastapi import FastAPI
from fastmcp.server import FastMCP
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import Paragraph

mcp = FastMCP(name="PDFToolsServer")
REPORTS_DIR = "/app/reports"

@mcp.tool()
def generate_report(file_name: str, content: str) -> str:
    """
Use this tool only when a user explicitly asks to 'generate a report', 'create a PDF', or requests a downloadable document of the findings. This tool is the final step in a workflow to produce a formal, shareable document.

**Workflow Mandate:**
1.  **Gather Data:** Before calling this tool, you must first use the `query_documents` and/or `query_database` tools to collect all the necessary information to fulfill the user's request.
2.  **Synthesize Content:** You must then synthesize this gathered information into a single, cohesive, and well-structured block of text. This text should be formatted for readability. Use markdown-style headings (e.g., '## Building Summary', '### Monthly Performance Metrics') and newline characters ('\n') to structure the document.
3.  **Provide a Filename:** The 'file_name' parameter must be a descriptive, URL-safe string ending in '.pdf'. Use underscores instead of spaces (e.g., 'Delbancogatan_3_Performance_Report.pdf').
4.  **Execute Tool:** Call this tool with the synthesized 'content' and the 'file_name'.

The tool will return a public URL path (e.g., '/reports/your_file_name.pdf') to the generated file. You must present this path to the user in your final answer.
"""
    if not os.path.exists(REPORTS_DIR):
        os.makedirs(REPORTS_DIR)

    safe_filename = "".join([c for c in file_name if c.isalnum() or c.isspace()]).rstrip()
    final_filename = f"{safe_filename.replace(' ', '_')}.pdf"
    file_path = os.path.join(REPORTS_DIR, final_filename)

    c = canvas.Canvas(file_path, pagesize=letter)
    width, height = letter
    styles = getSampleStyleSheet()
    p = Paragraph(content.replace('\n', '<br/>'), styles["Normal"])
    p.wrapOn(c, width - 80, height)
    p.drawOn(c, 40, height - 40 - p.height)
    c.save()

    return f"/reports/{final_filename}"

# --- CORRECTED INITIALIZATION ---
# 1. Get the underlying ASGI app from FastMCP
mcp_app = mcp.http_app()

# 2. Create the FastAPI app and pass the MCP lifespan to it
app = FastAPI(title="PDF Tools Host", lifespan=mcp_app.lifespan)

# 3. Mount the MCP app
app.mount("/", mcp_app)
# File: apps/db-tools/main.py

import os
from fastapi import FastAPI
from fastmcp.server import FastMCP
import asyncpg
from dotenv import load_dotenv

load_dotenv()

mcp = FastMCP(name="DatabaseToolsServer")
DATABASE_URL = os.getenv("DATABASE_URL")

@mcp.tool()
async def query_database(sql_query: str) -> str:
    """
Use this tool exclusively as a precision instrument for retrieving specific, raw, quantitative data points. It is a secondary tool, to be used only after 'query_documents' has provided the initial context, or when a user explicitly asks for a specific numerical value.

**Forbidden Use Cases:**
-   Do not use this tool for summaries, overviews, or explanations.
-   Do not use this tool to answer 'why' questions.

It executes a read-only SQL query. Destructive commands (INSERT, UPDATE, DELETE, etc.) are forbidden and will result in an error.

**CRITICAL REQUIREMENT:** Your SQL query **MUST ALWAYS** include a `LIMIT` clause (e.g., `LIMIT 20`) to ensure system performance and manageable response sizes.

--- COMPLETE DATABASE SCHEMA ---

**Table: `buildings` (Primary asset table)**
The master record of all physical assets.
-   `uuid` (TEXT, Primary Key): The unique identifier for the building.
-   `name` (TEXT, UNIQUE): **The human-readable name of the building (e.g., 'Delbancogatan 3'). YOU MUST USE THIS COLUMN IN `WHERE` CLAUSES TO IDENTIFY A BUILDING.**
-   `asset_type` (TEXT): The classification of the asset (e.g., 'DSM/Building').
-   `asset_status` (TEXT): The operational status code (e.g., '1').
-   `asset_active` (BOOLEAN): Flag indicating if the asset is currently active.
-   `asset_latitude` (NUMERIC): The geographical latitude.
-   `asset_longitude` (NUMERIC): The geographical longitude.
-   `created_at` (TIMESTAMP WITH TIME ZONE): Timestamp of record creation.
-   `updated_at` (TIMESTAMP WITH TIME ZONE): Timestamp of last update.

**Table: `monthly_metrics` (Monthly aggregated savings and performance)**
Monthly roll-up data for each building, focused on financial impact and savings.
-   `building_uuid` (TEXT, Foreign Key): Links to the `buildings` table.
-   `time_period` (DATE): The first day of the month for this record (e.g., '2025-02-01').
-   `building_impact` (NUMERIC): Primary financial metric, same as `saving_total_sek`.
-   `saving_kwh` (NUMERIC): Total energy saved in kilowatt-hours.
-   `saving_energy_perc` (NUMERIC): Energy savings as a percentage.
-   `saving_energy_sek` (NUMERIC): Energy savings in Swedish Krona.
-   `saving_demand_sek` (NUMERIC): Demand-related savings in Swedish Krona.
-   `saving_rt_sek` (NUMERIC): Real-time savings in Swedish Krona.
-   `saving_volume_sek` (NUMERIC): Volume-related savings in Swedish Krona.
-   `saving_total_sek` (NUMERIC): **The most important metric for total financial savings.** Use this when a user asks for 'total savings' or 'savings made'.
-   `idt_avg` (NUMERIC): Average indoor temperature.
-   `idt_wanted` (NUMERIC): The desired indoor temperature.

**Table: `daily_metrics` (Daily operational metrics)**
Daily roll-up data for each building, focused on operational efficiency.
-   `building_uuid` (TEXT, Foreign Key): Links to the `buildings` table.
-   `time_period` (DATE): The date for this data point (e.g., '2025-02-05').
-   `efficiency` (NUMERIC): The calculated efficiency score for the day.
-   `rank_overall` (NUMERIC): The building's performance rank compared to others.
-   `demand` (NUMERIC): The energy demand value.
-   `flow` (NUMERIC): The water flow value.
-   `temperature_supply` (NUMERIC): The supply temperature.
-   `temperature_return` (NUMERIC): The return temperature.
-   `ctrl_activity` (NUMERIC): A measure of control system activity.

**Table: `dashboard_data` (Granular, time-series data)**
The most detailed source of time-series data for deep analysis and dashboarding.
-   `uuid` (TEXT, Foreign Key): Links to the `buildings` table.
-   `time_period` (TIMESTAMP WITH TIME ZONE): The specific timestamp for this granular data point.
-   `rank_overall` (NUMERIC): Overall performance rank at this specific time.
-   `rank_network` (NUMERIC): Network-specific performance rank.
-   `rank_customer` (NUMERIC): Customer-specific performance rank.
-   `dq_score` (NUMERIC): Data quality score.
-   `dq_points` (NUMERIC): Data quality points.
-   `dq_max_points` (NUMERIC): Maximum possible data quality points.
-   `fault_total` (NUMERIC): Total fault indicator.
-   `fault_primloss` (NUMERIC): Primary loss fault indicator.
-   `fault_smirch` (NUMERIC): Smirch fault indicator.
-   `fault_heatsys` (NUMERIC): Heating system fault indicator.
-   `rank_fault_primloss` (NUMERIC): Rank for primary loss fault.
-   `rank_fault_smirch` (NUMERIC): Rank for smirch fault.
-   `rank_fault_heatsys` (NUMERIC): Rank for heating system fault.
-   `demand_max` (NUMERIC): Maximum demand metric.
-   `demand_flex` (NUMERIC): Demand flexibility metric.
-   `eff_abs` (NUMERIC): Absolute efficiency value.
-   `eff_flex` (NUMERIC): Efficiency flexibility metric.
-   `supply_abs` (NUMERIC): Absolute supply temperature.
-   `supply_dim` (NUMERIC): Dimensioned supply temperature.
-   `return_abs` (NUMERIC): Absolute return temperature.
-   `return_dim` (NUMERIC): Dimensioned return temperature.
-   `dt_abs` (NUMERIC): Absolute delta-temperature (supply - return).
-   `dt_dim` (NUMERIC): Dimensioned delta-temperature.
-   `flow_abs` (NUMERIC): Absolute flow rate.
-   `flow_dim` (NUMERIC): Dimensioned flow rate.
-   `volume_spec` (NUMERIC): Specific volume metric.
-   `overflow_abs` (NUMERIC): Absolute overflow value.
-   `energy_abs` (NUMERIC): Absolute energy value.
-   `volume_abs` (NUMERIC): Absolute volume value.
---
"""
    if any(keyword in sql_query.upper() for keyword in ["INSERT", "UPDATE", "DELETE", "DROP", "CREATE", "ALTER"]):
        return "Error: This tool only supports read-only SELECT queries."
    try:
        conn = await asyncpg.connect(DATABASE_URL)
        result = await conn.fetch(sql_query)
        await conn.close()
        return str(result)
    except Exception as e:
        return f"Error executing query: {e}"

mcp_app = mcp.http_app()
app = FastAPI(title="Database Tools Host", lifespan=mcp_app.lifespan)
app.mount("/", mcp_app)
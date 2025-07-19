import os
from vanna.google import GoogleGeminiChat
from vanna.chromadb import ChromaDB_VectorStore
# MODIFIED: Import the config to get the model name
from src import config

class MyVanna(ChromaDB_VectorStore, GoogleGeminiChat):
    def __init__(self, config=None):
        ChromaDB_VectorStore.__init__(self, config={'path': './chroma_db'})
        # MODIFIED: The 'model' is now passed in the config
        GoogleGeminiChat.__init__(self, config=config)

def main():
    print("🚀 Starting Vanna training...")
    # MODIFIED: Pass both the api_key and the correct model name
    vn = MyVanna(config={
        'api_key': os.getenv('GEMINI_API_KEY'),
        'model': config.LLM_MODEL_NAME
    })

    # ... (The rest of the main function is correct and unchanged)
    try:
        vn.connect_to_postgres(
            host=os.getenv("DB_HOST", "db"),
            dbname=os.getenv("DB_NAME"),
            user=os.getenv("DB_USER"),
            password=os.getenv("DB_PASSWORD"),
            port=os.getenv("DB_PORT", "5432")
        )
        print("✅ Successfully connected to the database.")
    except Exception as e:
        print(f"🔥 Error connecting to the database: {e}")
        return

    print("\n📚 Training on DDL...")
    # Using the full DDL from your last update
    ddl = """
        CREATE TABLE IF NOT EXISTS buildings (
            uuid TEXT PRIMARY KEY, name TEXT NOT NULL UNIQUE, asset_type TEXT,
            asset_status TEXT, asset_active BOOLEAN, asset_latitude NUMERIC,
            asset_longitude NUMERIC
        );
        CREATE TABLE IF NOT EXISTS daily_metrics (
            id BIGSERIAL PRIMARY KEY, building_uuid TEXT NOT NULL, time_period DATE NOT NULL,
            efficiency NUMERIC, rank_overall NUMERIC, demand NUMERIC, flow NUMERIC,
            temperature_supply NUMERIC, temperature_return NUMERIC, ctrl_activity NUMERIC
        );
        CREATE TABLE IF NOT EXISTS monthly_metrics (
            id BIGSERIAL PRIMARY KEY, building_uuid TEXT NOT NULL, time_period DATE NOT NULL,
            building_impact NUMERIC, saving_kwh NUMERIC, saving_energy_perc NUMERIC
        );
        CREATE TABLE IF NOT EXISTS dashboard_data (
            id BIGSERIAL PRIMARY KEY, uuid TEXT NOT NULL, building_control TEXT,
            property_meter TEXT, customer_group TEXT, geo_group TEXT, type_group TEXT,
            generic_group TEXT, time_period TIMESTAMP WITH TIME ZONE NOT NULL,
            most_wanted NUMERIC, rank_overall NUMERIC, rank_network NUMERIC,
            rank_customer NUMERIC, overflow_abs NUMERIC, overflow_rel NUMERIC,
            overflow_spec NUMERIC, energy_abs NUMERIC, volume_abs NUMERIC,
            volume_spec NUMERIC, volume_trend NUMERIC, flow_dim NUMERIC,
            demand_sig NUMERIC, demand_flex NUMERIC, demand_k NUMERIC, demand_max NUMERIC,
            demand_dim NUMERIC, dt_abs NUMERIC, dt_vw NUMERIC, dt_ideal NUMERIC,
            dt_trend NUMERIC, dt_srd NUMERIC, rt_abs NUMERIC, rt_vw NUMERIC,
            rt_trend NUMERIC, rt_srd NUMERIC, rt_flex NUMERIC, ntu NUMERIC, ntu_srd NUMERIC,
            lmtd NUMERIC, efficiency NUMERIC, efficiency_srd NUMERIC, supply_abs NUMERIC,
            supply_flex NUMERIC, fault_prim_loss NUMERIC, fault_smirch NUMERIC,
            fault_heat_sys NUMERIC, fault_valve NUMERIC, fault_transfer NUMERIC,
            data_quality_missing_odt NUMERIC, data_quality_missing_supply NUMERIC,
            data_quality_missing_return NUMERIC, data_quality_missing_flow NUMERIC,
            data_quality_missing_energy NUMERIC, data_quality_missing_volume NUMERIC,
            data_quality_missing_demand NUMERIC, data_quality_missing_return_sec NUMERIC,
            data_quality_missing_supply_sec NUMERIC, data_quality_outlier_odt NUMERIC,
            data_quality_outlier_supply NUMERIC, data_quality_outlier_return NUMERIC,
            data_quality_outlier_flow NUMERIC, data_quality_outlier_energy NUMERIC,
            data_quality_outlier_volume NUMERIC, data_quality_outlier_demand NUMERIC,
            data_quality_outlier_return_sec NUMERIC, data_quality_outlier_supply_sec NUMERIC,
            data_quality_frozen_odt NUMERIC, data_quality_frozen_supply NUMERIC,
            data_quality_frozen_return NUMERIC, data_quality_frozen_flow NUMERIC,
            data_quality_frozen_energy NUMERIC, data_quality_frozen_volume NUMERIC,
            data_quality_frozen_demand NUMERIC, data_quality_frozen_return_sec NUMERIC,
            data_quality_frozen_supply_sec NUMERIC, primloss_rank NUMERIC, smirch_rank NUMERIC,
            heatsys_rank NUMERIC, valve_rank NUMERIC, transfer_rank NUMERIC,
            x_sum NUMERIC, y_sum NUMERIC, vector_len NUMERIC, supply_pos NUMERIC,
            dt_pos NUMERIC, rt_pos NUMERIC, ntu_pos NUMERIC, eff_pos NUMERIC
        );
    """
    vn.train(ddl=ddl)
    print("✅ DDL training complete.")
    print("\n🎉 Vanna training finished successfully! The model is ready.")

if __name__ == "__main__":
    main()
-- data-ingestion-service/src/migrations/001_create_dashboard_data_table.sql
-- Final version: All metric/rank columns are NUMERIC for maximum flexibility.

CREATE TABLE IF NOT EXISTS dashboard_data (
    -- Surrogate Primary Key
    id BIGSERIAL PRIMARY KEY,

    -- Identifying / Categorical Columns
    building_control TEXT NOT NULL,
    property_meter TEXT NOT NULL,
    customer_group TEXT NOT NULL,
    geo_group TEXT NOT NULL,
    type_group TEXT NOT NULL,
    generic_group TEXT NOT NULL,
    uuid TEXT NOT NULL,

    -- Geographical / Asset Information
    asset_latitude NUMERIC NOT NULL,
    asset_longitude NUMERIC NOT NULL,

    -- Time-series Data Point
    time_period TIMESTAMP WITH TIME ZONE NOT NULL,

    -- --- FIX: Changed all INTEGER metrics to NUMERIC ---
    most_wanted NUMERIC NOT NULL,
    rank_overall NUMERIC NOT NULL,
    rank_network NUMERIC NOT NULL,
    rank_customer NUMERIC NOT NULL,
    overflow_abs NUMERIC NOT NULL,
    overflow_rel NUMERIC NOT NULL,
    overflow_spec NUMERIC NOT NULL,
    energy_abs NUMERIC NOT NULL,
    volume_abs NUMERIC NOT NULL,
    volume_spec NUMERIC NOT NULL,
    volume_trend NUMERIC NOT NULL,
    flow_dim NUMERIC NOT NULL,
    demand_sig NUMERIC NOT NULL,
    demand_flex NUMERIC NOT NULL,
    demand_k NUMERIC NOT NULL,
    demand_max NUMERIC NOT NULL,
    demand_dim NUMERIC NOT NULL,
    dt_abs NUMERIC NOT NULL,
    dt_vw NUMERIC NOT NULL,
    dt_ideal NUMERIC NOT NULL,
    dt_trend NUMERIC NOT NULL,
    dt_srd NUMERIC NOT NULL,
    rt_abs NUMERIC NOT NULL,
    rt_vw NUMERIC NOT NULL,
    rt_trend NUMERIC NOT NULL,
    rt_srd NUMERIC NOT NULL,
    rt_flex NUMERIC NOT NULL,
    ntu NUMERIC NOT NULL,
    ntu_srd NUMERIC NOT NULL,
    lmtd NUMERIC NOT NULL,
    efficiency NUMERIC NOT NULL,
    efficiency_srd NUMERIC NOT NULL,
    supply_abs NUMERIC NOT NULL,
    supply_flex NUMERIC NOT NULL,
    fault_prim_loss NUMERIC NOT NULL,
    fault_smirch NUMERIC NOT NULL,
    fault_heat_sys NUMERIC NOT NULL,
    fault_valve NUMERIC NOT NULL,
    fault_transfer NUMERIC NOT NULL,
    data_quality_missing_odt NUMERIC NOT NULL,
    data_quality_missing_supply NUMERIC NOT NULL,
    data_quality_missing_return NUMERIC NOT NULL,
    data_quality_missing_flow NUMERIC NOT NULL,
    data_quality_missing_energy NUMERIC NOT NULL,
    data_quality_missing_volume NUMERIC NOT NULL,
    data_quality_missing_demand NUMERIC NOT NULL,
    data_quality_missing_return_sec NUMERIC NOT NULL,
    data_quality_missing_supply_sec NUMERIC NOT NULL,
    data_quality_outlier_odt NUMERIC NOT NULL,
    data_quality_outlier_supply NUMERIC NOT NULL,
    data_quality_outlier_return NUMERIC NOT NULL,
    data_quality_outlier_flow NUMERIC NOT NULL,
    data_quality_outlier_energy NUMERIC NOT NULL,
    data_quality_outlier_volume NUMERIC NOT NULL,
    data_quality_outlier_demand NUMERIC NOT NULL,
    data_quality_outlier_return_sec NUMERIC NOT NULL,
    data_quality_outlier_supply_sec NUMERIC NOT NULL,
    data_quality_frozen_odt NUMERIC NOT NULL,
    data_quality_frozen_supply NUMERIC NOT NULL,
    data_quality_frozen_return NUMERIC NOT NULL,
    data_quality_frozen_flow NUMERIC NOT NULL,
    data_quality_frozen_energy NUMERIC NOT NULL,
    data_quality_frozen_volume NUMERIC NOT NULL,
    data_quality_frozen_demand NUMERIC NOT NULL,
    data_quality_frozen_return_sec NUMERIC NOT NULL,
    data_quality_frozen_supply_sec NUMERIC NOT NULL,
    primloss_rank NUMERIC NOT NULL,
    smirch_rank NUMERIC NOT NULL,
    heatsys_rank NUMERIC NOT NULL,
    valve_rank NUMERIC NOT NULL,
    transfer_rank NUMERIC NOT NULL,
    x_sum NUMERIC NOT NULL,
    y_sum NUMERIC NOT NULL,
    vector_len NUMERIC NOT NULL,
    supply_pos NUMERIC NOT NULL,
    dt_pos NUMERIC NOT NULL,
    rt_pos NUMERIC NOT NULL,
    ntu_pos NUMERIC NOT NULL,
    eff_pos NUMERIC NOT NULL,

    -- Composite Unique Constraint
    UNIQUE (uuid, time_period)
);

-- Create an index on time_period for faster time-series queries
CREATE INDEX IF NOT EXISTS idx_dashboard_data_time_period ON dashboard_data (time_period);

-- Create a composite index on uuid and time_period for faster filtering and joins
CREATE INDEX IF NOT EXISTS idx_dashboard_data_uuid_time_period ON dashboard_data (uuid, time_period);
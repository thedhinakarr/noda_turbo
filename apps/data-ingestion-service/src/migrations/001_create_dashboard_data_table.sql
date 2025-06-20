-- data-ingestion-service/src/migrations/001_create_dashboard_data_table.sql

CREATE TABLE IF NOT EXISTS dashboard_data (
    -- Surrogate Primary Key (Recommended for general use and ETL)
    id BIGSERIAL PRIMARY KEY,

    -- Identifying / Categorical Columns
    building_control TEXT NOT NULL,
    property_meter TEXT NOT NULL,
    customer_group TEXT NOT NULL,
    geo_group TEXT NOT NULL,
    type_group TEXT NOT NULL,
    generic_group TEXT NOT NULL,
    uuid TEXT NOT NULL, -- Note: This 'UUID' column is not guaranteed to be globally unique in CSV alone for all rows.

    -- Geographical / Asset Information
    asset_latitude NUMERIC NOT NULL,
    asset_longitude NUMERIC NOT NULL,

    -- Time-series Data Point (Timestamp with Time Zone confirmed)
    time_period TIMESTAMP WITH TIME ZONE NOT NULL,

    -- Core Dashboard Metrics (using NUMERIC for floats, INTEGER for integers as identified)
    most_wanted INTEGER NOT NULL,
    rank_overall INTEGER NOT NULL,
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
    fault_heat_sys INTEGER NOT NULL,
    fault_valve NUMERIC NOT NULL,
    fault_transfer NUMERIC NOT NULL,

    -- Data Quality Metrics (Missing)
    data_quality_missing_odt NUMERIC NOT NULL,
    data_quality_missing_supply NUMERIC NOT NULL,
    data_quality_missing_return NUMERIC NOT NULL,
    data_quality_missing_flow NUMERIC NOT NULL,
    data_quality_missing_energy NUMERIC NOT NULL,
    data_quality_missing_volume NUMERIC NOT NULL,
    data_quality_missing_demand NUMERIC NOT NULL,
    data_quality_missing_return_sec NUMERIC NOT NULL,
    data_quality_missing_supply_sec NUMERIC NOT NULL,

    -- Data Quality Metrics (Outlier)
    data_quality_outlier_odt INTEGER NOT NULL,
    data_quality_outlier_supply INTEGER NOT NULL,
    data_quality_outlier_return INTEGER NOT NULL,
    data_quality_outlier_flow INTEGER NOT NULL,
    data_quality_outlier_energy INTEGER NOT NULL,
    data_quality_outlier_volume INTEGER NOT NULL,
    data_quality_outlier_demand INTEGER NOT NULL,
    data_quality_outlier_return_sec INTEGER NOT NULL,
    data_quality_outlier_supply_sec INTEGER NOT NULL,

    -- Data Quality Metrics (Frozen)
    data_quality_frozen_odt INTEGER NOT NULL,
    data_quality_frozen_supply NUMERIC NOT NULL,
    data_quality_frozen_return NUMERIC NOT NULL,
    data_quality_frozen_flow NUMERIC NOT NULL,
    data_quality_frozen_energy NUMERIC NOT NULL,
    data_quality_frozen_volume NUMERIC NOT NULL,
    data_quality_frozen_demand NUMERIC NOT NULL,
    data_quality_frozen_return_sec INTEGER NOT NULL,
    data_quality_frozen_supply_sec INTEGER NOT NULL,

    -- Rank/Position Metrics
    primloss_rank NUMERIC NOT NULL,
    smirch_rank NUMERIC NOT NULL,
    heatsys_rank INTEGER NOT NULL,
    valve_rank INTEGER NOT NULL,
    transfer_rank INTEGER NOT NULL,
    x_sum INTEGER NOT NULL,
    y_sum INTEGER NOT NULL,
    vector_len NUMERIC NOT NULL,
    supply_pos NUMERIC NOT NULL,
    dt_pos INTEGER NOT NULL,
    rt_pos INTEGER NOT NULL,
    ntu_pos INTEGER NOT NULL,
    eff_pos INTEGER NOT NULL,

    -- Composite Unique Constraint (Recommended for logical uniqueness of a data point)
    UNIQUE (uuid, time_period)
);

-- Create an index on time_period for faster time-series queries
CREATE INDEX IF NOT EXISTS idx_dashboard_data_time_period ON dashboard_data (time_period);

-- Create a composite index on uuid and time_period for faster filtering and joins
CREATE INDEX IF NOT EXISTS idx_dashboard_data_uuid_time_period ON dashboard_data (uuid, time_period);

-- Create a partial index for the pg_notify trigger (optional, but good for performance)
-- This index would be on columns typically part of the trigger's WHERE clause or payload generation
-- For simplicity, we'll rely on the unique constraint index for the trigger for now.
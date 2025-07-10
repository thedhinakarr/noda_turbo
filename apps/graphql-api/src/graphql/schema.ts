// apps/graphql-api/src/graphql/schema.ts
// REPLACED WITH THE COMPLETE SCHEMA INCLUDING assetType, assetStatus, assetActive

import { gql } from 'graphql-tag';

export const typeDefs = gql`
  # =================================================================
  # Reusable Component Types
  # =================================================================

  # A GeoJSON-like point for mapping coordinates.
  type Location {
    latitude: Float
    longitude: Float
  }

  # A simple type for a single data point in a time series chart.
  type TimeSeriesDataPoint {
    timestamp: String!
    value: Float!
  }

  # =================================================================
  # System Summary Types (For Chatbot & System Cards)
  # =================================================================

  # Groups all ranking-related metrics together.
  type Ranking {
    overall: Float
    network: Float
    customer: Float
  }

  # Groups all fault-related flags. This is a perfect target for a "Faults" UI card.
  type Faults {
    primaryLoss: Float
    smirch: Float
    heatSystem: Float
    valve: Float
    transfer: Float
  }

  # Groups key performance indicators for a system.
  type KeyPerformanceIndicators {
    mostWanted: Float
    efficiency: Float
    efficiencySrd: Float
    ntu: Float
    ntuSrd: Float
    lmtd: Float
  }

  # Groups all temperature-related metrics.
  type TemperatureMetrics {
    deltaAbsolute: Float
    deltaVolumeWeighted: Float
    deltaIdeal: Float
    deltaTrend: Float
    deltaSrd: Float
    returnAbsolute: Float
    returnVolumeWeighted: Float
    returnTrend: Float
    returnSrd: Float
    returnFlex: Float
    supplyAbsolute: Float
    supplyFlex: Float
  }

  # Groups all demand-related metrics.
  type DemandMetrics {
    signal: Float
    flex: Float
    k: Float
    max: Float
    dimensional: Float
  }

  # The primary entity, composed of logical sub-types for summary views.
  type System {
    id: ID! # Maps to buildings.uuid for consistent ID
    uuid: String! # Maps to buildings.uuid
    name: String # Maps to buildings.name
    location: Location # Derived from buildings.asset_latitude, buildings.asset_longitude
    timePeriod: String # Derived from dashboard_data.time_period (latest)
    customerGroup: String # Derived from dashboard_data.customer_group (latest)
    geoGroup: String # Derived from dashboard_data.geo_group (latest)
    typeGroup: String # Derived from dashboard_data.type_group (latest)
    genericGroup: String # Derived from dashboard_data.generic_group (latest)
    
    # NEW FIELDS: Directly from buildings table
    assetType: String # Maps to buildings.asset_type
    assetStatus: String # Maps to buildings.asset_status (e.g., "optimal", "warning", "alert")
    assetActive: Boolean # Maps to buildings.asset_active (boolean conversion if needed)

    kpis: KeyPerformanceIndicators # Derived from dashboard_data
    ranking: Ranking # Derived from dashboard_data
    faults: Faults # Derived from dashboard_data
    demand: DemandMetrics # Derived from dashboard_data
    temperature: TemperatureMetrics # Derived from dashboard_data
  }

  # The paginated response for a list of systems.
  type SystemResponse {
    systems: [System!]!
    totalCount: Int!
  }

  # =================================================================
  # Page-Specific Types
  # =================================================================

  # --- For Overview Page ---
  type WeatherData {
    timestamp: String
    cloudiness: Float
    outdoorTemperature: Float
  }
  type OverviewData {
    buildings: [System!]!
    weather: [WeatherData!]
  }

  # --- For Retrospect Page ---
  # Represents a single, granular row from the dashboard_data table.
  # This is now fully expanded for testing.
  type RetrospectDataPoint {
    id: ID!
    uuid: String!
    building_control: String
    property_meter: String
    customer_group: String
    geo_group: String
    type_group: String
    generic_group: String
    time_period: String!
    most_wanted: Float
    rank_overall: Float
    rank_network: Float
    rank_customer: Float
    overflow_abs: Float
    overflow_rel: Float
    overflow_spec: Float
    energy_abs: Float
    volume_abs: Float
    volume_spec: Float
    volume_trend: Float
    flow_dim: Float
    demand_sig: Float
    demand_flex: Float
    demand_k: Float
    demand_max: Float
    demand_dim: Float
    dt_abs: Float
    dt_vw: Float
    dt_ideal: Float
    dt_trend: Float
    dt_srd: Float
    rt_abs: Float
    rt_vw: Float
    rt_trend: Float
    rt_srd: Float
    rt_flex: Float
    ntu: Float
    ntu_srd: Float
    lmtd: Float
    efficiency: Float
    efficiency_srd: Float
    supply_abs: Float
    supply_flex: Float
    fault_prim_loss: Float
    fault_smirch: Float
    fault_heat_sys: Float
    fault_valve: Float
    fault_transfer: Float
    data_quality_missing_odt: Float
    data_quality_missing_supply: Float
    data_quality_missing_return: Float
    data_quality_missing_flow: Float
    data_quality_missing_energy: Float
    data_quality_missing_volume: Float
    data_quality_missing_demand: Float
    data_quality_missing_return_sec: Float
    data_quality_missing_supply_sec: Float
    data_quality_outlier_odt: Float
    data_quality_outlier_supply: Float
    data_quality_outlier_return: Float
    data_quality_outlier_flow: Float
    data_quality_outlier_energy: Float
    data_quality_outlier_volume: Float
    data_quality_outlier_demand: Float
    data_quality_outlier_return_sec: Float
    data_quality_outlier_supply_sec: Float
    data_quality_frozen_odt: Float
    data_quality_frozen_supply: Float
    data_quality_frozen_return: Float
    data_quality_frozen_flow: Float
    data_quality_frozen_energy: Float
    data_quality_frozen_volume: Float
    data_quality_frozen_demand: Float
    data_quality_frozen_return_sec: Float
    data_quality_frozen_supply_sec: Float
    primloss_rank: Float
    smirch_rank: Float
    heatsys_rank: Float
    valve_rank: Float
    transfer_rank: Float
    x_sum: Float
    y_sum: Float
    vector_len: Float
    supply_pos: Float
    dt_pos: Float
    rt_pos: Float
    ntu_pos: Float
    eff_pos: Float
  }

  # --- For Building Page ---
  # This is now fully expanded for testing.
  type MonthlyMetric {
    id: ID!
    time_period: String!
    building_impact: Float
    saving_kwh: Float
    saving_energy_perc: Float
    saving_energy_sek: Float
    saving_demand_sek: Float
    saving_rt_sek: Float
    saving_volume_sek: Float
    saving_total_sek: Float
    idt_avg: Float
    idt_wanted: Float
  }

  # --- For Demand Page ---
  type DailyMetric {
    id: ID!
    time_period: String!
    demand: Float
    flow: Float
    temperature_supply: Float
    temperature_return: Float
    ctrl_activity: Float
  }


  # =================================================================
  # Main Query and Subscription Types
  # =================================================================

  type Query {
    # --- General Purpose Queries (For Chatbot, etc.) ---
    systems(limit: Int, offset: Int, status: String, searchTerm: String): SystemResponse
    system(uuid: String!): System
    systemMetricOverTime(uuid: String!, metric: String!): [TimeSeriesDataPoint!]

    # --- Page-Specific Queries ---
    overview: OverviewData
    retrospectData(uuid: String!, startDate: String, endDate: String): [RetrospectDataPoint!]
    monthlyMetrics(uuid: String!, startDate: String, endDate: String): [MonthlyMetric!]
    dailyMetrics(uuid: String!, startDate: String, endDate: String): [DailyMetric!]
  }

  type Subscription {
    systemUpdated: System
  }
`;
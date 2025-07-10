// apps/web/lib/graphql/types.ts

// =================================================================
// Reusable Component Types
// =================================================================

// A GeoJSON-like point for mapping coordinates.
export interface Location {
  latitude: number | null; // GraphQL Float can be null
  longitude: number | null; // GraphQL Float can be null
}

// A simple type for a single data point in a time series chart.
export interface TimeSeriesDataPoint {
  timestamp: string;
  value: number;
}

// =================================================================
// System Summary Types (For Chatbot & System Cards)
// =================================================================

// Groups all ranking-related metrics together.
export interface Ranking {
  overall: number | null;
  network: number | null;
  customer: number | null;
}

// Groups all fault-related flags.
export interface Faults {
  primaryLoss: number | null;
  smirch: number | null;
  heatSystem: number | null;
  valve: number | null;
  transfer: number | null;
}

// Groups key performance indicators for a system.
export interface KeyPerformanceIndicators {
  mostWanted: number | null;
  efficiency: number | null;
  efficiencySrd: number | null;
  ntu: number | null;
  ntuSrd: number | null;
  lmtd: number | null;
}

// Groups all temperature-related metrics.
export interface TemperatureMetrics {
  deltaAbsolute: number | null;
  deltaVolumeWeighted: number | null;
  deltaIdeal: number | null;
  deltaTrend: number | null;
  deltaSrd: number | null;
  returnAbsolute: number | null;
  returnVolumeWeighted: number | null;
  returnTrend: number | null;
  returnSrd: number | null;
  returnFlex: number | null;
  supplyAbsolute: number | null;
  supplyFlex: number | null;
}

// Groups all demand-related metrics.
export interface DemandMetrics {
  signal: number | null;
  flex: number | null;
  k: number | null;
  max: number | null;
  dimensional: number | null;
}

// The primary entity, composed of logical sub-types for summary views.
export interface System {
  id: string; // GraphQL ID! is typically string in TS
  uuid: string;
  name: string | null;
  location: Location | null;
  timePeriod: string | null;
  customerGroup: string | null;
  geoGroup: string | null;
  typeGroup: string | null;
  genericGroup: string | null;
  kpis: KeyPerformanceIndicators | null;
  ranking: Ranking | null;
  faults: Faults | null;
  demand: DemandMetrics | null;
  temperature: TemperatureMetrics | null;
}

// The paginated response for a list of systems.
export interface SystemResponse {
  systems: System[];
  totalCount: number;
}

// =================================================================
// Page-Specific Types
// =================================================================

// --- For Overview Page ---
export interface WeatherData {
  timestamp: string;
  cloudiness: number | null;
  outdoorTemperature: number | null;
}

export interface OverviewData {
  overview: {
    buildings: System[]; // This refers to the 'System' interface defined above
    weather: WeatherData[] | null; // GraphQL list can be null
  };
}

// --- For Retrospect Page ---
export interface RetrospectDataPoint {
  id: string;
  uuid: string;
  building_control: string | null;
  property_meter: string | null;
  customer_group: string | null;
  geo_group: string | null;
  type_group: string | null;
  generic_group: string | null;
  time_period: string;
  most_wanted: number | null;
  rank_overall: number | null;
  rank_network: number | null;
  rank_customer: number | null;
  overflow_abs: number | null;
  overflow_rel: number | null;
  overflow_spec: number | null;
  energy_abs: number | null;
  volume_abs: number | null;
  volume_spec: number | null;
  volume_trend: number | null;
  flow_dim: number | null;
  demand_sig: number | null;
  demand_flex: number | null;
  demand_k: number | null;
  demand_max: number | null;
  demand_dim: number | null;
  dt_abs: number | null;
  dt_vw: number | null;
  dt_ideal: number | null;
  dt_trend: number | null;
  dt_srd: number | null;
  rt_abs: number | null;
  rt_vw: number | null;
  rt_trend: number | null;
  rt_srd: number | null;
  rt_flex: number | null;
  ntu: number | null;
  ntu_srd: number | null;
  lmtd: number | null;
  efficiency: number | null;
  efficiency_srd: number | null;
  supply_abs: number | null;
  supply_flex: number | null;
  fault_prim_loss: number | null;
  fault_smirch: number | null;
  fault_heat_sys: number | null;
  fault_valve: number | null;
  fault_transfer: number | null;
  data_quality_missing_odt: number | null;
  data_quality_missing_supply: number | null;
  data_quality_missing_return: number | null;
  data_quality_missing_flow: number | null;
  data_quality_missing_energy: number | null;
  data_quality_missing_volume: number | null;
  data_quality_missing_demand: number | null;
  data_quality_missing_return_sec: number | null;
  data_quality_missing_supply_sec: number | null;
  data_quality_outlier_odt: number | null;
  data_quality_outlier_supply: number | null;
  data_quality_outlier_return: number | null;
  data_quality_outlier_flow: number | null;
  data_quality_outlier_energy: number | null;
  data_quality_outlier_volume: number | null;
  data_quality_outlier_demand: number | null;
  data_quality_outlier_return_sec: number | null;
  data_quality_outlier_supply_sec: number | null;
  data_quality_frozen_odt: number | null;
  data_quality_frozen_supply: number | null;
  data_quality_frozen_return: number | null;
  data_quality_frozen_flow: number | null;
  data_quality_frozen_energy: number | null;
  data_quality_frozen_volume: number | null;
  data_quality_frozen_demand: number | null;
  data_quality_frozen_return_sec: number | null;
  data_quality_frozen_supply_sec: number | null;
  primloss_rank: number | null;
  smirch_rank: number | null;
  heatsys_rank: number | null;
  valve_rank: number | null;
  transfer_rank: number | null;
  x_sum: number | null;
  y_sum: number | null;
  vector_len: number | null;
  supply_pos: number | null;
  dt_pos: number | null;
  rt_pos: number | null;
  ntu_pos: number | null;
  eff_pos: number | null;
}

// --- For Building Page ---
export interface MonthlyMetric {
  id: string;
  time_period: string;
  building_impact: number | null;
  saving_kwh: number | null;
  saving_energy_perc: number | null;
  saving_energy_sek: number | null;
  saving_demand_sek: number | null;
  saving_rt_sek: number | null;
  saving_volume_sek: number | null;
  saving_total_sek: number | null;
  idt_avg: number | null;
  idt_wanted: number | null;
}

// --- For Demand Page ---
export interface DailyMetric {
  id: string;
  time_period: string;
  demand: number | null;
  flow: number | null;
  temperature_supply: number | null;
  temperature_return: number | null;
  ctrl_activity: number | null;
}
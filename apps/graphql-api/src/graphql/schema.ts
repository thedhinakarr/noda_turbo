import { gql } from 'graphql-tag';

export const typeDefs = gql`
  # The main data type, representing a row from our dashboard_data table.
  # All database columns are mapped to corresponding GraphQL types.
  type DashboardData {
    id: ID!
    building_control: String
    property_meter: String
    customer_group: String
    geo_group: String
    type_group: String
    generic_group: String
    uuid: String!
    asset_latitude: Float
    asset_longitude: Float
    time_period: String
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
  }

  # A response wrapper for our main query. This allows us to return
  # both the list of systems for the current page and the total count
  # for building pagination controls.
  type DashboardDataResponse {
    systems: [DashboardData!]!
    totalCount: Int!
  }

  # The "Query" type is the entry point for all GET requests.
  type Query {
    # Fetches a paginated, filterable, and searchable list of systems.
    allDashboardData(
      limit: Int,
      offset: Int,
      status: String,
      searchTerm: String
    ): DashboardDataResponse

    # Fetches a single record by its UUID.
    dashboardDataByUuid(uuid: String!): DashboardData
  }
  
  # --- NEW: For real-time updates ---
  type Subscription {
    systemUpdated: DashboardData
  }
`;
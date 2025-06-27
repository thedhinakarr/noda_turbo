// apps/web/lib/graphql/queries.ts
import { gql } from '@apollo/client';

export const GET_ALL_DASHBOARD_DATA = gql`
  query GetAllDashboardData($limit: Int) {
    allDashboardData(limit: $limit) {
      id
      building_control
      property_meter
      customer_group
      geo_group
      type_group
      generic_group
      uuid
      asset_latitude
      asset_longitude
      time_period
      most_wanted
      rank_overall
      rank_network
      rank_customer
      overflow_abs
      overflow_rel
      overflow_spec
      energy_abs
      volume_abs
      volume_spec
      volume_trend
      flow_dim
      demand_sig
      demand_flex
      demand_k
      demand_max
      demand_dim
      dt_abs
      dt_vw
      dt_ideal
      dt_trend
      dt_srd
      rt_abs
      rt_vw
      rt_trend
      rt_srd
      rt_flex
      ntu
      ntu_srd
      lmtd
      efficiency
      efficiency_srd
      supply_abs
      supply_flex
      fault_prim_loss
      fault_smirch
      fault_heat_sys
      fault_valve
      fault_transfer
    }
  }
`;
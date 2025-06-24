// =================================================================
// FILE: apps/graphql-api/src/graphql/resolvers.ts
// The final, definitive, and correct version with explicit data type casting.
// =================================================================
import { MyContext } from './context';
import { GraphQLError } from 'graphql';
import { pubsub } from '../realtime/pubsub';

export const resolvers = {
  Query: {
    allDashboardData: async (_: any, { limit }: { limit: number }, context: MyContext) => {
      if (!context.user) {
        throw new GraphQLError('You must be logged in.', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }
      const result = await context.db.query('SELECT * FROM dashboard_data LIMIT $1', [limit]);
      return result.rows;
    },
  },

  Subscription: {
    systemUpdated: {
      // --- THIS IS THE FINAL FIX ---
      // The resolver now has a "resolve" function that takes the raw payload from Redis
      // (where all numeric values are strings) and explicitly parses them into
      // Floats to match the GraphQL schema. This prevents the type mismatch crash.
      resolve: (payload: any) => {
        return {
          systemUpdated: {
            id: payload.id,
            building_control: payload.building_control,
            property_meter: payload.property_meter,
            customer_group: payload.customer_group,
            geo_group: payload.geo_group,
            type_group: payload.type_group,
            generic_group: payload.generic_group,
            uuid: payload.uuid,
            asset_latitude: parseFloat(payload.asset_latitude),
            asset_longitude: parseFloat(payload.asset_longitude),
            time_period: payload.time_period,
            most_wanted: parseFloat(payload.most_wanted),
            rank_overall: parseFloat(payload.rank_overall),
            rank_network: parseFloat(payload.rank_network),
            rank_customer: parseFloat(payload.rank_customer),
            overflow_abs: parseFloat(payload.overflow_abs),
            overflow_rel: parseFloat(payload.overflow_rel),
            overflow_spec: parseFloat(payload.overflow_spec),
            energy_abs: parseFloat(payload.energy_abs),
            volume_abs: parseFloat(payload.volume_abs),
            volume_spec: parseFloat(payload.volume_spec),
            volume_trend: parseFloat(payload.volume_trend),
            flow_dim: parseFloat(payload.flow_dim),
            demand_sig: parseFloat(payload.demand_sig),
            demand_flex: parseFloat(payload.demand_flex),
            demand_k: parseFloat(payload.demand_k),
            demand_max: parseFloat(payload.demand_max),
            demand_dim: parseFloat(payload.demand_dim),
            dt_abs: parseFloat(payload.dt_abs),
            dt_vw: parseFloat(payload.dt_vw),
            dt_ideal: parseFloat(payload.dt_ideal),
            dt_trend: parseFloat(payload.dt_trend),
            dt_srd: parseFloat(payload.dt_srd),
            rt_abs: parseFloat(payload.rt_abs),
            rt_vw: parseFloat(payload.rt_vw),
            rt_trend: parseFloat(payload.rt_trend),
            rt_srd: parseFloat(payload.rt_srd),
            rt_flex: parseFloat(payload.rt_flex),
            ntu: parseFloat(payload.ntu),
            ntu_srd: parseFloat(payload.ntu_srd),
            lmtd: parseFloat(payload.lmtd),
            efficiency: parseFloat(payload.efficiency),
            efficiency_srd: parseFloat(payload.efficiency_srd),
            supply_abs: parseFloat(payload.supply_abs),
            supply_flex: parseFloat(payload.supply_flex),
            fault_prim_loss: parseFloat(payload.fault_prim_loss),
            fault_smirch: parseFloat(payload.fault_smirch),
            fault_heat_sys: parseFloat(payload.fault_heat_sys),
            fault_valve: parseFloat(payload.fault_valve),
            fault_transfer: parseFloat(payload.fault_transfer),
          },
        };
      },
      // The subscription still correctly listens for the raw update topic.
      subscribe: () => pubsub.asyncIterator(['RAW_SYSTEM_UPDATE']),
    },
  },
};
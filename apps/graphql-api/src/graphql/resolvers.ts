// apps/graphql-api/src/graphql/resolvers.ts
// REPLACED WITH THE COMPLETE RESOLVER CODE INCLUDING assetType, assetStatus, assetActive, and kpis.efficiency fix

import { GraphQLError } from 'graphql';
import { pubsub } from '../realtime/pubsub';
import { MyContext } from './context'; // Assuming MyContext is correctly defined

// Define a type for the 'building' object that resolvers will receive as a parent.
// This matches the columns from your 'buildings' DB table.
interface BuildingDBRow {
  uuid: string;
  name: string;
  asset_type: string | null;
  asset_status: string | null;
  asset_active: boolean | null; // Assuming DB type maps to boolean
  asset_latitude: number | null;
  asset_longitude: number | null;
  // Include other columns from your buildings table that might be directly returned by Query.overview
  customer_group?: string; // Optional, if directly on buildings table
  geo_group?: string;     // Optional, if directly on buildings table
  type_group?: string;    // Optional, if directly on buildings table
  generic_group?: string; // Optional, if directly on buildings table
}

// Define a type for a dashboard_data row
interface DashboardDataDBRow {
  uuid: string;
  time_period: Date; // Assuming TIMESTAMP WITH TIME ZONE maps to Date object in Node.js pg
  most_wanted: number | null;
  rank_overall: number | null;
  rank_network: number | null;
  rank_customer: number | null;
  efficiency: number | null; // From dashboard_data
  efficiency_srd: number | null;
  ntu: number | null;
  ntu_srd: number | null;
  lmtd: number | null;
  fault_prim_loss: number | null;
  fault_smirch: number | null;
  fault_heat_sys: number | null;
  fault_valve: number | null;
  fault_transfer: number | null;
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
  supply_abs: number | null;
  supply_flex: number | null;
  customer_group?: string;
  geo_group?: string;
  type_group?: string;
  generic_group?: string;
}

// Define a type for a daily_metrics row
interface DailyMetricsDBRow {
  uuid: string;
  time_period: Date;
  demand: number | null;
  flow: number | null;
  temperature_supply: number | null;
  temperature_return: number | null;
  ctrl_activity: number | null;
}

// Define a type for a weather_data row
interface WeatherDataDBRow {
  id: number;
  time_period: Date;
  cloudiness: number | null;
  outdoor_temperature: number | null;
}

// Helper to fetch time-series data within a date range.
// NOTE: This is NOT batched as it's for a single system's detailed view.
const getTimeSeriesData = async (context: MyContext, table: string, uuid: string, startDate: string, endDate: string) => {
  const uuidColumn = table === 'dashboard_data' ? 'uuid' : 'building_uuid'; // Assuming monthly_metrics/daily_metrics might use building_uuid
  const query = `
        SELECT * FROM ${table}
        WHERE ${uuidColumn} = $1 AND time_period >= $2 AND time_period <= $3
        ORDER BY time_period ASC;
    `;
  const result = await context.db.query(query, [uuid, startDate, endDate]);
  return result.rows;
}

export const resolvers = {
  // =================================================================
  // Query Resolvers (The Entry Points)
  // =================================================================
  Query: {
    systems: async (
      _: any,
      { limit = 20, offset = 0, searchTerm }: { limit?: number; offset?: number; searchTerm?: string },
      context: MyContext
    ) => {
      if (!context.user) throw new GraphQLError('Unauthorized', { extensions: { code: 'UNAUTHENTICATED' } });
      const params: any[] = [];
      const whereClauses: string[] = [];
      let paramIndex = 1;

      if (searchTerm) {
        whereClauses.push(`name ILIKE $${paramIndex++}`);
        params.push(`%${searchTerm}%`);
      }

      const whereStatement = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';
      const systemsQuery = `SELECT * FROM buildings ${whereStatement} ORDER BY name ASC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
      const countQuery = `SELECT COUNT(*) as total FROM buildings ${whereStatement}`;

      try {
        const [systemsResult, countResult] = await Promise.all([
          context.db.query(systemsQuery, [...params, limit, offset]),
          context.db.query(countQuery, params)
        ]);
        return { systems: systemsResult.rows, totalCount: parseInt(countResult.rows[0].total, 10) };
      } catch (e) {
        console.error("Error fetching systems:", e);
        throw new GraphQLError("Error fetching systems.");
      }
    },

    system: async (_: any, { uuid }: { uuid: string }, context: MyContext) => {
      if (!context.user) throw new GraphQLError('Unauthorized', { extensions: { code: 'UNAUTHENTICATED' } });
      const result = await context.db.query('SELECT * FROM buildings WHERE uuid = $1', [uuid]);
      return result.rows[0];
    },

    systemMetricOverTime: async (_: any, { uuid, metric }: { uuid: string; metric: string }, context: MyContext) => {
      if (!context.user) throw new GraphQLError('Unauthorized', { extensions: { code: 'UNAUTHENTICATED' } });
      const allowedMetrics = [
        'most_wanted', 'rank_overall', 'rank_network', 'rank_customer', 'overflow_abs', 'overflow_rel', 'overflow_spec',
        'energy_abs', 'volume_abs', 'volume_spec', 'volume_trend', 'flow_dim', 'demand_sig', 'demand_flex', 'demand_k',
        'demand_max', 'demand_dim', 'dt_abs', 'dt_vw', 'dt_ideal', 'dt_trend', 'dt_srd', 'rt_abs', 'rt_vw', 'rt_trend',
        'rt_srd', 'rt_flex', 'ntu', 'ntu_srd', 'lmtd', 'efficiency', 'efficiency_srd', 'supply_abs', 'supply_flex',
        'fault_prim_loss', 'fault_smirch', 'fault_heat_sys', 'fault_valve', 'fault_transfer'
      ];
      if (!allowedMetrics.includes(metric)) throw new GraphQLError('Invalid metric specified.');

      const query = `
                SELECT time_period as timestamp, ${metric} as value
                FROM dashboard_data WHERE uuid = $1 ORDER BY time_period ASC;
            `;
      const result = await context.db.query(query, [uuid]);
      return result.rows;
    },

    overview: async (_: any, __: any, context: MyContext) => {
      if (!context.user) throw new GraphQLError('Unauthorized', { extensions: { code: 'UNAUTHENTICATED' } });
      const [buildingsResult, weatherResult] = await Promise.all([
        context.db.query('SELECT * FROM buildings ORDER BY name ASC'),
        context.db.query('SELECT time_period as timestamp, cloudiness, outdoor_temperature FROM weather_data ORDER BY time_period DESC LIMIT 100')
      ]);
      return { buildings: buildingsResult.rows, weather: weatherResult.rows };
    },

    retrospectData: async (_: any, { uuid, startDate, endDate }: { uuid: string, startDate: string, endDate: string }, context: MyContext) => {
      if (!context.user) throw new GraphQLError('Unauthorized', { extensions: { code: 'UNAUTHENTICATED' } });
      return getTimeSeriesData(context, 'dashboard_data', uuid, startDate, endDate);
    },

    monthlyMetrics: async (_: any, { uuid, startDate, endDate }: { uuid: string, startDate: string, endDate: string }, context: MyContext) => {
      if (!context.user) throw new GraphQLError('Unauthorized', { extensions: { code: 'UNAUTHENTICATED' } });
      return getTimeSeriesData(context, 'monthly_metrics', uuid, startDate, endDate);
    },

    dailyMetrics: async (_: any, { uuid, startDate, endDate }: { uuid: string, startDate: string, endDate: string }, context: MyContext) => {
      if (!context.user) throw new GraphQLError('Unauthorized', { extensions: { code: 'UNAUTHENTICATED' } });
      return getTimeSeriesData(context, 'daily_metrics', uuid, startDate, endDate);
    },
  },

  // =================================================================
  // Type Resolvers (for nested fields and specific mappings)
  // =================================================================

  // Resolver for the System type
  System: {
    id: (parent: BuildingDBRow) => parent.uuid, // Use uuid from buildings table as GraphQL ID
    name: (parent: BuildingDBRow) => parent.name,
    uuid: (parent: BuildingDBRow) => parent.uuid,

    // NEW RESOLVERS: For fields directly from the 'buildings' table
    assetType: (parent: BuildingDBRow) => parent.asset_type,
    assetStatus: (parent: BuildingDBRow) => parent.asset_status,
    assetActive: (parent: BuildingDBRow) => parent.asset_active, // Assuming boolean conversion is handled or it's a boolean in DB

    // Nested 'location' field resolver
    location: (parent: BuildingDBRow) => {
      if (parent.asset_latitude !== null && parent.asset_longitude !== null) {
        return {
          latitude: parent.asset_latitude,
          longitude: parent.asset_longitude,
        };
      }
      return null;
    },

    // Nested group fields that also exist on dashboard_data (resolve from buildings first if possible)
    timePeriod: async (parent: BuildingDBRow, _: any, { loaders }: MyContext) => {
      const data = await loaders.latestGranularMetric.load(parent.uuid);
      // Assuming time_period from DB is a Date object, convert to ISO string if GraphQL type is String
      return data instanceof Error ? null : (data.time_period ? data.time_period.toISOString() : null);
    },
    customerGroup: async (parent: BuildingDBRow, _: any, { loaders }: MyContext) => {
      const data = await loaders.latestGranularMetric.load(parent.uuid);
      return data instanceof Error ? null : data.customer_group;
    },
    geoGroup: async (parent: BuildingDBRow, _: any, { loaders }: MyContext) => {
      const data = await loaders.latestGranularMetric.load(parent.uuid);
      return data instanceof Error ? null : data.geo_group;
    },
    typeGroup: async (parent: BuildingDBRow, _: any, { loaders }: MyContext) => {
      const data = await loaders.latestGranularMetric.load(parent.uuid);
      return data instanceof Error ? null : data.type_group;
    },
    genericGroup: async (parent: BuildingDBRow, _: any, { loaders }: MyContext) => {
      const data = await loaders.latestGranularMetric.load(parent.uuid);
      return data instanceof Error ? null : data.generic_group;
    },

    // Nested 'kpis' field resolver
    kpis: async (parent: BuildingDBRow, _: any, { loaders }: MyContext) => {
      const granularData = await loaders.latestGranularMetric.load(parent.uuid);
      // No need to load daily here unless other kpis fields specifically come from daily_metrics
      // const dailyData = await loaders.latestDailyMetric.load(parent.uuid);

      if (granularData instanceof Error) return null; // || dailyData instanceof Error

      return {
        mostWanted: granularData.most_wanted,
        // FIXED: efficiency now comes from granularData (dashboard_data)
        efficiency: granularData.efficiency,
        efficiencySrd: granularData.efficiency_srd,
        ntu: granularData.ntu,
        ntuSrd: granularData.ntu_srd,
        lmtd: granularData.lmtd,
      };
    },

    // Nested 'ranking' field resolver
    ranking: async (parent: BuildingDBRow, _: any, { loaders }: MyContext) => {
      const granularData = await loaders.latestGranularMetric.load(parent.uuid);
      if (granularData instanceof Error) return null;
      return {
        overall: granularData.rank_overall,
        network: granularData.rank_network,
        customer: granularData.rank_customer,
      };
    },

    // Nested 'faults' field resolver
    faults: async (parent: BuildingDBRow, _: any, { loaders }: MyContext) => {
      const granularData = await loaders.latestGranularMetric.load(parent.uuid);
      if (granularData instanceof Error) return null;
      return {
        primaryLoss: granularData.fault_prim_loss, smirch: granularData.fault_smirch,
        heatSystem: granularData.fault_heat_sys, valve: granularData.fault_valve, transfer: granularData.fault_transfer,
      };
    },

    // Nested 'demand' field resolver
    demand: async (parent: BuildingDBRow, _: any, { loaders }: MyContext) => {
      const granularData = await loaders.latestGranularMetric.load(parent.uuid);
      if (granularData instanceof Error) return null;
      return {
        signal: granularData.demand_sig, flex: granularData.demand_flex, k: granularData.demand_k,
        max: granularData.demand_max, dimensional: granularData.demand_dim,
      };
    },

    // Nested 'temperature' field resolver
    temperature: async (parent: BuildingDBRow, _: any, { loaders }: MyContext) => {
      const granularData = await loaders.latestGranularMetric.load(parent.uuid);
      if (granularData instanceof Error) return null;
      return {
        deltaAbsolute: granularData.dt_abs, deltaVolumeWeighted: granularData.dt_vw, deltaIdeal: granularData.dt_ideal,
        deltaTrend: granularData.dt_trend, deltaSrd: granularData.dt_srd, returnAbsolute: granularData.rt_abs,
        returnVolumeWeighted: granularData.rt_vw, returnTrend: granularData.rt_trend, returnSrd: granularData.rt_srd,
        returnFlex: granularData.rt_flex, supplyAbsolute: granularData.supply_abs, supplyFlex: granularData.supply_flex,
      };
    }
  },

  // Resolver for the WeatherData type
  WeatherData: {
    timestamp: (parent: WeatherDataDBRow) => {
      // Check if time_period exists and is not null/undefined
      if (parent.time_period) {
        let dateObj: Date;
        // If it's already a Date object (pg driver often returns this for TIMESTAMP WITH TIME ZONE)
        if (parent.time_period instanceof Date) {
          dateObj = parent.time_period;
        } else {
          // If it's a string (like "2025-07-04 18:00:00.000 +0200"), try to parse it
          dateObj = new Date(parent.time_period);
        }

        // Check if the parsed date is valid before converting to ISO string
        if (!isNaN(dateObj.getTime())) { // isNaN(date.getTime()) checks for "Invalid Date"
          return dateObj.toISOString();
        }
      }
      // If parent.time_period is null/undefined or parsing failed, return null.
      // This is now allowed because you've made 'timestamp' nullable in schema.ts.
      return null;
    },
    cloudiness: (parent: WeatherDataDBRow) => parent.cloudiness,
    outdoorTemperature: (parent: WeatherDataDBRow) => parent.outdoor_temperature,
  },
  // ... other type resolvers (Ranking, KeyPerformanceIndicators, Faults etc.)
  // You might also need resolvers for RetrospectDataPoint, MonthlyMetric, DailyMetric
  RetrospectDataPoint: {
    time_period: (parent: any) => parent.time_period ? parent.time_period.toISOString() : null,
    // ... map other snake_case fields to camelCase if needed for the GraphQL type
  },
  MonthlyMetric: {
    time_period: (parent: any) => parent.time_period ? parent.time_period.toISOString() : null,
    // ... map other snake_case fields
  },
  DailyMetric: {
    time_period: (parent: any) => parent.time_period ? parent.time_period.toISOString() : null,
    // ... map other snake_case fields
  },

  // =================================================================
  // Subscription Resolver
  // =================================================================
  Subscription: {
    systemUpdated: {
      resolve: async (payload: { uuid: string }, _: any, context: MyContext) => {
        console.log(`Resolving subscription for updated system: ${payload.uuid}`);
        return resolvers.Query.system(_, { uuid: payload.uuid }, context);
      },
      subscribe: () => pubsub.asyncIterator(['SYSTEM_UPDATED']),
    },
  },
};
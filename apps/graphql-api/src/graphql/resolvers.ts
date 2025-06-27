import { GraphQLError } from 'graphql';
import { pubsub } from '../realtime/pubsub';
import { MyContext } from './context';

// Helper function to derive efficiency ranges from a status string.
const getStatusRange = (status: string): { min: number; max: number } | null => {
  switch (status) {
    case 'optimal':
      return { min: 90, max: 101 }; // Using 101 to be inclusive of 100, as the query is < max.
    case 'warning':
      return { min: 80, max: 90 };
    case 'alert':
      return { min: 0, max: 80 };
    default:
      return null;
  }
};

export const resolvers = {
  Query: {
    allDashboardData: async (
      _: any,
      { limit = 20, offset = 0, status, searchTerm }: { limit?: number; offset?: number; status?: string; searchTerm?: string },
      context: MyContext
    ) => {
      if (!context.user) {
        throw new GraphQLError('You must be logged in to perform this action.', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      // --- Build a dynamic, parameterized SQL query to prevent SQL injection ---
      const params: any[] = [];
      const whereClauses: string[] = [];
      let paramIndex = 1;

      // 1. Status Filter - Check if status is defined before processing.
      if (status) {
        const statusRange = getStatusRange(status);
        if (statusRange) {
          whereClauses.push(`(efficiency >= $${paramIndex++} AND efficiency < $${paramIndex++})`);
          params.push(statusRange.min, statusRange.max);
        }
      }

      // 2. Search Term Filter
      if (searchTerm) {
        whereClauses.push(`(building_control ILIKE $${paramIndex} OR geo_group ILIKE $${paramIndex} OR type_group ILIKE $${paramIndex})`);
        params.push(`%${searchTerm}%`);
        paramIndex++;
      }
      
      const whereStatement = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

      // --- Construct the final queries for data and total count ---
      const systemsQueryString = `SELECT * FROM dashboard_data ${whereStatement} ORDER BY id ASC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
      const systemsParams = [...params, limit, offset];
      
      const countQueryString = `SELECT COUNT(*) as total FROM dashboard_data ${whereStatement}`;
      const countParams = [...params];

      // --- Execute Both Queries in Parallel for Efficiency ---
      try {
        const [systemsResult, countResult] = await Promise.all([
          context.db.query(systemsQueryString, systemsParams),
          context.db.query(countQueryString, countParams)
        ]);
        
        const systems = systemsResult.rows;
        // The count result is a string, so it must be parsed to an integer.
        const totalCount = parseInt(countResult.rows[0].total, 10);

        return {
          systems,
          totalCount,
        };
      } catch (e) {
        console.error("Error fetching dashboard data:", e);
        throw new GraphQLError("An error occurred while fetching dashboard data.");
      }
    },

    dashboardDataByUuid: async (_: any, { uuid }: { uuid: string }, context: MyContext) => {
      if (!context.user) {
        throw new GraphQLError('You must be logged in.', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }
      // Use parameterized query for security
      const result = await context.db.query('SELECT * FROM dashboard_data WHERE uuid = $1', [uuid]);
      return result.rows[0];
    },
  },

  Subscription: {
    systemUpdated: {
      resolve: (payload: any) => {
        // FIX: Explicitly type parsedPayload to allow dynamic key assignment.
        const parsedPayload: { [key: string]: any } = {};
        for (const key in payload) {
            const numericFields = [
                'asset_latitude', 'asset_longitude', 'most_wanted', 'rank_overall', 'rank_network',
                'rank_customer', 'overflow_abs', 'overflow_rel', 'overflow_spec', 'energy_abs', 'volume_abs',
                'volume_spec', 'volume_trend', 'flow_dim', 'demand_sig', 'demand_flex', 'demand_k', 'demand_max',
                'demand_dim', 'dt_abs', 'dt_vw', 'dt_ideal', 'dt_trend', 'dt_srd', 'rt_abs', 'rt_vw', 'rt_trend',
                'rt_srd', 'rt_flex', 'ntu', 'ntu_srd', 'lmtd', 'efficiency', 'efficiency_srd', 'supply_abs',
                'supply_flex', 'fault_prim_loss', 'fault_smirch', 'fault_heat_sys', 'fault_valve', 'fault_transfer'
            ];
            // Check if the key exists in payload before accessing it
            if (Object.prototype.hasOwnProperty.call(payload, key)) {
                if (numericFields.includes(key) && payload[key] !== null) {
                    parsedPayload[key] = parseFloat(payload[key]);
                } else {
                    parsedPayload[key] = payload[key];
                }
            }
        }
        return { systemUpdated: parsedPayload };
      },
      subscribe: () => pubsub.asyncIterator(['RAW_SYSTEM_UPDATE']),
    },
  },
};
// =================================================================
// FILE: apps/graphql-api/src/resolvers.ts
// (Create new file)
// =================================================================
import { MyContext } from './context';

export const resolvers = {
  Query: {
    // Resolver for the "allDashboardData" query
    allDashboardData: async (_: any, { limit }: { limit: number }, context: MyContext) => {
      try {
        console.log(`Fetching all dashboard data with limit: ${limit}`);
        const result = await context.db.query('SELECT * FROM dashboard_data LIMIT $1', [limit]);
        return result.rows;
      } catch (error) {
        console.error("Error fetching all dashboard data:", error);
        throw new Error("Failed to fetch dashboard data.");
      }
    },
    // Resolver for the "dashboardDataByUuid" query
    dashboardDataByUuid: async (_: any, { uuid }: { uuid: string }, context: MyContext) => {
        try {
            console.log(`Fetching dashboard data for uuid: ${uuid}`);
            const result = await context.db.query('SELECT * FROM dashboard_data WHERE uuid = $1 LIMIT 1', [uuid]);
            return result.rows[0]; // Return the first row found, or null
        } catch (error) {
            console.error(`Error fetching data for uuid ${uuid}:`, error);
            throw new Error("Failed to fetch dashboard data by UUID.");
        }
    }
  },
};
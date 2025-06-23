// =================================================================
// FILE: apps/graphql-api/src/graphql/resolvers.ts
// (This is the NEW, feature-complete version of your file)
// =================================================================
import { MyContext } from './context';
import { GraphQLError } from 'graphql';
import { pubsub } from '../realtime/pubsub';

export const resolvers = {
  Query: {
    // Resolver for fetching all dashboard data
    allDashboardData: async (_: any, { limit }: { limit: number }, context: MyContext) => {
      // 1. --- Authentication Check ---
      if (!context.user) {
        throw new GraphQLError('You must be logged in to perform this action.', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      try {
        const result = await context.db.query('SELECT * FROM dashboard_data LIMIT $1', [limit]);
        return result.rows;
      } catch (error) {
        console.error("Error fetching all dashboard data:", error);
        throw new GraphQLError('Error fetching dashboard data.', {
          extensions: { code: 'INTERNAL_SERVER_ERROR' },
        });
      }
    },
    
    // Resolver for fetching a single record by UUID
    dashboardDataByUuid: async (_: any, { uuid }: { uuid: string }, context: MyContext) => {
      // 1. --- Authentication Check ---
      if (!context.user) {
        throw new GraphQLError('You must be logged in to perform this action.', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      try {
        const result = await context.db.query('SELECT * FROM dashboard_data WHERE TRIM(uuid) = $1 LIMIT 1', [uuid]);
        if (result.rows.length === 0) {
          throw new GraphQLError('System not found.', {
            extensions: { code: 'NOT_FOUND' },
          });
        }
        return result.rows[0];
      } catch (error) {
        console.error(`Error fetching data for uuid ${uuid}:`, error);
        // If it's not a known GraphQL error, throw a generic one.
        if (error instanceof GraphQLError) throw error;
        throw new GraphQLError('Error fetching dashboard data by UUID.', {
           extensions: { code: 'INTERNAL_SERVER_ERROR' },
        });
      }
    }
  },

  // 2. --- Subscription Handler ---
  Subscription: {
    systemUpdated: {
      // This tells Apollo Server to listen to the 'SYSTEM_UPDATED' event
      // from our Redis pub/sub system.
      subscribe: () => pubsub.asyncIterator(['SYSTEM_UPDATED']),
    },
  },
};
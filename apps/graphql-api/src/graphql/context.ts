// =================================================================
// FILE: apps/graphql-api/src/context.ts
// (Create new file)
// =================================================================
import pool from './db';

// The context object holds data that is available to all resolvers.
// Here, we're making our database connection pool available.
export interface MyContext {
  db: typeof pool;
}

export const createContext = async (): Promise<MyContext> => {
  return {
    db: pool,
  };
};
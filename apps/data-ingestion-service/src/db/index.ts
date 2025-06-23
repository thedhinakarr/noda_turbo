// =================================================================
// FILE: apps/data-ingestion-service/src/db/index.ts
// (Updated with a more robust path to the .env file)
// =================================================================
import { Pool } from 'pg';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from the .env file in the project root.
// This new path is more robust and works correctly with 'pnpm run dev'.
dotenv.config({ path: path.resolve(process.cwd(), '../../.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export const connectDb = async () => {
  try {
    const client = await pool.connect();
    console.log('Successfully connected to PostgreSQL database.');
    client.release();
  } catch (error: any) {
    console.error('Failed to connect to PostgreSQL:', error);
    process.exit(1);
  }
};

export default pool;
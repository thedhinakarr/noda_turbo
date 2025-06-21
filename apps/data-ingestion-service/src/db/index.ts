// =================================================================
// FILE: apps/data-ingestion-service/src/db/index.ts
// (No changes to this file)
// =================================================================
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

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

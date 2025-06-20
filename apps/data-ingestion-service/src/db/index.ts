// apps/data-ingestion-service/src/db/index.ts

import { Pool } from 'pg';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from the .env file in the current app's root
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const pool = new Pool({
  user: process.env.PG_USER,
  host: process.env.PG_HOST,
  database: process.env.PG_DATABASE,
  password: process.env.PG_PASSWORD,
  port: parseInt(process.env.PG_PORT || '5432'),
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1); // Exit process if client crashes
});

export const connectDb = async () => {
  try {
    await pool.connect();
    console.log('PostgreSQL connected successfully!');
  } catch (err) {
    console.error('Failed to connect to PostgreSQL:', err);
    process.exit(1); // Exit if DB connection fails
  }
};

export const getDbClient = async () => {
  return pool.connect();
};

export const queryDb = async (text: string, params?: any[]) => {
  const client = await pool.connect();
  try {
    const res = await client.query(text, params);
    return res;
  } finally {
    client.release();
  }
};
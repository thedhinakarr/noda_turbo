// =================================================================
// FILE: apps/graphql-api/src/graphql/db.ts
// =================================================================
import { Pool } from 'pg';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export default pool;
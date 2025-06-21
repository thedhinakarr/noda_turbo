// =================================================================
// FILE: apps/data-ingestion-service/src/index.ts
// (This file is now updated with the migration logic)
// =================================================================
import { connectDb } from './db';
import { watchIncomingDirectory } from './watcher';
import pool from './db';
import fs from 'fs/promises';
import path from 'path';

/**
 * Runs the SQL migration file to ensure the database schema is up to date.
 */
const runMigration = async () => {
  console.log('Checking database schema...');
  const client = await pool.connect();
  try {
    const migrationFilePath = path.resolve(__dirname, 'migrations/001_create_dashboard_data_table.sql');
    const sql = await fs.readFile(migrationFilePath, 'utf-8');
    await client.query(sql);
    console.log('Database schema is ready.');
  } catch (error) {
    console.error('Failed to run database migration:', error);
    process.exit(1);
  } finally {
    client.release();
  }
};

/**
 * Main application entrypoint.
 */
const main = async () => {
  console.log('Starting Data Ingestion Service...');
  // 1. Connect to the database
  await connectDb();
  // 2. Ensure the schema is created
  await runMigration();
  // 3. Start watching for files
  watchIncomingDirectory();
};

main();
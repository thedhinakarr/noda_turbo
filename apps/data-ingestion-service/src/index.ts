// =================================================================
// FILE: apps/data-ingestion-service/src/index.ts
// (Updated with the new, robust migration runner)
// =================================================================
import { connectDb } from './db';
import { watchIncomingDirectory } from './watcher';
import pool from './db';
import fs from 'fs/promises';
import path from 'path';

/**
 * Reads all .sql files from the migrations directory and executes them
 * in alphabetical order. This ensures the database schema is always up to date.
 */
const runMigrations = async () => {
  console.log('Checking database schema...');
  const client = await pool.connect();
  try {
    const migrationDir = path.resolve(__dirname, 'migrations');
    const migrationFiles = (await fs.readdir(migrationDir))
      .filter(file => file.endsWith('.sql'))
      .sort(); // Sort files to ensure they run in order (e.g., 001, 002)

    for (const file of migrationFiles) {
      console.log(`Applying migration: ${file}`);
      const filePath = path.join(migrationDir, file);
      const sql = await fs.readFile(filePath, 'utf-8');
      await client.query(sql);
    }
    
    console.log('Database schema is up to date.');
  } catch (error) {
    console.error('Failed to run database migrations:', error);
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
  await connectDb();
  await runMigrations(); // This will now run all .sql files
  watchIncomingDirectory();
};

main();
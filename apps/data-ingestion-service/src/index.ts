// FILE: apps/data-ingestion-service/src/index.ts

import dotenv from 'dotenv';
import path from 'path';
import { Pool } from 'pg';
import fs from 'fs/promises';
import { WatcherService } from './watcher';
import { DatabaseService } from './db';
import { DbLoaderService } from './db-loader';

// Load environment variables from the root .env file
dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });

/**
 * A standalone function to run migrations before initializing the main services.
 * This resolves the race condition by ensuring the database schema is ready first.
 */
async function runMigrations() {
  console.log('Connecting to database to run migrations...');
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const client = await pool.connect();
  
  console.log('Checking database schema...');
  try {
    const migrationDir = path.resolve(__dirname, 'migrations');
    const migrationFiles = (await fs.readdir(migrationDir))
      .filter(file => file.endsWith('.sql'))
      .sort();

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
    await pool.end(); // End this temporary pool connection
  }
}

/**
 * Main application entrypoint.
 */
async function main() {
  console.log("Starting NODA Data Ingestion Service...");

  try {
    // STEP 1: Run migrations FIRST to ensure the database schema is correct.
    await runMigrations();

    // STEP 2: Now that migrations are complete, initialize the core services.
    // The DatabaseService constructor can now safely register the vector type.
    const databaseService = new DatabaseService();
    const dbLoaderService = new DbLoaderService(databaseService);
    const watcherService = new WatcherService(dbLoaderService);

    // STEP 3: Start watching the 'incoming' directory for new files.
    const incomingDirectory = path.resolve(__dirname, '../data/incoming');
    watcherService.watchDirectory(incomingDirectory);

    console.log(`Service is now watching the directory: ${incomingDirectory}`);

  } catch (error) {
    console.error("An unhandled error occurred during service startup:", error);
    process.exit(1);
  }
}

// Run the main function
main();

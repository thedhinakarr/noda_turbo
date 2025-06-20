// apps/data-ingestion-service/src/index.ts

import dotenv from 'dotenv';
import path from 'path';
import { connectDb } from './db';
import { startWatcher } from './watcher';

// Load environment variables from .env in the current app's root
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const main = async () => {
  console.log('Starting Data Ingestion Service...');

  // Connect to PostgreSQL
  await connectDb();

  // Get directory paths from environment variables
  const incomingDir = process.env.CSV_INCOMING_DIR;
  const processedDir = process.env.CSV_PROCESSED_DIR;
  const errorDir = process.env.CSV_ERROR_DIR;

  if (!incomingDir || !processedDir || !errorDir) {
    console.error('Environment variables for CSV directories are not set. Please check .env file.');
    process.exit(1);
  }

  // Start the file watcher
  await startWatcher({
    incomingDir,
    processedDir,
    errorDir,
  });

  console.log('Data Ingestion Service is running.');
};

// Start the service
main().catch(err => {
  console.error('Unhandled error in Data Ingestion Service:', err);
  process.exit(1);
});
// FILE: apps/data-ingestion-service/src/index.ts
import dotenv from 'dotenv';
import path from 'path';
import { DatabaseService } from './db';
import { IngestionService } from './ingestion';

dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });

async function main() {
  console.log("Starting NODA Data Ingestion Service...");

  const databaseService = new DatabaseService();

  try {
    await databaseService.initialize(); 
    console.log('Database initialization complete.');
    
    // Pass the single database instance to the IngestionService
    const ingestionService = new IngestionService(databaseService);
    ingestionService.start();

  } catch (error) {
    console.error("An unhandled error occurred during service startup:", error);
    await databaseService.disconnect();
    process.exit(1);
  }
}

main();

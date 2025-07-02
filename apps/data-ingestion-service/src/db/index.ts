// FILE: apps/data-ingestion-service/src/db/index.ts

import { Pool } from 'pg';
import { GoogleGenerativeAI } from '@google/generative-ai';
import * as pgvector from 'pgvector/pg';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs/promises';

// Load environment variables from the root .env file
dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });

export interface CsvRow {
  [key: string]: string | number | null;
}

export class DatabaseService {
  private pool: Pool;
  private genAI: GoogleGenerativeAI;
  private embeddingModel: any;

  constructor() {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });

    if (!process.env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY environment variable not set.");
    }
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    this.embeddingModel = this.genAI.getGenerativeModel({ model: "text-embedding-004" });
    
    this.registerVectorType();
  }

  private async registerVectorType() {
    const client = await this.pool.connect();
    try {
      await pgvector.registerType(client);
    } finally {
      client.release();
    }
  }

  public async connectDb(): Promise<void> {
    try {
      const client = await this.pool.connect();
      console.log('Successfully connected to PostgreSQL database.');
      client.release();
    } catch (error: any) {
      console.error('Failed to connect to PostgreSQL:', error);
      process.exit(1);
    }
  }
  
  public async runMigrations(): Promise<void> {
    console.log('Checking database schema...');
    const client = await this.pool.connect();
    try {
      const migrationDir = path.resolve(__dirname, '../migrations');
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
    }
  }

  public async insertWithEmbedding(data: CsvRow[], sourceFile: string): Promise<void> {
    const client = await this.pool.connect();
    try {
      console.log(`Starting embedding process for ${data.length} rows from ${sourceFile}...`);
      
      let processedCount = 0;
      for (const [index, row] of data.entries()) {
        
        // --- UPDATED: Extracting more columns for a richer context ---
        const systemId = row['UUID'];
        const buildingName = row['Building (control)'];
        const timePeriod = row['Time period'];
        const overallRank = row['Rank (overall)'];
        const efficiency = row['Efficiency'];
        const dtVw = row['dT (vw)'];
        const overflowAbs = row['Overflow (abs)'];
        const faultValve = row['Fault (valve)'];

        // --- UPDATED: More robust validation check ---
        const isRowValid = systemId && buildingName && timePeriod && 
                           (overallRank != null) && (efficiency != null) && 
                           (dtVw != null) && (overflowAbs != null) && (faultValve != null);

        if (!isRowValid) {
          continue;
        }

        // --- UPDATED: Constructing the new, richer text chunk ---
        const content = `For system ${systemId} in ${buildingName}, the key performance indicators are: overall rank of ${overallRank}, efficiency of ${Number(efficiency).toFixed(2)}, volume-weighted temperature difference (dT vw) of ${Number(dtVw).toFixed(2)}, absolute overflow of ${Number(overflowAbs).toFixed(2)}, and a valve fault score of ${Number(faultValve).toFixed(4)}.`;
        
        const result = await this.embeddingModel.embedContent(content);
        const embedding = result.embedding.values;

        const query = `
          INSERT INTO knowledge_embeddings (source_file, row_index, system_uuid, time_period, content, embedding)
          VALUES ($1, $2, $3, $4, $5, $6)
          ON CONFLICT (system_uuid, time_period) DO UPDATE SET
            source_file = EXCLUDED.source_file,
            row_index = EXCLUDED.row_index,
            content = EXCLUDED.content,
            embedding = EXCLUDED.embedding;
        `;
        
        await client.query(query, [
          sourceFile,
          index,
          systemId,
          new Date(timePeriod as string),
          content,
          pgvector.toSql(embedding),
        ]);
        processedCount++;
      }
      console.log(`Successfully embedded and inserted/updated ${processedCount} rows from ${sourceFile}`);
    } catch (error) {
      console.error('Error during embedding and insertion:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  public async disconnect(): Promise<void> {
    await this.pool.end();
  }
}

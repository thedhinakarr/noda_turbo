// FILE: apps/data-ingestion-service/src/db-loader/index.ts

import fs from 'fs';
import path from 'path';
import copy from 'pg-copy-streams';
import Papa from 'papaparse';
import { DatabaseService, CsvRow } from '../db'; // Import our new service and interface

export class DbLoaderService {
  private databaseService: DatabaseService;

  constructor(databaseService: DatabaseService) {
    this.databaseService = databaseService;
  }

  /**
   * The main orchestrator method. It parses a CSV file once, then
   * triggers both the raw data upsert and the AI knowledge base embedding.
   * @param filePath The path to the CSV file to process.
   */
  public async processNewCsvFile(filePath: string): Promise<void> {
    console.log(`Processing new file: ${filePath}`);
    const fileContent = fs.readFileSync(filePath, 'utf8');

    return new Promise((resolve, reject) => {
      Papa.parse(fileContent, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        complete: async (results) => {
          try {
            const data = results.data as CsvRow[];
            if (data.length === 0) {
              console.log('CSV file is empty. Nothing to process.');
              return resolve();
            }

            console.log(`Parsed ${data.length} rows. Starting database operations...`);

            // --- We will run both processes in parallel for efficiency ---
            await Promise.all([
              // TASK 1: Upsert raw data for the dashboard (your existing logic)
              this.upsertDashboardData(filePath),

              // TASK 2: Generate and store embeddings for the AI knowledge base
              this.databaseService.insertWithEmbedding(data, path.basename(filePath))
            ]);

            console.log(`Successfully completed all database operations for ${filePath}.`);
            resolve();
          } catch (error) {
            console.error(`Failed to process file ${filePath}.`, error);
            reject(error);
          }
        },
        error: (error:any) => {
          console.error('Error parsing CSV file:', error.message);
          reject(error);
        },
      });
    });
  }

  /**
   * This method contains your original, highly efficient logic for bulk-upserting
   * raw CSV data into the 'dashboard_data' table for frontend display.
   * It has been refactored to be a method of this class but is otherwise unchanged.
   * @param filePath The path to the CSV file.
   */
  private async upsertDashboardData(filePath: string): Promise<void> {
    const mainTableName = 'dashboard_data';
    const tempTableName = `temp_import_${Date.now()}`;
    
    // NOTE: We get the pool from the databaseService to ensure we use the same connection logic
    const client = await (this.databaseService as any).pool.connect();

    console.log(`[Upsert] Processing file: ${filePath} into table: "${mainTableName}"`);

    try {
      await client.query('BEGIN');

      const csvHeaders = await this.getCsvHeaders(filePath);
      const createTempTableColumns = csvHeaders.map(h => `"${h}" TEXT`).join(', ');
      await client.query(`CREATE TEMP TABLE "${tempTableName}" (${createTempTableColumns})`);
      console.log(`[Upsert] Temporary table "${tempTableName}" created.`);

      const copyStream = client.query(copy.from(`COPY "${tempTableName}" FROM STDIN WITH (FORMAT csv, HEADER true)`));
      const fileStream = fs.createReadStream(filePath);
      await new Promise((resolve, reject) => {
        fileStream.pipe(copyStream).on('finish', resolve).on('error', reject);
      });
      console.log('[Upsert] Data successfully loaded into temporary table.');

      const targetTableColumns = (await client.query(`
        SELECT column_name, data_type FROM information_schema.columns
        WHERE table_name = '${mainTableName}'
      `)).rows;

      const columnMapping = csvHeaders
        .map(header => {
          const sanitizedDbColumnName = this.sanitizeToSnakeCase(header);
          const dbColumn = targetTableColumns.find((c: { column_name: string }) => c.column_name === sanitizedDbColumnName);
          
          if (dbColumn) {
            return {
              csvHeader: `"${header}"`,
              dbColumn: `"${dbColumn.column_name}"`,
              castType: dbColumn.data_type.startsWith('timestamp') ? 'TIMESTAMPTZ' : dbColumn.data_type.toUpperCase(),
            };
          }
          return null;
        })
        .filter(m => m !== null);

      const insertColumns = columnMapping.map(m => m!.dbColumn).join(', ');
      const selectColumns = columnMapping.map(m => `CAST(NULLIF(${m!.csvHeader}, '') AS ${m!.castType})`).join(', ');
      const updateSet = columnMapping
        .filter(m => !['"uuid"', '"time_period"', '"id"'].includes(m!.dbColumn!))
        .map(m => `${m!.dbColumn} = EXCLUDED.${m!.dbColumn}`)
        .join(', ');

      const mergeQuery = `
        INSERT INTO "${mainTableName}" (${insertColumns})
        SELECT ${selectColumns} FROM "${tempTableName}"
        ON CONFLICT (uuid, time_period) DO UPDATE SET ${updateSet};
      `;
      await client.query(mergeQuery);
      console.log('[Upsert] Merge complete.');

      await client.query('COMMIT');
      console.log(`[Upsert] Successfully upserted data from ${path.basename(filePath)} to "${mainTableName}".`);

    } catch (error) {
      await client.query('ROLLBACK');
      console.error(`[Upsert] Error processing file ${filePath}. Rolled back transaction.`, error);
      throw error;
    } finally {
      await client.query(`DROP TABLE IF EXISTS "${tempTableName}"`);
      client.release();
    }
  }

  private async getCsvHeaders(filePath: string): Promise<string[]> {
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    return new Promise((resolve, reject) => {
        Papa.parse(fileContent, {
            header: false,
            preview: 1, // Only read the first row
            complete: (results) => {
                resolve(results.data[0] as string[]);
            },
            error: reject,
        });
    });
  }

  private sanitizeToSnakeCase(header: string): string {
    return header
      .trim()
      .toLowerCase()
      .replace(/[\s()-]+/g, '_')
      .replace(/[^a-z0-9_]/g, '')
      .replace(/^_+|_+$/g, '');
  }
}
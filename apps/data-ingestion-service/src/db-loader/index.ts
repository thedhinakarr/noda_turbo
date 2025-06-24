// =================================================================
// FILE: apps/data-ingestion-service/src/db-loader/index.ts
// The final, definitive version with the corrected sanitization logic.
// =================================================================
import fs from 'fs';
import path from 'path';
import copy from 'pg-copy-streams';
import csvParser from 'csv-parser';
import pool from '../db';

/**
 * Reads the headers from a CSV file.
 */
const getCsvHeaders = async (filePath: string): Promise<string[]> => {
  return new Promise((resolve, reject) => {
    const stream = fs.createReadStream(filePath).pipe(csvParser());
    stream.on('headers', (headers) => {
      stream.destroy();
      resolve(headers);
    });
    stream.on('error', reject);
  });
};

/**
 * A robust function to sanitize a string from a CSV header into a
 * database-friendly snake_case name.
 * e.g., "Building (control)" -> "building_control"
 * e.g., "Data quality - Missing (supply)" -> "data_quality_missing_supply"
 */
const sanitizeToSnakeCase = (header: string): string => {
  return header
    .trim()
    .toLowerCase()
    // Replace spaces, parentheses, and hyphens with underscores
    .replace(/[\s()-]+/g, '_')
    // Remove any non-alphanumeric characters (except underscores)
    .replace(/[^a-z0-9_]/g, '')
    // Remove underscores from the start or end of the string
    .replace(/^_+|_+$/g, '');
};


/**
 * Processes a given CSV file and "upserts" its data into the 'dashboard_data' table.
 */
export const processCsvToDb = async (filePath: string) => {
  const mainTableName = 'dashboard_data';
  const tempTableName = `temp_import_${Date.now()}`;
  const client = await pool.connect();

  console.log(`Processing file: ${filePath} into table: "${mainTableName}"`);

  try {
    await client.query('BEGIN');

    const csvHeaders = await getCsvHeaders(filePath);
    const createTempTableColumns = csvHeaders.map(h => `"${h}" TEXT`).join(', ');
    await client.query(`CREATE TEMP TABLE "${tempTableName}" (${createTempTableColumns})`);
    console.log(`Temporary table "${tempTableName}" created.`);

    const copyStream = client.query(copy.from(`COPY "${tempTableName}" FROM STDIN WITH (FORMAT csv, HEADER true)`));
    const fileStream = fs.createReadStream(filePath);
    await new Promise((resolve, reject) => {
      fileStream.pipe(copyStream).on('finish', resolve).on('error', reject);
    });
    console.log('Data successfully loaded into temporary table.');

    const targetTableColumns = (await client.query(`
      SELECT column_name, data_type FROM information_schema.columns
      WHERE table_name = '${mainTableName}'
    `)).rows;

    const columnMapping = csvHeaders
      .map(header => {
        const sanitizedDbColumnName = sanitizeToSnakeCase(header);
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
    console.log('Merge complete.');

    await client.query('COMMIT');
    console.log(`Successfully upserted data from ${path.basename(filePath)} to "${mainTableName}".`);

  } catch (error) {
    await client.query('ROLLBACK');
    console.error(`Error processing file ${filePath}. Rolled back transaction.`, error);
    throw error;
  } finally {
    await client.query(`DROP TABLE IF EXISTS "${tempTableName}"`);
    client.release();
  }
};
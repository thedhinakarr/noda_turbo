// =================================================================
// FILE: apps/data-ingestion-service/src/db-loader/index.ts
// (This file is updated with the final logic)
// =================================================================
import fs from 'fs';
import path from 'path';
import copy from 'pg-copy-streams';
import pool from '../db';

/**
 * Processes a given CSV file and bulk-inserts its data into the 'dashboard_data' table.
 * It intelligently uses all columns from the target table except for the 'id' column.
 */
export const processCsvToDb = async (filePath: string) => {
  const tableName = 'dashboard_data'; // Hardcoded table name
  console.log(`Processing file: ${filePath} into table: "${tableName}"`);
  
  const client = await pool.connect();
  try {
    // Fetch column names from the table, excluding 'id'
    const res = await client.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = '${tableName}' AND column_name != 'id'
      ORDER BY ordinal_position;
    `);
    
    const columns = res.rows.map(row => `"${row.column_name}"`).join(', ');

    await client.query('BEGIN');
    
    // Construct the COPY command with the explicit column list
    const copyCommand = `COPY "${tableName}" (${columns}) FROM STDIN WITH (FORMAT csv, HEADER true)`;
    console.log(`Executing COPY with ${res.rows.length} columns.`);

    const stream = client.query(copy.from(copyCommand));
    const fileStream = fs.createReadStream(filePath);
    
    await new Promise((resolve, reject) => {
      fileStream.pipe(stream).on('finish', resolve).on('error', reject);
    });
    
    await client.query('COMMIT');
    console.log(`Successfully imported data from ${path.basename(filePath)} to "${tableName}".`);

  } catch (error) {
    await client.query('ROLLBACK');
    console.error(`Error processing file ${filePath}. Rolled back transaction.`, error);
    throw error;
  } finally {
    client.release();
  }
};
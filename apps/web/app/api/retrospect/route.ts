import { NextResponse } from 'next/server';
import { Client } from 'pg';
import fs from 'fs/promises';
import path from 'path';
import { parse as csvParse } from 'csv-parse/sync';

const PG_URL = process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/noda_turbo";

// Adjust these paths if needed
const CSV_DIRS = [
  '/home/madlad_/work/noda_turbo/data/processed',
  '/home/madlad_/work/noda_turbo/data/error',
  '/home/madlad_/work/noda_turbo/data/incoming',
];

async function fetchFromPostgres() {
  const client = new Client({ connectionString: PG_URL });
  await client.connect();
  try {
    const res = await client.query('SELECT * FROM dashboard_data ORDER BY time_period DESC LIMIT 1000');
    return res.rows;
  } finally {
    await client.end();
  }
}

async function fetchFromCsv() {
  for (const dir of CSV_DIRS) {
    try {
      const files = await fs.readdir(dir);
      const csvFile = files.filter(f => f.endsWith('.csv')).sort().reverse()[0];
      if (csvFile) {
        const csvContent = await fs.readFile(path.join(dir, csvFile), 'utf8');
        const records = csvParse(csvContent, { columns: true });
        return records;
      }
    } catch (e) { /* ignore and try next */ }
  }
  return [];
}

export async function GET() {
  try {
    let data = [];
    try {
      data = await fetchFromPostgres();
    } catch (e) {
      // DB error, fallback to CSV
    }
    if (!data || data.length === 0) {
      data = await fetchFromCsv();
    }
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching retrospect data:', error);
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
  }
}

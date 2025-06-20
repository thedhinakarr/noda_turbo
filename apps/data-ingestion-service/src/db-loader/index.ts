// apps/data-ingestion-service/src/db-loader/index.ts

import { getDbClient } from '../db';
import { from as copyFromFromStream } from 'pg-copy-streams'; // This will be used for bulk copy

// Define the interface for a single row of data from your CSV
// Ensure these types match your PostgreSQL table schema.
// We'll process incoming CSV rows into this format.
export interface DashboardDataRow {
  building_control: string;
  property_meter: string;
  customer_group: string;
  geo_group: string;
  type_group: string;
  generic_group: string;
  uuid: string;
  asset_latitude: number;
  asset_longitude: number;
  time_period: Date; // Use Date object for TIMESTAMP WITH TIME ZONE
  most_wanted: number;
  rank_overall: number;
  rank_network: number;
  rank_customer: number;
  overflow_abs: number;
  overflow_rel: number;
  overflow_spec: number;
  energy_abs: number;
  volume_abs: number;
  volume_spec: number;
  volume_trend: number;
  flow_dim: number;
  demand_sig: number;
  demand_flex: number;
  demand_k: number;
  demand_max: number;
  demand_dim: number;
  dt_abs: number;
  dt_vw: number;
  dt_ideal: number;
  dt_trend: number;
  dt_srd: number;
  rt_abs: number;
  rt_vw: number;
  rt_trend: number;
  rt_srd: number;
  rt_flex: number;
  ntu: number;
  ntu_srd: number;
  lmtd: number;
  efficiency: number;
  efficiency_srd: number;
  supply_abs: number;
  supply_flex: number;
  fault_prim_loss: number;
  fault_smirch: number;
  fault_heat_sys: number;
  fault_valve: number;
  fault_transfer: number;
  data_quality_missing_odt: number;
  data_quality_missing_supply: number;
  data_quality_missing_return: number;
  data_quality_missing_flow: number;
  data_quality_missing_energy: number;
  data_quality_missing_volume: number;
  data_quality_missing_demand: number;
  data_quality_missing_return_sec: number;
  data_quality_missing_supply_sec: number;
  data_quality_outlier_odt: number;
  data_quality_outlier_supply: number;
  data_quality_outlier_return: number;
  data_quality_outlier_flow: number;
  data_quality_outlier_energy: number;
  data_quality_outlier_volume: number;
  data_quality_outlier_demand: number;
  data_quality_outlier_return_sec: number;
  data_quality_outlier_supply_sec: number;
  data_quality_frozen_odt: number;
  data_quality_frozen_supply: number;
  data_quality_frozen_return: number;
  data_quality_frozen_flow: number;
  data_quality_frozen_energy: number;
  data_quality_frozen_volume: number;
  data_quality_frozen_demand: number;
  data_quality_frozen_return_sec: number;
  data_quality_frozen_supply_sec: number;
  primloss_rank: number;
  smirch_rank: number;
  heatsys_rank: number;
  valve_rank: number;
  transfer_rank: number;
  x_sum: number;
  y_sum: number;
  vector_len: number;
  supply_pos: number;
  dt_pos: number;
  rt_pos: number;
  ntu_pos: number;
  eff_pos: number;
}


// Function to perform bulk insert using pg-copy-streams
export const loadDataIntoDb = async (dataRows: DashboardDataRow[]): Promise<number> => {
  if (dataRows.length === 0) {
    console.log('No data rows to load.');
    return 0;
  }

  const client = await getDbClient();
  let loadedRowCount = 0;

  try {
    // Define columns in the order they appear in your dataRows
    // Make sure this order matches the order you pass data to the stream
    const columns = [
        'building_control', 'property_meter', 'customer_group', 'geo_group',
        'type_group', 'generic_group', 'uuid', 'asset_latitude', 'asset_longitude',
        'time_period', 'most_wanted', 'rank_overall', 'rank_network', 'rank_customer',
        'overflow_abs', 'overflow_rel', 'overflow_spec', 'energy_abs', 'volume_abs',
        'volume_spec', 'volume_trend', 'flow_dim', 'demand_sig', 'demand_flex',
        'demand_k', 'demand_max', 'demand_dim', 'dt_abs', 'dt_vw', 'dt_ideal',
        'dt_trend', 'dt_srd', 'rt_abs', 'rt_vw', 'rt_trend', 'rt_srd', 'rt_flex',
        'ntu', 'ntu_srd', 'lmtd', 'efficiency', 'efficiency_srd', 'supply_abs',
        'supply_flex', 'fault_prim_loss', 'fault_smirch', 'fault_heat_sys',
        'fault_valve', 'fault_transfer', 'data_quality_missing_odt',
        'data_quality_missing_supply', 'data_quality_missing_return',
        'data_quality_missing_flow', 'data_quality_missing_energy',
        'data_quality_missing_volume', 'data_quality_missing_demand',
        'data_quality_missing_return_sec', 'data_quality_missing_supply_sec',
        'data_quality_outlier_odt', 'data_quality_outlier_supply',
        'data_quality_outlier_return', 'data_quality_outlier_flow',
        'data_quality_outlier_energy', 'data_quality_outlier_volume',
        'data_quality_outlier_demand', 'data_quality_outlier_return_sec',
        'data_quality_outlier_supply_sec', 'data_quality_frozen_odt',
        'data_quality_frozen_supply', 'data_quality_frozen_return',
        'data_quality_frozen_flow', 'data_quality_frozen_energy',
        'data_quality_frozen_volume', 'data_quality_frozen_demand',
        'data_quality_frozen_return_sec', 'data_quality_frozen_supply_sec',
        'primloss_rank', 'smirch_rank', 'heatsys_rank', 'valve_rank',
        'transfer_rank', 'x_sum', 'y_sum', 'vector_len', 'supply_pos',
        'dt_pos', 'rt_pos', 'ntu_pos', 'eff_pos'
    ];

    // The COPY command string
    // IMPORTANT: ON CONFLICT clause cannot be used with COPY FROM STDIN directly.
    // For upserts, you would typically COPY to a temporary table, then MERGE/INSERT ON CONFLICT.
    // For now, we'll just insert, assuming new files are new data or handle conflicts in a later step.
    const copyCommand = `COPY dashboard_data (${columns.join(', ')}) FROM STDIN WITH (FORMAT csv, DELIMITER ',', HEADER FALSE)`;

    // Create a writable stream for the COPY operation
    const stream = client.query(copyFromFromStream(copyCommand));

    // Write each row to the stream
    for (const row of dataRows) {
      const rowValues = columns.map(col => {
        const value = row[col as keyof DashboardDataRow];
        // Special handling for Date objects: convert to ISO string for PostgreSQL
        if (value instanceof Date) {
            return value.toISOString();
        }
        return value;
      });
      stream.write(rowValues.join(',') + '\n');
    }
    stream.end();

    // Wait for the stream to finish and handle results
    await new Promise<void>((resolve, reject) => {
      stream.on('end', () => {
        // pg-copy-streams emits 'end' when the copy is complete.
        // It doesn't directly return the row count here, but we know all were attempted.
        // For actual row count confirmation, you'd query the table or rely on logs.
        console.log(`Successfully attempted to load ${dataRows.length} rows.`);
        loadedRowCount = dataRows.length; // Assume all attempted were successful for now
        resolve();
      });
      stream.on('error', reject);
    });

    console.log(`Data loaded successfully. Total rows: ${loadedRowCount}`);
  } catch (error) {
    console.error('Error loading data into DB:', error);
    throw error; // Re-throw to be caught by the calling function
  } finally {
    client.release(); // Release the client back to the pool
  }

  return loadedRowCount;
};

// --- UPSERT Strategy (More robust for updating existing records) ---
// The COPY command directly doesn't support ON CONFLICT.
// A common pattern for UPSERT with COPY is:
// 1. COPY data into a temporary staging table.
// 2. Perform an INSERT ... ON CONFLICT ... FROM staging_table query.
// 3. TRUNCATE/DROP the staging table.

// For now, `loadDataIntoDb` performs a simple INSERT via COPY.
// We will refine this later if needed, but for initial ingestion, it's sufficient.
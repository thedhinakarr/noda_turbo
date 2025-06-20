// apps/data-ingestion-service/src/csv-processor/index.ts

import fs from 'fs';
import path from 'path';
import csv from 'csv-parser';
import { DashboardDataRow } from '../db-loader';

/**
 * Maps raw CSV column names to their snake_case PostgreSQL counterparts
 * and performs type conversions.
 *
 * @param row - A single row object from csv-parser
 * @returns A DashboardDataRow object
 */
const transformCsvRow = (row: any): DashboardDataRow => {
  // Helper to safely parse numbers, defaulting to 0 or null if conversion fails.
  const parseNumeric = (value: string | undefined): number => {
    const num = parseFloat(value || '');
    return isNaN(num) ? 0 : num; // Default to 0 for NOT NULL columns if parsing fails
  };

  // Helper to parse integers
  const parseIntStrict = (value: string | undefined): number => {
    const num = parseInt(value || '', 10);
    return isNaN(num) ? 0 : num; // Default to 0 for NOT NULL columns if parsing fails
  };

  // Helper to parse dates (assuming ISO 8601 or similar format that Date constructor can handle)
  const parseDate = (value: string | undefined): Date => {
    if (!value) return new Date(0); // Return a default valid date if empty
    const date = new Date(value);
    if (isNaN(date.getTime())) {
      console.warn(`Invalid date format encountered: "${value}". Defaulting to epoch.`);
      return new Date(0); // Return epoch if date parsing fails
    }
    return date;
  };

  return {
    building_control: row['Building (control)'] || '',
    property_meter: row['Property (meter)'] || '',
    customer_group: row['Customer group'] || '',
    geo_group: row['Geo group'] || '',
    type_group: row['Type group'] || '',
    generic_group: row['Generic group'] || '',
    uuid: row['UUID'] || '',
    asset_latitude: parseNumeric(row['Asset latitude']),
    asset_longitude: parseNumeric(row['Asset longitude']),
    time_period: parseDate(row['Time period']),
    most_wanted: parseIntStrict(row['Most wanted']),
    rank_overall: parseIntStrict(row['Rank (overall)']),
    rank_network: parseNumeric(row['Rank (network)']),
    rank_customer: parseNumeric(row['Rank (customer)']),
    overflow_abs: parseNumeric(row['Overflow (abs)']),
    overflow_rel: parseNumeric(row['Overflow (rel)']),
    overflow_spec: parseNumeric(row['Overflow (spec)']),
    energy_abs: parseNumeric(row['Energy (abs)']),
    volume_abs: parseNumeric(row['Volume (abs)']),
    volume_spec: parseNumeric(row['Volume (spec)']),
    volume_trend: parseNumeric(row['Volume (trend)']),
    flow_dim: parseNumeric(row['Flow (dim)']),
    demand_sig: parseNumeric(row['Demand (sig)']),
    demand_flex: parseNumeric(row['Demand (flex)']),
    demand_k: parseNumeric(row['Demand (k)']),
    demand_max: parseNumeric(row['Demand (max)']),
    demand_dim: parseNumeric(row['Demand (dim)']),
    dt_abs: parseNumeric(row['dT (abs)']),
    dt_vw: parseNumeric(row['dT (vw)']),
    dt_ideal: parseNumeric(row['dT (ideal)']),
    dt_trend: parseNumeric(row['dT (trend)']),
    dt_srd: parseNumeric(row['dt (srd)']),
    rt_abs: parseNumeric(row['rT (abs)']),
    rt_vw: parseNumeric(row['rT (vw)']),
    rt_trend: parseNumeric(row['rT (trend)']),
    rt_srd: parseNumeric(row['rT (srd)']),
    rt_flex: parseNumeric(row['rT (flex)']),
    ntu: parseNumeric(row['NTU']),
    ntu_srd: parseNumeric(row['NTU (srd)']),
    lmtd: parseNumeric(row['LMTD']),
    efficiency: parseNumeric(row['Efficiency']),
    efficiency_srd: parseNumeric(row['Efficiency (srd)']),
    supply_abs: parseNumeric(row['Supply (abs)']),
    supply_flex: parseNumeric(row['Supply (flex)']),
    fault_prim_loss: parseNumeric(row['Fault (prim loss)']),
    fault_smirch: parseNumeric(row['Fault (smirch)']),
    fault_heat_sys: parseIntStrict(row['Fault (heat sys)']),
    fault_valve: parseNumeric(row['Fault (valve)']),
    fault_transfer: parseNumeric(row['Fault (transfer)']),
    data_quality_missing_odt: parseNumeric(row['Data quality - Missing (odt)']),
    data_quality_missing_supply: parseNumeric(row['Data quality - Missing (supply)']),
    data_quality_missing_return: parseNumeric(row['Data quality - Missing (return)']),
    data_quality_missing_flow: parseNumeric(row['Data quality - Missing (flow)']),
    data_quality_missing_energy: parseNumeric(row['Data quality - Missing (energy)']),
    data_quality_missing_volume: parseNumeric(row['Data quality - Missing (volume)']),
    data_quality_missing_demand: parseNumeric(row['Data quality - Missing (demand)']),
    data_quality_missing_return_sec: parseNumeric(row['Data quality - Missing (return_sec)']),
    data_quality_missing_supply_sec: parseNumeric(row['Data quality - Missing (supply_sec)']),
    data_quality_outlier_odt: parseIntStrict(row['Data quality - Outlier (odt)']),
    data_quality_outlier_supply: parseIntStrict(row['Data quality - Outlier (supply)']),
    data_quality_outlier_return: parseIntStrict(row['Data quality - Outlier (return)']),
    data_quality_outlier_flow: parseIntStrict(row['Data quality - Outlier (flow)']),
    data_quality_outlier_energy: parseIntStrict(row['Data quality - Outlier (energy)']),
    data_quality_outlier_volume: parseIntStrict(row['Data quality - Outlier (volume)']),
    data_quality_outlier_demand: parseIntStrict(row['Data quality - Outlier (demand)']),
    data_quality_outlier_return_sec: parseIntStrict(row['Data quality - Outlier (return_sec)']),
    data_quality_outlier_supply_sec: parseIntStrict(row['Data quality - Outlier (supply_sec)']),
    data_quality_frozen_odt: parseIntStrict(row['Data quality - Frozen (odt)']),
    data_quality_frozen_supply: parseNumeric(row['Data quality - Frozen (supply)']),
    data_quality_frozen_return: parseNumeric(row['Data quality - Frozen (return)']),
    data_quality_frozen_flow: parseNumeric(row['Data quality - Frozen (flow)']),
    data_quality_frozen_energy: parseNumeric(row['Data quality - Frozen (energy)']),
    data_quality_frozen_volume: parseNumeric(row['Data quality - Frozen (volume)']),
    data_quality_frozen_demand: parseNumeric(row['Data quality - Frozen (demand)']),
    data_quality_frozen_return_sec: parseIntStrict(row['Data quality - Frozen (return_sec)']),
    data_quality_frozen_supply_sec: parseIntStrict(row['Data quality - Frozen (supply_sec)']),
    primloss_rank: parseNumeric(row['primloss_rank']),
    smirch_rank: parseNumeric(row['smirch_rank']),
    heatsys_rank: parseIntStrict(row['heatsys_rank']),
    valve_rank: parseIntStrict(row['valve_rank']),
    transfer_rank: parseIntStrict(row['transfer_rank']),
    x_sum: parseIntStrict(row['x_sum']),
    y_sum: parseIntStrict(row['y_sum']),
    vector_len: parseNumeric(row['vector_len']),
    supply_pos: parseNumeric(row['supply_pos']),
    dt_pos: parseIntStrict(row['dt_pos']),
    rt_pos: parseIntStrict(row['rt_pos']),
    ntu_pos: parseIntStrict(row['ntu_pos']),
    eff_pos: parseIntStrict(row['eff_pos']),
  };
};

/**
 * Processes a CSV file, parses its rows, and transforms them into DashboardDataRow format.
 *
 * @param filePath - The full path to the CSV file.
 * @returns A promise that resolves to an array of DashboardDataRow.
 */
export const processCsvFile = (filePath: string): Promise<DashboardDataRow[]> => {
  return new Promise((resolve, reject) => {
    const results: DashboardDataRow[] = [];
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data: any) => {
        try {
          const transformedRow = transformCsvRow(data);
          results.push(transformedRow);
        } catch (error) {
          console.error(`Error transforming row in ${filePath}:`, data, error);
          // Decide whether to skip row, or reject the whole file.
          // For now, we'll log and continue, but this should be robust.
        }
      })
      .on('end', () => {
        console.log(`Finished processing CSV: ${filePath}. Total rows: ${results.length}`);
        resolve(results);
      })
      .on('error', (error: any) => {
        console.error(`Error reading CSV file ${filePath}:`, error);
        reject(error);
      });
  });
};
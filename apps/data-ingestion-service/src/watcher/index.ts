// apps/data-ingestion-service/src/watcher/index.ts

import chokidar from 'chokidar';
import path from 'path';
import fs from 'fs/promises'; // Use promises version for async operations
import { processCsvFile } from '../csv-processor';
import { loadDataIntoDb } from '../db-loader';

interface WatcherOptions {
  incomingDir: string;
  processedDir: string;
  errorDir: string;
}

export const startWatcher = async (options: WatcherOptions) => {
  const { incomingDir, processedDir, errorDir } = options;

  // Ensure directories exist
  await fs.mkdir(incomingDir, { recursive: true });
  await fs.mkdir(processedDir, { recursive: true });
  await fs.mkdir(errorDir, { recursive: true });

  const watcher = chokidar.watch(incomingDir, {
    persistent: true,
    ignoreInitial: false, // Process existing files on startup
    awaitWriteFinish: {    // Wait for file to be completely written before processing
      stabilityThreshold: 2000, // Wait 2 seconds of no changes
      pollInterval: 100       // Check for changes every 100ms
    },
    ignored: /(^|[\/\\])\../, // Ignore dotfiles
  });

  console.log(`Watching for CSV files in: ${path.resolve(incomingDir)}`);

  watcher.on('add', async (filePath) => {
    console.log(`Detected new file: ${filePath}`);
    await handleFile(filePath, processedDir, errorDir);
  });

  watcher.on('change', async (filePath) => {
    // Note: 'change' event might fire multiple times. awaitWriteFinish helps.
    // For robust production systems, consider a more sophisticated deduplication
    // or transactional processing for updates.
    console.log(`Detected file change: ${filePath}`);
    await handleFile(filePath, processedDir, errorDir);
  });

  watcher.on('error', (error) => console.error(`Watcher error: ${error}`));

  // Optionally, listen for 'unlink' to handle file deletions if needed
  // watcher.on('unlink', (filePath) => console.log(`File unlinked: ${filePath}`));

  return watcher; // Return the watcher instance for potential cleanup
};

async function handleFile(filePath: string, processedDir: string, errorDir: string) {
  const fileName = path.basename(filePath);
  const processedFilePath = path.join(processedDir, fileName);
  const errorFilePath = path.join(errorDir, fileName);

  try {
    console.log(`Processing file: ${fileName}`);
    const dataRows = await processCsvFile(filePath);
    const loadedCount = await loadDataIntoDb(dataRows);
    console.log(`Successfully loaded ${loadedCount} rows from ${fileName}`);

    // Move to processed directory
    await fs.rename(filePath, processedFilePath);
    console.log(`Moved ${fileName} to ${processedFilePath}`);

  } catch (error) {
    console.error(`Failed to process and load ${fileName}:`, error);
    // Move to error directory
    await fs.rename(filePath, errorFilePath);
    console.log(`Moved ${fileName} to ${errorFilePath}`);
  }
}
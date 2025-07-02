// FILE: apps/data-ingestion-service/src/watcher/index.ts

import chokidar from 'chokidar';
import path from 'path';
import fs from 'fs/promises';
import { DbLoaderService } from '../db-loader';

export class WatcherService {
  private dbLoaderService: DbLoaderService;
  private incomingDir: string;
  private processedDir: string;
  private errorDir: string;

  constructor(dbLoaderService: DbLoaderService) {
    this.dbLoaderService = dbLoaderService;

    // Read directory paths from environment variables, with safe fallbacks.
    this.incomingDir = process.env.CSV_INCOMING_DIR ?? path.resolve(__dirname, '../../data/incoming');
    this.processedDir = process.env.CSV_PROCESSED_DIR ?? path.resolve(__dirname, '../../data/processed');
    this.errorDir = process.env.CSV_ERROR_DIR ?? path.resolve(__dirname, '../../data/errors');
  }

  /**
   * Ensures that the necessary directories for file processing exist.
   */
  private async ensureDirs(): Promise<void> {
    await fs.mkdir(this.incomingDir, { recursive: true });
    await fs.mkdir(this.processedDir, { recursive: true });
    await fs.mkdir(this.errorDir, { recursive: true });
  }

  /**
   * Starts watching a directory for new files to process.
   * @param directoryPath The path to the directory to watch.
   */
  public watchDirectory(directoryPath: string): void {
    this.ensureDirs().then(() => {
      console.log(`Watching for new files in: ${directoryPath}`);
      
      const watcher = chokidar.watch(directoryPath, {
        persistent: true,
        ignored: /^\./,
        awaitWriteFinish: { stabilityThreshold: 2000, pollInterval: 100 },
      });

      // Listen for the 'add' event, which is triggered for new files.
      watcher.on('add', async (filePath) => {
        const fileName = path.basename(filePath);
        console.log(`New file detected: ${fileName}`);
        
        try {
          // --- THIS IS THE KEY CHANGE ---
          // Call the processNewCsvFile method from our DbLoaderService instance.
          // This will trigger both the raw data upsert and the AI embedding.
          await this.dbLoaderService.processNewCsvFile(filePath);
          
          // Move the file to the 'processed' directory on success.
          const destPath = path.join(this.processedDir, fileName);
          await fs.rename(filePath, destPath);
          console.log(`Successfully processed and moved ${fileName} to processed folder.`);

        } catch (error) {
          // Move the file to the 'error' directory on failure.
          console.error(`An error occurred processing ${fileName}:`, error);
          const errorPath = path.join(this.errorDir, fileName);
          await fs.rename(filePath, errorPath);
          console.error(`Moved ${fileName} to error folder.`);
        }
      });
    });
  }
}
// =================================================================
// FILE: apps/data-ingestion-service/src/watcher/index.ts
// (No changes to this file)
// =================================================================
import chokidar from 'chokidar';
import path from 'path';
import fs from 'fs/promises';
import { processCsvToDb } from '../db-loader';

const INCOMING_DIR = path.resolve(__dirname, '../../data/incoming');
const PROCESSED_DIR = path.resolve(__dirname, '../../data/processed');
const ERROR_DIR = path.resolve(__dirname, '../../data/errors');

const ensureDirs = async () => {
  await fs.mkdir(INCOMING_DIR, { recursive: true });
  await fs.mkdir(PROCESSED_DIR, { recursive: true });
  await fs.mkdir(ERROR_DIR, { recursive: true });
};

export const watchIncomingDirectory = () => {
  ensureDirs().then(() => {
    console.log(`Watching for files in: ${INCOMING_DIR}`);
    const watcher = chokidar.watch(INCOMING_DIR, {
      persistent: true,
      ignored: /^\./,
      awaitWriteFinish: { stabilityThreshold: 2000, pollInterval: 100 },
    });

    watcher.on('add', async (filePath) => {
      const fileName = path.basename(filePath);
      try {
        await processCsvToDb(filePath);
        const destPath = path.join(PROCESSED_DIR, fileName);
        await fs.rename(filePath, destPath);
        console.log(`Moved ${fileName} to processed folder.`);
      } catch (error) {
        const errorPath = path.join(ERROR_DIR, fileName);
        await fs.rename(filePath, errorPath);
        console.error(`Moved ${fileName} to error folder.`);
      }
    });
  });
};
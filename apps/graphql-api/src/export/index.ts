// =================================================================
// FILE: apps/graphql-api/src/export/index.ts
// (Updated with explicit types for 'Router', 'req', and 'res')
// =================================================================
import { Router, Request, Response } from 'express';
import pool from '../graphql/db';

const router: Router = Router();

// Placeholder for exporting data as CSV
router.get('/csv', async (req: Request, res: Response) => {
  console.log('CSV export requested.');
  try {
    const dummyCsv = 'uuid,building_control,efficiency\n"uuid-1","Building A",95.2';
    
    res.header('Content-Type', 'text/csv');
    res.attachment('dashboard_data.csv');
    res.send(dummyCsv);

  } catch (error) {
    console.error("Failed to export CSV:", error);
    res.status(500).send('Error exporting data');
  }
});

export default router;
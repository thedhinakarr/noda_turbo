// =================================================================
// FILE: apps/graphql-api/src/realtime/postgres-listener.ts
// (This file is correct - No changes needed)
// =================================================================
import pool from '../graphql/db';
import { pubsub } from './pubsub';

const CHANNEL_NAME = 'dashboard_updates';

export const startPostgresListener = async () => {
  const client = await pool.connect();
  
  client.on('notification', (msg) => {
    console.log(`Received notification from PostgreSQL on channel '${msg.channel}'`);
    if (msg.payload) {
      try {
        const payload = JSON.parse(msg.payload);
        pubsub.publish('SYSTEM_UPDATED', { systemUpdated: payload });
        console.log('Published update to Redis.');
      } catch (error) {
        console.error('Error parsing notification payload:', error);
      }
    }
  });

  await client.query(`LISTEN ${CHANNEL_NAME}`);
  console.log(`PostgreSQL listener started on channel: ${CHANNEL_NAME}`);
};
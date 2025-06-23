//=================================================================
// FILE: apps/graphql-api/src/realtime/pubsub.ts
// (Updated with type casting to fix incompatibility)
// =================================================================
import { RedisPubSub } from 'graphql-redis-subscriptions';
import { createClient } from 'redis';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

const options = {
  url: redisUrl,
};

// --- FIX: Cast the clients to 'any' to resolve type conflict ---
export const pubsub = new RedisPubSub({
  publisher: createClient(options) as any,
  subscriber: createClient(options) as any,
});
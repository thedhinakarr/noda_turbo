// =================================================================
// FILE: apps/graphql-api/src/index.ts
// (Updated to use an executable schema for WebSockets)
// =================================================================
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import http from 'http';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import { WebSocketServer } from 'ws';
import { useServer } from 'graphql-ws/lib/use/ws';
import { makeExecutableSchema } from '@graphql-tools/schema';

import { typeDefs } from './graphql/schema';
import { resolvers } from './graphql/resolvers';
import { MyContext, createContext } from './graphql/context';
import authRoutes from './auth';
import exportRoutes from './export';
import { startPostgresListener } from './realtime/postgres-listener';

dotenv.config();

const app = express();
const httpServer = http.createServer(app);

// --- Create an executable schema for both servers to use ---
const schema = makeExecutableSchema({ typeDefs, resolvers });

const startServer = async () => {
  // --- WebSocket Server for Subscriptions ---
  const wsServer = new WebSocketServer({
    server: httpServer,
    path: '/api/graphql',
  });
  const serverCleanup = useServer({ schema }, wsServer);

  // --- Apollo GraphQL Server ---
  const server = new ApolloServer<MyContext>({
    schema, // Use the executable schema
    plugins: [
      ApolloServerPluginDrainHttpServer({ httpServer }),
      {
        async serverWillStart() {
          return {
            async drainServer() {
              await serverCleanup.dispose();
            },
          };
        },
      },
    ],
  });

  await server.start();

  // --- Express REST API Routes ---
  app.use(cors());
  app.use(express.json());

  app.get('/api/health', (req, res) => res.status(200).json({ status: 'ok' }));
  app.use('/api/auth', authRoutes);
  app.use('/api/export', exportRoutes);
  
  // --- GraphQL Endpoint ---
  app.use(
    '/api/graphql',
    expressMiddleware(server, { context: createContext })
  );

  const port = process.env.PORT || 4000;
  await new Promise<void>((resolve) => httpServer.listen({ port }, resolve));
  
  console.log(`GraphQL API ready at http://localhost:${port}/api/graphql`);
  console.log(`Subscriptions ready at ws://localhost:${port}/api/graphql`);
  console.log(`Auth routes ready at http://localhost:${port}/api/auth`);
  console.log(`Export routes ready at http://localhost:${port}/api/export`);
  console.log(`Health check ready at http://localhost:${port}/api/health`);

  // --- Start the Real-time Data Listener ---
  startPostgresListener();
};

startServer();
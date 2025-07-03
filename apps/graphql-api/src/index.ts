// =================================================================
// FILE: apps/graphql-api/src/index.ts (Updated)
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

// +++ ADD THIS IMPORT +++
import axios from 'axios';

import { typeDefs } from './graphql/schema';
import { resolvers } from './graphql/resolvers';
import { MyContext, createContext } from './graphql/context';
import authRoutes from './auth';
import exportRoutes from './export';
import { startPostgresListener } from './realtime/postgres-listener';
import { connectRedis } from './realtime/redis-client';

dotenv.config();

const app = express();
const httpServer = http.createServer(app);
const schema = makeExecutableSchema({ typeDefs, resolvers });

const startServer = async () => {
  await connectRedis();

  // --- No changes to your existing WebSocket setup ---
  const wsServer = new WebSocketServer({
    server: httpServer,
    path: '/api/graphql',
  });
  const serverCleanup = useServer({ schema }, wsServer);

  // --- No changes to your existing Apollo Server setup ---
  const server = new ApolloServer<MyContext>({
    schema,
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

  app.use(cors());
  app.use(express.json());

  // --- No changes to your existing REST routes ---
  app.get('/api/health', (req, res) => res.status(200).json({ status: 'ok' }));
  app.use('/api/auth', authRoutes);
  app.use('/api/export', exportRoutes);

  // +++ ADD THIS ENTIRE SECTION FOR THE NEW AI STREAMING GATEWAY +++
  const llmServiceUrl = process.env.LLM_SERVICE_URL || 'http://llm-service:5001';

  app.post('/api/copilot-stream', async (req, res) => {
    console.log('Received request on /api/copilot-stream');

    // 1. Security Check: This is where you would validate the user's token.
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).send('Unauthorized');
    }
    // In a real implementation, you would use your `createContext` logic here
    // to fully validate the token against Entra ID.

    // 2. Open the Server-Sent Events (SSE) stream to the client
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    try {
      // Use axios to get a stream from the llm-service
      const response = await axios({
        method: 'POST',
        url: `${llmServiceUrl}/api/v1/chat`,
        data: req.body,
        responseType: 'stream',
      });

      // Pipe the stream from the llm-service directly to the client
      response.data.pipe(res);

      // Handle stream closing
      req.on('close', () => {
        console.log('Client closed connection. Aborting request to LLM service.');
        response.data.destroy();
      });

    } catch (error) {
      // --- THIS IS THE CORRECTED BLOCK ---
      // We check the type of the error before using it.
      if (axios.isAxiosError(error)) {
        console.error('Error proxying to llm-service:', error.message);
      } else {
        console.error('An unknown error occurred:', error);
      }
      res.write(`data: ${JSON.stringify({ error: 'AI service connection failed.' })}\n\n`);
      res.end();
    }
  });
  // +++ END OF NEW SECTION +++

  // --- No changes to your existing GraphQL middleware ---
  // It is correctly placed after all other REST routes.
  app.use(
    '/api/graphql',
    expressMiddleware(server, { context: createContext })
  );

  const port = process.env.PORT || 4000;
  await new Promise<void>((resolve) => httpServer.listen({ port }, resolve));

  console.log(`🚀 GraphQL & Subscriptions ready at http://localhost:${port}/api/graphql`);
  console.log(`🚀 CoPilot streaming endpoint ready at http://localhost:${port}/api/copilot-stream`);
  startPostgresListener();
};

startServer();
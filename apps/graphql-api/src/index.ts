// =================================================================
// FILE: apps/graphql-api/src/index.ts
// (Create new file)
// =================================================================
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import express from 'express';
import http from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import { typeDefs } from './schema';
import { resolvers } from './resolvers';
import { MyContext, createContext } from './context';

dotenv.config();

const app = express();
const httpServer = http.createServer(app);

const startServer = async () => {
  const server = new ApolloServer<MyContext>({
    typeDefs,
    resolvers,
  });

  await server.start();

  app.use(
    '/graphql',
    cors<cors.CorsRequest>(),
    express.json(),
    expressMiddleware(server, {
      context: createContext,
    })
  );

  const port = process.env.PORT || 4000;
  await new Promise<void>((resolve) => httpServer.listen({ port }, resolve));
  console.log(`🚀 GraphQL API ready at http://localhost:${port}/graphql`);
};

startServer();
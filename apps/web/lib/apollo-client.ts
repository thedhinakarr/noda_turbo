// apps/web/lib/apollo-client.ts
import {
  ApolloClient,
  InMemoryCache,
  HttpLink
} from "@apollo/client";

// This HttpLink points to your Next.js API Route proxy.
// This is all you need.
const httpLink = new HttpLink({
  uri: '/api/graphql',
});

const client = new ApolloClient({
  // Remove the authMiddleware, the proxy handles everything.
  link: httpLink,
  cache: new InMemoryCache(),
});

export default client;
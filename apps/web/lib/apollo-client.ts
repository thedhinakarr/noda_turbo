// apps/web/lib/apollo-client.ts
import { ApolloClient, InMemoryCache, HttpLink, ApolloLink, concat } from "@apollo/client";

// This HttpLink now points to the Next.js API Route proxy for GraphQL
const httpLink = new HttpLink({
  uri: '/api/graphql', // This is the internal Next.js API route
});

const authMiddleware = new ApolloLink((operation, forward) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;

  operation.setContext(({ headers = {} }) => ({
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : "",
    },
  }));

  return forward(operation);
});

const client = new ApolloClient({
  link: concat(authMiddleware, httpLink),
  cache: new InMemoryCache(),
});

export default client;
// =================================================================
// FILE: apps/web/lib/apollo-wrapper.tsx
// (Create this NEW file. This replaces apollo-client.ts)
// =================================================================
"use client"; // This wrapper is a client component.

import { ApolloLink, HttpLink } from "@apollo/client";
import {
  ApolloNextAppProvider,
  NextSSRApolloClient,
  NextSSRInMemoryCache,
  SSRMultipartLink,
} from "@apollo/experimental-nextjs-app-support/ssr";

// This function creates a new Apollo Client instance for each request.
// It's configured to work with both Server-Side Rendering and Client-Side Rendering.
function makeClient() {
  const httpLink = new HttpLink({
      uri: "http://localhost:4000/graphql",
  });

  return new NextSSRApolloClient({
    cache: new NextSSRInMemoryCache(),
    link:
      typeof window === "undefined"
        ? ApolloLink.from([
            // This is the key part for Server-Side Rendering
            new SSRMultipartLink({
              stripDefer: true,
            }),
            httpLink,
          ])
        : httpLink,
  });
}

// The new ApolloProvider component that wraps your application.
export function ApolloWrapper({ children }: React.PropsWithChildren) {
  return (
    <ApolloNextAppProvider makeClient={makeClient}>
      {children}
    </ApolloNextAppProvider>
  );
}
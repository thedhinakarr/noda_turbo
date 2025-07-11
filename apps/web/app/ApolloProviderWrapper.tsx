// FILE: apps/web/app/ApolloProviderWrapper.tsx
// PURPOSE: To provide the client-side Apollo Client to all child components.
// This file should remain unchanged from the previous version.
"use client";

import React from 'react';
import { ApolloProvider } from '@apollo/client';
import { makeClient } from '@/lib/apollo-client'; // Imports the client-side factory

export function ApolloClientProvider({ children }: { children: React.ReactNode }) {
  // Creates the client instance once and provides it to the app.
  const [client] = React.useState(makeClient());
  return <ApolloProvider client={client}>{children}</ApolloProvider>;
}
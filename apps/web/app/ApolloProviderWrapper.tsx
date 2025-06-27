// apps/web/app/ApolloProviderWrapper.tsx
"use client";

import React from 'react';
import { ApolloProvider } from '@apollo/client';
import client from '../lib/apollo-client';

export function ApolloClientProvider({ children }: { children: React.ReactNode }) {
  return <ApolloProvider client={client}>{children}</ApolloProvider>;
}
// apps/web/context/CopilotContext.tsx
"use client";

import React, { createContext, useContext, useState, ReactNode, Dispatch, SetStateAction } from 'react';

// Define the shape of our context value
interface CopilotContextType {
  isCopilotOpen: boolean;
  setCopilotOpen: Dispatch<SetStateAction<boolean>>;
}

// Create the context with an undefined default value (will be provided by the Provider)
const CopilotContext = createContext<CopilotContextType | undefined>(undefined);

// Custom hook to consume the context
export function useCopilot() {
  const context = useContext(CopilotContext);
  if (context === undefined) {
    throw new Error('useCopilot must be used within a CopilotProvider');
  }
  return context;
}

// Provider component that will wrap the parts of your app that need Copilot access
export function CopilotProvider({ children }: { children: ReactNode }) {
  const [isCopilotOpen, setCopilotOpen] = useState(false); // Initial state: Copilot is closed

  return (
    <CopilotContext.Provider value={{ isCopilotOpen, setCopilotOpen }}>
      {children}
    </CopilotContext.Provider>
  );
}
// FILE: apps/web/lib/store/copilotStore.ts
import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';

export interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface CopilotState {
  isCopilotOpen: boolean;
  sessionId: string;
  messages: Message[];
  // --- UPDATED FOR MULTIPLE HIGHLIGHTS ---
  highlightedSelectors: string[]; // Changed from single to array
  setHighlightedSelectors: (selectors: string[]) => void; // Updated function
  clearHighlights: () => void; // Updated function name
  // --- END UPDATES ---
  addMessage: (message: Message) => void;
  toggleCopilot: () => void;
  resetConversation: () => void;
}

const getInitialState = () => ({
  sessionId: uuidv4(),
  messages: [
    {
      role: 'assistant' as const,
      content: "Hello! I am the NODA Copilot. How can I help you analyze your thermal systems today?"
    }
  ]
});

export const useCopilotStore = create<CopilotState>((set) => ({
  isCopilotOpen: false,
  ...getInitialState(),
  // --- UPDATED FOR MULTIPLE HIGHLIGHTS ---
  highlightedSelectors: [],
  setHighlightedSelectors: (selectors) => set({ highlightedSelectors: selectors }),
  clearHighlights: () => set({ highlightedSelectors: [] }),
  // --- END UPDATES ---
  addMessage: (message) => set((state) => ({ messages: [...state.messages, message] })),
  toggleCopilot: () => set((state) => ({ isCopilotOpen: !state.isCopilotOpen })),
  resetConversation: () => set(getInitialState()),
}));
// FILE: apps/web/lib/store/copilotStore.ts
// PURPOSE: The global Zustand store to manage the Copilot's state.
import { create } from 'zustand';

interface CopilotState {
  isCopilotOpen: boolean;
  setCopilotOpen: (isOpen: boolean) => void;
  toggleCopilot: () => void;
}

export const useCopilotStore = create<CopilotState>((set) => ({
  isCopilotOpen: false, // Default to closed
  setCopilotOpen: (isOpen) => set({ isCopilotOpen: isOpen }),
  toggleCopilot: () => set((state) => ({ isCopilotOpen: !state.isCopilotOpen })),
}));
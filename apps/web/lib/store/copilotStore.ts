import { create } from 'zustand';

// Defines the state and actions for the Copilot UI
interface CopilotUiState {
  isSidebarOpen: boolean;
  openSidebar: () => void;
  closeSidebar: () => void;
  toggleSidebar: () => void;
}

/**
 * A Zustand store to manage the global state of the Copilot's UI,
 * such as the visibility of the sidebar.
 */
export const useCopilotUiStore = create<CopilotUiState>((set) => ({
  isSidebarOpen: false, // The sidebar is closed by default
  openSidebar: () => set({ isSidebarOpen: true }),
  closeSidebar: () => set({ isSidebarOpen: false }),
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
}));

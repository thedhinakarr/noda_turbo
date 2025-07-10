import { create } from 'zustand';

// This interface defines the state and actions for our UI store.
interface UiActionsState {
  highlightedElementId: string | null; // The ID of the element to highlight, e.g., "kpi-card-efficiency"
  highlight: (elementId: string) => void; // Action to set the highlighted element
  clearHighlight: () => void; // Action to clear the highlight
}

/**
 * The Zustand store for managing UI interactions triggered by the AI.
 * Components can subscribe to this store to react to events like highlighting.
 */
export const useUiActionsStore = create<UiActionsState>((set) => ({
  highlightedElementId: null,
  highlight: (elementId) => set({ highlightedElementId: elementId }),
  clearHighlight: () => set({ highlightedElementId: null }),
}));

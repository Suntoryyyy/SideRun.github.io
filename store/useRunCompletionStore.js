/**
 * Signals Home to reload and plays handoff animations after a run completes.
 */
import { create } from 'zustand';

const useRunCompletionStore = create((set) => ({
  version: 0,
  /** Set when navigating Home after Done / View on Home — drives ring + card highlight. */
  handoff: null,
  bump: () => set((s) => ({ version: s.version + 1 })),
  setHandoff: (handoff) =>
    set((s) => ({
      handoff,
      version: s.version + 1,
    })),
  clearHandoff: () => set({ handoff: null }),
}));

export default useRunCompletionStore;

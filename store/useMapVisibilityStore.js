/**
 * useMapVisibilityStore — per-friend "show on map" preference.
 *
 * Shared by the Run map (friend markers) and the Crew screen toggle so the two
 * stay in two-way sync automatically: both read/write the same Zustand state,
 * and every change is persisted to AsyncStorage under `@map_visibility`.
 *
 * Shape: { [friendId: string]: boolean }  — value is whether the friend is
 * shown on the map. A missing key means "visible" (opt-out model), so newly
 * added friends appear by default.
 */
import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const MAP_VISIBILITY_KEY = '@map_visibility';

const useMapVisibilityStore = create((set, get) => ({
  visibility: {},
  hydrated: false,

  // Load the persisted map once. Safe to call repeatedly.
  hydrate: async () => {
    if (get().hydrated) return;
    try {
      const raw = await AsyncStorage.getItem(MAP_VISIBILITY_KEY);
      const parsed = raw ? JSON.parse(raw) : {};
      set({
        visibility: parsed && typeof parsed === 'object' ? parsed : {},
        hydrated: true,
      });
    } catch (e) {
      set({ hydrated: true });
    }
  },

  // Non-reactive convenience getter. Components that need to re-render on change
  // should select `visibility` and compute `visibility[id] !== false` instead.
  isVisible: (friendId) => get().visibility[friendId] !== false,

  setVisible: (friendId, visible) => {
    const next = { ...get().visibility, [friendId]: !!visible };
    set({ visibility: next });
    AsyncStorage.setItem(MAP_VISIBILITY_KEY, JSON.stringify(next)).catch(() => {});
  },

  toggle: (friendId) => {
    const current = get().visibility[friendId] !== false;
    get().setVisible(friendId, !current);
  },
}));

export default useMapVisibilityStore;

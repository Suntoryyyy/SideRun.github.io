/**
 * useDemoMode — simulates a realistic GPS run without real location.
 *
 * Activation:
 *   Set AsyncStorage key "siderun_demo_mode" = "1" (the DemoToggle does this).
 *   DemoToggle also calls `broadcastDemoMode(value)` so every mounted
 *   subscriber (including the live RunScreen) updates immediately — this
 *   matters because the RunScreen stays mounted when the user switches
 *   to the Profile tab.
 *
 * What it provides:
 *   - `isDemoMode` flag
 *   - `demoRegion`      — initial map region (Tokyo Imperial Palace loop)
 *   - `demoLocation`    — current simulated position (updates continuously)
 *   - `demoSpeed`       — simulated speed (m/s, varies naturally)
 *   - `demoCoordinates` — accumulated path since the most recent activation
 *   - `resetDemo`       — resets the simulation back to step 0
 *
 * Internally each pair of KEYFRAME waypoints is linearly interpolated into
 * ~8 sub-steps so the on-screen marker glides at ~3 m/s (5:30/km pace)
 * instead of teleporting 180 m every 2 seconds.
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const DEMO_MODE_KEY = 'siderun_demo_mode';

// ── Runtime subscription ────────────────────────────────────────────────────
// A tiny module-level pub-sub so the DemoToggle can flip the flag and every
// subscribed `useDemoMode()` instance reacts without requiring remounts.
const listeners = new Set();
export function broadcastDemoMode(value) {
  listeners.forEach((l) => {
    try { l(value); } catch (_) {}
  });
}

// ── Route keyframes ─────────────────────────────────────────────────────────
// ~5 km counterclockwise loop on the PUBLIC ROADS outside the Imperial Palace
// moat (皇居外苑ランニングコース), Tokyo.
//
// Key constraint: every point must lie OUTSIDE the palace walls/moat.
//   East side  → longitude ≥ 139.762  (Uchibori-dori between moat & Marunouchi)
//   West side  → longitude ≤ 139.748  (road between moat & Kojimachi)
//   North side → latitude  ≥ 35.688   (north moat road past Takebashi)
//   South side → latitude  ≤ 35.677   (south road past Sakuradamon)
//
// Previous routes drifted west (longitude decreasing) on the east side and
// ended up inside the palace grounds. This version keeps the east road at a
// constant longitude of ~139.764 and uses straight, short segments so linear
// interpolation stays on tarmac throughout.
const KEYFRAMES = [
  // ── SE start: Hibiya / Wadakura area, east side of moat ──────────────
  [35.6762, 139.7635],
  // ── East side: going north along Uchibori-dori ───────────────────────
  // The outer moat is to the LEFT (west); Marunouchi offices to the RIGHT.
  // Longitude held near 139.764 so we never slip into the palace grounds.
  [35.6776, 139.7640],
  [35.6792, 139.7641],
  [35.6806, 139.7638],
  [35.6820, 139.7632],
  [35.6833, 139.7622],
  [35.6844, 139.7610],
  [35.6854, 139.7595],
  [35.6862, 139.7578], // approaching north-east (Hitotsubashi)
  // ── NE corner & north side: Takebashi → Kitanomaru south ─────────────
  [35.6869, 139.7558],
  [35.6873, 139.7536], // Takebashi, road turns west
  [35.6874, 139.7514],
  [35.6871, 139.7492],
  [35.6864, 139.7472],
  [35.6852, 139.7454], // Kitanomaru south gate, road turns south
  // ── West side: Kitanomaru → Hanzomon → Sakashita ─────────────────────
  // Longitude held near 139.747 – west of palace, clearly on public road.
  [35.6837, 139.7448],
  [35.6821, 139.7450],
  [35.6806, 139.7457], // Hanzomon Gate
  [35.6791, 139.7468],
  [35.6777, 139.7482],
  [35.6764, 139.7499], // Sakashita Gate, road curves south-east
  // ── South side: west → Sakuradamon → Hibiya → east ───────────────────
  // Latitude held near 35.676 – south of the outer moat.
  [35.6756, 139.7519],
  [35.6751, 139.7541],
  [35.6750, 139.7564], // Sakuradamon Gate
  [35.6754, 139.7587],
  [35.6760, 139.7609],
  [35.6762, 139.7625],
  [35.6762, 139.7635], // close loop at SE start
];

// Densify the route: between each pair of keyframes, insert `SUBDIV - 1`
// intermediate interpolated points so the marker glides smoothly.
// Reduced to 4 (from 8) since keyframes are now spaced ~120 m apart
// instead of ~300 m, so the path already closely follows the road.
const SUBDIV = 4;
const DEMO_ROUTE = (() => {
  const out = [];
  for (let i = 0; i < KEYFRAMES.length - 1; i++) {
    const [a, b] = [KEYFRAMES[i], KEYFRAMES[i + 1]];
    for (let k = 0; k < SUBDIV; k++) {
      const t = k / SUBDIV;
      out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]);
    }
  }
  out.push(KEYFRAMES[KEYFRAMES.length - 1]);
  return out;
})();

export const DEMO_ROUTE_COORDS = DEMO_ROUTE.map(([lat, lng]) => ({
  latitude: lat,
  longitude: lng,
}));

// Rough distance in km between two lat/lng points.
function haversineKm(a, b) {
  const R = 6371;
  const dLat = ((b[0] - a[0]) * Math.PI) / 180;
  const dLng = ((b[1] - a[1]) * Math.PI) / 180;
  const sinLat = Math.sin(dLat / 2);
  const sinLng = Math.sin(dLng / 2);
  const h =
    sinLat * sinLat +
    Math.cos((a[0] * Math.PI) / 180) *
      Math.cos((b[0] * Math.PI) / 180) *
      sinLng *
      sinLng;
  return R * 2 * Math.asin(Math.sqrt(h));
}

// Advance one interpolated sub-step every 700 ms → realistic ~3 m/s run pace.
const STEP_INTERVAL_MS = 700;

export default function useDemoMode() {
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [stepIdx, setStepIdx] = useState(0);
  const [demoCoordinates, setDemoCoordinates] = useState([]);
  const intervalRef = useRef(null);

  // Read demo flag on mount + subscribe to runtime toggles.
  useEffect(() => {
    AsyncStorage.getItem(DEMO_MODE_KEY).then((v) => {
      setIsDemoMode(v === '1');
    });

    const listener = (value) => setIsDemoMode(!!value);
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  // Advance the simulated position whenever demo mode is on.
  useEffect(() => {
    if (!isDemoMode) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }
    setStepIdx(0);
    setDemoCoordinates([]);

    intervalRef.current = setInterval(() => {
      setStepIdx((prev) => (prev + 1) % DEMO_ROUTE.length);
    }, STEP_INTERVAL_MS);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isDemoMode]);

  // Accumulate path as stepIdx advances.
  useEffect(() => {
    if (!isDemoMode) return;
    const [lat, lng] = DEMO_ROUTE[stepIdx];
    const point = { latitude: lat, longitude: lng, timestamp: Date.now() };
    setDemoCoordinates((prev) => [...prev, point]);
  }, [stepIdx, isDemoMode]);

  const resetDemo = useCallback(() => {
    setStepIdx(0);
    setDemoCoordinates([]);
  }, []);

  const [lat, lng] = DEMO_ROUTE[stepIdx % DEMO_ROUTE.length];

  // Simulate natural speed from the current segment length.
  const prevIdx = Math.max(0, stepIdx - 1);
  const segKm = haversineKm(
    DEMO_ROUTE[prevIdx],
    DEMO_ROUTE[stepIdx % DEMO_ROUTE.length],
  );
  const segMps = (segKm * 1000) / (STEP_INTERVAL_MS / 1000);
  const demoSpeed = Math.min(5, Math.max(2.2, segMps)).toFixed(1);

  // Centre on the middle of the loop (roughly the Palace centre) so the
  // whole 5 km route fits comfortably on screen.
  const demoRegion = {
    latitude: 35.6820,
    longitude: 139.7545,
    latitudeDelta: 0.018,
    longitudeDelta: 0.018,
  };

  const demoLocation = { latitude: lat, longitude: lng };

  return {
    isDemoMode,
    demoRegion,
    demoLocation,
    demoSpeed,
    demoCoordinates,
    resetDemo,
  };
}

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
// ~2.3 km loop around the Imperial Palace, Tokyo.
const KEYFRAMES = [
  [35.6851, 139.7528],
  [35.6853, 139.7548],
  [35.6862, 139.7562],
  [35.6874, 139.7573],
  [35.6889, 139.7581],
  [35.6904, 139.7585],
  [35.6918, 139.7582],
  [35.6930, 139.7575],
  [35.6939, 139.7564],
  [35.6945, 139.7550],
  [35.6948, 139.7534],
  [35.6947, 139.7518],
  [35.6942, 139.7504],
  [35.6933, 139.7492],
  [35.6921, 139.7483],
  [35.6907, 139.7478],
  [35.6893, 139.7477],
  [35.6879, 139.7480],
  [35.6866, 139.7487],
  [35.6856, 139.7498],
  [35.6849, 139.7512],
  [35.6845, 139.7527],
  [35.6845, 139.7543],
  [35.6848, 139.7558],
  [35.6854, 139.7570],
  [35.6863, 139.7580],
  [35.6875, 139.7588],
  [35.6888, 139.7592],
  [35.6901, 139.7591],
  [35.6913, 139.7586],
  [35.6923, 139.7577],
  [35.6930, 139.7565],
  [35.6934, 139.7551],
  [35.6933, 139.7536],
  [35.6929, 139.7522],
  [35.6921, 139.7510],
  [35.6910, 139.7501],
  [35.6897, 139.7495],
  [35.6884, 139.7493],
  [35.6871, 139.7495],
  [35.6859, 139.7500],
  [35.6850, 139.7509],
  [35.6844, 139.7520],
  [35.6843, 139.7533],
  [35.6845, 139.7546],
  [35.6850, 139.7558],
  [35.6858, 139.7568],
  [35.6869, 139.7575],
  [35.6882, 139.7579],
  [35.6895, 139.7578],
  [35.6906, 139.7572],
  [35.6915, 139.7563],
  [35.6920, 139.7551],
  [35.6921, 139.7538],
  [35.6917, 139.7524],
  [35.6909, 139.7513],
  [35.6899, 139.7505],
  [35.6887, 139.7501],
  [35.6875, 139.7501],
  [35.6863, 139.7505],
  [35.6854, 139.7513],
  [35.6851, 139.7528],
];

// Densify the route: between each pair of keyframes, insert `SUBDIV - 1`
// intermediate interpolated points so the marker glides smoothly.
const SUBDIV = 8;
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

  const demoRegion = {
    latitude: KEYFRAMES[0][0],
    longitude: KEYFRAMES[0][1],
    latitudeDelta: 0.012,
    longitudeDelta: 0.012,
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

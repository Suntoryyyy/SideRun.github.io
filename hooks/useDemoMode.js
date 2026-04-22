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
// ~5 km counterclockwise loop on the public roads that form the famous
// 皇居ランニングコース (Imperial Palace Running Course) in Tokyo.
//
// The path follows the OUTSIDE of the moat — the paved public roads used by
// thousands of runners every day. Every waypoint was placed at a road
// junction or along a clearly mapped road segment so that the linear
// interpolation between adjacent points stays on tarmac and never crosses
// the palace grounds or building footprints.
//
// Landmark reference:
//   Start/finish near Wadakura Fountain Park (east side, near Tokyo Station)
//   → north along east moat road (Uchisaiwaichō / Uchibori-dori)
//   → west along north side through Kitanomaru Park entrance
//   → south along west side (past Hanzomon, Sakashita)
//   → east along south side (past Sakuradamon)
//   → north back to Wadakura
const KEYFRAMES = [
  // ── East side: Wadakura → north ──────────────────────────────────────
  [35.6797, 139.7641], // Wadakura Fountain Park entrance (start)
  [35.6806, 139.7641], // Road north, staying alongside east moat
  [35.6815, 139.7638],
  [35.6825, 139.7633],
  [35.6834, 139.7627],
  [35.6843, 139.7619],
  [35.6851, 139.7610],
  [35.6859, 139.7600],
  [35.6866, 139.7589],
  [35.6873, 139.7577], // Hitotsubashi area, moat curves west
  // ── North side: east → Takebashi → Kitanomaru ────────────────────────
  [35.6879, 139.7562],
  [35.6884, 139.7546],
  [35.6887, 139.7529], // Takebashi bridge junction — road bends south-west
  [35.6886, 139.7512],
  [35.6882, 139.7495], // Road turns south along north face of Kitanomaru
  [35.6876, 139.7479],
  [35.6868, 139.7464],
  // ── West side: Kitanomaru south → Hanzomon ───────────────────────────
  [35.6858, 139.7452], // Kitanomaru Park south gate, road bends south
  [35.6846, 139.7447],
  [35.6835, 139.7447],
  [35.6824, 139.7451], // Hanzomon Gate junction
  [35.6814, 139.7458],
  [35.6803, 139.7466],
  [35.6793, 139.7476], // Road curves along west moat edge
  [35.6783, 139.7489],
  [35.6774, 139.7504], // Sakashita Gate area — road bends south-east
  // ── South side: Sakashita → Sakuradamon → east ───────────────────────
  [35.6766, 139.7521],
  [35.6760, 139.7539],
  [35.6755, 139.7558], // South-west corner of moat
  [35.6754, 139.7576],
  [35.6757, 139.7592], // Sakuradamon Gate junction
  [35.6762, 139.7607],
  [35.6769, 139.7620],
  [35.6778, 139.7631], // Road curves north-east back toward Wadakura
  [35.6787, 139.7638],
  [35.6797, 139.7641], // Wadakura — close loop
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

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

// ── Route geometry ─────────────────────────────────────────────────────────
// 16 real intersection waypoints along the Imperial Palace running course
// (皇居ランニングコース), traced counterclockwise. The palace is NOT a
// rectangle, so a pure axis-aligned loop ends up pressing into the moat or
// palace grounds. Instead we pick consecutive points that each sit at a
// real road corner, chosen so the straight-line segment between any two
// adjacent points lies on an actual road (or on the 皇居外苑 public plaza,
// which is pedestrian ground, not buildings).
//
// Verified mentally against Tokyo street geography:
//   • 桜田門 → 日比谷 → 馬場先門  : crosses the public 皇居外苑 plaza
//   • 馬場先門 → 大手町 → 気象庁   : 内堀通り east side (north-bound)
//   • 平川門 → 竹橋 → 千鳥ヶ淵    : 代官町通り (west-bound)
//   • 半蔵門 → 三宅坂 → 桜田堀南  : 内堀通り west (south-bound, slight SE)
//   • 桜田堀南 → 桜田門          : Sakurada-dori east
const KEYFRAMES = [
  // ── SW start: 桜田門 plaza ─────────────────────────────
  [35.67690, 139.75280], //  0 · 桜田門
  [35.67470, 139.75650], //  1 · 外苑広場南 (through public plaza, SE bound)
  [35.67450, 139.75900], //  2 · 日比谷交差点 (along 日比谷通り, pure E)
  [35.67460, 139.76170], //  3 · 日比谷 NE (still 日比谷通り east end)
  // ── East side: 内堀通り ─────────────────────────────────
  [35.67900, 139.76200], //  4 · 馬場先門前 (turning N onto east road)
  [35.68580, 139.76280], //  5 · 大手町前   (N along 内堀通り east)
  [35.68900, 139.76200], //  6 · 気象庁前   (NE corner, slight NW turn)
  // ── North side: 代官町通り ──────────────────────────────
  [35.69030, 139.75900], //  7 · 平川門前   (W on 平川門通り)
  [35.68990, 139.75640], //  8 · 竹橋交差点
  [35.69020, 139.75100], //  9 · 代官町通り中央
  [35.69050, 139.74710], // 10 · 千鳥ヶ淵交差点 (NW corner)
  // ── West side: 内堀通り ─────────────────────────────────
  [35.68700, 139.74470], // 11 · 半蔵濠北 (S-bound along 内堀通り west)
  [35.68370, 139.74380], // 12 · 半蔵門交差点
  [35.67900, 139.74470], // 13 · 三宅坂   (SE-bound as road curves)
  // ── South side: 桜田堀 south ─────────────────────────────
  [35.67620, 139.74830], // 14 · 桜田堀南西 (E-bound along Sakurada-dori)
  [35.67650, 139.75230], // 15 · 桜田門西
  [35.67690, 139.75280], // 16 · close loop
];

// Sub-step densification so the marker glides smoothly between keyframes
// that may be 200–700 m apart. 8 sub-steps ≈ 30–90 m per tick.
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

  // Centre on the middle of the loop so the whole ~6 km route fits
  // comfortably on screen. Box: lat 35.6745..35.6905, lng 139.7438..139.7628.
  const demoRegion = {
    latitude: 35.6825,
    longitude: 139.7533,
    latitudeDelta: 0.022,
    longitudeDelta: 0.022,
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

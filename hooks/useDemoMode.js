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
// Strictly-orthogonal ~5 km loop around the Imperial Palace outer moat.
//
// Every segment is PURELY north-south or PURELY east-west — no diagonals —
// so linear interpolation between waypoints always lies along an actual
// road axis (Marunouchi's street grid is orthogonal, and the four roads
// around the palace moat run on the cardinal directions).
//
// Rectangle edges picked so each full edge lives on a real thoroughfare:
//   • ROAD_N  lat 35.6886 — Daikancho-dori (north moat, east of Takebashi)
//   • ROAD_S  lat 35.6762 — Sakurada-dori  (south moat, east of Sakuradamon)
//   • ROAD_E  lng 139.7623 — Uchibori-dori east (Wadakura → Otemon)
//   • ROAD_W  lng 139.7477 — Uchibori-dori west (Sakashita → Hanzomon)
//
// Corners are HARD 90° turns so the rendered polyline never diagonals
// through a building. Each straight is dense-sampled at ~40 m intervals.
const ROAD_N = 35.6886;
const ROAD_S = 35.6762;
const ROAD_E = 139.7623;
const ROAD_W = 139.7477;

// Generator: emits samples along axis-aligned straight segments only. Going
// CCW starting on the south road heading east.
function buildImperialPalaceLoop() {
  const N = ROAD_N, S = ROAD_S, E = ROAD_E, W = ROAD_W;
  const pts = [];
  // Sample a straight segment with `steps` intermediate points. One of the
  // two coord deltas is always 0, so every sample shares a coord with both
  // endpoints — guarantees the polyline stays on a single road axis.
  const line = (la0, ln0, la1, ln1, steps) => {
    if ((la1 - la0) !== 0 && (ln1 - ln0) !== 0) {
      throw new Error('buildImperialPalaceLoop: segment must be axis-aligned');
    }
    for (let i = 0; i < steps; i++) {
      const t = i / steps;
      pts.push([la0 + (la1 - la0) * t, ln0 + (ln1 - ln0) * t]);
    }
  };

  const STR_H = 22; // horizontal edges: longer (lng spans ~1.5 km)
  const STR_V = 20; // vertical edges

  // 1. South road — heading east along Sakurada-dori
  line(S, W, S, E, STR_H);
  // 2. East road — heading north along Uchibori-dori east (Babasaki → Otemon)
  line(S, E, N, E, STR_V);
  // 3. North road — heading west along Daikancho-dori
  line(N, E, N, W, STR_H);
  // 4. West road — heading south along Uchibori-dori west (Hanzomon → Miyakezaka)
  line(N, W, S, W, STR_V);
  // Close cleanly on the start.
  pts.push([S, W]);
  return pts;
}

const KEYFRAMES = buildImperialPalaceLoop();

// Keyframes are already dense (~40 m apart), so a single sub-step is plenty
// to smooth the marker between ticks without over-sampling.
const SUBDIV = 2;
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

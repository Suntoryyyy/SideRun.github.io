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
// ~5 km counterclockwise loop generated as a rounded rectangle that hugs the
// public roads around the Imperial Palace outer moat (皇居外苑ランニングコース).
//
// Each edge sits at the actual outer-road latitude/longitude:
//   • ROAD_N  — Daikancho-dori (north of moat, past Takebashi → Kitanomaru)
//   • ROAD_S  — Sakurada-dori  (south of moat, Hibiya → Sakuradamon)
//   • ROAD_E  — Uchibori-dori east side (Wadakura-mon → Hitotsubashi)
//   • ROAD_W  — Uchibori-dori west side (Kitanomaru → Hanzomon → Sakashita)
// Corners are rounded with a real ~280 m radius that matches the moat
// geometry, so the generated polyline traces the curbside instead of cutting
// through palace grounds.
const ROAD_N = 35.6890;
const ROAD_S = 35.6758;
const ROAD_E = 139.7625;
const ROAD_W = 139.7467;
const CORNER_R = 0.0028; // ≈ 280 m at 35.68° N

// Generator: walks the perimeter counterclockwise, sampling straight edges
// and 90° corner arcs at uniform intervals. 12 × 4 straight samples + 8 × 4
// corner samples yield ~80 tightly-spaced waypoints (~65 m apart).
function buildImperialPalaceLoop() {
  const N = ROAD_N, S = ROAD_S, E = ROAD_E, W = ROAD_W, r = CORNER_R;
  const pts = [];
  const line = (la0, ln0, la1, ln1, steps) => {
    for (let i = 0; i < steps; i++) {
      const t = i / steps;
      pts.push([la0 + (la1 - la0) * t, ln0 + (ln1 - ln0) * t]);
    }
  };
  // Arc center (cLat, cLng), swept from a0 → a1 at radius r.
  // Point = (cLat + r*sin(a), cLng + r*cos(a)).
  const arc = (cLat, cLng, a0, a1, steps) => {
    for (let i = 0; i < steps; i++) {
      const t = i / steps;
      const a = a0 + (a1 - a0) * t;
      pts.push([cLat + r * Math.sin(a), cLng + r * Math.cos(a)]);
    }
  };
  const STR = 12; // samples per straight edge
  const CUR = 8;  // samples per corner arc

  // CCW, starting on the south road near Sakuradamon, heading east.
  line(S,     W + r, S,     E - r, STR);            // south straight
  arc (S + r, E - r, -Math.PI / 2, 0,      CUR);    // SE corner
  line(S + r, E,     N - r, E,     STR);            // east straight
  arc (N - r, E - r,  0,     Math.PI / 2, CUR);     // NE corner (Takebashi)
  line(N,     E - r, N,     W + r, STR);            // north straight
  arc (N - r, W + r,  Math.PI / 2, Math.PI, CUR);   // NW corner (Kudanshita)
  line(N - r, W,     S + r, W,     STR);            // west straight (Hanzomon)
  arc (S + r, W + r,  Math.PI, 3 * Math.PI / 2, CUR); // SW corner (Sakashita)
  // Close the loop cleanly on the start point.
  pts.push([S, W + r]);
  return pts;
}

const KEYFRAMES = buildImperialPalaceLoop();

// Keep a small sub-step densification so the marker glides between already
// close waypoints. 2 sub-steps ≈ 32 m per tick — smooth without over-sampling.
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

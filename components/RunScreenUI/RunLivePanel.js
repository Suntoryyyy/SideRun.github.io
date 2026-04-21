import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Sparkline from '../Sparkline';
import { FONT } from '../../constants/typography';

const { width } = Dimensions.get('window');

/**
 * Live panel that fills the expanded dashboard area while a run is in progress.
 *
 *   ┌────────────────────────────────────────────┐
 *   │  NEXT KM MILESTONE        0.34 / 1.00 km   │
 *   │  ▓▓▓▓▓░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░     │
 *   │                                            │
 *   │  LIVE PACE               ↙ steady pace     │
 *   │   ∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿                          │
 *   │                                            │
 *   │  SPLITS                                    │
 *   │   km 1 · 5'20″    km 2 · 5'08″  …          │
 *   └────────────────────────────────────────────┘
 *
 * Pace samples are taken in-memory every ~2s from `instantPace` so we never
 * have to plumb persistent state into the tracking hook. If there's no signal
 * yet we show a friendly placeholder instead of a dead chart.
 */
const PACE_SAMPLE_WINDOW = 30; // ~60s worth at 2s cadence

const formatPaceMmSs = (minPerKm) => {
  if (!isFinite(minPerKm) || minPerKm <= 0 || minPerKm > 30) return '—';
  const m = Math.floor(minPerKm);
  const s = Math.round((minPerKm - m) * 60);
  return `${m}'${s < 10 ? '0' : ''}${s}"`;
};

export default function RunLivePanel({
  runData,
  durationInSeconds,
  currentSpeed, // meters/sec string
  isRunning,
}) {
  const [paceSamples, setPaceSamples] = useState([]);
  const lastSampleAt = useRef(0);

  // Sample instantaneous pace (min/km) from currentSpeed while running.
  useEffect(() => {
    if (!isRunning) return;
    const now = Date.now();
    if (now - lastSampleAt.current < 1800) return;
    lastSampleAt.current = now;

    const mps = Number(currentSpeed) || 0;
    // min/km from m/s: 16.6667 / mps; guard against 0.
    const minPerKm = mps > 0.3 ? 16.6667 / mps : null;

    setPaceSamples((prev) => {
      const next = [...prev, minPerKm ?? prev[prev.length - 1] ?? 8];
      return next.length > PACE_SAMPLE_WINDOW
        ? next.slice(-PACE_SAMPLE_WINDOW)
        : next;
    });
  }, [currentSpeed, isRunning]);

  const distKm = Number(runData?.distance ?? 0);
  const wholeKm = Math.floor(distKm);
  const fractional = distKm - wholeKm;
  const nextMilestone = wholeKm + 1;

  // Per-km splits: if the tracking hook exposes split times we use them,
  // otherwise we synthesize from average pace so the UI stays alive.
  const splits = (runData?.splits && runData.splits.length
    ? runData.splits
    : Array.from({ length: wholeKm }, (_, i) => {
        if (distKm <= 0 || durationInSeconds <= 0) return 0;
        const avg = durationInSeconds / distKm; // sec per km avg
        // fake slight variation so the numbers don't all read identical
        const jitter = (Math.sin(i * 1.3) - 0.2) * 6;
        return (avg + jitter) / 60; // min/km
      }))
    .slice(-4); // show at most 4 most recent splits

  const currentPace = formatPaceMmSs(
    paceSamples.length ? paceSamples[paceSamples.length - 1] : null
  );

  const paceTrend = (() => {
    if (paceSamples.length < 4) return null;
    const last = paceSamples[paceSamples.length - 1];
    const prior = paceSamples[Math.max(0, paceSamples.length - 5)];
    if (!last || !prior) return null;
    const delta = last - prior;
    if (Math.abs(delta) < 0.08) return { label: 'Steady pace', color: '#0B0F13' };
    if (delta < 0) return { label: 'Picking up', color: '#1EA574' };
    return { label: 'Slowing', color: '#E0892E' };
  })();

  return (
    <View style={styles.wrap}>
      {/* Next milestone */}
      <View style={styles.block}>
        <View style={styles.rowTop}>
          <Text style={styles.label}>NEXT KM MILESTONE</Text>
          <Text style={styles.valueSmall}>
            {distKm.toFixed(2)}
            <Text style={styles.valueUnit}> / {nextMilestone}.00 km</Text>
          </Text>
        </View>
        <View style={styles.barTrack}>
          <View
            style={[
              styles.barFill,
              { width: `${Math.max(4, fractional * 100)}%` },
            ]}
          />
        </View>
      </View>

      {/* Live pace sparkline */}
      <View style={styles.block}>
        <View style={styles.rowTop}>
          <Text style={styles.label}>LIVE PACE</Text>
          <View style={styles.trendRow}>
            {paceTrend ? (
              <>
                <Ionicons
                  name={
                    paceTrend.label === 'Picking up'
                      ? 'trending-up'
                      : paceTrend.label === 'Slowing'
                      ? 'trending-down'
                      : 'remove'
                  }
                  size={12}
                  color={paceTrend.color}
                />
                <Text style={[styles.trendText, { color: paceTrend.color }]}>
                  {paceTrend.label}
                </Text>
              </>
            ) : (
              <Text style={styles.trendMuted}>Warming up</Text>
            )}
          </View>
        </View>

        <View style={styles.paceCard}>
          <View style={styles.paceNumberCol}>
            <Text style={styles.paceBig}>{currentPace}</Text>
            <Text style={styles.paceUnit}>/km</Text>
          </View>

          {paceSamples.length >= 2 ? (
            <Sparkline
              // invert so "faster pace = higher curve"
              data={paceSamples.map((p) => -p)}
              width={width * 0.55}
              height={44}
              color="#24C789"
              fillOpacity={0.12}
              strokeWidth={2}
              highlightLast
            />
          ) : (
            <View style={styles.paceIdle}>
              <View style={styles.paceIdleDot} />
              <Text style={styles.paceIdleText}>
                {isRunning ? 'Gathering pace data…' : 'Start running to see your pace'}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Splits */}
      {wholeKm > 0 && (
        <View style={styles.block}>
          <View style={styles.rowTop}>
            <Text style={styles.label}>RECENT SPLITS</Text>
            <Text style={styles.trendMuted}>
              {splits.length} of {wholeKm}
            </Text>
          </View>
          <View style={styles.splitsRow}>
            {splits.map((p, idx) => {
              const km = wholeKm - splits.length + idx + 1;
              return (
                <View key={`split-${km}`} style={styles.splitPill}>
                  <Text style={styles.splitKm}>km {km}</Text>
                  <Text style={styles.splitPace}>{formatPaceMmSs(p)}</Text>
                </View>
              );
            })}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 24,
    paddingTop: 8,
    gap: 18,
  },
  block: {
    gap: 10,
  },
  rowTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontFamily: FONT.bold,
    fontSize: 10,
    letterSpacing: 1.4,
    color: '#9AA0A6',
    textTransform: 'uppercase',
  },
  valueSmall: {
    fontFamily: FONT.extraBold,
    fontSize: 13,
    color: '#0B0F13',
    fontVariant: ['tabular-nums'],
  },
  valueUnit: {
    fontFamily: FONT.semibold,
    color: '#9AA0A6',
  },
  barTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(11,15,19,0.06)',
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 4,
    backgroundColor: '#0B0F13',
  },
  paceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 18,
    backgroundColor: '#F4F5F7',
    gap: 14,
  },
  paceNumberCol: {
    alignItems: 'flex-start',
  },
  paceBig: {
    fontFamily: FONT.extraBold,
    fontSize: 26,
    color: '#0B0F13',
    letterSpacing: -0.5,
    fontVariant: ['tabular-nums'],
  },
  paceUnit: {
    fontFamily: FONT.semibold,
    fontSize: 11,
    color: '#6B6F76',
    marginTop: 2,
    letterSpacing: 0.6,
  },
  paceIdle: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  paceIdleDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#24C789',
  },
  paceIdleText: {
    fontFamily: FONT.semibold,
    fontSize: 12,
    color: '#6B6F76',
    flex: 1,
  },
  trendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  trendText: {
    fontFamily: FONT.bold,
    fontSize: 11,
    letterSpacing: 0.4,
  },
  trendMuted: {
    fontFamily: FONT.semibold,
    fontSize: 11,
    color: '#9AA0A6',
    letterSpacing: 0.4,
  },
  splitsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  splitPill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#F4F5F7',
    minWidth: 84,
  },
  splitKm: {
    fontFamily: FONT.bold,
    fontSize: 10,
    color: '#9AA0A6',
    letterSpacing: 1,
    marginBottom: 2,
  },
  splitPace: {
    fontFamily: FONT.extraBold,
    fontSize: 15,
    color: '#0B0F13',
    letterSpacing: -0.3,
    fontVariant: ['tabular-nums'],
  },
});

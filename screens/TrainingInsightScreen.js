/**
 * TrainingInsightScreen — post-run analytics screen.
 *
 * Reached via "See training insight →" on RunSummaryModal.
 * Receives `runData` and `durationInSeconds` from route.params.
 *
 * Structure (matches Figma frame 3:1007):
 *   1. AI Coach card — generated text feedback
 *   2. Recovery + Next Workout pair
 *   3. Last 5 pace trend bar chart
 *   4. Heart-rate zones (synthetic if no HR sensor)
 *   5. Schedule next workout CTA
 */
import React, { useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { FONT, T } from '../constants/typography';

// ─── helpers ────────────────────────────────────────────────────────────────

function fmtPace(minPerKm) {
  if (!minPerKm || minPerKm <= 0 || !isFinite(minPerKm)) return '—';
  const m = Math.floor(minPerKm);
  const s = Math.round((minPerKm - m) * 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

function fmtDur(sec) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

// Generate AI-style coaching text from run metrics.
function buildCoachText(distKm, paceMinPerKm, splits) {
  if (distKm <= 0) {
    return 'Complete a run to unlock personalised coaching insights.';
  }
  const fastestSplit = splits?.length
    ? splits.reduce((a, b) => (a.paceMinPerKm < b.paceMinPerKm ? a : b))
    : null;

  if (paceMinPerKm < 4.5) {
    return `Excellent pace — your average of ${fmtPace(paceMinPerKm)}/km is race-ready. Consider a 400m interval session next Tuesday to sharpen your threshold.`;
  }
  if (fastestSplit && fastestSplit.paceMinPerKm < paceMinPerKm * 0.95) {
    return `Strong effort. Your km ${fastestSplit.km} at ${fmtPace(fastestSplit.paceMinPerKm)} matched your threshold pace. Push a longer tempo block next session.`;
  }
  if (distKm >= 5) {
    return `Solid ${distKm.toFixed(1)} km at ${fmtPace(paceMinPerKm)}/km. Consistency is building your aerobic base — aim for one slightly faster run this week.`;
  }
  return `Good ${distKm.toFixed(1)} km run at ${fmtPace(paceMinPerKm)}/km. Build weekly volume gradually to improve your base fitness.`;
}

// Synthetic HR zone distribution from pace (no HR sensor needed).
function buildHRZones(paceMinPerKm, durationSec) {
  const intensity = paceMinPerKm < 5 ? 0.8 : paceMinPerKm < 6 ? 0.6 : 0.4;
  const total = durationSec;
  return [
    { zone: 'Z1', pct: (1 - intensity) * 0.15, color: '#9AA0A6' },
    { zone: 'Z2', pct: (1 - intensity) * 0.35, color: '#9AA0A6' },
    { zone: 'Z3', pct: intensity * 0.45, color: '#24C789' },
    { zone: 'Z4', pct: intensity * 0.30, color: '#9AA0A6' },
    { zone: 'Z5', pct: intensity * 0.10, color: '#9AA0A6' },
  ].map((z) => ({ ...z, durationSec: Math.round(z.pct * total) }));
}

// Next-workout suggestion based on today's run.
function buildNextWorkout(distKm, paceMinPerKm) {
  if (distKm >= 5 && paceMinPerKm < 5.5) {
    return { type: '400m×6', detail: 'Intervals · 40 min', day: 'TUE' };
  }
  if (distKm >= 3) {
    return { type: 'Tempo 4K', detail: 'Steady · 35 min', day: 'WED' };
  }
  return { type: 'Easy 5K', detail: 'Recovery · 30 min', day: 'SUN' };
}

// ─── component ──────────────────────────────────────────────────────────────

export default function TrainingInsightScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const { runData, durationInSeconds } = route?.params ?? {};

  const distKm = Number(runData?.distance ?? 0);
  const duration = Number(durationInSeconds ?? 0);
  const paceMinPerKm = distKm > 0 ? duration / 60 / distKm : 8;
  const splits = runData?.splits ?? [];

  const coachText = useMemo(
    () => buildCoachText(distKm, paceMinPerKm, splits),
    [distKm, paceMinPerKm, splits],
  );

  const hrZones = useMemo(
    () => buildHRZones(paceMinPerKm, duration),
    [paceMinPerKm, duration],
  );

  const nextWorkout = useMemo(
    () => buildNextWorkout(distKm, paceMinPerKm),
    [distKm, paceMinPerKm],
  );

  // Trend chart: last-5 bar chart (use real splits or synthetic series).
  // Heights normalised so the fastest (lowest pace) = tallest bar.
  const trendData = useMemo(() => {
    const base = splits.length >= 2
      ? splits.slice(-5).map((s) => ({ pace: s.paceMinPerKm, km: s.km }))
      : [
          { pace: paceMinPerKm + 0.3, km: 1 },
          { pace: paceMinPerKm + 0.2, km: 2 },
          { pace: paceMinPerKm + 0.1, km: 3 },
          { pace: paceMinPerKm + 0.15, km: 4 },
          { pace: paceMinPerKm, km: 5 },
        ];

    const MAX_H = 82;
    const MIN_H = 30;
    const slowest = Math.max(...base.map((d) => d.pace));
    const fastest = Math.min(...base.map((d) => d.pace));
    const range = slowest - fastest || 0.01;
    const isCurrent = (d) => d.km === base[base.length - 1]?.km;

    return base.map((d) => ({
      ...d,
      height: MIN_H + ((slowest - d.pace) / range) * (MAX_H - MIN_H),
      isCurrent: isCurrent(d),
    }));
  }, [splits, paceMinPerKm]);

  const recovery = Math.min(99, Math.max(60, Math.round(90 - paceMinPerKm * 2 + distKm)));

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          style={styles.topBtn}
        >
          <Ionicons name="chevron-back" size={20} color="#0B0F13" />
        </TouchableOpacity>
        <Text style={styles.topTitle}>Training insight</Text>
        <TouchableOpacity style={styles.topBtn}>
          <Ionicons name="share-outline" size={20} color="#0B0F13" />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: Math.max(insets.bottom + 24, 40) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── AI Coach ── */}
        <View style={styles.card}>
          <View style={styles.aiTag}>
            <Ionicons name="sparkles" size={12} color="#0B0F13" />
            <Text style={styles.aiTagText}>AI COACH</Text>
          </View>
          <Text style={styles.coachBody}>{coachText}</Text>
          <TouchableOpacity activeOpacity={0.7}>
            <Text style={styles.coachLink}>How I analyzed this  →</Text>
          </TouchableOpacity>
        </View>

        {/* ── Recovery + Next Workout ── */}
        <View style={styles.pairRow}>
          <View style={[styles.pairCard, styles.pairCardLight]}>
            <Text style={styles.pairLabel}>RECOVERY</Text>
            <Text style={styles.recoveryNum}>{recovery}</Text>
            <Text style={styles.pairSubtext}>
              {recovery >= 80 ? 'Easy day tomorrow' : recovery >= 65 ? 'Moderate effort ok' : 'Rest recommended'}
            </Text>
          </View>
          <View style={[styles.pairCard, styles.pairCardDark]}>
            <Text style={styles.pairLabelDark}>
              NEXT WORKOUT · {nextWorkout.day}
            </Text>
            <Text style={styles.nextWorkoutType}>{nextWorkout.type}</Text>
            <Text style={styles.nextWorkoutDetail}>{nextWorkout.detail}</Text>
          </View>
        </View>

        {/* ── Pace trend chart ── */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardHeading}>Last {trendData.length} km splits</Text>
            {splits.length >= 2 && (
              <Text style={styles.trendImprove}>
                {fmtPace(trendData[0].pace)} → {fmtPace(trendData[trendData.length - 1].pace)}
              </Text>
            )}
          </View>
          <View style={styles.trendChart}>
            {trendData.map((d, i) => (
              <View key={i} style={styles.trendBar}>
                <View
                  style={[
                    styles.trendBarFill,
                    { height: d.height },
                    d.isCurrent && styles.trendBarCurrent,
                  ]}
                />
                <Text
                  style={[
                    styles.trendPace,
                    d.isCurrent && styles.trendPaceCurrent,
                  ]}
                >
                  {fmtPace(d.pace)}
                </Text>
              </View>
            ))}
          </View>
          <View style={styles.trendFooter}>
            <Text style={styles.trendFooterText}>
              {splits.length >= 2 ? 'km 1' : 'Estimated'}
            </Text>
            <Text style={[styles.trendFooterText, styles.trendFooterGreen]}>
              {splits.length >= 2 ? `km ${trendData[trendData.length - 1]?.km}` : 'Today'}
            </Text>
          </View>
        </View>

        {/* ── Heart rate zones ── */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardHeading}>Heart rate zones</Text>
            <Text style={styles.hrMeta}>
              {distKm > 0 ? 'Estimated · no sensor' : 'No data'}
            </Text>
          </View>
          <View style={styles.hrZones}>
            {hrZones.map((z) => (
              <View key={z.zone} style={styles.hrRow}>
                <Text
                  style={[
                    styles.hrZoneLabel,
                    z.color === '#24C789' && styles.hrZoneLabelAccent,
                  ]}
                >
                  {z.zone}
                </Text>
                <View style={styles.hrBarTrack}>
                  <View
                    style={[
                      styles.hrBarFill,
                      {
                        width: `${Math.round(z.pct * 100)}%`,
                        backgroundColor: z.color,
                      },
                    ]}
                  />
                </View>
                <Text style={styles.hrDuration}>{fmtDur(z.durationSec)}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* ── Bottom CTA ── */}
      <View
        style={[
          styles.ctaWrap,
          { paddingBottom: Math.max(insets.bottom + 8, 24) },
        ]}
      >
        <TouchableOpacity
          style={styles.ctaBtn}
          activeOpacity={0.85}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.ctaBtnText}>
            {`Schedule ${nextWorkout.day === 'TUE' ? 'Tuesday' : nextWorkout.day === 'WED' ? 'Wednesday' : 'next'} ${nextWorkout.type}`}
          </Text>
          <Ionicons name="arrow-forward" size={22} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F4F5F7',
  },

  // Top bar
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  topBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topTitle: {
    fontFamily: FONT.semibold,
    fontSize: 18,
    letterSpacing: -0.3,
    color: '#0B0F13',
  },

  scroll: {
    paddingHorizontal: 24,
    paddingTop: 8,
    gap: 12,
  },

  // Cards
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 16,
    gap: 10,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardHeading: {
    fontFamily: FONT.semibold,
    fontSize: 18,
    letterSpacing: -0.3,
    color: '#0B0F13',
  },

  // AI Coach
  aiTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#24C789',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 99,
    alignSelf: 'flex-start',
  },
  aiTagText: {
    fontFamily: FONT.semibold,
    fontSize: 11,
    letterSpacing: 0.8,
    color: '#0B0F13',
  },
  coachBody: {
    fontFamily: FONT.semibold,
    fontSize: 17,
    lineHeight: 24,
    color: '#0B0F13',
  },
  coachLink: {
    fontFamily: FONT.medium,
    fontSize: 13,
    color: '#24C789',
  },

  // Pair cards
  pairRow: {
    flexDirection: 'row',
    gap: 8,
  },
  pairCard: {
    flex: 1,
    borderRadius: 20,
    padding: 12,
    gap: 4,
    justifyContent: 'space-between',
    minHeight: 96,
  },
  pairCardLight: {
    backgroundColor: '#FFFFFF',
  },
  pairCardDark: {
    backgroundColor: '#0B0F13',
  },
  pairLabel: {
    fontFamily: FONT.semibold,
    fontSize: 10,
    letterSpacing: 1.2,
    color: '#9AA0A6',
    textTransform: 'uppercase',
  },
  pairLabelDark: {
    fontFamily: FONT.semibold,
    fontSize: 10,
    letterSpacing: 1.2,
    color: 'rgba(255,255,255,0.5)',
    textTransform: 'uppercase',
  },
  recoveryNum: {
    fontFamily: FONT.black,
    fontSize: 40,
    color: '#24C789',
    lineHeight: 44,
  },
  pairSubtext: {
    fontFamily: FONT.medium,
    fontSize: 13,
    color: '#0B0F13',
  },
  nextWorkoutType: {
    fontFamily: FONT.bold,
    fontSize: 26,
    color: '#FFFFFF',
    letterSpacing: -0.5,
    lineHeight: 32,
  },
  nextWorkoutDetail: {
    fontFamily: FONT.medium,
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
  },

  // Trend chart
  trendImprove: {
    fontFamily: FONT.semibold,
    fontSize: 11,
    letterSpacing: 0.6,
    color: '#24C789',
    textTransform: 'uppercase',
  },
  trendChart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 96,
    gap: 4,
  },
  trendBar: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    justifyContent: 'flex-end',
  },
  trendBarFill: {
    width: '70%',
    borderRadius: 8,
    backgroundColor: 'rgba(107,111,118,0.35)',
  },
  trendBarCurrent: {
    backgroundColor: '#24C789',
  },
  trendPace: {
    fontFamily: FONT.semibold,
    fontSize: 10,
    letterSpacing: 0.4,
    color: '#9AA0A6',
    textTransform: 'uppercase',
  },
  trendPaceCurrent: {
    color: '#24C789',
  },
  trendFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  trendFooterText: {
    fontFamily: FONT.medium,
    fontSize: 12,
    color: '#9AA0A6',
  },
  trendFooterGreen: {
    color: '#24C789',
  },

  // HR zones
  hrMeta: {
    fontFamily: FONT.semibold,
    fontSize: 10,
    letterSpacing: 0.6,
    color: '#9AA0A6',
    textTransform: 'uppercase',
  },
  hrZones: {
    gap: 6,
  },
  hrRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  hrZoneLabel: {
    fontFamily: FONT.semibold,
    fontSize: 10,
    letterSpacing: 0.8,
    color: '#9AA0A6',
    textTransform: 'uppercase',
    width: 18,
  },
  hrZoneLabelAccent: {
    color: '#24C789',
  },
  hrBarTrack: {
    flex: 1,
    height: 10,
    backgroundColor: 'rgba(11,15,19,0.07)',
    borderRadius: 99,
    overflow: 'hidden',
  },
  hrBarFill: {
    height: '100%',
    borderRadius: 99,
    minWidth: 12,
  },
  hrDuration: {
    fontFamily: FONT.medium,
    fontSize: 13,
    color: '#6B6F76',
    width: 38,
    textAlign: 'right',
  },

  // Bottom CTA
  ctaWrap: {
    paddingHorizontal: 24,
    paddingTop: 8,
    backgroundColor: '#F4F5F7',
  },
  ctaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#0B0F13',
    shadowColor: '#24C789',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 6,
  },
  ctaBtnText: {
    fontFamily: FONT.semibold,
    fontSize: 17,
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
});

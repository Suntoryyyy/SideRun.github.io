import React, { forwardRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Defs, LinearGradient, Stop, Rect, Circle } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import ThreeRings from './ThreeRings';
import { T, FONT } from '../constants/typography';

export const SHARE_CARD_WIDTH = 340;
export const SHARE_CARD_HEIGHT = 560;

/**
 * A dedicated, export-only card for sharing a completed run.
 *
 * Rendered off-screen by RunSummaryModal and captured with
 * `react-native-view-shot`. The aspect ratio (~17:28) reads well on IG stories
 * and Twitter previews without cropping the big metric.
 *
 * Wraps its children in a forwarded-ref <View> so `captureRef` can snapshot it.
 */
const ShareCard = forwardRef(function ShareCard(
  {
    distanceKm = 0,
    durationLabel = '0:00',
    paceLabel = '—',
    kcal = 0,
    distProgress = 0,
    paceProgress = 0,
    durProgress = 0,
    username = 'Runner',
    dateLabel,
    isPB = false,
  },
  ref
) {
  const today =
    dateLabel ||
    new Date().toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });

  return (
    <View ref={ref} collapsable={false} style={styles.root}>
      {/* Gradient background */}
      <Svg
        width={SHARE_CARD_WIDTH}
        height={SHARE_CARD_HEIGHT}
        style={StyleSheet.absoluteFill}
      >
        <Defs>
          <LinearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#0F1418" />
            <Stop offset="0.55" stopColor="#0B0F13" />
            <Stop offset="1" stopColor="#050709" />
          </LinearGradient>
          <LinearGradient id="glow" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#FF5A36" stopOpacity="0.28" />
            <Stop offset="1" stopColor="#FF5A36" stopOpacity="0" />
          </LinearGradient>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#bg)" />
        <Circle cx={SHARE_CARD_WIDTH * 0.85} cy={80} r={180} fill="url(#glow)" />
      </Svg>

      {/* Top row: brand + date */}
      <View style={styles.topRow}>
        <View style={styles.brand}>
          <Ionicons name="footsteps" size={16} color="#24C789" />
          <Text style={styles.brandText}>SIDERUN</Text>
        </View>
        <Text style={styles.date}>{today}</Text>
      </View>

      {/* Status pill */}
      <View style={styles.pillWrap}>
        {isPB ? (
          <View style={styles.pillPB}>
            <Ionicons name="star" size={10} color="#0B0F13" />
            <Text style={styles.pillPBText}>NEW 5K PB</Text>
          </View>
        ) : (
          <View style={styles.pillNeutral}>
            <Text style={styles.pillNeutralText}>RUN COMPLETED</Text>
          </View>
        )}
      </View>

      {/* Hero rings */}
      <View style={styles.ringsWrap}>
        <ThreeRings
          size={150}
          stroke={13}
          gap={3}
          rings={[
            { progress: distProgress, color: '#FF5A36' },
            { progress: paceProgress, color: '#8AE676' },
            { progress: durProgress, color: '#00C2FF' },
          ]}
        />
        <View style={styles.ringsCenter} pointerEvents="none">
          <Text style={styles.ringsPct}>{Math.round(distProgress * 100)}%</Text>
          <Text style={styles.ringsLabel}>DISTANCE</Text>
        </View>
      </View>

      {/* Main metric */}
      <View style={styles.metricRow}>
        <Text style={styles.metricNum}>{distanceKm.toFixed(2)}</Text>
        <Text style={styles.metricUnit}>km</Text>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <Stat label="TIME" value={durationLabel} />
        <Divider />
        <Stat label="PACE" value={paceLabel} unit="/km" />
        <Divider />
        <Stat label="KCAL" value={String(kcal)} />
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerUser}>@{username}</Text>
        <Text style={styles.footerUrl}>siderun.app</Text>
      </View>
    </View>
  );
});

function Stat({ label, value, unit }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statLabel}>{label}</Text>
      <View style={styles.statValueRow}>
        <Text style={styles.statValue}>{value}</Text>
        {unit ? <Text style={styles.statUnit}>{unit}</Text> : null}
      </View>
    </View>
  );
}

function Divider() {
  return <View style={styles.divider} />;
}

const styles = StyleSheet.create({
  root: {
    width: SHARE_CARD_WIDTH,
    height: SHARE_CARD_HEIGHT,
    backgroundColor: '#0B0F13',
    paddingHorizontal: 28,
    paddingTop: 26,
    paddingBottom: 22,
    overflow: 'hidden',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  brandText: {
    fontFamily: FONT.black,
    fontSize: 13,
    color: '#FFFFFF',
    letterSpacing: 2,
  },
  date: {
    ...T.label,
    fontSize: 10,
    color: '#9AA0A6',
  },
  pillWrap: {
    alignSelf: 'flex-start',
    marginTop: 6,
    marginBottom: 10,
  },
  pillPB: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    gap: 4,
  },
  pillPBText: {
    ...T.label,
    fontSize: 10,
    color: '#0B0F13',
  },
  pillNeutral: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  pillNeutralText: {
    ...T.label,
    fontSize: 10,
    color: '#FFFFFF',
  },
  ringsWrap: {
    width: 150,
    height: 150,
    alignSelf: 'center',
    marginTop: 14,
    marginBottom: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringsCenter: {
    position: 'absolute',
    alignItems: 'center',
  },
  ringsPct: {
    fontFamily: FONT.extraBold,
    fontSize: 26,
    color: '#FFFFFF',
    letterSpacing: -0.8,
    fontVariant: ['tabular-nums'],
  },
  ringsLabel: {
    ...T.label,
    fontSize: 9,
    letterSpacing: 1.6,
    marginTop: 2,
  },
  metricRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    alignSelf: 'center',
    marginTop: 6,
    marginBottom: 4,
  },
  metricNum: {
    fontFamily: FONT.black,
    fontSize: 60,
    color: '#FFFFFF',
    letterSpacing: -2.5,
    fontVariant: ['tabular-nums'],
    lineHeight: 64,
  },
  metricUnit: {
    fontFamily: FONT.semibold,
    fontSize: 18,
    color: '#9AA0A6',
    marginLeft: 6,
  },
  statsRow: {
    flexDirection: 'row',
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  stat: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    ...T.label,
    fontSize: 9,
    letterSpacing: 1.4,
    marginBottom: 4,
  },
  statValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  statValue: {
    fontFamily: FONT.extraBold,
    fontSize: 18,
    color: '#FFFFFF',
    letterSpacing: -0.3,
    fontVariant: ['tabular-nums'],
  },
  statUnit: {
    fontFamily: FONT.semibold,
    fontSize: 11,
    color: '#9AA0A6',
    marginLeft: 3,
  },
  divider: {
    width: 1,
    height: 26,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  footer: {
    position: 'absolute',
    left: 28,
    right: 28,
    bottom: 22,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerUser: {
    fontFamily: FONT.bold,
    fontSize: 12,
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  footerUrl: {
    ...T.label,
    fontSize: 9,
    letterSpacing: 1.4,
    color: 'rgba(255,255,255,0.4)',
  },
});

export default ShareCard;

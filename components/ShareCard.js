/**
 * ShareCard — square (1:1) "Route Hero" share card.
 *
 * Rendered off-screen by RunSummaryModal and captured with react-native-view-shot
 * to produce a PNG the user can save/share. Square aspect reads well on IG feed
 * posts and Twitter previews. The route polyline is the visual hero — this is
 * the most identity-rich part of a run and the most share-worthy element.
 *
 *   ┌─────────────────────────────────┐
 *   │ ● SIDERUN           TUE · 06:42 │
 *   │ ┌─────────────────────────────┐ │
 *   │ │ ● Morning run       ★ NEW PB│ │
 *   │ │                             │ │
 *   │ │    ╭─────╮                  │ │
 *   │ │   ╱       ╲                 │ │
 *   │ │  ●         ●                │ │
 *   │ └─────────────────────────────┘ │
 *   │                                 │
 *   │ 5.12 km                         │
 *   │ ─────────────────────────────── │
 *   │  TIME   │  PACE   │  KCAL       │
 *   │  27:05  │  5:17 /km│  384       │
 *   │                                 │
 *   │ @suntory             siderun.app│
 *   └─────────────────────────────────┘
 */
import React, { forwardRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Defs, LinearGradient, Stop, Rect, Circle } from 'react-native-svg';
import RouteArt from './RouteArt';
import { FONT } from '../constants/typography';

export const SHARE_CARD_WIDTH = 540;
export const SHARE_CARD_HEIGHT = 540;

const MAP_PAD = 28;
const MAP_H = 232;
const MAP_W = SHARE_CARD_WIDTH - MAP_PAD * 2;

const ShareCard = forwardRef(function ShareCard(
  {
    distanceKm = 0,
    durationLabel = '0:00',
    paceLabel = '—',
    kcal = 0,
    username = 'Runner',
    dateLabel,
    timeLabel,
    placeName = 'Your route',
    coordinates,
    isPB = false,
  },
  ref,
) {
  const today =
    dateLabel ||
    new Date()
      .toLocaleDateString(undefined, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      })
      .toUpperCase();

  const time =
    timeLabel ||
    new Date().toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });

  return (
    <View ref={ref} collapsable={false} style={styles.root}>
      {/* Background with subtle brand-tinted glow */}
      <Svg
        width={SHARE_CARD_WIDTH}
        height={SHARE_CARD_HEIGHT}
        style={StyleSheet.absoluteFill}
      >
        <Defs>
          <LinearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#0F141A" />
            <Stop offset="1" stopColor="#080B10" />
          </LinearGradient>
          <LinearGradient id="glow" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#24C789" stopOpacity="0.26" />
            <Stop offset="1" stopColor="#24C789" stopOpacity="0" />
          </LinearGradient>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#bg)" />
        <Circle
          cx={SHARE_CARD_WIDTH * 0.12}
          cy={-30}
          r={220}
          fill="url(#glow)"
        />
      </Svg>

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.brandRow}>
          <View style={styles.brandDot} />
          <Text style={styles.brandText}>SIDERUN</Text>
        </View>
        <Text style={styles.dateText}>
          {today} · {time}
        </Text>
      </View>

      {/* Route hero */}
      <View style={styles.mapSlot}>
        <RouteArt
          coordinates={coordinates}
          width={MAP_W}
          height={MAP_H}
          variant="hero"
          strokeColor="#24C789"
          placeName={placeName}
          badge={
            isPB ? { icon: 'star', label: 'NEW 5K PB' } : null
          }
        />
      </View>

      {/* Metric row */}
      <View style={styles.metricRow}>
        <Text style={styles.metricNum} numberOfLines={1} allowFontScaling={false}>
          {distanceKm.toFixed(2)}
        </Text>
        <Text style={styles.metricUnit}>km</Text>
      </View>

      {/* Stats */}
      <View style={styles.stats}>
        <Stat label="TIME" value={durationLabel} />
        <Stat label="PACE" value={paceLabel} unit="/km" />
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
      <View style={styles.statRow}>
        <Text style={styles.statValue} allowFontScaling={false}>
          {value}
        </Text>
        {unit ? <Text style={styles.statUnit}>{unit}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    width: SHARE_CARD_WIDTH,
    height: SHARE_CARD_HEIGHT,
    backgroundColor: '#0B0F13',
    overflow: 'hidden',
    borderRadius: 36,
  },
  header: {
    position: 'absolute',
    top: 26,
    left: MAP_PAD,
    right: MAP_PAD,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#24C789',
  },
  brandText: {
    fontFamily: FONT.black,
    fontSize: 14,
    color: '#FFFFFF',
    letterSpacing: 2.4,
  },
  dateText: {
    fontFamily: FONT.semibold,
    fontSize: 12,
    color: '#9AA0A6',
    letterSpacing: 1.6,
  },

  mapSlot: {
    position: 'absolute',
    top: 64,
    left: MAP_PAD,
    width: MAP_W,
    height: MAP_H,
  },

  metricRow: {
    position: 'absolute',
    top: 64 + MAP_H + 14,
    left: MAP_PAD,
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  metricNum: {
    fontFamily: FONT.black,
    fontSize: 70,
    color: '#FFFFFF',
    letterSpacing: -2.5,
    lineHeight: 72,
    fontVariant: ['tabular-nums'],
  },
  metricUnit: {
    fontFamily: FONT.bold,
    fontSize: 20,
    color: '#8E939A',
    marginLeft: 8,
  },

  stats: {
    position: 'absolute',
    top: 64 + MAP_H + 100,
    left: 0,
    right: 0,
    paddingHorizontal: MAP_PAD,
    paddingTop: 18,
    paddingBottom: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  stat: {
    alignItems: 'center',
  },
  statLabel: {
    fontFamily: FONT.bold,
    fontSize: 10,
    letterSpacing: 1.6,
    color: '#7F858C',
    marginBottom: 4,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  statValue: {
    fontFamily: FONT.extraBold,
    fontSize: 22,
    color: '#FFFFFF',
    letterSpacing: -0.3,
    fontVariant: ['tabular-nums'],
  },
  statUnit: {
    fontFamily: FONT.semibold,
    fontSize: 11,
    color: '#8E939A',
    marginLeft: 3,
  },

  footer: {
    position: 'absolute',
    bottom: 26,
    left: MAP_PAD,
    right: MAP_PAD,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  footerUser: {
    fontFamily: FONT.bold,
    fontSize: 13,
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  footerUrl: {
    fontFamily: FONT.bold,
    fontSize: 11,
    color: '#73787F',
    letterSpacing: 1.6,
  },
});

export default ShareCard;

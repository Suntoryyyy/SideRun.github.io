/**
 * ShareCardStory — 9:16 vertical share card for Instagram Stories.
 *
 * Designed to drop directly into IG Story with no cropping (9:16 is the native
 * Story aspect ratio). Background gradient shifts with time-of-day so every
 * run has its own "mood", which is what makes shares feel personal and
 * unstageable.
 *
 *   ┌─────────────┐
 *   │● SIDERUN    │
 *   │ TUE · 06:42 │
 *   │             │
 *   │ ★ NEW PB    │
 *   │             │
 *   │    5.12     │ ← huge hero
 *   │ KILOMETRES  │
 *   │             │
 *   │ ╭─────╮     │ ← route panel
 *   │ │ route│    │
 *   │ ╰─────╯     │
 *   │             │
 *   │ ▂▃▅▆▇ pace  │ ← splits
 *   │ @suntory    │
 *   └─────────────┘
 */
import React, { forwardRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Defs, LinearGradient, Stop, Rect, Circle } from 'react-native-svg';
import RouteArt from './RouteArt';
import { FONT } from '../constants/typography';

export const STORY_CARD_WIDTH = 540;
export const STORY_CARD_HEIGHT = 960;

/**
 * Pick background gradient based on hour of day.
 * Dawn (5-8): peach → magenta → navy
 * Day (8-17): sky blue → cooler blue
 * Dusk (17-20): orange → violet
 * Night (20-5): deep navy → black
 */
function pickPalette(hour) {
  if (hour >= 5 && hour < 8) {
    return {
      top: '#FF7B5A',
      mid: '#8C4790',
      bot: '#0F0D21',
      sun: 'rgba(255,240,210,0.45)',
      moodLabel: 'SUNRISE',
    };
  }
  if (hour >= 8 && hour < 17) {
    return {
      top: '#60A7E8',
      mid: '#2B5F95',
      bot: '#0F1F32',
      sun: 'rgba(255,255,255,0.18)',
      moodLabel: 'DAYLIGHT',
    };
  }
  if (hour >= 17 && hour < 20) {
    return {
      top: '#FF915A',
      mid: '#6E3B8C',
      bot: '#0E0A1F',
      sun: 'rgba(255,220,180,0.35)',
      moodLabel: 'GOLDEN HOUR',
    };
  }
  return {
    top: '#1D2550',
    mid: '#0C1230',
    bot: '#05070F',
    sun: 'rgba(180,200,255,0.12)',
    moodLabel: 'NIGHT',
  };
}

/**
 * Generate splits (min/km per kilometer) from the real splits array, falling
 * back to synthetic ones from average pace when splits aren't recorded.
 */
function resolveSplits(runData, avgPace) {
  const real = Array.isArray(runData?.splits) ? runData.splits : [];
  const realPaces = real
    .map((s) => (typeof s === 'number' ? s : s?.paceMinPerKm))
    .filter((n) => typeof n === 'number' && isFinite(n) && n > 0);
  if (realPaces.length >= 2) return realPaces.slice(-5);
  const km = Math.max(1, Math.round(Number(runData?.distance || 0)));
  const N = Math.min(5, km);
  if (!N || !isFinite(avgPace) || avgPace <= 0) return [];
  return Array.from({ length: N }, (_, i) => {
    const jitter = (Math.sin(i * 1.7) + Math.cos(i * 0.9)) * 0.18;
    return Math.max(2.5, avgPace + jitter);
  });
}

const ShareCardStory = forwardRef(function ShareCardStory(
  {
    distanceKm = 0,
    durationLabel = '0:00',
    paceLabel = '—',
    paceMinPerKm = 0,
    kcal = 0,
    username = 'Runner',
    dateLabel,
    timeLabel,
    placeName = 'Your route',
    coordinates,
    isPB = false,
    runData,
    hourOverride, // optional, used for testing/export
  },
  ref,
) {
  const hour =
    typeof hourOverride === 'number' ? hourOverride : new Date().getHours();
  const palette = pickPalette(hour);

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

  const splits = resolveSplits(runData, paceMinPerKm);
  const fastest = splits.length ? Math.min(...splits) : 0;
  const slowest = splits.length ? Math.max(...splits) : 0;
  const paceRange = slowest - fastest || 0.01;

  return (
    <View ref={ref} collapsable={false} style={styles.root}>
      {/* Time-of-day gradient background */}
      <Svg
        width={STORY_CARD_WIDTH}
        height={STORY_CARD_HEIGHT}
        style={StyleSheet.absoluteFill}
      >
        <Defs>
          <LinearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={palette.top} />
            <Stop offset="0.45" stopColor={palette.mid} />
            <Stop offset="1" stopColor={palette.bot} />
          </LinearGradient>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#sky)" />
        {/* Sun / moon disc */}
        <Circle
          cx={STORY_CARD_WIDTH / 2}
          cy={-40}
          r={210}
          fill={palette.sun}
        />
      </Svg>

      {/* Brand row */}
      <View style={styles.brandRow}>
        <View style={styles.brandLeft}>
          <View style={styles.brandDot} />
          <Text style={styles.brandText}>SIDERUN</Text>
        </View>
        <Text style={styles.dateText}>
          {today} · {time} {palette.moodLabel ? `· ${palette.moodLabel}` : ''}
        </Text>
      </View>

      {/* PB / summary pill */}
      <View style={styles.pbWrap} pointerEvents="none">
        <View style={[styles.pbPill, !isPB && styles.pbPillNeutral]}>
          {isPB ? <Text style={styles.pbStar}>★</Text> : null}
          <Text style={[styles.pbText, !isPB && styles.pbTextNeutral]}>
            {isPB ? 'NEW 5K PERSONAL BEST' : 'RUN COMPLETED'}
          </Text>
        </View>
      </View>

      {/* Hero number */}
      <View style={styles.heroWrap}>
        <Text
          style={styles.heroNum}
          numberOfLines={1}
          allowFontScaling={false}
        >
          {distanceKm.toFixed(2)}
        </Text>
        <Text style={styles.heroUnit} allowFontScaling={false}>
          KILOMETRES
        </Text>
        <Text style={styles.placeText} numberOfLines={1}>
          {placeName.toUpperCase()}
        </Text>
      </View>

      {/* Route panel */}
      <View style={styles.routeSlot}>
        <RouteArt
          coordinates={coordinates}
          width={STORY_CARD_WIDTH - 120}
          height={240}
          variant="minimal"
        />
      </View>

      {/* Splits */}
      <View style={styles.splitsHeader}>
        <Text style={styles.splitsLabel}>PER-KM PACE</Text>
        <Text style={styles.splitsLabel}>{paceLabel} /KM AVG</Text>
      </View>
      <View style={styles.splitsRow}>
        {splits.length === 0 ? (
          <View style={styles.splitsEmpty}>
            <Text style={styles.splitsEmptyText}>
              Splits will appear after your first full kilometre.
            </Text>
          </View>
        ) : (
          splits.map((p, i) => {
            const ratio = (slowest - p) / paceRange;
            const h = 24 + ratio * 68;
            const isFastest = p === fastest;
            return (
              <View key={`bar-${i}`} style={styles.splitCol}>
                <View
                  style={[
                    styles.splitBar,
                    { height: h, opacity: isFastest ? 1 : 0.35 },
                  ]}
                />
                <Text
                  style={[
                    styles.splitLabel,
                    isFastest && styles.splitLabelFast,
                  ]}
                >
                  KM {i + 1}
                </Text>
              </View>
            );
          })
        )}
      </View>

      {/* Stats row (time / kcal) for context */}
      <View style={styles.ctxRow}>
        <Text style={styles.ctxText}>
          {durationLabel} <Text style={styles.ctxMuted}>TIME</Text>   ·  {kcal}{' '}
          <Text style={styles.ctxMuted}>KCAL</Text>
        </Text>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerUser}>@{username}</Text>
        <Text style={styles.footerUrl}>siderun.app</Text>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  root: {
    width: STORY_CARD_WIDTH,
    height: STORY_CARD_HEIGHT,
    overflow: 'hidden',
    borderRadius: 36,
    backgroundColor: '#0B0F13',
  },

  brandRow: {
    position: 'absolute',
    top: 56,
    left: 32,
    right: 32,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brandLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
  },
  brandText: {
    fontFamily: FONT.black,
    fontSize: 14,
    color: '#FFFFFF',
    letterSpacing: 2.4,
  },
  dateText: {
    fontFamily: FONT.semibold,
    fontSize: 11,
    color: 'rgba(255,255,255,0.85)',
    letterSpacing: 1.2,
  },

  pbWrap: {
    position: 'absolute',
    top: 106,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  pbPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
  },
  pbPillNeutral: {
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  pbStar: {
    fontFamily: FONT.black,
    fontSize: 12,
    color: '#0B0F13',
  },
  pbText: {
    fontFamily: FONT.black,
    fontSize: 12,
    color: '#0B0F13',
    letterSpacing: 1.4,
  },
  pbTextNeutral: {
    color: '#FFFFFF',
  },

  heroWrap: {
    position: 'absolute',
    top: 160,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  heroNum: {
    fontFamily: FONT.black,
    fontSize: 200,
    color: '#FFFFFF',
    letterSpacing: -8,
    lineHeight: 200,
    fontVariant: ['tabular-nums'],
  },
  heroUnit: {
    fontFamily: FONT.bold,
    fontSize: 28,
    color: 'rgba(255,255,255,0.9)',
    letterSpacing: 4,
    marginTop: 6,
  },
  placeText: {
    fontFamily: FONT.semibold,
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    letterSpacing: 1.8,
    marginTop: 10,
  },

  routeSlot: {
    position: 'absolute',
    top: 486,
    left: 60,
    width: STORY_CARD_WIDTH - 120,
    height: 240,
  },

  splitsHeader: {
    position: 'absolute',
    top: 746,
    left: 60,
    right: 60,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  splitsLabel: {
    fontFamily: FONT.bold,
    fontSize: 11,
    letterSpacing: 1.6,
    color: 'rgba(255,255,255,0.6)',
  },
  splitsRow: {
    position: 'absolute',
    top: 776,
    left: 60,
    right: 60,
    height: 100,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 10,
  },
  splitCol: {
    flex: 1,
    alignItems: 'center',
  },
  splitBar: {
    width: '100%',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
  },
  splitLabel: {
    fontFamily: FONT.bold,
    fontSize: 9,
    letterSpacing: 0.8,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 8,
  },
  splitLabelFast: {
    color: '#FFFFFF',
  },
  splitsEmpty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  splitsEmptyText: {
    fontFamily: FONT.semibold,
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    letterSpacing: 0.2,
  },

  ctxRow: {
    position: 'absolute',
    bottom: 82,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  ctxText: {
    fontFamily: FONT.extraBold,
    fontSize: 14,
    color: '#FFFFFF',
    letterSpacing: 1.2,
  },
  ctxMuted: {
    fontFamily: FONT.bold,
    color: 'rgba(255,255,255,0.55)',
    letterSpacing: 1.6,
  },

  footer: {
    position: 'absolute',
    bottom: 36,
    left: 60,
    right: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  footerUser: {
    fontFamily: FONT.bold,
    fontSize: 14,
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  footerUrl: {
    fontFamily: FONT.bold,
    fontSize: 11,
    color: 'rgba(255,255,255,0.55)',
    letterSpacing: 1.6,
  },
});

export default ShareCardStory;

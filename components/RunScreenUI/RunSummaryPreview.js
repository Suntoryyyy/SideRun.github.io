/**
 * RunSummaryPreview — in-app summary body with three switchable styles:
 *   route  → map hero + distance (default)
 *   data   → stats-first, prominent splits
 *   social → crew cheers + highlights
 */
import React from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import RouteArt from '../RouteArt';
import CelebrationPulse from '../CelebrationPulse';
import { FONT, T } from '../../constants/typography';

export const PREVIEW_STYLES = [
  { key: 'route', label: 'Route', icon: 'map-outline' },
  { key: 'data', label: 'Stats', icon: 'stats-chart-outline' },
  { key: 'social', label: 'Social', icon: 'heart-outline' },
];

function InlineStat({ label, value, unit, large }) {
  return (
    <View style={[styles.inlineStat, large && styles.inlineStatLarge]}>
      <Text style={styles.inlineStatLabel}>{label}</Text>
      <View style={styles.inlineStatRow}>
        <Text
          style={[styles.inlineStatValue, large && styles.inlineStatValueLarge]}
          allowFontScaling={false}
        >
          {value}
        </Text>
        {unit ? <Text style={styles.inlineStatUnit}>{unit}</Text> : null}
      </View>
    </View>
  );
}

function SplitsChart({ splitsPaces, fastest, slowest, paceRange, formatPace, tall }) {
  if (!splitsPaces.length) return null;
  const maxH = tall ? 72 : 56;
  const minH = tall ? 28 : 20;
  return (
    <View style={styles.splitsBlock}>
      <View style={styles.splitsHeader}>
        <Text style={styles.splitsLabel}>PER-KM PACE</Text>
        <Text style={styles.splitsLabel}>Fastest {formatPace(fastest)}</Text>
      </View>
      <View style={[styles.splitsRow, tall && { height: 110 }]}>
        {splitsPaces.map((p, i) => {
          const ratio = (slowest - p) / paceRange;
          const h = minH + ratio * maxH;
          const isFastest = p === fastest;
          return (
            <View key={`split-${i}`} style={styles.splitCol}>
              <View
                style={[
                  styles.splitBar,
                  { height: h, opacity: isFastest ? 1 : 0.35 },
                ]}
              />
              <Text style={[styles.splitText, isFastest && styles.splitTextFast]}>
                {formatPace(p)}
              </Text>
              <Text style={styles.splitKm}>km {i + 1}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

export default function RunSummaryPreview({
  style = 'route',
  profile,
  distanceKm,
  durationLabel,
  paceLabel,
  kcal,
  runData,
  isPB,
  cheersReceived,
  splitsPaces,
  fastest,
  slowest,
  paceRange,
  formatPace,
  previewW,
  mapH,
  heroScale,
}) {
  if (style === 'data') {
    return (
      <View style={styles.dataWrap}>
        <View style={styles.heroWrap}>
          {isPB && <CelebrationPulse size={150} color={profile.accent} rings={2} />}
          <Animated.View style={[styles.heroRowCenter, { transform: [{ scale: heroScale }] }]}>
            <Text style={styles.heroNumLarge} allowFontScaling={false}>
              {distanceKm.toFixed(2)}
            </Text>
            <Text style={styles.heroUnitLarge}>km</Text>
          </Animated.View>
        </View>

        <View style={styles.statGrid}>
          <View style={[styles.statCard, { borderColor: profile.accent + '33' }]}>
            <InlineStat label="TIME" value={durationLabel} large />
          </View>
          <View style={[styles.statCard, { borderColor: profile.accent + '33' }]}>
            <InlineStat label="PACE" value={paceLabel} unit="/km" large />
          </View>
          <View style={styles.statCard}>
            <InlineStat label="KCAL" value={String(kcal)} large />
          </View>
          <View style={styles.statCard}>
            <InlineStat
              label="SPLITS"
              value={String(splitsPaces.length || '—')}
              large
            />
          </View>
        </View>

        <SplitsChart
          splitsPaces={splitsPaces}
          fastest={fastest}
          slowest={slowest}
          paceRange={paceRange}
          formatPace={formatPace}
          tall
        />

        <View style={[styles.mapThumb, { width: previewW }]}>
          <RouteArt
            coordinates={runData?.coordinates}
            width={previewW}
            height={Math.round(previewW * 0.22)}
            variant="hero"
            strokeColor={profile.accent}
            placeName={profile.placeName}
          />
        </View>
      </View>
    );
  }

  if (style === 'social') {
    const hasCheers = cheersReceived > 0;
    return (
      <View style={styles.socialWrap}>
        <View style={[styles.socialHero, { backgroundColor: profile.accentTint }]}>
          <Ionicons
            name={hasCheers ? 'heart' : 'person-outline'}
            size={28}
            color={profile.accent}
          />
          <Text style={[styles.socialNum, { color: profile.accent }]}>
            {hasCheers ? cheersReceived : '—'}
          </Text>
          <Text style={styles.socialLabel}>
            {hasCheers
              ? cheersReceived === 1
                ? 'cheer from your crew'
                : 'cheers from your crew'
              : 'solo run — share next time'}
          </Text>
        </View>

        <View style={[styles.mapWrap, { width: previewW, height: Math.round(mapH * 0.65) }]}>
          <RouteArt
            coordinates={runData?.coordinates}
            width={previewW}
            height={Math.round(mapH * 0.65)}
            variant="hero"
            strokeColor={profile.accent}
            placeName={profile.placeName}
            badge={isPB ? { icon: 'star', label: 'NEW 5K PB' } : null}
          />
        </View>

        <View style={styles.statsCompact}>
          <InlineStat label="DIST" value={distanceKm.toFixed(2)} unit="km" />
          <View style={styles.statDivider} />
          <InlineStat label="TIME" value={durationLabel} />
          <View style={styles.statDivider} />
          <InlineStat label="PACE" value={paceLabel} unit="/km" />
        </View>

        {hasCheers && (
          <View style={styles.socialNote}>
            <Ionicons name="people" size={14} color="#FF915A" />
            <Text style={styles.socialNoteText}>
              Your friends were watching — keep the momentum going
            </Text>
          </View>
        )}
      </View>
    );
  }

  // route (default)
  return (
    <>
      <View style={[styles.mapWrap, { width: previewW, height: mapH }]}>
        <RouteArt
          coordinates={runData?.coordinates}
          width={previewW}
          height={mapH}
          variant="hero"
          strokeColor={profile.accent}
          placeName={profile.placeName}
          badge={isPB ? { icon: 'star', label: 'NEW 5K PB' } : null}
        />
      </View>

      <View style={styles.heroWrap}>
        {isPB && <CelebrationPulse size={150} color={profile.accent} rings={2} />}
        <Animated.View style={[styles.heroRow, { transform: [{ scale: heroScale }] }]}>
          <Text style={styles.heroNum} allowFontScaling={false}>
            {distanceKm.toFixed(2)}
          </Text>
          <Text style={styles.heroUnit}>km</Text>
        </Animated.View>
      </View>

      <View style={styles.stats}>
        <InlineStat label="TIME" value={durationLabel} />
        <View style={styles.statDivider} />
        <InlineStat label="PACE" value={paceLabel} unit="/km" />
        <View style={styles.statDivider} />
        <InlineStat label="KCAL" value={String(kcal)} />
      </View>

      <SplitsChart
        splitsPaces={splitsPaces}
        fastest={fastest}
        slowest={slowest}
        paceRange={paceRange}
        formatPace={formatPace}
      />
    </>
  );
}

const styles = StyleSheet.create({
  mapWrap: {
    alignSelf: 'center',
    overflow: 'hidden',
    borderRadius: 22,
  },
  mapThumb: {
    alignSelf: 'center',
    overflow: 'hidden',
    borderRadius: 16,
    opacity: 0.85,
  },
  heroWrap: {
    alignSelf: 'flex-start',
    justifyContent: 'center',
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    alignSelf: 'flex-start',
  },
  heroRowCenter: {
    flexDirection: 'row',
    alignItems: 'baseline',
    alignSelf: 'center',
  },
  heroNum: {
    fontFamily: FONT.black,
    fontSize: 56,
    color: '#FFFFFF',
    letterSpacing: -2,
    fontVariant: ['tabular-nums'],
    lineHeight: 58,
  },
  heroNumLarge: {
    fontFamily: FONT.black,
    fontSize: 72,
    color: '#FFFFFF',
    letterSpacing: -3,
    fontVariant: ['tabular-nums'],
    lineHeight: 74,
  },
  heroUnit: {
    fontFamily: FONT.bold,
    fontSize: 18,
    color: '#8E939A',
    marginLeft: 8,
  },
  heroUnitLarge: {
    fontFamily: FONT.bold,
    fontSize: 22,
    color: '#8E939A',
    marginLeft: 10,
  },
  stats: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 16,
    paddingBottom: 4,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  statsCompact: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  inlineStat: {
    flex: 1,
    alignItems: 'center',
  },
  inlineStatLarge: {
    flex: 0,
    alignItems: 'flex-start',
    width: '100%',
  },
  inlineStatLabel: {
    ...T.label,
    fontSize: 10,
    marginBottom: 4,
  },
  inlineStatRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  inlineStatValue: {
    fontFamily: FONT.extraBold,
    fontSize: 20,
    color: '#FFFFFF',
    letterSpacing: -0.3,
    fontVariant: ['tabular-nums'],
  },
  inlineStatValueLarge: {
    fontSize: 24,
  },
  inlineStatUnit: {
    fontFamily: FONT.semibold,
    fontSize: 11,
    color: '#8E939A',
    marginLeft: 3,
  },
  dataWrap: {
    alignSelf: 'stretch',
    alignItems: 'center',
    gap: 16,
  },
  statGrid: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  statCard: {
    width: '47%',
    flexGrow: 1,
    padding: 14,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  socialWrap: {
    alignSelf: 'stretch',
    alignItems: 'center',
    gap: 14,
  },
  socialHero: {
    alignSelf: 'stretch',
    alignItems: 'center',
    paddingVertical: 20,
    borderRadius: 20,
    gap: 4,
  },
  socialNum: {
    fontFamily: FONT.black,
    fontSize: 48,
    letterSpacing: -1,
    lineHeight: 52,
  },
  socialLabel: {
    fontFamily: FONT.semibold,
    fontSize: 13,
    color: 'rgba(255,255,255,0.65)',
    textAlign: 'center',
  },
  socialNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'stretch',
    paddingHorizontal: 4,
  },
  socialNoteText: {
    fontFamily: FONT.regular,
    fontSize: 12,
    color: 'rgba(255,255,255,0.55)',
    flex: 1,
  },
  splitsBlock: {
    alignSelf: 'stretch',
    paddingTop: 4,
    gap: 10,
  },
  splitsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  splitsLabel: {
    fontFamily: FONT.bold,
    fontSize: 10,
    letterSpacing: 1.4,
    color: 'rgba(255,255,255,0.55)',
    textTransform: 'uppercase',
  },
  splitsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 90,
    gap: 6,
  },
  splitCol: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    justifyContent: 'flex-end',
  },
  splitBar: {
    width: '60%',
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
  },
  splitText: {
    fontFamily: FONT.bold,
    fontSize: 9,
    color: 'rgba(255,255,255,0.55)',
  },
  splitKm: {
    fontFamily: FONT.bold,
    fontSize: 8,
    letterSpacing: 0.3,
    color: 'rgba(255,255,255,0.35)',
    textTransform: 'uppercase',
  },
  splitTextFast: {
    color: '#FFFFFF',
  },
});

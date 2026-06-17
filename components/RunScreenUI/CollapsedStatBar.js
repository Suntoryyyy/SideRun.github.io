import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { FONT } from '../../constants/typography';
import { formatDuration } from '../../utils/timeUtils';

/**
 * CollapsedStatBar — the compact, always-complete data strip shown while a run
 * is in progress (or when the pre-run sheet is collapsed to reveal the map).
 *
 * Inspired by Keep's collapsed run bar: three glanceable metrics (distance ·
 * time · pace) in one tidy row so the runner gets the full picture without the
 * tall sheet eating the map. Unlike the old behaviour — where collapsing slid
 * the giant distance number half off-screen — every value here is fully
 * visible at a fixed compact size.
 */
const formatPace = (distKm, durationSec) => {
  if (!distKm || distKm < 0.01 || !durationSec) return "--'--\"";
  const secPerKm = durationSec / distKm;
  const min = Math.floor(secPerKm / 60);
  const sec = Math.round(secPerKm % 60);
  return `${min}'${sec < 10 ? '0' : ''}${sec}"`;
};

export default function CollapsedStatBar({ runData, durationInSeconds, style }) {
  const distKm = Number(runData?.distance ?? 0);
  const pace = formatPace(distKm, durationInSeconds);

  return (
    <View style={[styles.bar, style]} pointerEvents="none">
      <View style={styles.col}>
        <Text style={styles.value} numberOfLines={1} adjustsFontSizeToFit>
          {distKm.toFixed(2)}
        </Text>
        <Text style={styles.label}>KM</Text>
      </View>

      <View style={styles.sep} />

      <View style={styles.col}>
        <Text style={styles.value} numberOfLines={1} adjustsFontSizeToFit>
          {formatDuration(durationInSeconds)}
        </Text>
        <Text style={styles.label}>TIME</Text>
      </View>

      <View style={styles.sep} />

      <View style={styles.col}>
        <Text style={styles.value} numberOfLines={1} adjustsFontSizeToFit>
          {pace}
        </Text>
        <Text style={styles.label}>PACE /KM</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingVertical: 14,
    paddingHorizontal: 18,
    shadowColor: '#0B0F13',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 8,
  },
  col: {
    flex: 1,
    alignItems: 'center',
  },
  value: {
    fontFamily: FONT.extraBold,
    fontSize: 24,
    color: '#0B0F13',
    letterSpacing: -0.6,
    fontVariant: ['tabular-nums'],
  },
  label: {
    fontFamily: FONT.bold,
    fontSize: 9,
    color: '#9AA0A6',
    letterSpacing: 1.4,
    marginTop: 4,
    textTransform: 'uppercase',
  },
  sep: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(11,15,19,0.08)',
    marginHorizontal: 6,
  },
});

import React from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FONT, T } from '../../constants/typography';
import { formatDuration } from '../../utils/timeUtils';

/**
 * Formats pace as "M'SS"" (min per km).
 * Returns "--'--"" when no distance logged yet.
 */
const formatPace = (distKm, durationSec) => {
  if (!distKm || distKm < 0.01 || !durationSec) return "--'--\"";
  const secPerKm = durationSec / distKm;
  const min = Math.floor(secPerKm / 60);
  const sec = Math.round(secPerKm % 60);
  return `${min}'${sec < 10 ? '0' : ''}${sec}"`;
};

const MetricDashboard = ({
  mode,
  runData,
  durationInSeconds,
  contentOpacity,
  friendsWatching,
}) => {
  const distKm = runData?.distance ?? 0;
  const pace = formatPace(distKm, durationInSeconds);

  return (
    <View style={styles.container}>

      {/* Primary metric — distance */}
      <View style={styles.primaryRow}>
        <Text
          style={styles.primaryValue}
          adjustsFontSizeToFit
          numberOfLines={1}
        >
          {distKm.toFixed(2)}
        </Text>
        <Text style={styles.primaryUnit}>KM</Text>
      </View>

      {/* Secondary row — time + pace + kcal */}
      <View style={styles.secondaryRow}>
        <View style={styles.statBox}>
          <Text style={styles.statValue} adjustsFontSizeToFit numberOfLines={1}>
            {formatDuration(durationInSeconds)}
          </Text>
          <Text style={styles.statLabel}>TIME</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.statBox}>
          <Text style={styles.statValue} adjustsFontSizeToFit numberOfLines={1}>
            {pace}
          </Text>
          <Text style={styles.statLabel}>PACE /KM</Text>
        </View>

        <View style={styles.divider} />

        {/* Kcal or "X watching" */}
        <Animated.View style={[styles.statBox, { opacity: contentOpacity }]}>
          <Text style={styles.statValue} adjustsFontSizeToFit numberOfLines={1}>
            {Math.round(runData?.calories ?? 0)}
          </Text>
          <Text style={styles.statLabel}>KCAL</Text>
        </Animated.View>
      </View>

      {/* Friends watching chip (shared mode only) */}
      {mode === 'shared' && friendsWatching > 0 && (
        <Animated.View style={[styles.watchingChip, { opacity: contentOpacity }]}>
          <Ionicons name="people" size={12} color="#24C789" />
          <Text style={styles.watchingText}>{friendsWatching} watching</Text>
        </Animated.View>
      )}
    </View>
  );
};

export default MetricDashboard;

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 28,
    paddingTop: 6,
    paddingBottom: 16,
  },

  /* primary distance */
  primaryRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    marginBottom: 16,
  },
  primaryValue: {
    fontFamily: FONT.extraBold,
    fontSize: 68,
    letterSpacing: -3,
    color: '#0B0F13',
    lineHeight: 74,
    fontVariant: ['tabular-nums'],
  },
  primaryUnit: {
    fontFamily: FONT.bold,
    fontSize: 22,
    color: '#6B6F76',
    marginLeft: 6,
    marginBottom: 8,
    letterSpacing: 1,
  },

  /* three-up secondary row */
  secondaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontFamily: FONT.extraBold,
    fontSize: 22,
    color: '#0B0F13',
    letterSpacing: -0.5,
    fontVariant: ['tabular-nums'],
  },
  statLabel: {
    fontFamily: FONT.bold,
    fontSize: 9,
    color: '#9AA0A6',
    letterSpacing: 1.4,
    marginTop: 5,
    textTransform: 'uppercase',
  },
  divider: {
    width: 1,
    height: 36,
    backgroundColor: 'rgba(11,15,19,0.08)',
  },

  /* friends watching */
  watchingChip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    marginTop: 14,
  },
  watchingText: {
    fontFamily: FONT.semibold,
    fontSize: 12,
    color: '#24C789',
    letterSpacing: 0.2,
  },
});

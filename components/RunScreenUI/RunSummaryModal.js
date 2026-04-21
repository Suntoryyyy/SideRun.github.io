import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Dimensions,
  Platform,
  ScrollView,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { formatDuration } from '../../utils/timeUtils';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import ThreeRings from '../ThreeRings';
import Sparkline from '../Sparkline';
import { T, FONT } from '../../constants/typography';

const { width } = Dimensions.get('window');

// Targets used to fill the three rings.
const DISTANCE_TARGET_KM = 5;   // "close the distance ring" = 5 km
const DURATION_TARGET_SEC = 1800; // 30 min
const PACE_FLOOR = 8;  // min/km – slowest considered (0%)
const PACE_CEIL = 4;   // min/km – fastest considered (100%)

const RunSummaryModal = ({ durationInSeconds, runData, currentSpeed, closeRun }) => {
  const distanceKm = Number(runData?.distance || 0);
  const duration = Number(durationInSeconds || 0);
  const paceMinPerKm =
    distanceKm > 0 ? duration / 60 / distanceKm : PACE_FLOOR;
  const kcal = Math.round(distanceKm * 62); // rough, ~62 kcal/km average

  const distProgress = Math.min(1, distanceKm / DISTANCE_TARGET_KM);
  const durProgress = Math.min(1, duration / DURATION_TARGET_SEC);
  const paceProgress = Math.min(
    1,
    Math.max(0, (PACE_FLOOR - paceMinPerKm) / (PACE_FLOOR - PACE_CEIL))
  );

  const formatPace = (minPerKm) => {
    if (!isFinite(minPerKm) || minPerKm <= 0) return '—';
    const m = Math.floor(minPerKm);
    const s = Math.round((minPerKm - m) * 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Synthetic per-km splits data for sparkline (in absence of real splits).
  const splitCount = Math.max(1, Math.ceil(distanceKm));
  const splits = Array.from({ length: splitCount }, (_, i) => {
    const wobble = (Math.sin(i * 1.7) + 1) * 0.25;
    return paceMinPerKm + (wobble - 0.25);
  });

  const isPB = distanceKm >= DISTANCE_TARGET_KM;

  return (
    <Modal visible={true} transparent animationType="slide">
      <BlurView intensity={90} tint="dark" style={styles.blurContainer}>
        <View style={styles.card}>
          <ScrollView
            contentContainerStyle={styles.scroll}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.pillRow}>
              {isPB ? (
                <View style={styles.pillPB}>
                  <Ionicons name="star" size={11} color="#0B0F13" />
                  <Text style={styles.pillPBText}>NEW 5K PB</Text>
                </View>
              ) : (
                <View style={styles.pillNeutral}>
                  <Text style={styles.pillNeutralText}>RUN COMPLETED</Text>
                </View>
              )}
              <View style={styles.pillGhost}>
                <Text style={styles.pillGhostText}>
                  {new Date().toLocaleDateString(undefined, {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                  })}
                </Text>
              </View>
            </View>

            <View style={styles.ringsWrap}>
              <ThreeRings
                size={170}
                stroke={13}
                gap={3}
                rings={[
                  { progress: distProgress, color: '#FF5A36' },
                  { progress: paceProgress, color: '#8AE676' },
                  { progress: durProgress, color: '#00C2FF' },
                ]}
              />
              <View style={styles.ringsCenter} pointerEvents="none">
                <Text style={styles.ringsPct}>
                  {Math.round(distProgress * 100)}%
                </Text>
                <Text style={styles.ringsCenterLabel}>DISTANCE</Text>
              </View>
            </View>

            <View style={styles.metricRow}>
              <Text style={styles.metricNum}>{distanceKm.toFixed(2)}</Text>
              <Text style={styles.metricUnit}>km</Text>
            </View>
            <Text style={styles.metricCaption}>
              {isPB ? 'Great run — you closed the 5K ring.' : 'Run logged — keep the streak.'}
            </Text>

            <View style={styles.statsGrid}>
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>TIME</Text>
                <Text style={styles.statValue}>{formatDuration(duration)}</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>AVG PACE</Text>
                <Text style={styles.statValue}>
                  {formatPace(paceMinPerKm)}
                  <Text style={styles.statUnit}> /km</Text>
                </Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>SPEED</Text>
                <Text style={styles.statValue}>
                  {currentSpeed || '0.0'}
                  <Text style={styles.statUnit}> m/s</Text>
                </Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>KCAL</Text>
                <Text style={styles.statValue}>{kcal}</Text>
              </View>
            </View>

            <View style={styles.splitsWrap}>
              <View style={styles.splitsHeader}>
                <Text style={styles.splitsTitle}>PER-KM PACE</Text>
                <Text style={styles.splitsHint}>
                  {splitCount} split{splitCount > 1 ? 's' : ''}
                </Text>
              </View>
              <Sparkline
                data={splits.map((p) => -p)}
                width={width * 0.85 - 48}
                height={36}
                color="#8AE676"
                fillOpacity={0.16}
                highlightLast
                strokeWidth={2}
              />
            </View>

            <View style={styles.actionsRow}>
              <TouchableOpacity
                style={styles.ghostBtn}
                activeOpacity={0.8}
                onPress={() => {
                  if (Platform.OS !== 'web') {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }
                }}
              >
                <Ionicons name="share-outline" size={18} color="#FFF" />
                <Text style={styles.ghostBtnText}>Share</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.doneButton}
                activeOpacity={0.8}
                onPress={() => {
                  if (Platform.OS !== 'web') {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  }
                  closeRun();
                }}
              >
                <Text style={styles.doneButtonText}>Done</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </BlurView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  blurContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  card: {
    width: width * 0.88,
    maxHeight: '86%',
    backgroundColor: '#0B0F13',
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 10,
    overflow: 'hidden',
  },
  scroll: {
    padding: 24,
    alignItems: 'center',
  },
  pillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 18,
    alignSelf: 'stretch',
    justifyContent: 'space-between',
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
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  pillNeutralText: {
    ...T.label,
    fontSize: 10,
    color: '#FFFFFF',
  },
  pillGhost: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  pillGhostText: {
    ...T.label,
    fontSize: 10,
  },
  ringsWrap: {
    width: 170,
    height: 170,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  ringsCenter: {
    position: 'absolute',
    alignItems: 'center',
  },
  ringsPct: {
    fontFamily: FONT.extraBold,
    fontSize: 28,
    color: '#FFFFFF',
    letterSpacing: -1,
    fontVariant: ['tabular-nums'],
  },
  ringsCenterLabel: {
    ...T.label,
    fontSize: 9,
    letterSpacing: 1.5,
    marginTop: 2,
  },
  metricRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 14,
  },
  metricNum: {
    ...T.displayL,
    color: '#FFFFFF',
  },
  metricUnit: {
    fontFamily: FONT.semibold,
    fontSize: 20,
    color: '#9AA0A6',
    marginLeft: 4,
  },
  metricCaption: {
    fontFamily: FONT.semibold,
    fontSize: 13,
    color: '#9AA0A6',
    marginTop: 4,
    marginBottom: 18,
    textAlign: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignSelf: 'stretch',
    justifyContent: 'space-between',
    paddingTop: 14,
    paddingBottom: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  statBox: {
    width: '48%',
    marginBottom: 14,
  },
  statLabel: {
    ...T.label,
    marginBottom: 4,
  },
  statValue: {
    ...T.metricL,
    fontSize: 20,
    color: '#FFFFFF',
  },
  statUnit: {
    ...T.metricUnit,
    color: '#9AA0A6',
  },
  splitsWrap: {
    alignSelf: 'stretch',
    paddingTop: 12,
    paddingBottom: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  splitsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  splitsTitle: {
    ...T.label,
  },
  splitsHint: {
    ...T.caption,
    fontFamily: FONT.semibold,
    fontSize: 10,
  },
  actionsRow: {
    flexDirection: 'row',
    alignSelf: 'stretch',
    gap: 12,
    marginTop: 16,
  },
  ghostBtn: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    height: 54,
    borderRadius: 27,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    backgroundColor: 'rgba(255,255,255,0.04)',
    gap: 6,
  },
  ghostBtnText: {
    fontFamily: FONT.bold,
    fontSize: 15,
    color: '#FFFFFF',
  },
  doneButton: {
    flex: 1.3,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#24C789',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#24C789',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 14,
    elevation: 6,
  },
  doneButtonText: {
    ...T.button,
    fontSize: 17,
    letterSpacing: 0.5,
  },
});

export default RunSummaryModal;

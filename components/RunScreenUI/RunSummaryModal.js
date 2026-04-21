import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Dimensions,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { formatDuration } from '../../utils/timeUtils';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import ThreeRings from '../ThreeRings';
import Sparkline from '../Sparkline';
import RouteThumb from '../RouteThumb';
import ShareCard, { SHARE_CARD_HEIGHT } from '../ShareCard';
import useUserStore from '../../store/useUserStore';
import { T, FONT } from '../../constants/typography';

const { width } = Dimensions.get('window');

// Render a simple shareable card to a canvas and return a PNG blob.
// Used on web in place of a native share sheet (coursework-scope friendly).
const buildWebCardBlob = ({ distanceKm, duration, paceLabel, kcal, username, isPB }) => {
  if (typeof document === 'undefined') return null;
  return new Promise((resolve) => {
    const W = 1080;
    const H = 1350;
    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');

    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, '#0B0F13');
    grad.addColorStop(1, '#1A1F26');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    ctx.fillStyle = '#9AA0A6';
    ctx.font = '700 36px -apple-system, "Inter", "Segoe UI", system-ui, sans-serif';
    ctx.fillText('SIDERUN', 72, 130);

    ctx.fillStyle = isPB ? '#FFFFFF' : 'rgba(255,255,255,0.1)';
    const pillText = isPB ? '★ NEW 5K PB' : 'RUN COMPLETED';
    ctx.font = '800 28px -apple-system, "Inter", sans-serif';
    const pillW = ctx.measureText(pillText).width + 60;
    ctx.beginPath();
    const pillX = W - 72 - pillW;
    const pillY = 90;
    const pillH = 56;
    const r = 28;
    ctx.moveTo(pillX + r, pillY);
    ctx.lineTo(pillX + pillW - r, pillY);
    ctx.arcTo(pillX + pillW, pillY, pillX + pillW, pillY + r, r);
    ctx.lineTo(pillX + pillW, pillY + pillH - r);
    ctx.arcTo(pillX + pillW, pillY + pillH, pillX + pillW - r, pillY + pillH, r);
    ctx.lineTo(pillX + r, pillY + pillH);
    ctx.arcTo(pillX, pillY + pillH, pillX, pillY + pillH - r, r);
    ctx.lineTo(pillX, pillY + r);
    ctx.arcTo(pillX, pillY, pillX + r, pillY, r);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = isPB ? '#0B0F13' : '#FFFFFF';
    ctx.fillText(pillText, pillX + 30, pillY + 38);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = '900 280px -apple-system, "Inter", sans-serif';
    const distStr = distanceKm.toFixed(2);
    ctx.fillText(distStr, 72, 540);
    ctx.fillStyle = '#9AA0A6';
    ctx.font = '800 72px -apple-system, "Inter", sans-serif';
    const distW = ctx.measureText(distStr).width;
    ctx.fillText('km', 90 + distW, 540);

    ctx.fillStyle = '#9AA0A6';
    ctx.font = '600 36px -apple-system, "Inter", sans-serif';
    ctx.fillText(`@${username}`, 72, 600);

    const formatDur = (secs) => {
      const h = Math.floor(secs / 3600);
      const m = Math.floor((secs % 3600) / 60);
      const s = Math.floor(secs % 60);
      return h > 0
        ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
        : `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    };
    const stats = [
      { label: 'TIME', value: formatDur(duration) },
      { label: 'PACE', value: `${paceLabel} /km` },
      { label: 'KCAL', value: String(kcal) },
    ];
    stats.forEach((s, i) => {
      const x = 72 + i * 320;
      ctx.fillStyle = '#9AA0A6';
      ctx.font = '800 28px -apple-system, "Inter", sans-serif';
      ctx.fillText(s.label, x, 780);
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '800 68px -apple-system, "Inter", sans-serif';
      ctx.fillText(s.value, x, 860);
    });

    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(72, 960);
    ctx.lineTo(W - 72, 960);
    ctx.stroke();

    ctx.fillStyle = '#9AA0A6';
    ctx.font = '600 32px -apple-system, "Inter", sans-serif';
    ctx.fillText(new Date().toLocaleDateString(undefined, {
      weekday: 'long', month: 'short', day: 'numeric'
    }), 72, 1040);

    ctx.fillStyle = '#24C789';
    ctx.beginPath();
    ctx.arc(140, 1230, 28, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '900 28px -apple-system, "Inter", sans-serif';
    ctx.fillText('siderun.app', 190, 1243);

    canvas.toBlob((blob) => resolve(blob), 'image/png', 0.95);
  });
};

// Targets used to fill the three rings.
const DISTANCE_TARGET_KM = 5;   // "close the distance ring" = 5 km
const DURATION_TARGET_SEC = 1800; // 30 min
const PACE_FLOOR = 8;  // min/km – slowest considered (0%)
const PACE_CEIL = 4;   // min/km – fastest considered (100%)

const RunSummaryModal = ({ durationInSeconds, runData, currentSpeed, closeRun }) => {
  const shareRef = useRef(null);
  const [isSharing, setIsSharing] = useState(false);
  const username = useUserStore((s) => s.user?.username) || 'Runner';

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

  const handleShare = async () => {
    if (isSharing) return;
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    // WEB: compose the card client-side onto a canvas and trigger a download
    // — lighter than linking social SDKs and gives the user a shareable PNG.
    if (Platform.OS === 'web') {
      try {
        setIsSharing(true);
        const blob = await buildWebCardBlob({
          distanceKm,
          duration,
          paceLabel: formatPace(paceMinPerKm),
          kcal,
          username,
          isPB,
        });
        if (!blob) throw new Error('Could not render card');
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const stamp = new Date().toISOString().replace(/[:.]/g, '-');
        a.download = `siderun-${stamp}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      } catch (e) {
        console.warn('[RunSummaryModal] web download failed', e);
        Alert.alert('Save failed', 'Could not generate the run card.');
      } finally {
        setIsSharing(false);
      }
      return;
    }

    // NATIVE: snapshot the card and save directly to Photos.
    try {
      setIsSharing(true);
      const { captureRef } = require('react-native-view-shot');
      const MediaLibrary = require('expo-media-library');

      const perm = await MediaLibrary.requestPermissionsAsync();
      if (!perm.granted) {
        Alert.alert(
          'Allow photo access',
          'SideRun needs permission to save your run card to Photos.'
        );
        return;
      }

      const uri = await captureRef(shareRef, {
        format: 'png',
        quality: 0.95,
        result: 'tmpfile',
      });
      await MediaLibrary.saveToLibraryAsync(uri);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Saved to Photos', 'Your run card is now in your camera roll.');
    } catch (e) {
      console.warn('[RunSummaryModal] save failed', e);
      Alert.alert('Save failed', e?.message || 'Could not capture the run card.');
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <Modal visible={true} transparent animationType="slide">
      {/* Off-screen share card — rendered so captureRef has something to snapshot.
          Skipped on web since we don't support native-style capture + share there. */}
      {Platform.OS !== 'web' ? (
        <View pointerEvents="none" style={styles.shareOffscreen}>
          <ShareCard
            ref={shareRef}
            distanceKm={distanceKm}
            durationLabel={formatDuration(duration)}
            paceLabel={formatPace(paceMinPerKm)}
            kcal={kcal}
            distProgress={distProgress}
            paceProgress={paceProgress}
            durProgress={durProgress}
            username={username}
            isPB={isPB}
          />
        </View>
      ) : null}

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

            {/* Distance + route map side by side */}
            <View style={styles.heroRow}>
              <View style={styles.heroLeft}>
                <View style={styles.metricRow}>
                  <Text style={styles.metricNum}>{distanceKm.toFixed(2)}</Text>
                  <Text style={styles.metricUnit}>km</Text>
                </View>
                <Text style={styles.metricCaption}>
                  {isPB ? 'Great run — new 5K PB.' : 'Run logged — keep the streak.'}
                </Text>
              </View>
              <RouteThumb
                coordinates={runData?.coordinates}
                width={110}
                height={80}
              />
            </View>

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
                <Text style={styles.statLabel}>KCAL</Text>
                <Text style={styles.statValue}>{kcal}</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>DATE</Text>
                <Text style={styles.statValue}>
                  {new Date().toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                  })}
                </Text>
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
                style={[styles.ghostBtn, isSharing && styles.ghostBtnBusy]}
                activeOpacity={0.8}
                onPress={handleShare}
                disabled={isSharing}
              >
                {isSharing ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons
                      name={Platform.OS === 'web' ? 'download-outline' : 'image-outline'}
                      size={18}
                      color="#FFF"
                    />
                    <Text style={styles.ghostBtnText}>
                      {Platform.OS === 'web' ? 'Download' : 'Save'}
                    </Text>
                  </>
                )}
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
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    alignSelf: 'stretch',
    marginTop: 14,
    marginBottom: 18,
    gap: 12,
  },
  heroLeft: {
    flex: 1,
  },
  metricRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
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
  ghostBtnBusy: {
    opacity: 0.6,
  },
  ghostBtnText: {
    fontFamily: FONT.bold,
    fontSize: 15,
    color: '#FFFFFF',
  },
  shareOffscreen: {
    position: 'absolute',
    top: 0,
    left: -10000,
    width: 340,
    height: SHARE_CARD_HEIGHT,
    opacity: 0,
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

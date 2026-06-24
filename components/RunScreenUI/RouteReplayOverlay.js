/**
 * RouteReplayOverlay — brief route redraw before navigating to Home.
 * Honors Reduce Motion (instant full path, shorter hold).
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Dimensions, StyleSheet, View, Text } from 'react-native';
import RouteArt from '../RouteArt';
import useReducedMotion from '../../hooks/useReducedMotion';
import { FONT } from '../../constants/typography';

const { width, height } = Dimensions.get('window');

export default function RouteReplayOverlay({ coordinates, distanceKm, onComplete }) {
  const reduced = useReducedMotion();
  const progress = useRef(new Animated.Value(reduced ? 1 : 0)).current;
  const fade = useRef(new Animated.Value(0)).current;
  const [drawProgress, setDrawProgress] = useState(reduced ? 1 : 0);

  const previewW = Math.min(width * 0.82, 360);
  const previewH = Math.round(previewW * 0.55);

  useEffect(() => {
    const listener = progress.addListener(({ value }) => setDrawProgress(value));
    Animated.timing(fade, {
      toValue: 1,
      duration: reduced ? 0 : 220,
      useNativeDriver: true,
    }).start();

    if (reduced) {
      const t = setTimeout(() => onComplete?.(), 400);
      return () => clearTimeout(t);
    }

    Animated.timing(progress, {
      toValue: 1,
      duration: 1200,
      useNativeDriver: false,
    }).start(() => {
      setTimeout(() => onComplete?.(), 280);
    });

    return () => progress.removeListener(listener);
  }, [reduced]);

  const label = useMemo(
    () => (distanceKm != null ? `${Number(distanceKm).toFixed(2)} km saved` : 'Run saved'),
    [distanceKm]
  );

  return (
    <Animated.View style={[styles.overlay, { opacity: fade }]} pointerEvents="none">
      <View style={styles.card}>
        <Text style={styles.label}>{label}</Text>
        <RouteArt
          coordinates={coordinates}
          width={previewW}
          height={previewH}
          variant="hero"
          strokeColor="#24C789"
          drawProgress={drawProgress}
        />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(11,15,19,0.72)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 3000,
  },
  card: {
    alignItems: 'center',
    gap: 14,
  },
  label: {
    fontFamily: FONT.bold,
    fontSize: 13,
    letterSpacing: 1.2,
    color: 'rgba(255,255,255,0.85)',
    textTransform: 'uppercase',
  },
});

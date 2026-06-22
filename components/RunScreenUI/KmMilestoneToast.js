/**
 * KmMilestoneToast — brief pop when the runner crosses a full kilometer.
 * Glanceable: big km number + split pace. Honors Reduce Motion.
 */
import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import useReducedMotion from '../../hooks/useReducedMotion';
import CelebrationPulse from '../CelebrationPulse';
import { FONT } from '../../constants/typography';

const formatPace = (minPerKm) => {
  if (!isFinite(minPerKm) || minPerKm <= 0) return '—';
  const m = Math.floor(minPerKm);
  const s = Math.round((minPerKm - m) * 60);
  return `${m}:${s < 10 ? '0' : ''}${s} /km`;
};

export default function KmMilestoneToast({ milestone, onDone }) {
  const reduced = useReducedMotion();
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(reduced ? 1 : 0.82)).current;
  const slide = useRef(new Animated.Value(reduced ? 0 : 12)).current;

  useEffect(() => {
    if (!milestone) return undefined;

    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } catch (_) {}
    }

    if (reduced) {
      opacity.setValue(1);
      const t = setTimeout(() => onDone?.(), 1600);
      return () => clearTimeout(t);
    }

    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 220,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        tension: 140,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.timing(slide, {
        toValue: 0,
        duration: 260,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();

    const hold = setTimeout(() => {
      Animated.timing(opacity, {
        toValue: 0,
        duration: 350,
        useNativeDriver: true,
      }).start(() => onDone?.());
    }, 1800);

    return () => clearTimeout(hold);
  }, [milestone?.id]);

  if (!milestone) return null;

  return (
    <View pointerEvents="none" style={styles.wrap}>
      <Animated.View
        style={[
          styles.toast,
          { opacity, transform: [{ scale }, { translateY: slide }] },
        ]}
      >
        {!reduced && <CelebrationPulse size={100} color="#24C789" rings={1} duration={800} />}
        <Text style={styles.kmLabel}>KM {milestone.km}</Text>
        <Text style={styles.pace}>{formatPace(milestone.paceMinPerKm)}</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    top: '28%',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 2000,
  },
  toast: {
    minWidth: 140,
    paddingHorizontal: 22,
    paddingVertical: 16,
    borderRadius: 22,
    backgroundColor: 'rgba(11,15,19,0.88)',
    borderWidth: 1,
    borderColor: 'rgba(36,199,137,0.35)',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  kmLabel: {
    fontFamily: FONT.black,
    fontSize: 28,
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  pace: {
    fontFamily: FONT.bold,
    fontSize: 13,
    color: '#24C789',
    marginTop: 4,
    letterSpacing: 0.3,
  },
});

/**
 * FloatingCheer — the in-run "cheer" reaction animation (shared web + native).
 *
 * Replaces the old duplicated FloatingEmoji. A cheer now:
 *   • pops in with a spring overshoot,
 *   • rises while drifting along a gentle curve with a little rotation wobble,
 *   • emits a single accent "impact ring" at spawn (plain emoji only),
 *   • fades out near the top,
 *   • can show an ×N combo badge + scale up when several of the same arrive.
 *
 * Honors Reduce Motion: falls back to an in-place fade with no travel.
 * Supports emoji, a short text bubble, or an image (photo cheer).
 */
import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, StyleSheet, View, Text } from 'react-native';
import { Image } from 'expo-image';
import useReducedMotion from '../../hooks/useReducedMotion';

const isImageCheer = (e) =>
  typeof e === 'string' &&
  (e.startsWith('data:image') || e.startsWith('file:') || e.startsWith('http'));

export default function FloatingCheer({ emoji, count = 1, onComplete }) {
  const reduced = useReducedMotion();
  const t = useRef(new Animated.Value(0)).current;
  const pop = useRef(new Animated.Value(0)).current;

  const isImg = isImageCheer(emoji);
  const isText = typeof emoji === 'string' && emoji.length > 2 && !isImg;
  const isPlainEmoji = !isImg && !isText;

  const r = useMemo(
    () => ({
      startX: (Math.random() - 0.5) * 90,
      sway: (Math.random() - 0.5) * 46,
      driftX: (Math.random() - 0.5) * 110,
      rot: (Math.random() - 0.5) * 22,
      rise: 360 + Math.random() * 120,
      dur: 2200 + Math.random() * 700,
    }),
    []
  );

  const comboScale = 1 + Math.min(Math.max(count - 1, 0), 4) * 0.12;

  useEffect(() => {
    if (reduced) {
      pop.setValue(1);
      Animated.sequence([
        Animated.timing(t, { toValue: 0.12, duration: 200, useNativeDriver: true }),
        Animated.delay(1000),
        Animated.timing(t, { toValue: 1, duration: 400, useNativeDriver: true }),
      ]).start(() => onComplete && onComplete());
      return undefined;
    }
    Animated.spring(pop, {
      toValue: 1,
      tension: 150,
      friction: 6,
      useNativeDriver: true,
    }).start();
    const rise = Animated.timing(t, {
      toValue: 1,
      duration: r.dur,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    });
    rise.start(() => onComplete && onComplete());
    return () => rise.stop();
  }, [reduced]);

  const opacity = t.interpolate({
    inputRange: [0, 0.1, 0.7, 1],
    outputRange: [0, 1, 1, 0],
  });
  const translateY = reduced
    ? 0
    : t.interpolate({ inputRange: [0, 1], outputRange: [0, -r.rise] });
  const translateX = reduced
    ? r.startX
    : t.interpolate({
        inputRange: [0, 0.5, 1],
        outputRange: [r.startX, r.startX + r.sway, r.startX + r.driftX],
      });
  const rotate = reduced
    ? '0deg'
    : t.interpolate({ inputRange: [0, 1], outputRange: ['0deg', `${r.rot}deg`] });
  const scale = pop.interpolate({
    inputRange: [0, 1],
    outputRange: [0.4 * comboScale, comboScale],
  });

  // Impact ring (spawn flash) — plain emoji only, skipped under Reduce Motion.
  const ringOpacity = t.interpolate({
    inputRange: [0, 0.05, 0.26],
    outputRange: [0, 0.5, 0],
    extrapolate: 'clamp',
  });
  const ringScale = t.interpolate({
    inputRange: [0, 0.26],
    outputRange: [0.4, 1.6],
    extrapolate: 'clamp',
  });

  return (
    <View pointerEvents="none" style={styles.anchor}>
      <Animated.View
        style={[
          styles.item,
          { opacity, transform: [{ translateX }, { translateY }, { rotate }, { scale }] },
        ]}
      >
        {isPlainEmoji && !reduced && (
          <Animated.View
            style={[
              styles.ring,
              { opacity: ringOpacity, transform: [{ scale: ringScale }] },
            ]}
          />
        )}

        {isImg ? (
          <Image source={{ uri: emoji }} style={styles.img} contentFit="cover" />
        ) : isText ? (
          <View style={styles.bubble}>
            <Text style={styles.bubbleText}>{emoji}</Text>
          </View>
        ) : (
          <Text style={styles.emoji}>{emoji}</Text>
        )}

        {count > 1 && isPlainEmoji && (
          <View style={styles.combo}>
            <Text style={styles.comboText}>×{count}</Text>
          </View>
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  anchor: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 150,
    alignItems: 'center',
    zIndex: 1500,
  },
  item: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    fontSize: 54,
  },
  ring: {
    position: 'absolute',
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: '#24C789',
  },
  img: {
    width: 80,
    height: 80,
    borderRadius: 12,
    borderWidth: 3,
    borderColor: '#24C789',
    backgroundColor: '#fff',
  },
  bubble: {
    backgroundColor: 'rgba(36,199,137,0.95)',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 20,
    maxWidth: 240,
  },
  bubbleText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  combo: {
    position: 'absolute',
    top: -8,
    right: -16,
    backgroundColor: '#0B0F13',
    borderRadius: 11,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderWidth: 1.5,
    borderColor: '#fff',
  },
  comboText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
  },
});

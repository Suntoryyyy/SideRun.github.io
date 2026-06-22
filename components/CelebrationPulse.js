/**
 * CelebrationPulse — a one-time, tasteful "you hit a milestone" flourish.
 *
 * Renders a couple of accent rings that expand and fade out exactly once on
 * mount (no looping, no confetti — PRODUCT.md: delight is earned at specific
 * moments, never sprayed everywhere). Renders nothing under Reduce Motion.
 *
 * Drop it as an absolutely-centered sibling behind the element you want to
 * celebrate (e.g. the finished-run distance number).
 */
import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import useReducedMotion from '../hooks/useReducedMotion';

export default function CelebrationPulse({
  size = 160,
  color = '#24C789',
  rings = 2,
  duration = 1100,
  delay = 120,
  style,
}) {
  const reduced = useReducedMotion();
  const vals = useRef(
    Array.from({ length: rings }, () => new Animated.Value(0))
  ).current;

  useEffect(() => {
    if (reduced) return undefined;
    const anims = vals.map((v, i) =>
      Animated.timing(v, {
        toValue: 1,
        duration,
        delay: delay + i * 220,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      })
    );
    anims.forEach((a) => a.start());
    return () => anims.forEach((a) => a.stop());
  }, [reduced, vals, duration, delay]);

  if (reduced) return null;

  return (
    <View pointerEvents="none" style={[styles.wrap, style]}>
      {vals.map((v, i) => (
        <Animated.View
          key={i}
          style={[
            styles.ring,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              borderColor: color,
              opacity: v.interpolate({
                inputRange: [0, 0.15, 1],
                outputRange: [0, 0.45, 0],
              }),
              transform: [
                {
                  scale: v.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.3, 1.4],
                  }),
                },
              ],
            },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    position: 'absolute',
    borderWidth: 2,
  },
});

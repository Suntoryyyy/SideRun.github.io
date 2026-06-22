/**
 * FloatingCheer — the in-run "cheer" reaction animation (shared web + native).
 *
 * Rapid repeats of the same emoji merge into ×N combos. Higher tiers (×5, ×10+)
 * earn stronger but restrained celebration: tier label, accent rings, pulse.
 * Honors Reduce Motion throughout.
 */
import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, StyleSheet, View, Text } from 'react-native';
import { Image } from 'expo-image';
import useReducedMotion from '../../hooks/useReducedMotion';
import CelebrationPulse from '../CelebrationPulse';
import { getComboTier } from '../../constants/cheerCombo';

const isImageCheer = (e) =>
  typeof e === 'string' &&
  (e.startsWith('data:image') || e.startsWith('file:') || e.startsWith('http'));

export default function FloatingCheer({ emoji, count = 1, onComplete }) {
  const reduced = useReducedMotion();
  const t = useRef(new Animated.Value(0)).current;
  const pop = useRef(new Animated.Value(0)).current;
  const tierPop = useRef(new Animated.Value(0)).current;

  const isImg = isImageCheer(emoji);
  const isText = typeof emoji === 'string' && emoji.length > 2 && !isImg;
  const isPlainEmoji = !isImg && !isText;

  const tier = getComboTier(count);
  const isHighTier = tier.key === 'hot' || tier.key === 'legendary';

  const r = useMemo(
    () => ({
      startX: (Math.random() - 0.5) * 90,
      sway: (Math.random() - 0.5) * 46,
      driftX: (Math.random() - 0.5) * 110,
      rot: (Math.random() - 0.5) * (isHighTier ? 32 : 22),
      rise: (isHighTier ? 420 : 360) + Math.random() * 120,
      dur: (isHighTier ? 2800 : 2200) + Math.random() * 700,
    }),
    [isHighTier]
  );

  const comboScale = tier.scale + Math.min(Math.max(count - tier.min, 0), 3) * 0.04;

  useEffect(() => {
    if (reduced) {
      pop.setValue(1);
      tierPop.setValue(1);
      Animated.sequence([
        Animated.timing(t, { toValue: 0.12, duration: 200, useNativeDriver: true }),
        Animated.delay(isHighTier ? 1400 : 1000),
        Animated.timing(t, { toValue: 1, duration: 400, useNativeDriver: true }),
      ]).start(() => onComplete && onComplete());
      return undefined;
    }
    Animated.spring(pop, {
      toValue: 1,
      tension: isHighTier ? 170 : 150,
      friction: isHighTier ? 5 : 6,
      useNativeDriver: true,
    }).start();
    if (isHighTier) {
      Animated.spring(tierPop, {
        toValue: 1,
        delay: 80,
        tension: 140,
        friction: 7,
        useNativeDriver: true,
      }).start();
    }
    const rise = Animated.timing(t, {
      toValue: 1,
      duration: r.dur,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    });
    rise.start(() => onComplete && onComplete());
    return () => rise.stop();
  }, [reduced, isHighTier]);

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
    outputRange: [0.35 * comboScale, comboScale],
  });
  const tierScale = tierPop.interpolate({
    inputRange: [0, 1],
    outputRange: [0.6, 1],
  });
  const tierOpacity = tierPop.interpolate({
    inputRange: [0, 0.2, 0.85, 1],
    outputRange: [0, 1, 1, 0.6],
  });

  const ringOpacity = t.interpolate({
    inputRange: [0, 0.05, 0.26],
    outputRange: [0, isHighTier ? 0.65 : 0.5, 0],
    extrapolate: 'clamp',
  });
  const ringScale = t.interpolate({
    inputRange: [0, 0.26],
    outputRange: [0.4, isHighTier ? 2 : 1.6],
    extrapolate: 'clamp',
  });

  const emojiSize = isHighTier ? 62 : 54;

  return (
    <View pointerEvents="none" style={styles.anchor}>
      <Animated.View
        style={[
          styles.item,
          { opacity, transform: [{ translateX }, { translateY }, { rotate }, { scale }] },
        ]}
      >
        {isPlainEmoji && tier.key === 'legendary' && !reduced && (
          <CelebrationPulse size={120} color={tier.ringColor} rings={2} duration={900} />
        )}

        {isPlainEmoji && !reduced &&
          Array.from({ length: tier.rings }).map((_, i) => (
            <Animated.View
              key={`ring-${i}`}
              style={[
                styles.ring,
                {
                  width: 64 + i * 14,
                  height: 64 + i * 14,
                  borderRadius: (64 + i * 14) / 2,
                  borderColor: tier.ringColor,
                  opacity: ringOpacity,
                  transform: [{ scale: ringScale }],
                },
              ]}
            />
          ))}

        {isHighTier && tier.label && (
          <Animated.View
            style={[
              styles.tierBanner,
              {
                backgroundColor: tier.ringColor,
                opacity: tierOpacity,
                transform: [{ scale: tierScale }],
              },
            ]}
          >
            <Text style={styles.tierText}>{tier.label.toUpperCase()}</Text>
          </Animated.View>
        )}

        {isImg ? (
          <Image source={{ uri: emoji }} style={styles.img} contentFit="cover" />
        ) : isText ? (
          <View style={styles.bubble}>
            <Text style={styles.bubbleText}>{emoji}</Text>
          </View>
        ) : (
          <Text style={[styles.emoji, { fontSize: emojiSize }]}>{emoji}</Text>
        )}

        {count > 1 && isPlainEmoji && (
          <View
            style={[
              styles.combo,
              isHighTier && { backgroundColor: tier.ringColor, borderColor: '#0B0F13' },
            ]}
          >
            <Text style={[styles.comboText, isHighTier && { color: '#0B0F13' }]}>
              ×{count}
            </Text>
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
    borderWidth: 2,
  },
  tierBanner: {
    position: 'absolute',
    top: -36,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
    zIndex: 2,
  },
  tierText: {
    color: '#0B0F13',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.2,
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

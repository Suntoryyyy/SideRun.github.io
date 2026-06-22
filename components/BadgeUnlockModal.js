/**
 * BadgeUnlockModal — one-time celebration when a badge is earned.
 * Restrained flourish per PRODUCT.md: pulse ring + icon pop + haptic.
 */
import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Animated,
  Platform,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { BlurView } from 'expo-blur';
import BouncyButton from './BouncyButton';
import CelebrationPulse from './CelebrationPulse';
import useReducedMotion from '../hooks/useReducedMotion';
import { getBadgeMeta } from '../constants/badges';
import { FONT, T } from '../constants/typography';

const { width } = Dimensions.get('window');

export default function BadgeUnlockModal({ badgeId, onDismiss }) {
  const reduced = useReducedMotion();
  const badge = getBadgeMeta(badgeId);
  const scale = useRef(new Animated.Value(reduced ? 1 : 0.7)).current;
  const fade = useRef(new Animated.Value(reduced ? 1 : 0)).current;

  useEffect(() => {
    if (Platform.OS !== 'web') {
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch (_) {}
    }
    if (reduced) return;
    Animated.parallel([
      Animated.spring(scale, {
        toValue: 1,
        tension: 120,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.timing(fade, {
        toValue: 1,
        duration: 280,
        useNativeDriver: true,
      }),
    ]).start();
  }, [reduced]);

  if (!badgeId) return null;

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onDismiss}>
      <BlurView intensity={85} tint="dark" style={styles.backdrop}>
        <Animated.View style={[styles.card, { opacity: fade }]}>
          <Text style={styles.eyebrow}>Badge unlocked</Text>

          <View style={styles.iconWrap}>
            <CelebrationPulse size={130} color={badge.color} rings={2} />
            <Animated.View
              style={[
                styles.iconCircle,
                { backgroundColor: `${badge.color}22`, transform: [{ scale }] },
              ]}
            >
              <Ionicons name={badge.icon} size={44} color={badge.color} />
            </Animated.View>
          </View>

          <Text style={styles.name}>{badge.name}</Text>
          <Text style={styles.description}>{badge.description}</Text>
          <Text style={styles.category}>{badge.category}</Text>

          <BouncyButton style={styles.btn} activeOpacity={0.85} onPress={onDismiss}>
            <Text style={styles.btnText}>Nice!</Text>
          </BouncyButton>
        </Animated.View>
      </BlurView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.45)',
    padding: 24,
  },
  card: {
    width: width * 0.82,
    maxWidth: 340,
    backgroundColor: '#0B0F13',
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 28,
    paddingTop: 28,
    paddingBottom: 24,
    alignItems: 'center',
  },
  eyebrow: {
    ...T.label,
    fontSize: 11,
    letterSpacing: 1.6,
    color: 'rgba(255,255,255,0.55)',
    marginBottom: 20,
  },
  iconWrap: {
    width: 120,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    fontFamily: FONT.extraBold,
    fontSize: 24,
    color: '#FFFFFF',
    letterSpacing: -0.4,
    textAlign: 'center',
  },
  description: {
    fontFamily: FONT.regular,
    fontSize: 14,
    color: 'rgba(255,255,255,0.65)',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  category: {
    fontFamily: FONT.bold,
    fontSize: 10,
    letterSpacing: 1.4,
    color: 'rgba(255,255,255,0.4)',
    textTransform: 'uppercase',
    marginTop: 14,
  },
  btn: {
    marginTop: 24,
    alignSelf: 'stretch',
    height: 50,
    borderRadius: 25,
    backgroundColor: '#24C789',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: {
    ...T.button,
    fontSize: 16,
  },
});

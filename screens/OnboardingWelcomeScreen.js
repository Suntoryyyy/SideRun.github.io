import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import Svg, {
  Circle,
  Defs,
  LinearGradient,
  Stop,
  G,
} from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { T } from '../constants/typography';

const { width } = Dimensions.get('window');

export default function OnboardingWelcomeScreen({ navigation }) {
  const spin = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(spin, {
        toValue: 1,
        duration: 18000,
        useNativeDriver: true,
      })
    ).start();
  }, [spin]);

  const rotate = spin.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.root}>
      <View style={styles.topDots}>
        <View style={[styles.dot, styles.dotActive]} />
        <View style={styles.dot} />
        <View style={styles.dot} />
      </View>

      <View style={styles.heroWrap}>
        <Animated.View style={{ transform: [{ rotate }] }}>
          <Svg width={280} height={280} viewBox="0 0 280 280">
            <Defs>
              <LinearGradient id="g1" x1="0" y1="0" x2="1" y2="1">
                <Stop offset="0" stopColor="#FF5A36" />
                <Stop offset="1" stopColor="#FF8A64" />
              </LinearGradient>
              <LinearGradient id="g2" x1="0" y1="0" x2="1" y2="1">
                <Stop offset="0" stopColor="#24C789" />
                <Stop offset="1" stopColor="#8AE676" />
              </LinearGradient>
              <LinearGradient id="g3" x1="0" y1="0" x2="1" y2="1">
                <Stop offset="0" stopColor="#00C2FF" />
                <Stop offset="1" stopColor="#6AA8FF" />
              </LinearGradient>
            </Defs>
            <G>
              <Circle
                cx="140"
                cy="140"
                r="120"
                stroke="url(#g1)"
                strokeWidth="14"
                strokeLinecap="round"
                strokeDasharray="540 200"
                fill="none"
              />
              <Circle
                cx="140"
                cy="140"
                r="96"
                stroke="url(#g2)"
                strokeWidth="14"
                strokeLinecap="round"
                strokeDasharray="390 210"
                fill="none"
                transform="rotate(120 140 140)"
              />
              <Circle
                cx="140"
                cy="140"
                r="72"
                stroke="url(#g3)"
                strokeWidth="14"
                strokeLinecap="round"
                strokeDasharray="260 190"
                fill="none"
                transform="rotate(220 140 140)"
              />
            </G>
          </Svg>
        </Animated.View>
        <View style={styles.heroCenter} pointerEvents="none">
          <Ionicons name="footsteps" size={44} color="#0B0F13" />
        </View>
      </View>

      <View style={styles.textWrap}>
        <Text style={styles.eyebrow}>WELCOME TO SIDERUN</Text>
        <Text style={styles.title}>Run together,{'\n'}anywhere.</Text>
        <Text style={styles.sub}>
          Live cheers from friends, weather-smart routes, and gentle goals you'll
          actually close.
        </Text>
      </View>

      <View style={styles.ctaWrap}>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => {
            if (Platform.OS !== 'web') {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }
            navigation.navigate('OnboardingPermissions');
          }}
          style={styles.primaryBtn}
        >
          <Text style={styles.primaryBtnText}>Get started</Text>
          <Ionicons name="arrow-forward" size={18} color="#FFF" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
    paddingTop: 80,
    paddingBottom: 40,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  topDots: {
    flexDirection: 'row',
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(0,0,0,0.12)',
  },
  dotActive: {
    width: 24,
    backgroundColor: '#0B0F13',
  },
  heroWrap: {
    width: 280,
    height: 280,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroCenter: {
    position: 'absolute',
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#F4F5F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrap: {
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  eyebrow: {
    ...T.eyebrow,
    marginBottom: 10,
  },
  title: {
    ...T.title1,
    textAlign: 'center',
  },
  sub: {
    ...T.bodyMuted,
    fontSize: 15,
    textAlign: 'center',
    marginTop: 10,
    maxWidth: 320,
  },
  ctaWrap: {
    alignSelf: 'stretch',
  },
  primaryBtn: {
    flexDirection: 'row',
    backgroundColor: '#0B0F13',
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#0B0F13',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 6,
  },
  primaryBtnText: {
    ...T.button,
  },
});

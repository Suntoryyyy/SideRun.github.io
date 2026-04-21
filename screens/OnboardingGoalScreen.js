import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ProgressRing from '../components/ProgressRing';
import { T, FONT } from '../constants/typography';

const GOAL_PRESETS = [
  { km: 10, label: 'Easy', desc: 'Kickstart a habit' },
  { km: 20, label: 'Balanced', desc: 'Stay consistent' },
  { km: 30, label: 'Focused', desc: 'Build endurance' },
  { km: 50, label: 'Ambitious', desc: 'Serious miles' },
];

export const ONBOARDING_KEY = 'siderun_onboarding_done';
export const WEEKLY_GOAL_KEY = 'siderun_weekly_goal_km';

export default function OnboardingGoalScreen({ navigation, onComplete }) {
  const [selected, setSelected] = useState(20);

  const finish = async () => {
    try {
      await AsyncStorage.setItem(WEEKLY_GOAL_KEY, String(selected));
      await AsyncStorage.setItem(ONBOARDING_KEY, '1');
    } catch (e) {}
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    if (typeof onComplete === 'function') {
      onComplete();
    }
  };

  const progress = Math.min(1, selected / 50);

  return (
    <View style={styles.root}>
      <TouchableOpacity
        onPress={() => navigation.goBack()}
        hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
        style={styles.back}
      >
        <Ionicons name="arrow-back" size={24} color="#0B0F13" />
      </TouchableOpacity>

      <View style={styles.topDots}>
        <View style={styles.dot} />
        <View style={styles.dot} />
        <View style={[styles.dot, styles.dotActive]} />
      </View>

      <View style={styles.header}>
        <Text style={styles.eyebrow}>STEP 3 OF 3</Text>
        <Text style={styles.title}>Pick your weekly{'\n'}running goal.</Text>
        <Text style={styles.sub}>
          We'll surface this as your "This week" ring — close it for a streak bonus.
        </Text>
      </View>

      <View style={styles.ringWrap}>
        <ProgressRing
          size={140}
          stroke={14}
          progress={progress}
          color="#24C789"
          trackColor="rgba(0,0,0,0.06)"
          valueText={`${selected}`}
          label="KM / WEEK"
        />
      </View>

      <View style={styles.presetRow}>
        {GOAL_PRESETS.map((g) => {
          const active = g.km === selected;
          return (
            <TouchableOpacity
              key={g.km}
              onPress={() => {
                if (Platform.OS !== 'web') {
                  Haptics.selectionAsync();
                }
                setSelected(g.km);
              }}
              activeOpacity={0.85}
              style={[
                styles.preset,
                active && styles.presetActive,
              ]}
            >
              <Text
                style={[styles.presetKm, active && styles.presetKmActive]}
              >
                {g.km}
                <Text
                  style={[styles.presetKmUnit, active && styles.presetKmUnitActive]}
                >
                  {' km'}
                </Text>
              </Text>
              <Text
                style={[styles.presetLabel, active && styles.presetLabelActive]}
              >
                {g.label}
              </Text>
              <Text
                style={[styles.presetDesc, active && styles.presetDescActive]}
              >
                {g.desc}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.ctaWrap}>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={finish}
          style={styles.primaryBtn}
        >
          <Text style={styles.primaryBtnText}>Start running</Text>
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
    paddingTop: 70,
    paddingBottom: 40,
  },
  back: {
    position: 'absolute',
    left: 20,
    top: 60,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  topDots: {
    flexDirection: 'row',
    gap: 6,
    alignSelf: 'center',
    marginBottom: 24,
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
  header: {
    alignItems: 'center',
    marginBottom: 16,
  },
  eyebrow: {
    ...T.eyebrow,
    marginBottom: 10,
  },
  title: {
    ...T.title2,
    textAlign: 'center',
  },
  sub: {
    ...T.bodyMuted,
    fontSize: 13,
    textAlign: 'center',
    marginTop: 8,
    maxWidth: 320,
  },
  ringWrap: {
    alignItems: 'center',
    marginVertical: 12,
  },
  presetRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  preset: {
    width: '48%',
    padding: 14,
    borderRadius: 20,
    backgroundColor: '#F4F5F7',
    borderWidth: 1.5,
    borderColor: 'transparent',
    marginBottom: 10,
  },
  presetActive: {
    backgroundColor: '#0B0F13',
    borderColor: '#0B0F13',
  },
  presetKm: {
    ...T.metricL,
    fontSize: 20,
  },
  presetKmActive: {
    color: '#FFFFFF',
  },
  presetKmUnit: {
    fontFamily: FONT.semibold,
    fontSize: 13,
    color: '#6B6F76',
  },
  presetKmUnitActive: {
    color: '#9AA0A6',
  },
  presetLabel: {
    fontFamily: FONT.extraBold,
    fontSize: 12,
    color: '#24C789',
    marginTop: 2,
    letterSpacing: 0.5,
  },
  presetLabelActive: {
    color: '#8AE676',
  },
  presetDesc: {
    fontFamily: FONT.medium,
    fontSize: 11,
    color: '#6B6F76',
    marginTop: 2,
  },
  presetDescActive: {
    color: '#9AA0A6',
  },
  ctaWrap: {
    marginTop: 'auto',
  },
  primaryBtn: {
    flexDirection: 'row',
    height: 56,
    borderRadius: 28,
    backgroundColor: '#0B0F13',
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

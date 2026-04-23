/**
 * DemoToggle — enables/disables Demo Mode (simulated GPS) and exposes a
 * "Seed a completed run" shortcut. The seeded run shows up on HomeScreen's
 * Recent-run card and in the training-insight flow, so a whole demo can be
 * shown without waiting for a live simulation to finish.
 *
 * NOTE: Alert.alert is unreliable in web/PWA environments (browsers block
 * window.alert() in certain contexts). We use inline toast-style feedback
 * instead so the button always feels responsive.
 */
import React, { useEffect, useState } from 'react';
import { View, Text, Switch, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { DEMO_MODE_KEY, broadcastDemoMode, DEMO_ROUTE_COORDS } from '../hooks/useDemoMode';
import { FONT } from '../constants/typography';

export default function DemoToggle() {
  const [enabled, setEnabled] = useState(false);
  // 'idle' | 'loading' | 'success' | 'error'
  const [seedState, setSeedState] = useState('idle');
  const toastOpacity = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    AsyncStorage.getItem(DEMO_MODE_KEY).then((v) => setEnabled(v === '1'));
  }, []);

  const toggle = async (val) => {
    setEnabled(val);
    await AsyncStorage.setItem(DEMO_MODE_KEY, val ? '1' : '0');
    broadcastDemoMode(val);
  };

  const showToast = (type) => {
    setSeedState(type);
    Animated.sequence([
      Animated.timing(toastOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.delay(2200),
      Animated.timing(toastOpacity, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start(() => setSeedState('idle'));
  };

  const seedCompletedRun = async () => {
    if (seedState === 'loading') return;
    setSeedState('loading');

    const distance = 5.12;
    const duration_seconds = 1620; // 27:00
    const pace = duration_seconds / 60 / distance;
    const splits = [1, 2, 3, 4, 5].map((km) => ({
      km,
      paceMinPerKm: pace + Math.sin(km * 1.4) * 0.25,
      durationSec: Math.round(pace * 60 + Math.sin(km * 1.4) * 15),
    }));
    const runRecord = {
      distance,
      duration_seconds,
      pace,
      calories: Math.round(distance * 62),
      coordinates: DEMO_ROUTE_COORDS,
      splits,
      created_at: new Date().toISOString(),
    };

    try {
      await AsyncStorage.setItem('lastCompletedRun', JSON.stringify(runRecord));
      showToast('success');
    } catch (e) {
      console.warn('Seed failed:', e);
      showToast('error');
    }
  };

  return (
    <View>
      <View style={styles.row}>
        <View style={styles.iconWrap}>
          <Ionicons name="navigate-circle-outline" size={20} color="#6B6F76" />
        </View>
        <View style={styles.body}>
          <Text style={styles.label}>Demo Mode</Text>
          <Text style={styles.desc}>
            Simulates a GPS run (Tokyo loop) — no real location needed.
          </Text>
        </View>
        <Switch
          value={enabled}
          onValueChange={toggle}
          trackColor={{ false: '#E5E7EB', true: '#0B0F13' }}
          thumbColor="#FFFFFF"
        />
      </View>

      <TouchableOpacity
        style={[styles.seedBtn, seedState === 'loading' && styles.seedBtnLoading]}
        activeOpacity={0.8}
        onPress={seedCompletedRun}
        disabled={seedState === 'loading'}
      >
        <Ionicons
          name={seedState === 'loading' ? 'hourglass-outline' : 'flash'}
          size={15}
          color="#0B0F13"
        />
        <Text style={styles.seedBtnText}>
          {seedState === 'loading' ? 'Seeding…' : 'Seed a completed run'}
        </Text>
      </TouchableOpacity>

      {/* Inline toast — shown instead of Alert.alert so it works on web/PWA */}
      {seedState !== 'idle' && seedState !== 'loading' && (
        <Animated.View
          style={[
            styles.toast,
            seedState === 'success' ? styles.toastSuccess : styles.toastError,
            { opacity: toastOpacity },
          ]}
          pointerEvents="none"
        >
          <Ionicons
            name={seedState === 'success' ? 'checkmark-circle' : 'alert-circle'}
            size={15}
            color={seedState === 'success' ? '#1EA574' : '#E05A36'}
          />
          <Text style={[styles.toastText, seedState === 'error' && styles.toastTextError]}>
            {seedState === 'success'
              ? 'Run seeded — switch to Home tab to see it'
              : 'Seed failed — check console'}
          </Text>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    gap: 12,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F4F5F7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  body: {
    flex: 1,
    gap: 2,
  },
  label: {
    fontFamily: FONT.bold,
    fontSize: 14,
    color: '#0B0F13',
  },
  desc: {
    fontFamily: FONT.regular,
    fontSize: 12,
    color: '#6B6F76',
  },
  seedBtn: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 99,
    backgroundColor: 'rgba(36,199,137,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(36,199,137,0.4)',
  },
  seedBtnLoading: {
    opacity: 0.55,
  },
  seedBtnText: {
    fontFamily: FONT.bold,
    fontSize: 12,
    color: '#0B0F13',
    letterSpacing: 0.2,
  },
  toast: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(30,165,116,0.10)',
  },
  toastSuccess: {
    backgroundColor: 'rgba(30,165,116,0.10)',
  },
  toastError: {
    backgroundColor: 'rgba(224,90,54,0.10)',
  },
  toastText: {
    fontFamily: FONT.semibold,
    fontSize: 12,
    color: '#1EA574',
    flex: 1,
  },
  toastTextError: {
    color: '#E05A36',
  },
});

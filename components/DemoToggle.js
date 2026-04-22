/**
 * DemoToggle — enables/disables Demo Mode (simulated GPS) and exposes a
 * "Seed a completed run" shortcut. The seeded run shows up on HomeScreen's
 * Recent-run card and in the training-insight flow, so a whole demo can be
 * shown without waiting for a live simulation to finish.
 */
import React, { useEffect, useState } from 'react';
import { View, Text, Switch, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { DEMO_MODE_KEY, broadcastDemoMode, DEMO_ROUTE_COORDS } from '../hooks/useDemoMode';
import { FONT } from '../constants/typography';

export default function DemoToggle() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(DEMO_MODE_KEY).then((v) => setEnabled(v === '1'));
  }, []);

  const toggle = async (val) => {
    setEnabled(val);
    await AsyncStorage.setItem(DEMO_MODE_KEY, val ? '1' : '0');
    // Broadcast so every mounted useDemoMode() subscriber reacts
    // immediately, including the RunScreen that may already be mounted
    // in the bottom-tab navigator.
    broadcastDemoMode(val);
  };

  const seedCompletedRun = async () => {
    const distance = 5.12;
    const duration_seconds = 1620; // 27:00
    const pace = duration_seconds / 60 / distance; // min/km
    const splits = [1, 2, 3, 4, 5].map((km) => ({
      km,
      paceMinPerKm: pace + (Math.sin(km * 1.4) * 0.25),
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
      Alert.alert(
        'Demo run seeded',
        'Open the Home tab — the Recent-run card and Next-target chip now show the simulated 5.12 km run. Tap the card to see the Summary + Training Insight.',
      );
    } catch (e) {
      Alert.alert('Seed failed', String(e?.message || e));
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
        style={styles.seedBtn}
        activeOpacity={0.85}
        onPress={seedCompletedRun}
      >
        <Ionicons name="flash" size={15} color="#0B0F13" />
        <Text style={styles.seedBtnText}>Seed a completed run</Text>
      </TouchableOpacity>
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
    marginTop: 4,
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
  seedBtnText: {
    fontFamily: FONT.bold,
    fontSize: 12,
    color: '#0B0F13',
    letterSpacing: 0.2,
  },
});

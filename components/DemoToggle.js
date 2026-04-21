/**
 * DemoToggle — a simple row that enables/disables Demo Mode.
 * Drop it anywhere (Profile screen, Settings drawer, etc.).
 */
import React, { useEffect, useState } from 'react';
import { View, Text, Switch, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { DEMO_MODE_KEY } from '../hooks/useDemoMode';
import { FONT } from '../constants/typography';

export default function DemoToggle() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(DEMO_MODE_KEY).then((v) => setEnabled(v === '1'));
  }, []);

  const toggle = async (val) => {
    setEnabled(val);
    await AsyncStorage.setItem(DEMO_MODE_KEY, val ? '1' : '0');
  };

  return (
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
});

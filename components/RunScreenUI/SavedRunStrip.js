/**
 * SavedRunStrip — after dismissing the summary, nudge user toward Home
 * while they browse the map.
 */
import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import BouncyButton from '../BouncyButton';
import { FONT } from '../../constants/typography';

export default function SavedRunStrip({ distanceKm, onViewHome }) {
  return (
    <View style={styles.wrap} pointerEvents="box-none">
      <View style={styles.strip}>
        <View style={styles.left}>
          <Ionicons name="checkmark-circle" size={18} color="#24C789" />
          <Text style={styles.text}>
            {Number(distanceKm).toFixed(2)} km saved
          </Text>
        </View>
        <BouncyButton style={styles.btn} activeOpacity={0.85} onPress={onViewHome}>
          <Text style={styles.btnText}>View on Home</Text>
          <Ionicons name="arrow-forward" size={14} color="#0B0F13" />
        </BouncyButton>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: Platform.OS === 'ios' ? 118 : 108,
    zIndex: 1200,
  },
  strip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: 'rgba(36,199,137,0.25)',
    shadowColor: '#0B0F13',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
    gap: 10,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    minWidth: 0,
  },
  text: {
    fontFamily: FONT.bold,
    fontSize: 14,
    color: '#0B0F13',
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#24C789',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
  },
  btnText: {
    fontFamily: FONT.bold,
    fontSize: 12,
    color: '#0B0F13',
    letterSpacing: 0.2,
  },
});

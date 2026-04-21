import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { T } from '../constants/typography';

/**
 * AuthButton — mirrors the Figma `Auth / CTA` component set.
 *
 * Figma variants:
 *   State = Default    →   idle, filled pill, arrow trailing
 *   State = Loading    →   spinner trailing, not pressable
 *   State = Disabled   →   opacity reduced, not pressable
 *
 * Component properties:
 *   Label      → button label text
 *   Trailing   → trailing glyph ("→" default, "○" when loading)
 */
export default function AuthButton({
  label,
  onPress,
  loading = false,
  disabled = false,
  trailing,
  style,
}) {
  const isInactive = loading || disabled;
  return (
    <TouchableOpacity
      style={[
        styles.btn,
        isInactive && styles.btnInactive,
        style,
      ]}
      onPress={onPress}
      disabled={isInactive}
      activeOpacity={0.85}
    >
      {loading ? (
        <ActivityIndicator color="#FFFFFF" />
      ) : (
        <>
          <Text style={styles.label}>{label}</Text>
          {trailing !== undefined ? (
            typeof trailing === 'string' ? (
              <Text style={styles.trailingText}>{trailing}</Text>
            ) : (
              trailing
            )
          ) : (
            <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
          )}
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    flexDirection: 'row',
    backgroundColor: '#0B0F13',
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#0B0F13',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 22,
    elevation: 6,
  },
  btnInactive: {
    opacity: 0.6,
  },
  label: {
    ...T.button,
  },
  trailingText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});

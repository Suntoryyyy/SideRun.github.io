import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, {
  Circle,
  Defs,
  LinearGradient,
  Stop,
} from 'react-native-svg';
import { T } from '../constants/typography';

/**
 * Minimalist empty state in the Apple Fitness / Oura aesthetic.
 *
 * Props:
 *  - icon: Ionicons name (default "sparkles-outline")
 *  - title: string
 *  - desc: string
 *  - actionLabel?: string
 *  - onAction?: () => void
 *  - accent?: color (default green)
 *  - compact?: boolean — smaller padding / art
 */
export default function EmptyState({
  icon = 'sparkles-outline',
  title,
  desc,
  actionLabel,
  onAction,
  accent = '#24C789',
  compact = false,
}) {
  const artSize = compact ? 120 : 168;
  const iconSize = compact ? 30 : 42;
  return (
    <View style={[styles.wrap, compact && styles.wrapCompact]}>
      <View
        style={[
          styles.art,
          { width: artSize, height: artSize },
        ]}
      >
        <Svg width={artSize} height={artSize} viewBox="0 0 168 168">
          <Defs>
            <LinearGradient id="esBg" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor={accent} stopOpacity="0.12" />
              <Stop offset="1" stopColor={accent} stopOpacity="0.02" />
            </LinearGradient>
            <LinearGradient id="esRing" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor={accent} stopOpacity="0.9" />
              <Stop offset="1" stopColor={accent} stopOpacity="0.4" />
            </LinearGradient>
          </Defs>
          <Circle cx="84" cy="84" r="80" fill="url(#esBg)" />
          <Circle
            cx="84"
            cy="84"
            r="60"
            stroke="url(#esRing)"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray="250 130"
            fill="none"
            transform="rotate(-60 84 84)"
          />
          <Circle
            cx="84"
            cy="84"
            r="42"
            stroke={accent}
            strokeOpacity="0.3"
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray="4 10"
            fill="none"
          />
        </Svg>
        <View
          style={[
            styles.iconWrap,
            { width: artSize * 0.42, height: artSize * 0.42, borderRadius: artSize },
          ]}
        >
          <Ionicons name={icon} size={iconSize} color={accent} />
        </View>
      </View>
      {!!title && <Text style={styles.title}>{title}</Text>}
      {!!desc && <Text style={styles.desc}>{desc}</Text>}
      {!!actionLabel && !!onAction && (
        <TouchableOpacity
          onPress={onAction}
          activeOpacity={0.85}
          style={styles.ctaBtn}
        >
          <Text style={styles.ctaText}>{actionLabel}</Text>
          <Ionicons name="arrow-forward" size={16} color="#FFF" />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  wrapCompact: {
    paddingVertical: 20,
  },
  art: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  iconWrap: {
    position: 'absolute',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0B0F13',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 3,
  },
  title: {
    ...T.title3,
    textAlign: 'center',
  },
  desc: {
    ...T.bodyMuted,
    textAlign: 'center',
    marginTop: 6,
    maxWidth: 320,
  },
  ctaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 18,
    backgroundColor: '#0B0F13',
    paddingHorizontal: 18,
    height: 44,
    borderRadius: 22,
    gap: 6,
  },
  ctaText: {
    ...T.button,
    fontSize: 14,
  },
});

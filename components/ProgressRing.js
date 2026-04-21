import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { FONT } from '../constants/typography';

/**
 * Apple Fitness / Oura style circular progress ring.
 *
 * Props:
 *  - size: outer diameter (px)
 *  - stroke: ring thickness (px)
 *  - progress: 0..1
 *  - color: progress color (default accent orange)
 *  - trackColor: track color (default very light gray)
 *  - label: small caption below value (e.g. "WEEK")
 *  - valueText: middle label override; defaults to percentage
 *  - gradient: optional [startColor, endColor] to use a gradient stroke
 */
export default function ProgressRing({
  size = 96,
  stroke = 10,
  progress = 0,
  color = '#FF5A36',
  trackColor = '#EFF2F5',
  valueText,
  label,
  textColor = '#0B0F13',
  gradient,
}) {
  const clamped = Math.max(0, Math.min(1, progress));
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const dash = c * clamped;

  const center = size / 2;
  const display =
    valueText !== undefined ? valueText : `${Math.round(clamped * 100)}%`;

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size}>
        {gradient ? (
          <Defs>
            <LinearGradient id="pg" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor={gradient[0]} />
              <Stop offset="1" stopColor={gradient[1]} />
            </LinearGradient>
          </Defs>
        ) : null}
        <Circle
          cx={center}
          cy={center}
          r={r}
          stroke={trackColor}
          strokeWidth={stroke}
          fill="none"
        />
        <Circle
          cx={center}
          cy={center}
          r={r}
          stroke={gradient ? 'url(#pg)' : color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${c - dash}`}
          fill="none"
          transform={`rotate(-90 ${center} ${center})`}
        />
      </Svg>
      <View style={styles.textWrap} pointerEvents="none">
        <Text style={[styles.value, { color: textColor, fontSize: size * 0.24 }]}>
          {display}
        </Text>
        {label ? (
          <Text style={[styles.label, { color: '#9A9EA5', fontSize: size * 0.1 }]}>
            {label}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  textWrap: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: {
    fontFamily: FONT.extraBold,
    letterSpacing: -0.5,
    fontVariant: ['tabular-nums'],
  },
  label: {
    marginTop: 2,
    fontFamily: FONT.bold,
    letterSpacing: 1,
  },
});

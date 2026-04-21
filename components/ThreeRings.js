import React from 'react';
import { View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

/**
 * Apple Fitness style three concentric rings.
 *
 * Props:
 *  - size: overall diameter (default 160)
 *  - stroke: ring thickness (default 12)
 *  - gap: gap between rings (default 4)
 *  - rings: [{ progress, color, trackColor? }, ...] from outer to inner (up to 3)
 */
export default function ThreeRings({
  size = 160,
  stroke = 12,
  gap = 4,
  rings = [],
}) {
  const center = size / 2;

  const specs = rings.slice(0, 3).map((r, i) => {
    const radius = (size - stroke) / 2 - i * (stroke + gap);
    const clamped = Math.max(0, Math.min(1, r.progress || 0));
    const c = 2 * Math.PI * radius;
    return {
      r: radius,
      color: r.color,
      trackColor: r.trackColor || 'rgba(255,255,255,0.08)',
      dash: c * clamped,
      c,
    };
  });

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        {specs.map((s, i) => (
          <Circle
            key={`t-${i}`}
            cx={center}
            cy={center}
            r={s.r}
            stroke={s.trackColor}
            strokeWidth={stroke}
            fill="none"
          />
        ))}
        {specs.map((s, i) => (
          <Circle
            key={`p-${i}`}
            cx={center}
            cy={center}
            r={s.r}
            stroke={s.color}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={`${s.dash} ${s.c - s.dash}`}
            fill="none"
            transform={`rotate(-90 ${center} ${center})`}
          />
        ))}
      </Svg>
    </View>
  );
}

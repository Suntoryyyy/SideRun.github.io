import React from 'react';
import { View } from 'react-native';
import Svg, { Path, Circle, Defs, LinearGradient, Stop } from 'react-native-svg';

/**
 * Minimalist sparkline for small weekly/monthly series.
 *
 * Props:
 *  - data: number[] — series values (length >= 1)
 *  - width/height: canvas dimensions
 *  - color: line color
 *  - fillOpacity: max opacity of the area fill (0..1)
 *  - highlightLast: if true, draws a small dot on the last point
 *  - highlightIndex: if set (overrides highlightLast), draws dot on that index
 *  - strokeWidth
 */
export default function Sparkline({
  data = [],
  width = 280,
  height = 32,
  color = '#FF5A36',
  fillOpacity = 0.22,
  highlightLast = true,
  highlightIndex,
  strokeWidth = 2,
}) {
  if (!Array.isArray(data) || data.length === 0) {
    return <View style={{ width, height }} />;
  }

  const pad = 3;
  const w = width;
  const h = height;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const stepX = data.length > 1 ? (w - pad * 2) / (data.length - 1) : 0;

  const points = data.map((v, i) => {
    const x = pad + i * stepX;
    const y = h - pad - ((v - min) / range) * (h - pad * 2);
    return { x, y };
  });

  const linePath = points
    .map((p, i) => (i === 0 ? `M${p.x},${p.y}` : `L${p.x},${p.y}`))
    .join(' ');

  const areaPath = `${linePath} L${points[points.length - 1].x},${h} L${points[0].x},${h} Z`;

  const dotIdx =
    typeof highlightIndex === 'number'
      ? highlightIndex
      : highlightLast
      ? points.length - 1
      : -1;
  const dot = dotIdx >= 0 && dotIdx < points.length ? points[dotIdx] : null;

  return (
    <View style={{ width, height }}>
      <Svg width={width} height={height}>
        <Defs>
          <LinearGradient id="sp" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={color} stopOpacity={String(fillOpacity)} />
            <Stop offset="1" stopColor={color} stopOpacity="0" />
          </LinearGradient>
        </Defs>
        <Path d={areaPath} fill="url(#sp)" />
        <Path
          d={linePath}
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        {dot ? <Circle cx={dot.x} cy={dot.y} r={strokeWidth + 1} fill={color} /> : null}
      </Svg>
    </View>
  );
}

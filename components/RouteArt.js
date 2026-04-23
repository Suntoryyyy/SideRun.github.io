/**
 * RouteArt — hero-sized route polyline renderer used by the new share cards
 * and the in-app Run Summary modal.
 *
 *   ┌─────────────────────────────────┐
 *   │ ● IMPERIAL PALACE LOOP   ★ PB   │
 *   │                                 │
 *   │         ╭──────╮                │
 *   │        ╱        ╲               │
 *   │  ●────╯          ╰─── end       │
 *   │                                 │
 *   │ 4.98 km · outer loop            │
 *   └─────────────────────────────────┘
 *
 * Two variants:
 *   • `hero`    — dark rounded card with subtle grid, place/PB chips, glow
 *   • `minimal` — just the polyline on a translucent panel (Story card)
 *
 * Never renders react-native-maps — the whole idea of the share card is a
 * *stylised* route, not a real map tile (keeps export consistent cross-platform
 * and avoids tile-licensing headaches).
 */
import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Polyline, Circle, Line } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { FONT } from '../constants/typography';

const PAD = 24;

function buildPath(coords, w, h) {
  if (!coords || coords.length < 2) return null;
  const lats = coords.map((c) => c.latitude);
  const lngs = coords.map((c) => c.longitude);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  const rangeH = maxLat - minLat || 1e-4;
  const rangeW = maxLng - minLng || 1e-4;
  const scale = Math.min((w - PAD * 2) / rangeW, (h - PAD * 2) / rangeH);
  const projectedW = rangeW * scale;
  const projectedH = rangeH * scale;
  const offsetX = PAD + (w - PAD * 2 - projectedW) / 2;
  const offsetY = PAD + (h - PAD * 2 - projectedH) / 2;
  const pts = coords.map((c) => ({
    x: offsetX + (c.longitude - minLng) * scale,
    y: offsetY + projectedH - (c.latitude - minLat) * scale,
  }));
  return { pts, start: pts[0], end: pts[pts.length - 1] };
}

// Friendly-looking stylised loop we draw when there are no real coords (web
// demo mode, or runs saved without GPS samples). Keeps the share card from
// ever looking empty.
const FALLBACK_LOOP = (w, h) => {
  const cx = w / 2;
  const cy = h / 2;
  const rx = (w - PAD * 2) * 0.42;
  const ry = (h - PAD * 2) * 0.38;
  const pts = [];
  const N = 64;
  for (let i = 0; i <= N; i++) {
    const t = (i / N) * Math.PI * 2;
    // Slight lobes so it doesn't look like a perfect ellipse.
    const r = 1 + 0.08 * Math.sin(t * 3) + 0.04 * Math.cos(t * 5);
    pts.push({
      x: cx + Math.cos(t) * rx * r,
      y: cy + Math.sin(t) * ry * r,
    });
  }
  return { pts, start: pts[0], end: pts[Math.floor(N * 0.32)] };
};

export default function RouteArt({
  coordinates,
  width,
  height,
  variant = 'hero',              // 'hero' | 'minimal'
  strokeColor,                   // defaults based on variant
  placeName,                     // optional chip label on hero variant
  badge,                         // optional top-right badge {icon, label}
  backgroundColor,               // override viewport bg
}) {
  const path = useMemo(() => {
    const built = buildPath(coordinates, width, height);
    return built || FALLBACK_LOOP(width, height);
  }, [coordinates, width, height]);

  const stroke = strokeColor || (variant === 'minimal' ? '#FFFFFF' : '#24C789');
  const bg =
    backgroundColor ||
    (variant === 'minimal' ? 'rgba(255,255,255,0.08)' : '#121721');

  const polylinePoints = path.pts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');

  // Subtle grid for hero variant (gives a "map-ish" feel without tiles).
  const gridLines = variant === 'hero' ? (
    <>
      {[1, 2, 3, 4, 5, 6, 7].map((i) => (
        <Line
          key={`v${i}`}
          x1={(width / 8) * i}
          x2={(width / 8) * i}
          y1={0}
          y2={height}
          stroke="#FFFFFF"
          strokeWidth={1}
          strokeOpacity={0.04}
        />
      ))}
      {[1, 2, 3, 4, 5].map((i) => (
        <Line
          key={`h${i}`}
          x1={0}
          x2={width}
          y1={(height / 6) * i}
          y2={(height / 6) * i}
          stroke="#FFFFFF"
          strokeWidth={1}
          strokeOpacity={0.04}
        />
      ))}
    </>
  ) : null;

  return (
    <View
      style={[
        styles.wrap,
        { width, height, backgroundColor: bg },
        variant === 'minimal' && styles.wrapMinimal,
      ]}
    >
      <Svg width={width} height={height}>
        {gridLines}
        {/* Outer halo pass — widest, most transparent */}
        <Polyline
          points={polylinePoints}
          fill="none"
          stroke={stroke}
          strokeOpacity={0.18}
          strokeWidth={14}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {/* Inner halo pass */}
        <Polyline
          points={polylinePoints}
          fill="none"
          stroke={stroke}
          strokeOpacity={0.38}
          strokeWidth={9}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {/* Main stroke */}
        <Polyline
          points={polylinePoints}
          fill="none"
          stroke={stroke}
          strokeWidth={4.5}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {/* Start dot (white) */}
        <Circle cx={path.start.x} cy={path.start.y} r={7} fill="#FFFFFF" stroke={bg} strokeWidth={3} />
        {/* End dot (accent) */}
        <Circle cx={path.end.x} cy={path.end.y} r={7} fill={stroke} stroke={bg} strokeWidth={3} />
      </Svg>

      {/* Hero-variant overlays */}
      {variant === 'hero' && placeName ? (
        <View style={styles.placeChip}>
          <View style={[styles.placeDot, { backgroundColor: stroke }]} />
          <Text style={styles.placeText} numberOfLines={1}>
            {placeName}
          </Text>
        </View>
      ) : null}

      {variant === 'hero' && badge ? (
        <View style={styles.badge}>
          {badge.icon ? (
            <Ionicons name={badge.icon} size={11} color="#0B0F13" />
          ) : null}
          <Text style={styles.badgeText}>{badge.label}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: 24,
    overflow: 'hidden',
  },
  wrapMinimal: {
    borderRadius: 28,
  },
  placeChip: {
    position: 'absolute',
    top: 14,
    left: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingLeft: 10,
    paddingRight: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(0,0,0,0.55)',
    maxWidth: '70%',
  },
  placeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  placeText: {
    fontFamily: FONT.bold,
    fontSize: 11,
    color: '#FFFFFF',
    letterSpacing: 1.2,
  },
  badge: {
    position: 'absolute',
    top: 14,
    right: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
  },
  badgeText: {
    fontFamily: FONT.black,
    fontSize: 11,
    color: '#0B0F13',
    letterSpacing: 1.4,
  },
});

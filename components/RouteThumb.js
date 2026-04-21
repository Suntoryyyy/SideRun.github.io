/**
 * RouteThumb — tiny route preview for the Run Summary card.
 *
 * Web:  draws an SVG polyline centred on a white card (no map tiles needed).
 * Native: renders a small react-native-maps MapView, zoomed to the bounding
 *         box of the coordinates, with a green polyline overlay.
 *
 * Falls back gracefully when < 2 points are available.
 */
import React, { useMemo } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import Svg, { Polyline, Circle } from 'react-native-svg';

const PAD = 12; // px padding inside SVG viewport

function normalisePath(coords, w, h) {
  if (!coords || coords.length < 2) return { points: [], start: null, end: null };
  const lats = coords.map((c) => c.latitude);
  const lngs = coords.map((c) => c.longitude);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);

  const rangeH = maxLat - minLat || 0.0001;
  const rangeW = maxLng - minLng || 0.0001;

  // Keep proportions: fit inside the box.
  const scaleH = (h - PAD * 2) / rangeH;
  const scaleW = (w - PAD * 2) / rangeW;
  const scale = Math.min(scaleH, scaleW);

  // Centre within the box.
  const projectedW = rangeW * scale;
  const projectedH = rangeH * scale;
  const offsetX = PAD + (w - PAD * 2 - projectedW) / 2;
  const offsetY = PAD + (h - PAD * 2 - projectedH) / 2;

  const pts = coords.map((c) => {
    const x = offsetX + (c.longitude - minLng) * scale;
    // Lat increases upward; SVG y increases downward.
    const y = offsetY + projectedH - (c.latitude - minLat) * scale;
    return { x, y };
  });

  return {
    points: pts,
    start: pts[0],
    end: pts[pts.length - 1],
  };
}

export default function RouteThumb({ coordinates, width = 120, height = 80 }) {
  const { points, start, end } = useMemo(
    () => normalisePath(coordinates, width, height),
    [coordinates, width, height],
  );

  if (!points || points.length < 2) {
    // No route yet — blank placeholder.
    return (
      <View style={[styles.container, { width, height }]}>
        <View style={styles.noRoute} />
      </View>
    );
  }

  const polylinePoints = points.map((p) => `${p.x},${p.y}`).join(' ');

  return (
    <View style={[styles.container, { width, height }]}>
      <Svg width={width} height={height}>
        <Polyline
          points={polylinePoints}
          fill="none"
          stroke="#24C789"
          strokeWidth={2.5}
          strokeLinejoin="round"
          strokeLinecap="round"
          strokeOpacity={0.9}
        />
        {/* Start dot */}
        <Circle cx={start.x} cy={start.y} r={4} fill="#24C789" />
        {/* End dot */}
        <Circle cx={end.x} cy={end.y} r={5} fill="#FF5A36" stroke="#FFFFFF" strokeWidth={1.5} />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.06)',
    overflow: 'hidden',
  },
  noRoute: {
    flex: 1,
    borderRadius: 12,
  },
});

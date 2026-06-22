import React, { useEffect, useState } from 'react';
import BouncyButton from '../BouncyButton';
import { View, Text, StyleSheet, Platform, Animated } from 'react-native';
import { Image } from 'expo-image';
import { MapContainer, TileLayer, Marker, Polyline, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import useDemoMode, { DEMO_ROUTE_COORDS } from '../../hooks/useDemoMode';
import useMapFriends from '../../hooks/useMapFriends';
import FriendMapLayer from './FriendMapLayer.web';
import FloatingCheer from './FloatingCheer';

// Fix leaflet icon paths
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

// Custom div icons — no external image dependency
const startIcon = L.divIcon({
  className: '',
  html: '<div style="width:14px;height:14px;background:#24C789;border:3px solid white;border-radius:50%;box-shadow:0 2px 8px rgba(0,0,0,0.35)"></div>',
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

const currentPosIcon = L.divIcon({
  className: '',
  html: '<div style="width:18px;height:18px;background:#0B0F13;border:3px solid white;border-radius:50%;box-shadow:0 2px 10px rgba(0,0,0,0.4)"></div>',
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

// Colour-code a pace value (min/km) into a visible hue
const paceColor = (pace) => {
  if (pace <= 0 || !isFinite(pace)) return '#24C789';
  if (pace < 4.5) return '#24C789';   // fast — green
  if (pace < 5.5) return '#8AE676';   // medium — light green
  if (pace < 6.5) return '#F5C842';   // moderate — yellow
  if (pace < 8)   return '#FF7A36';   // slow — orange
  return '#FF3B30';                    // walking — red
};

// Build pace-coloured polyline segments from coordinates array
// Each coord needs { latitude, longitude, timestamp } for pace calc
const buildPaceSegments = (coords) => {
  if (coords.length < 2) return [{ positions: coords.map(c => [c.latitude, c.longitude]), color: '#24C789' }];
  const segments = [];
  for (let i = 1; i < coords.length; i++) {
    const prev = coords[i - 1];
    const curr = coords[i];
    const dLat = curr.latitude - prev.latitude;
    const dLon = curr.longitude - prev.longitude;
    const distKm = Math.sqrt(dLat * dLat + dLon * dLon) * 111;
    const dtMin = prev.timestamp && curr.timestamp
      ? (curr.timestamp - prev.timestamp) / 60000
      : 0;
    const pace = distKm > 0 && dtMin > 0 ? dtMin / distKm : 0;
    segments.push({
      positions: [[prev.latitude, prev.longitude], [curr.latitude, curr.longitude]],
      color: paceColor(pace),
    });
  }
  return segments;
};

const RecenterControl = ({ location, follow }) => {
  const map = useMap();
  useEffect(() => {
    // Android Web PWA 0x0 container size issue fix
    const t = setTimeout(() => {
      map.invalidateSize();
    }, 400);

    // Only hard-follow the runner while actually running. Before a run we let
    // FriendMapLayer frame "you + crew", and we don't fight the user panning
    // around to browse friend markers.
    if (location && follow) {
      map.setView([location.latitude, location.longitude], map.getZoom());
    }
    return () => clearTimeout(t);
  }, [location, follow, map]);
  return null;
};

const RunMapMemo = ({
  mode,
  spectateFriend,
  runData,
  currentLocation,
  liveFriends = [],
  visibilityScope = "public",
  isRunning,
  liveEmojis = [],
  cheers = [],
  recenterMap,
  setLiveEmojis,
  userAvatar
}) => {
  const defaultCenter = [39.9042, 116.4074]; // Default to Beijing if no loc
  const mapCenter = currentLocation && currentLocation.latitude !== undefined
    ? [currentLocation.latitude, currentLocation.longitude] 
    : (spectateFriend && spectateFriend.latitude !== undefined ? [spectateFriend.latitude, spectateFriend.longitude] : defaultCenter);
    
  const coords = runData?.coordinates || [];
  const paceSegments = buildPaceSegments(coords);
  const hasTsData = coords.length >= 2 && coords[0]?.timestamp != null;

  // When demo mode is on, draw a faint "preview" of the full Tokyo loop so
  // the user can see exactly where the simulation will run — especially
  // helpful for course-work demos when no real GPS is available.
  const { isDemoMode } = useDemoMode();
  const previewPositions = isDemoMode
    ? DEMO_ROUTE_COORDS.map((c) => [c.latitude, c.longitude])
    : null;

  // Local virtual crew positioned around the runner — drives the interactive
  // friend markers / mini cards. Only shown on your own run map (not spectate).
  const mapFriends = useMapFriends(currentLocation);
  const showFriendLayer = mode !== 'spectate' && visibilityScope !== 'private';

  return (
    <View style={[styles.container, { flex: 1, height: '100vh', width: '100vw' }]}>
      <MapContainer 
        center={mapCenter} 
        zoom={16} 
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
        zoomControl={false}
      >
        {/* light_all = minimal light grey — matches v3 minimalist palette */}
        <TileLayer
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        />

        {currentLocation && <RecenterControl location={currentLocation} follow={isRunning} />}

        {/* Demo-mode route preview — faint dashed loop showing where the
            simulated run will go. Only visible when demo mode is on. */}
        {previewPositions && (
          <Polyline
            positions={previewPositions}
            color="#0B0F13"
            weight={2}
            opacity={0.25}
            dashArray="6 8"
          />
        )}

        {/* Draw the user's route — pace-coloured if timestamps exist, solid green otherwise */}
        {coords.length > 1 && (hasTsData
          ? paceSegments.map((seg, i) => (
              <Polyline key={i} positions={seg.positions} color={seg.color} weight={5} opacity={0.9} />
            ))
          : <Polyline positions={coords.map(c => [c.latitude, c.longitude])} color="#24C789" weight={5} />
        )}

        {/* Start marker */}
        {coords.length > 0 && (
          <Marker
            position={[coords[0].latitude, coords[0].longitude]}
            icon={startIcon}
          />
        )}

        {/* Current user marker */}
        {currentLocation && mode !== 'spectate' && (
          <Marker position={[currentLocation.latitude, currentLocation.longitude]} icon={currentPosIcon} />
        )}

        {/* Spectator target marker */}
        {mode === 'spectate' && currentLocation && (
          <Marker position={[currentLocation.latitude, currentLocation.longitude]} icon={currentPosIcon} />
        )}
        
        {/* Interactive crew layer: avatar markers, labels, mini cards,
            zoom-based density and auto camera-fit. */}
        {showFriendLayer && (
          <FriendMapLayer friends={mapFriends} selfLocation={currentLocation} />
        )}
      </MapContainer>

      {/* Custom Recenter Button matching the native screen overlay.
          Hidden during an active/paused solo run: the bottom data bar + control
          live there, the map already auto-follows the runner via RecenterControl,
          and the frosted circle otherwise overlaps the Pause button's top-right
          as a stray grey blob. Still shown pre-run and while spectating. */}
      {(!isRunning || mode === 'spectate') && (
        <BouncyButton
          style={[styles.recenterButton, { padding: 0 }]}
          onPress={recenterMap}
        >
          <BlurView intensity={80} tint="light" style={{ width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' }}>
            <Ionicons name="navigate" size={24} color="#000" />
          </BlurView>
        </BouncyButton>
      )}

      {/* Live / spectate pill — only visible when a run is active or watching */}
      {(isRunning || mode === 'spectate') && (
        <View style={styles.badgeContainer}>
          <BlurView intensity={80} tint="light" style={{ ...StyleSheet.absoluteFillObject }} />
          <View style={styles.badgeDot} />
          <Text style={styles.badgeText}>
            {mode === 'spectate'
              ? 'Watching ' + (spectateFriend?.name || 'Live')
              : 'Live'}
          </Text>
        </View>
      )}

      {/* Floating Emojis (received) */}
      {liveEmojis.map((c) => (
        <FloatingCheer
          key={c.id}
          emoji={c.emoji}
          count={c.count}
          onComplete={() => {
            if (setLiveEmojis) {
              setLiveEmojis((prev) => prev.filter((e) => e.id !== c.id));
            }
          }}
        />
      ))}

      {/* Cheers sent queue popup */}
      {cheers.map((cheer, index) => (
        <View
          key={`cheer-${index}`}
          style={[styles.cheerBubble, { top: 50 + index * 60 }]}
        >
          <Text style={styles.cheerText}>{cheer.emoji}</Text>
        </View>
      ))}

    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative'
  },
  recenterButton: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: 'hidden',
    zIndex: 1000, // Important for overlapping react-leaflet on web
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  badgeContainer: {
    position: 'absolute',
    // Align with demoBanner so the pill never sits under the status bar /
    // dynamic island on iPhone PWA.
    top: Platform.OS === 'ios' ? 60 : Platform.OS === 'web' ? 48 : 36,
    left: 20,
    backgroundColor: 'transparent',
    overflow: 'hidden',
    borderRadius: 20,
    paddingVertical: 7,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  badgeDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#24C789',
  },
  badgeText: {
    fontFamily: 'Inter_700Bold',
    color: '#0B0F13',
    fontSize: 12,
    letterSpacing: 0.2,
  },
  floatingEmoji: {
    position: 'absolute',
    left: '42%',
    zIndex: 1500,
    alignItems: 'center',
    justifyContent: 'center',
  },
  floatingEmojiText: {
    fontSize: 60,
  },
  cheerBubble: {
    position: 'absolute',
    right: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 25,
    padding: 12,
    zIndex: 1500,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cheerText: {
    fontSize: 24,
  }
});

export default React.memo(RunMapMemo);

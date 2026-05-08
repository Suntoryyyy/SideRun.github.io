import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Platform, TouchableOpacity, Animated } from 'react-native';
import { Image } from 'expo-image';
import { MapContainer, TileLayer, Marker, Polyline, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import useDemoMode, { DEMO_ROUTE_COORDS } from '../../hooks/useDemoMode';

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

const FloatingEmoji = ({ emoji, onComplete }) => {
  const [anim] = React.useState(new Animated.Value(0));
  const randomX = React.useMemo(() => (Math.random() - 0.5) * 150, []);
  const randomRot = React.useMemo(() => (Math.random() - 0.5) * 45, []);
  const duration = React.useMemo(() => 2000 + Math.random() * 1000, []);
  const targetBottom = React.useMemo(() => 450 + Math.random() * 100, []);

  React.useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration: duration,
      useNativeDriver: false, // web doesn't fully support all native drivers, false is safer wrapper
    }).start(onComplete);
  }, []);

  return (
    <Animated.View
      style={[
        styles.floatingEmoji,
        {
          bottom: anim.interpolate({
            inputRange: [0, 1],
            outputRange: [150, targetBottom],
          }),
          transform: [
            {
              translateX: anim.interpolate({
                inputRange: [0, 0.5, 1],
                outputRange: [0, randomX, randomX * 1.2],
              })
            },
            {
              rotate: anim.interpolate({
                inputRange: [0, 1],
                outputRange: ['0deg', `${randomRot}deg`],
              })
            },
            {
              scale: anim.interpolate({
                inputRange: [0, 0.1, 0.8, 1],
                outputRange: [0.5, 1.2, 1, 0.8],
              })
            }
          ],
          opacity: anim.interpolate({
            inputRange: [0, 0.2, 0.8, 1],
            outputRange: [0, 1, 1, 0],
          }),
        },
      ]}
    >
      {emoji && typeof emoji === 'string' && (emoji.startsWith('data:image') || emoji.startsWith('file:') || emoji.startsWith('http')) ? (
        <Image source={{ uri: emoji }} style={{ width: 80, height: 80, borderRadius: 12, borderWidth: 3, borderColor: '#24C789', backgroundColor: '#fff', overflow: 'hidden' }} />
      ) : (
        <View style={{ backgroundColor: emoji.length > 2 ? 'rgba(36, 199, 137, 0.9)' : 'transparent', paddingHorizontal: emoji.length > 2 ? 15 : 0, paddingVertical: emoji.length > 2 ? 10 : 0, borderRadius: 20 }}>
          <Text style={[styles.floatingEmojiText, emoji.length > 2 ? { fontSize: 18, color: '#fff', fontWeight: 'bold' } : {}]}>{emoji}</Text>
        </View>
      )}
    </Animated.View>
  );
};

const RecenterControl = ({ location }) => {
  const map = useMap();
  useEffect(() => {
    // Android Web PWA 0x0 container size issue fix
    const t = setTimeout(() => {
      map.invalidateSize();
    }, 400);

    if (location) {
      map.setView([location.latitude, location.longitude], map.getZoom());
    }
    return () => clearTimeout(t);
  }, [location, map]);
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

        {currentLocation && <RecenterControl location={currentLocation} />}

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
        
        {/* Live friends */}
        {visibilityScope !== "private" && isRunning && liveFriends.map(friend => (
          <Marker key={friend.id} position={[friend.latitude, friend.longitude]}>
            <Popup>{friend.name || friend.avatar}</Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Custom Recenter Button matching the native screen overlay */}
      <TouchableOpacity 
        style={[styles.recenterButton, { padding: 0 }]} 
        onPress={recenterMap}
      >
        <BlurView intensity={80} tint="light" style={{ width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' }}>
          <Ionicons name="navigate" size={24} color="#000" />
        </BlurView>
      </TouchableOpacity>

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
        <FloatingEmoji
          key={c.id}
          emoji={c.emoji}
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

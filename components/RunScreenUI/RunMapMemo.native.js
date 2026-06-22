import { Animated } from 'react-native';
import React, { useEffect, useRef, useState } from 'react';
import * as Haptics from 'expo-haptics';
import { BlurView } from 'expo-blur';
import BouncyButton from '../BouncyButton';
import { View, Text, Platform, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Polyline, Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import MapStyle from '../../screens/MapStyle.json';
import { Image } from 'expo-image';
import useDemoMode, { DEMO_ROUTE_COORDS } from '../../hooks/useDemoMode';
import useMapFriends from '../../hooks/useMapFriends';
import useMapVisibilityStore from '../../store/useMapVisibilityStore';
import { getDistance } from '../../utils/locationUtils';
import { formatDuration } from '../../utils/timeUtils';
import {
  NATIVE_REGION_DELTA,
  badgeColor,
  isImageAvatar,
  isEmojiAvatar,
  avatarInitial,
  formatMapDistance,
} from '../../constants/mapConfig';
import styles from '../../styles/RunScreenStyles';

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
      useNativeDriver: false,
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
        <Image source={{ uri: emoji }} style={{ width: 80, height: 80, borderRadius: 12, borderWidth: 3, borderColor: '#24C789', backgroundColor: '#fff', overflow: 'hidden' }} contentFit="cover" />
      ) : (
        <View style={{ backgroundColor: emoji.length > 2 ? 'rgba(36, 199, 137, 0.9)' : 'transparent', paddingHorizontal: emoji.length > 2 ? 15 : 0, paddingVertical: emoji.length > 2 ? 10 : 0, borderRadius: 20 }}>
          <Text style={[styles.floatingEmojiText, emoji.length > 2 ? { fontSize: 18, color: '#fff', fontWeight: 'bold' } : {}]}>{emoji}</Text>
        </View>
      )}
    </Animated.View>
  );
};

const RunMapMemo = React.memo(({
  navigation,
  region,
  currentLocation,
  runData,
  mapRef,
  mode,
  spectateFriend,
  userAvatar,
  visibilityScope,
  isRunning,
  liveFriends,
  liveEmojis,
  cheers,
  recenterMap,
  setLiveEmojis
}) => {
  const { isDemoMode } = useDemoMode();

  // ── Live crew layer state ────────────────────────────────────────────────
  const mapFriends = useMapFriends(currentLocation);
  const visibility = useMapVisibilityStore((s) => s.visibility);
  const setVisible = useMapVisibilityStore((s) => s.setVisible);
  const hydrateVisibility = useMapVisibilityStore((s) => s.hydrate);
  const [selectedId, setSelectedId] = useState(null);
  const [latDelta, setLatDelta] = useState(region?.latitudeDelta ?? 0.02);
  const didFitRef = useRef(false);

  useEffect(() => { hydrateVisibility(); }, [hydrateVisibility]);

  const showFriendLayer = mode !== 'spectate' && visibilityScope !== 'private';
  const visibleFriends = React.useMemo(
    () => mapFriends.filter((f) => visibility[f.id] !== false),
    [mapFriends, visibility]
  );
  const showLabel = latDelta <= NATIVE_REGION_DELTA.label;
  const showDistance = latDelta <= NATIVE_REGION_DELTA.distance;
  const distTo = (f) =>
    currentLocation && currentLocation.latitude != null
      ? getDistance(currentLocation, { latitude: f.latitude, longitude: f.longitude }) * 1000
      : null;
  const selectedFriend = visibleFriends.find((f) => f.id === selectedId) || null;

  // Auto-fit the camera to (you + visible friends) once on entry.
  useEffect(() => {
    if (Platform.OS === 'web' || !showFriendLayer || didFitRef.current) return;
    if (!mapRef || !mapRef.current) return;
    const pts = [];
    if (currentLocation && currentLocation.latitude != null) {
      pts.push({ latitude: currentLocation.latitude, longitude: currentLocation.longitude });
    }
    visibleFriends.forEach((f) => pts.push({ latitude: f.latitude, longitude: f.longitude }));
    if (pts.length === 0) return;
    didFitRef.current = true;
    requestAnimationFrame(() => {
      try {
        if (pts.length === 1) {
          mapRef.current.animateToRegion(
            { ...pts[0], latitudeDelta: 0.02, longitudeDelta: 0.02 },
            600
          );
        } else {
          mapRef.current.fitToCoordinates(pts, {
            edgePadding: { top: 130, right: 70, bottom: 320, left: 70 },
            animated: true,
          });
        }
      } catch (_) {}
    });
  }, [showFriendLayer, visibleFriends, currentLocation, mapRef]);

  return (
    <View style={styles.mapContainer}>
        {/* Floating Back Button */}
        <BouncyButton
          style={[styles.backButton, { padding: 0 }]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            navigation.goBack();
          }}
          hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
        >
          <BlurView intensity={80} tint="light" style={{ padding: 10, borderRadius: 20 }}>
          <Ionicons name="arrow-back" size={28} color="#333" />
          </BlurView>
        </BouncyButton>

        {Platform.OS === "web" ? (
          // Real OpenStreetMap embed for web fallback
          <div
            style={{
              width: "100%",
              height: "100%",
              borderRadius: 8,
              overflow: "hidden",
            }}
          >
            <iframe
              width="100%"
              height="100%"
              frameBorder="0"
              scrolling="no"
              marginHeight="0"
              marginWidth="0"
              src={`https://www.openstreetmap.org/export/embed.html?bbox=${region.longitude - 0.005},${region.latitude - 0.005},${region.longitude + 0.005},${region.latitude + 0.005}&layer=mapnik&marker=${currentLocation?.latitude || region.latitude},${currentLocation?.longitude || region.longitude}`}
              style={{ border: "none" }}
            />
            <View style={styles.webMapOverlayCard}>
              <Text style={styles.webMapOverlayText}>GPS Tracking Active</Text>
              {runData.coordinates.length > 0 && (
                <Text style={styles.webMapOverlayCoords}>
                  Route: {runData.coordinates.length} pts logged
                </Text>
              )}
            </View>
          </div>
        ) : (
          // Native map view
          <View style={styles.map}>
            <MapView
              ref={mapRef}
              style={Object.assign({}, styles.map, { flex: 1 })}
              provider={PROVIDER_GOOGLE}
              initialRegion={region}
              showsUserLocation={mode !== 'spectate'}
              followsUserLocation={false} // Detach forced follow
              customMapStyle={MapStyle}
              onPress={() => setSelectedId(null)}
              onRegionChangeComplete={(r) => {
                if (r && r.latitudeDelta != null) setLatDelta(r.latitudeDelta);
              }}
            >
              {/* Demo-mode preview of the Tokyo loop — dashed, low opacity */}
              {isDemoMode && (
                <Polyline
                  coordinates={DEMO_ROUTE_COORDS}
                  strokeColor="rgba(11,15,19,0.25)"
                  strokeWidth={2}
                  lineDashPattern={[6, 8]}
                />
              )}
              {runData.coordinates.length > 1 && (
                <Polyline
                  coordinates={runData.coordinates}
                  strokeColor="#24C789"
                  strokeWidth={4}
                />
              )}
            
            {mode === 'spectate' && currentLocation && spectateFriend && (
                <Marker
                  coordinate={{ latitude: currentLocation.latitude, longitude: currentLocation.longitude }}
                  title={spectateFriend.name}
                  anchor={{ x: 0.5, y: 0.5 }}
                >
                  <View style={{
                    width: 40, height: 40, borderRadius: 20,
                    backgroundColor: '#FFF', borderWidth: 2, borderColor: '#FF9500',
                    justifyContent: 'center', alignItems: 'center',
                    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 5
                  }}>
                    {spectateFriend.avatar && (spectateFriend.avatar.startsWith("http") || spectateFriend.avatar.startsWith("file:")) ? (
                      <Image source={{ uri: spectateFriend.avatar }} style={{ width: 36, height: 36, borderRadius: 18 }} />
                    ) : (
                      <Text style={{ fontSize: 18 }}>{spectateFriend.avatar || "🏃"}</Text>
                    )}
                  </View>
                </Marker>
              )}
            {showFriendLayer && visibleFriends.map((friend) => {
                const color = badgeColor(friend.id);
                const dist = distTo(friend);
                return (
                  <React.Fragment key={friend.id}>
                    <Marker
                      // Re-mount when density crosses a threshold so the snapshot
                      // (tracksViewChanges=false) reflects label/distance changes.
                      key={`${friend.id}-${showLabel}-${showDistance}-${visibility[`${friend.id}:label`] !== false}`}
                      coordinate={{ latitude: friend.latitude, longitude: friend.longitude }}
                      anchor={{ x: 0.5, y: 1 }}
                      onPress={() =>
                        setSelectedId((id) => (id === friend.id ? null : friend.id))
                      }
                      tracksViewChanges={false}
                    >
                      <View style={{ alignItems: 'center' }}>
                        <View style={[mStyles.avatarWrap, { borderColor: color }]}>
                          {isImageAvatar(friend.avatar) ? (
                            <Image source={{ uri: friend.avatar }} style={mStyles.avatarImg} contentFit="cover" />
                          ) : isEmojiAvatar(friend.avatar) ? (
                            <Text style={{ fontSize: 16 }}>{friend.avatar}</Text>
                          ) : (
                            <View style={[mStyles.badge, { backgroundColor: color }]}>
                              <Text style={mStyles.badgeText}>{avatarInitial(friend.name)}</Text>
                            </View>
                          )}
                        </View>
                        <View style={[mStyles.pinStem, { borderTopColor: color }]} />
                        {showLabel && visibility[`${friend.id}:label`] !== false && (
                          <View style={mStyles.label}>
                            <Text style={mStyles.labelName} numberOfLines={1}>{friend.name}</Text>
                            {showDistance && dist != null && (
                              <Text style={mStyles.labelDist}>{formatMapDistance(dist)}</Text>
                            )}
                          </View>
                        )}
                      </View>
                    </Marker>
                    {/* Per-pin close button */}
                    <Marker
                      coordinate={{ latitude: friend.latitude, longitude: friend.longitude }}
                      anchor={{ x: 0.5, y: 1 }}
                      centerOffset={{ x: 17, y: -34 }}
                      onPress={() => {
                        setVisible(friend.id, false);
                        if (selectedId === friend.id) setSelectedId(null);
                      }}
                      tracksViewChanges={false}
                    >
                      <View style={mStyles.closeBtn}>
                        <Text style={mStyles.closeX}>×</Text>
                      </View>
                    </Marker>
                  </React.Fragment>
                );
              })}
          </MapView>
                    {/* User Identity floating badge */}
          <View style={{
            position: 'absolute',
            bottom: 40,
            left: 20,
            backgroundColor: 'transparent',
            overflow: 'hidden',
            borderRadius: 20,
            paddingVertical: 5,
            paddingHorizontal: 15,
            flexDirection: 'row',
            alignItems: 'center',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.2,
            shadowRadius: 4,
            elevation: 4
          }}>
            <BlurView intensity={80} tint="light" style={{ ...StyleSheet.absoluteFillObject }} />
            {mode === 'spectate' && spectateFriend ? (
              spectateFriend.avatar && (spectateFriend.avatar.startsWith("file:") || spectateFriend.avatar.startsWith("http") || spectateFriend.avatar.startsWith("data:")) ? (
                <Image source={{ uri: spectateFriend.avatar }} style={{ width: 24, height: 24, borderRadius: 12, marginRight: 8 }} />
              ) : (
                <Text style={{ fontSize: 18, marginRight: 8 }}>{spectateFriend.avatar || "👤"}</Text>
              )
            ) : userAvatar && (userAvatar.startsWith("file:") || userAvatar.startsWith("http") || userAvatar.startsWith("data:")) ? (
              <Image source={{ uri: userAvatar }} style={{ width: 24, height: 24, borderRadius: 12, marginRight: 8 }} />
            ) : (
              <Text style={{ fontSize: 18, marginRight: 8 }}>{userAvatar || "👤"}</Text>
            )}
            <Text style={{ fontWeight: 'bold', color: '#24C789', fontSize: 14 }}>{mode === 'spectate' ? 'Watching: ' + (spectateFriend?.name || 'Live') : 'Tracking You'}</Text>
          </View>

          {/* Recenter Button */}
          <BouncyButton 
          style={[styles.recenterButton, { padding: 0 }]} 
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            recenterMap();
          }}
        >
          <BlurView intensity={80} tint="light" style={{ width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' }}>
            <Ionicons name="navigate" size={24} color="#000" />
          </BlurView>
          </BouncyButton>

          {/* Mini info card for the tapped friend. Anchored near the top so it
              never sits on top of the markers clustered around mid-map. */}
          {showFriendLayer && selectedFriend && (
            <View style={mStyles.cardWrap} pointerEvents="box-none">
              <View style={mStyles.card}>
                <View style={mStyles.cardHeader}>
                  <View style={[mStyles.cardAvatar, { borderColor: badgeColor(selectedFriend.id) }]}>
                    {isImageAvatar(selectedFriend.avatar) ? (
                      <Image source={{ uri: selectedFriend.avatar }} style={mStyles.cardAvatarImg} contentFit="cover" />
                    ) : isEmojiAvatar(selectedFriend.avatar) ? (
                      <Text style={{ fontSize: 20 }}>{selectedFriend.avatar}</Text>
                    ) : (
                      <View style={[mStyles.badge, { backgroundColor: badgeColor(selectedFriend.id), width: '100%', height: '100%' }]}>
                        <Text style={mStyles.badgeText}>{avatarInitial(selectedFriend.name)}</Text>
                      </View>
                    )}
                  </View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={mStyles.cardName} numberOfLines={1}>{selectedFriend.name}</Text>
                    <Text style={[mStyles.cardStatus, { color: selectedFriend.status === 'running' ? '#0B8A57' : '#5B6470' }]}>
                      {selectedFriend.status === 'running' ? '● 跑步中' : '已结束'}
                    </Text>
                  </View>
                  {distTo(selectedFriend) != null && (
                    <Text style={mStyles.cardDist}>{formatMapDistance(distTo(selectedFriend))}</Text>
                  )}
                  <BouncyButton
                    style={mStyles.cardClose}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    onPress={() => setSelectedId(null)}
                  >
                    <Ionicons name="close" size={16} color="#0B0F13" />
                  </BouncyButton>
                </View>
                <View style={mStyles.cardMetaRow}>
                  <Text style={mStyles.cardMeta}>{selectedFriend.distanceKm.toFixed(2)} km</Text>
                  <Text style={mStyles.cardSep}>·</Text>
                  <Text style={mStyles.cardMeta}>{formatDuration(selectedFriend.durationSec)}</Text>
                </View>
                <Text style={mStyles.cardMsg} numberOfLines={1}>{selectedFriend.lastMessage}</Text>
              </View>
            </View>
          )}
        </View>
        )}

        {liveEmojis.map((c, i) => (
          <FloatingEmoji
            key={c.id}
            emoji={c.emoji}
            onComplete={() =>
              setLiveEmojis((prev) => prev.filter((e) => e.id !== c.id))
            }
          />
        ))}

        {cheers.map((cheer, index) => (
          <View
            key={index}
            style={[styles.cheerBubble, { top: 50 + index * 60 }]}
          >
            <Text style={styles.cheerText}>{cheer.emoji}</Text>
          </View>
        ))}
      </View>
  );
}, (prevProps, nextProps) => {
  // Prevent re-render when only durationInSeconds (timer) changes!
  return (
    prevProps.region === nextProps.region &&
    prevProps.currentLocation === nextProps.currentLocation &&
    prevProps.runData.coordinates.length === nextProps.runData.coordinates.length &&
    prevProps.liveEmojis.length === nextProps.liveEmojis.length &&
    prevProps.cheers.length === nextProps.cheers.length &&
    prevProps.isRunning === nextProps.isRunning
  );
});

const mStyles = StyleSheet.create({
  avatarWrap: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#24C789',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  avatarImg: { width: '100%', height: '100%', borderRadius: 15 },
  badge: { alignItems: 'center', justifyContent: 'center', borderRadius: 15, width: '100%', height: '100%' },
  badgeText: { color: '#FFFFFF', fontWeight: '800', fontSize: 13 },
  pinStem: {
    width: 0,
    height: 0,
    marginTop: -1,
    borderLeftWidth: 4,
    borderRightWidth: 4,
    borderTopWidth: 6,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#24C789',
  },
  closeBtn: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#0B0F13',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeX: { color: '#FFFFFF', fontSize: 13, fontWeight: '700', lineHeight: 14 },
  label: {
    marginTop: 3,
    maxWidth: 150,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  labelName: { fontSize: 11, fontWeight: '700', color: '#0B0F13' },
  labelDist: { fontSize: 10, fontWeight: '700', color: '#24C789' },
  cardWrap: {
    position: 'absolute',
    top: '15%',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  card: {
    width: 240,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    shadowColor: '#0B0F13',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.22,
    shadowRadius: 16,
    elevation: 8,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  cardAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#24C789',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  cardAvatarImg: { width: '100%', height: '100%', borderRadius: 19 },
  cardName: { fontSize: 14, fontWeight: '800', color: '#0B0F13' },
  cardStatus: { fontSize: 11, fontWeight: '700', marginTop: 1 },
  cardDist: { fontSize: 12, fontWeight: '800', color: '#0B0F13' },
  cardClose: { padding: 2, marginLeft: 2 },
  cardMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
  cardMeta: { fontSize: 12, fontWeight: '700', color: '#0B0F13' },
  cardSep: { fontSize: 12, color: '#C2C7CE' },
  cardMsg: { fontSize: 11, color: '#5B6470', marginTop: 6 },
});

export default RunMapMemo;

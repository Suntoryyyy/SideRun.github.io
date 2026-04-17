import { Animated } from 'react-native';
import React from 'react';
import * as Haptics from 'expo-haptics';
import { BlurView } from 'expo-blur';
import { View, Text, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Polyline, Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import MapStyle from '../../screens/MapStyle.json';
import { Image } from 'expo-image';
import styles from '../../styles/RunScreenStyles';

const FloatingEmoji = ({ emoji, onComplete }) => {
  const [anim] = React.useState(new Animated.Value(0));

  React.useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration: 2000,
      useNativeDriver: true,
    }).start(onComplete);
  }, []);

  return (
    <Animated.View
      style={[
        styles.floatingEmoji,
        {
          bottom: anim.interpolate({
            inputRange: [0, 1],
            outputRange: [100, 400],
          }),
          opacity: anim.interpolate({
            inputRange: [0, 0.8, 1],
            outputRange: [1, 1, 0],
          }),
        },
      ]}
    >
      {emoji && (emoji.startsWith('data:image') || emoji.startsWith('file:') || emoji.startsWith('http')) ? (
        <Image source={{ uri: emoji }} style={{ width: 60, height: 60 }} contentFit="contain" />
      ) : (
        <Text style={styles.floatingEmojiText}>{emoji}</Text>
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
  return (
    <View style={styles.mapContainer}>
        {/* Floating Back Button */}
        <TouchableOpacity
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
        </TouchableOpacity>

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
            >
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
            {visibilityScope !== "private" && isRunning && liveFriends.map((friend) => (
                <Marker
                  key={friend.id}
                  coordinate={{
                    latitude: friend.latitude,
                    longitude: friend.longitude,
                  }}
                  title={`${friend.name} is running`}
                  anchor={{ x: 0.5, y: 0.5 }}
                >
                  <View
                    style={[
                      styles.avatarHaloOuter,
                      { backgroundColor: "rgba(36, 199, 137, 0.2)" },
                    ]}
                  >
                    <View
                      style={[
                        styles.avatarHaloInner,
                        { borderColor: "#24C789" },
                      ]}
                    >
                      <Text style={styles.mapAvatarEmoji}>{friend.avatar}</Text>
                    </View>
                  </View>
                </Marker>
              ))}
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
          <TouchableOpacity 
          style={[styles.recenterButton, { padding: 0 }]} 
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            recenterMap();
          }}
        >
          <BlurView intensity={80} tint="light" style={{ width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' }}>
            <Ionicons name="navigate" size={24} color="#000" />
          </BlurView>
          </TouchableOpacity>
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

export default RunMapMemo;

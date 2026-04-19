import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Platform, TouchableOpacity } from 'react-native';
import { MapContainer, TileLayer, Marker, Polyline, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';

// Fix leaflet icon paths
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

const RecenterControl = ({ location }) => {
  const map = useMap();
  useEffect(() => {
    if (location) {
      map.setView([location.latitude, location.longitude], map.getZoom());
    }
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
  userAvatar
}) => {
  const defaultCenter = [39.9042, 116.4074]; // Default to Beijing if no loc
  const mapCenter = currentLocation && currentLocation.latitude !== undefined
    ? [currentLocation.latitude, currentLocation.longitude] 
    : (spectateFriend && spectateFriend.latitude !== undefined ? [spectateFriend.latitude, spectateFriend.longitude] : defaultCenter);
    
  const polylinePositions = (runData?.coordinates || []).map(c => [c.latitude, c.longitude]);

  return (
    <View style={styles.container}>
      <MapContainer 
        center={mapCenter} 
        zoom={16} 
        style={{ width: '100%', height: '100%' }}
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {currentLocation && <RecenterControl location={currentLocation} />}
        
        {/* Draw the user's route */}
        {polylinePositions.length > 0 && (
          <Polyline positions={polylinePositions} color="#24C789" weight={5} />
        )}

        {/* Current user marker */}
        {currentLocation && mode !== 'spectate' && (
          <Marker position={[currentLocation.latitude, currentLocation.longitude]}>
            <Popup>{userAvatar ? `User: ${userAvatar}` : "You"}</Popup>
          </Marker>
        )}

        {/* Spectator target marker */}
        {mode === 'spectate' && spectateFriend && spectateFriend.latitude !== undefined && (
          <Marker position={[spectateFriend.latitude, spectateFriend.longitude]}>
            <Popup>{spectateFriend.name || 'Friend'}</Popup>
          </Marker>
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

      {/* Floating status badge */}
      <View style={styles.badgeContainer}>
        <BlurView intensity={80} tint="light" style={{ ...StyleSheet.absoluteFillObject }} />
        <Text style={styles.badgeText}>
          {mode === 'spectate' ? 'Watching: ' + (spectateFriend?.name || 'Live') : 'Tracking You (Web)'}
        </Text>
      </View>
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
    bottom: 40,
    left: 20,
    backgroundColor: 'transparent',
    overflow: 'hidden',
    borderRadius: 20,
    paddingVertical: 5,
    paddingHorizontal: 15,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4
  },
  badgeText: {
    fontWeight: 'bold', 
    color: '#24C789', 
    fontSize: 14
  }
});

export default React.memo(RunMapMemo);

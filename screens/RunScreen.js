import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Dimensions,
  ScrollView,
  Platform,
  UIManager,
  LayoutAnimation,
  Image
} from 'react-native';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import MapStyle from './MapStyle.json';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// Conditionally import MapView for native platforms only
let MapView, Polyline, Marker;
if (Platform.OS !== 'web') {
  const Maps = require('react-native-maps');
  MapView = Maps.default;
  Polyline = Maps.Polyline;
  Marker = Maps.Marker;
}

const { width, height } = Dimensions.get('window');

export default function RunScreen({ route, navigation }) {
  const { mode = 'solo' } = route?.params || {};
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [durationInSeconds, setDurationInSeconds] = useState(0);
  const [runData, setRunData] = useState({
    distance: 0,
    calories: 0,
    coordinates: [],
  });
  const [isPanelCollapsed, setIsPanelCollapsed] = useState(false);

  const togglePanel = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsPanelCollapsed(!isPanelCollapsed);
  };
  const [currentLocation, setCurrentLocation] = useState(null);
  const [region, setRegion] = useState(null);
  const [friendsWatching, setFriendsWatching] = useState(2);
  const [userAvatar, setUserAvatar] = useState(null);
  const [cheers, setCheers] = useState([]);

  const watchId = useRef(null);
  const lastLocation = useRef(null);

  useEffect(() => {
    let interval;
    if (isRunning && !isPaused) {
      interval = setInterval(() => {
        setDurationInSeconds(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning, isPaused]);

  useEffect(() => {
    requestLocationPermission();
    loadUserAvatar();
    return () => {
      if (watchId.current) {
        watchId.current.remove();
      }
    };
  }, []);

  const loadUserAvatar = async () => {
    try {
      const currentUser = await AsyncStorage.getItem('currentUser');
      if (currentUser) {
        const users = await AsyncStorage.getItem('users');
        if (users) {
          const parsedUsers = JSON.parse(users);
          const found = parsedUsers.find(u => u.username === currentUser);
          if (found && found.avatar) {
            setUserAvatar(found.avatar);
          }
        }
      }
    } catch (e) {
      console.log(e);
    }
  };

  const requestLocationPermission = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission denied', 'Location permission is required for run tracking.');
      return;
    }
    getCurrentLocation();
  };

  const getCurrentLocation = async () => {
    try {
      let location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      if (!location) {
        location = await Location.getLastKnownPositionAsync();
      }
      if (location) {
        const { latitude, longitude } = location.coords;
        setCurrentLocation({ latitude, longitude });
        setRegion({
          latitude,
          longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        });
      }
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert('GPS Error', 'Could not get current location. Ensure GPS is enabled.');
    }
  };

  const startRun = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    if (!currentLocation) {
      Alert.alert('Location not available', 'Please wait for location to be determined.');
      return;
    }

    setIsRunning(true);
    setIsPaused(false);
    setDurationInSeconds(0);
    lastLocation.current = currentLocation;

    setRunData({
      distance: 0,
      calories: 0,
      coordinates: [currentLocation],
    });

    watchId.current = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        timeInterval: 3000,
        distanceInterval: 5, // Requires 5 meters movement
      },
      (location) => {
        const { latitude, longitude } = location.coords;
        const newLocation = { latitude, longitude };

        setCurrentLocation(newLocation);
        
        const distFromLast = lastLocation.current ? getDistance(lastLocation.current, newLocation) : 0;
        
        // Filter out GPS drift: only add if we moved more than 5 meters (0.005 km)
        // but less than 1km at once (prevents huge jumps in GPS)
        if (distFromLast > 0.005 && distFromLast < 1.0) {
          lastLocation.current = newLocation;
          setRunData(prev => {
            const newCoords = [...prev.coordinates, newLocation];
            const newDistance = prev.distance + distFromLast;
            const calories = newDistance * 60; // rough estimate

            return {
              ...prev,
              distance: newDistance,
              calories,
              coordinates: newCoords,
            };
          });
        }
      }
    );
  };

  const pauseRun = () => {
    setIsPaused(true);
    if (watchId.current) {
      watchId.current.remove();
      watchId.current = null;
    }
  };

  const resumeRun = async () => {
    setIsPaused(false);
    watchId.current = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        timeInterval: 3000,
        distanceInterval: 5,
      },
      (location) => {
        const { latitude, longitude } = location.coords;
        const newLocation = { latitude, longitude };

        setCurrentLocation(newLocation);
        
        const distFromLast = lastLocation.current ? getDistance(lastLocation.current, newLocation) : 0;
        
        if (distFromLast > 0.005 && distFromLast < 1.0) {
          lastLocation.current = newLocation;
          setRunData(prev => {
            const newCoords = [...prev.coordinates, newLocation];
            const newDistance = prev.distance + distFromLast;
            const calories = newDistance * 60;

            return {
              ...prev,
              distance: newDistance,
              calories,
              coordinates: newCoords,
            };
          });
        }
      }
    );
  };

  const stopRun = async () => {
    setIsRunning(false);
    setIsPaused(false);
    if (watchId.current) {
      watchId.current.remove();
      watchId.current = null;
    }

    const currentDurationMinutes = durationInSeconds / 60;
    const finalPace = runData.distance > 0 ? (currentDurationMinutes / runData.distance) : 0;

    // Save run data
    try {
      const runRecord = {
        date: new Date().toLocaleDateString(),
        distance: runData.distance.toFixed(2),
        duration: formatDuration(durationInSeconds),
        pace: finalPace.toFixed(1),
        calories: Math.round(runData.calories),
        coordinates: runData.coordinates,
      };

      const existingRuns = await AsyncStorage.getItem('recentRuns');
      const runs = existingRuns ? JSON.parse(existingRuns) : [];
      runs.unshift(runRecord);
      await AsyncStorage.setItem('recentRuns', JSON.stringify(runs.slice(0, 10))); // Keep last 10

      // Update user stats
      const stats = await AsyncStorage.getItem('userStats');
      const userStats = stats ? JSON.parse(stats) : {
        totalDistance: 0,
        totalRuns: 0,
        weeklyDistance: 0,
        weeklyRuns: 0,
      };

      userStats.totalDistance += runData.distance;
      userStats.totalRuns += 1;
      userStats.weeklyDistance += runData.distance;
      userStats.weeklyRuns += 1;

      await AsyncStorage.setItem('userStats', JSON.stringify(userStats));

      Alert.alert('Run Completed!', `Distance: ${runData.distance.toFixed(2)} km\nDuration: ${formatDuration(durationInSeconds)}`);
      navigation.goBack();
    } catch (error) {
      console.error('Error saving run:', error);
    }
  };

  const calculateDistance = (coords) => {
    if (coords.length < 2) return 0;
    let totalDistance = 0;
    for (let i = 1; i < coords.length; i++) {
      totalDistance += getDistance(coords[i - 1], coords[i]);
    }
    return totalDistance;
  };

  const getDistance = (coord1, coord2) => {
    if (!coord1 || !coord2) return 0;
    const R = 6371; // Earth's radius in km
    const dLat = (coord2.latitude - coord1.latitude) * Math.PI / 180;
    const dLon = (coord2.longitude - coord1.longitude) * Math.PI / 180;
    const a =
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(coord1.latitude * Math.PI / 180) * Math.cos(coord2.latitude * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const formatDuration = (totalSeconds) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const sendCheer = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const emojis = ['💪', '🔥', '🏃‍♂️', '🎉', '👍'];
    const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
    setCheers(prev => [...prev, { emoji: randomEmoji, time: Date.now() }]);
    setTimeout(() => {
      setCheers(prev => prev.slice(1));
    }, 3000);
  };

  const currentPace = (runData.distance > 0) ? ((durationInSeconds / 60) / runData.distance).toFixed(1) : '0.0';

  if (!region) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Getting your location...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.mapContainer}>
        {/* Floating Back Button */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
        >
          <Ionicons name="arrow-back" size={28} color="#333" />
        </TouchableOpacity>

        {Platform.OS === 'web' ? (
          // Real OpenStreetMap embed for web fallback
          <div style={{ width: '100%', height: '100%', borderRadius: 8, overflow: 'hidden' }}>
            <iframe
              width="100%"
              height="100%"
              frameBorder="0"
              scrolling="no"
              marginHeight="0"
              marginWidth="0"
              src={`https://www.openstreetmap.org/export/embed.html?bbox=${region.longitude - 0.005},${region.latitude - 0.005},${region.longitude + 0.005},${region.latitude + 0.005}&layer=mapnik&marker=${currentLocation?.latitude || region.latitude},${currentLocation?.longitude || region.longitude}`}
              style={{ border: 'none' }}
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
          <MapView
            style={styles.map}
            region={region}
            showsUserLocation={false}
            followsUserLocation={true}
            customMapStyle={MapStyle}
          >
            {runData.coordinates.length > 1 && (
              <Polyline
                coordinates={runData.coordinates}
                strokeColor="#FF9500"
                strokeWidth={4}
              />
            )}
            {currentLocation && (
              <Marker coordinate={currentLocation} title="You are here" anchor={{ x: 0.5, y: 0.5 }}>
                <View style={styles.avatarHaloOuter}>
                  <View style={styles.avatarHaloInner}>
                    {userAvatar && (userAvatar.startsWith('file:') || userAvatar.startsWith('http') || userAvatar.startsWith('data:')) ? (
                      <Image source={{ uri: userAvatar }} style={styles.mapAvatarImage} />
                    ) : (
                      <Text style={styles.mapAvatarEmoji}>{userAvatar || '👤'}</Text>
                    )}
                  </View>
                </View>
              </Marker>
            )}
          </MapView>
        )}

        {cheers.map((cheer, index) => (
          <View key={index} style={[styles.cheerBubble, { top: 50 + index * 60 }]}>
            <Text style={styles.cheerText}>{cheer.emoji}</Text>
          </View>
        ))}
      </View>

      <View style={[styles.dashboardContainer, isPanelCollapsed && styles.dashboardCollapsed]}>
        <TouchableOpacity 
          style={styles.dragHandleContainer} 
          activeOpacity={0.8} 
          onPress={togglePanel}
        >
          <View style={styles.dragHandle} />
        </TouchableOpacity>
        
        {!isPanelCollapsed && (
          <View style={styles.statsContainer}>
            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{runData.distance.toFixed(2)}</Text>
                <Text style={styles.statLabel}>KILOMETERS</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{formatDuration(durationInSeconds)}</Text>
                <Text style={styles.statLabel}>TIME</Text>
              </View>
            </View>
            
            <View style={[styles.statsRow, { marginTop: 24 }]}>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{currentPace}</Text>
                <Text style={styles.statLabel}>CURRENT PACE</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{Math.round(runData.calories)}</Text>
                <Text style={styles.statLabel}>KCAL BURNED</Text>
              </View>
            </View>

            {mode === 'shared' && (
              <Text style={styles.friendsText}>👥 {friendsWatching} friends watching</Text>
            )}
          </View>
        )}

        <View style={styles.controlsContainer}>
          {!isRunning ? (
            <TouchableOpacity style={styles.circleStartButton} onPress={startRun}>
              <Text style={styles.circleStartText}>GO</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.activeControls}>
              {isPaused ? (
                <TouchableOpacity style={styles.circleResumeButton} onPress={resumeRun}>
                  <Text style={styles.circleButtonText}>RESUME</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity style={styles.circlePauseButton} onPress={pauseRun}>
                  <Text style={styles.circleButtonText}>PAUSE</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity style={styles.circleStopButton} onPress={stopRun}>
                <Text style={styles.circleButtonText}>FINISH</Text>
              </TouchableOpacity>
            </View>
          )}

          {mode === 'shared' && isRunning && (
            <TouchableOpacity style={styles.cheerButton} onPress={sendCheer}>
              <Text style={styles.cheerButtonText}>Send Cheer 🎉</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F5F7',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F4F5F7',
  },
  loadingText: {
    fontSize: 16,
    color: '#888',
    fontWeight: '500',
  },
  mapContainer: {
    height: height * 0.55,
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : (Platform.OS === 'web' ? 90 : 40),
    left: 20,
    zIndex: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 20,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  cheerBubble: {
    position: 'absolute',
    right: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 25,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  cheerText: {
    fontSize: 26,
  },
  dashboardContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    marginTop: -30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 8,
    paddingTop: 10,
    paddingBottom: 20,
    justifyContent: 'space-between',
  },
  dashboardCollapsed: {
    flex: 0,
    height: 180,
    justifyContent: 'flex-start',
  },
  dragHandleContainer: {
    width: '100%',
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dragHandle: {
    width: 40,
    height: 5,
    backgroundColor: '#E0E0E0',
    borderRadius: 2.5,
  },
  avatarHaloOuter: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 149, 0, 0.3)', // Tailing halo effect
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarHaloInner: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FF9500',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 4,
    borderWidth: 2,
    borderColor: '#FF9500',
    overflow: 'hidden',
  },
  mapAvatarImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  mapAvatarEmoji: {
    fontSize: 18,
  },
  statsContainer: {
    paddingHorizontal: 40,
    paddingTop: 5,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statBox: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#222222',
    fontVariant: ['tabular-nums'],
  },
  statLabel: {
    fontSize: 12,
    color: '#999999',
    marginTop: 4,
    fontWeight: '600',
    letterSpacing: 1,
  },
  friendsText: {
    textAlign: 'center',
    fontSize: 14,
    color: '#24C789',
    marginTop: 14,
    fontWeight: '600',
  },
  controlsContainer: {
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: Platform.OS === 'ios' ? 20 : 0,
  },
  circleStartButton: {
    backgroundColor: '#24C789',
    width: 90,
    height: 90,
    borderRadius: 45,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#24C789',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  circleStartText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  activeControls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    paddingHorizontal: 20,
  },
  circlePauseButton: {
    backgroundColor: '#FF9500',
    width: 75,
    height: 75,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  circleResumeButton: {
    backgroundColor: '#24C789',
    width: 75,
    height: 75,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  circleStopButton: {
    backgroundColor: '#FF453A',
    width: 75,
    height: 75,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  circleButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  cheerButton: {
    backgroundColor: '#F0F0F0',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    alignItems: 'center',
    marginTop: 20,
  },
  cheerButtonText: {
    color: '#444',
    fontSize: 14,
    fontWeight: '600',
  },
  webMapOverlayCard: {
    position: 'absolute',
    top: Platform.OS === 'web' ? 20 : 40,
    right: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    zIndex: 10,
    alignItems: 'flex-end',
  },
  webMapOverlayText: {
    color: '#24C789',
    fontWeight: '800',
    fontSize: 14,
  },
  webMapOverlayCoords: {
    color: '#666',
    fontWeight: '600',
    fontSize: 12,
    marginTop: 2,
  },
});

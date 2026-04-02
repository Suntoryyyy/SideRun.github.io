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
} from 'react-native';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
  const [runData, setRunData] = useState({
    distance: 0,
    duration: 0,
    pace: 0,
    calories: 0,
    coordinates: [],
  });
  const [currentLocation, setCurrentLocation] = useState(null);
  const [region, setRegion] = useState(null);
  const [friendsWatching, setFriendsWatching] = useState(2);
  const [cheers, setCheers] = useState([]);

  const watchId = useRef(null);
  const startTime = useRef(null);
  const lastLocation = useRef(null);

  useEffect(() => {
    requestLocationPermission();
    return () => {
      if (watchId.current) {
        watchId.current.remove();
      }
    };
  }, []);

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
    if (!currentLocation) {
      Alert.alert('Location not available', 'Please wait for location to be determined.');
      return;
    }

    setIsRunning(true);
    setIsPaused(false);
    startTime.current = Date.now();
    lastLocation.current = currentLocation;

    setRunData(prev => ({
      ...prev,
      coordinates: [currentLocation],
    }));

    watchId.current = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        timeInterval: 5000,
        distanceInterval: 10,
      },
      (location) => {
        const { latitude, longitude } = location.coords;
        const newLocation = { latitude, longitude };

        setCurrentLocation(newLocation);
        setRunData(prev => {
          const newCoords = [...prev.coordinates, newLocation];
          const distance = calculateDistance(newCoords);
          const duration = (Date.now() - startTime.current) / 1000 / 60; // minutes
          const pace = duration > 0 ? distance / duration : 0;
          const calories = distance * 60; // rough estimate

          return {
            ...prev,
            distance,
            duration,
            pace,
            calories,
            coordinates: newCoords,
          };
        });
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
        timeInterval: 5000,
        distanceInterval: 10,
      },
      (location) => {
        const { latitude, longitude } = location.coords;
        const newLocation = { latitude, longitude };

        setCurrentLocation(newLocation);
        setRunData(prev => {
          const newCoords = [...prev.coordinates, newLocation];
          const distance = calculateDistance(newCoords);
          const duration = (Date.now() - startTime.current) / 1000 / 60;
          const pace = duration > 0 ? distance / duration : 0;
          const calories = distance * 60;

          return {
            ...prev,
            distance,
            duration,
            pace,
            calories,
            coordinates: newCoords,
          };
        });
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

    // Save run data
    try {
      const runRecord = {
        date: new Date().toLocaleDateString(),
        distance: runData.distance.toFixed(2),
        duration: formatDuration(runData.duration),
        pace: runData.pace.toFixed(1),
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

      Alert.alert('Run Completed!', `Distance: ${runData.distance.toFixed(2)} km\nDuration: ${formatDuration(runData.duration)}`);
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

  const formatDuration = (minutes) => {
    const hrs = Math.floor(minutes / 60);
    const mins = Math.floor(minutes % 60);
    const secs = Math.floor((minutes % 1) * 60);
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const sendCheer = () => {
    const emojis = ['💪', '🔥', '🏃‍♂️', '🎉', '👍'];
    const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
    setCheers(prev => [...prev, { emoji: randomEmoji, time: Date.now() }]);
    setTimeout(() => {
      setCheers(prev => prev.slice(1));
    }, 3000);
  };

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
        {Platform.OS === 'web' ? (
          // Web fallback - show a simple map placeholder
          <View style={styles.webMapPlaceholder}>
            <Text style={styles.webMapText}>🗺️ Map View</Text>
            <Text style={styles.webMapSubtext}>GPS tracking active</Text>
            {runData.coordinates.length > 0 && (
              <Text style={styles.webMapCoords}>
                Route: {runData.coordinates.length} points tracked
              </Text>
            )}
          </View>
        ) : (
          // Native map view
          <MapView
            style={styles.map}
            region={region}
            showsUserLocation={true}
            followsUserLocation={true}
          >
            {runData.coordinates.length > 1 && (
              <Polyline
                coordinates={runData.coordinates}
                strokeColor="#FF9500"
                strokeWidth={4}
              />
            )}
            {currentLocation && (
              <Marker coordinate={currentLocation} title="You are here" />
            )}
          </MapView>
        )}

        {cheers.map((cheer, index) => (
          <View key={index} style={[styles.cheerBubble, { top: 50 + index * 60 }]}>
            <Text style={styles.cheerText}>{cheer.emoji}</Text>
          </View>
        ))}
      </View>

      <View style={styles.dashboardContainer}>
        <View style={styles.statsContainer}>
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{runData.distance.toFixed(2)}</Text>
              <Text style={styles.statLabel}>KILOMETERS</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{formatDuration(runData.duration)}</Text>
              <Text style={styles.statLabel}>TIME</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{runData.pace.toFixed(1)}</Text>
              <Text style={styles.statLabel}>PACE</Text>
            </View>
          </View>

          {mode === 'shared' && (
            <Text style={styles.friendsText}>👥 {friendsWatching} friends watching</Text>
          )}
        </View>

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
  statsContainer: {
    paddingHorizontal: 20,
    paddingTop: 15,
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
  webMapPlaceholder: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#EAEAEA',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  webMapText: {
    fontSize: 24,
    color: '#888',
    marginBottom: 8,
  },
  webMapSubtext: {
    fontSize: 16,
    color: '#AAA',
    marginBottom: 4,
  },
  webMapCoords: {
    fontSize: 14,
    color: '#24C789',
    fontWeight: 'bold',
  }
});

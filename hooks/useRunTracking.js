import { useState, useEffect, useRef } from "react";
import * as Location from "expo-location";
import * as TaskManager from 'expo-task-manager';

const BACKGROUND_LOCATION_TASK = "BACKGROUND_LOCATION_TASK";
import { Alert } from "react-native";
import useUserStore from '../store/useUserStore';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "../services/supabase";
import * as Haptics from "expo-haptics";
import { getDistance } from "../utils/locationUtils";
import { formatDuration } from "../utils/timeUtils";

export function useRunTracking(visibilityScope, userAvatar, navigation, mode) {
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [durationInSeconds, setDurationInSeconds] = useState(0);
  const [runData, setRunData] = useState({
    distance: 0,
    calories: 0,
    coordinates: [],
  });
  const [currentLocation, setCurrentLocation] = useState(null);
  const [region, setRegion] = useState(null);
  const [liveFriends, setLiveFriends] = useState([]);
  const [signalLost, setSignalLost] = useState(false);
  const lastUpdateTime = useRef(Date.now());

  const watchId = useRef(null);
  const lastLocation = useRef(null);

  useEffect(() => {
    if (mode === "spectate" && navigation && navigation.getState) {
      // Mock tracking a friend
      setIsRunning(true);
      const mockStartLat = 37.78825;
      
    const heartbeat = setInterval(() => {
      if (Date.now() - lastUpdateTime.current > 10000) {
        setSignalLost(true);
      } else {
        setSignalLost(false);
      }
    }, 5000);

      const mockStartLng = -122.4324;
      setCurrentLocation({ latitude: mockStartLat, longitude: mockStartLng });
      setRegion({
        latitude: mockStartLat,
        longitude: mockStartLng,
        latitudeDelta: 0.025,
        longitudeDelta: 0.025,
      });
      setDurationInSeconds(1240); // 20 minutes in
      setRunData({
        distance: 4.5,
        calories: 320,
        coordinates: [{ latitude: mockStartLat, longitude: mockStartLng }],
      });
      
      const interval = setInterval(() => {
        setRunData(prev => {
          const lastLoc = prev.coordinates[prev.coordinates.length - 1] || { latitude: mockStartLat, longitude: mockStartLng };
          const newLoc = {
            latitude: lastLoc.latitude + 0.0001,
            longitude: lastLoc.longitude + 0.0001
          };
          setCurrentLocation(newLoc);
          lastUpdateTime.current = Date.now();
          return {
            ...prev,
            distance: prev.distance + 0.015,
            calories: prev.calories + 1,
            coordinates: [...prev.coordinates, newLoc]
          };
        });
      }, 3000);
      return () => { clearInterval(interval); clearInterval(heartbeat); };
    }
  }, [mode]);


  useEffect(() => {
    let interval;
    if (isRunning && !isPaused) {
      interval = setInterval(
        () => setDurationInSeconds((prev) => prev + 1),
        1000,
      );
    }
    return () => clearInterval(interval);
  }, [isRunning, isPaused]);

  useEffect(() => {
    if (mode !== "spectate") requestLocationPermission();
    return () => {
      if (watchId.current) watchId.current.remove();
    };
  }, []);

  const requestLocationPermission = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission denied",
        "Location permission is required for run tracking.",
      );
      return;
    }
    getCurrentLocation();
  };

  const getCurrentLocation = async () => {
    try {
      let location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      if (!location) location = await Location.getLastKnownPositionAsync();
      if (location) {
        const { latitude, longitude } = location.coords;
        setCurrentLocation({ latitude, longitude });
        setRegion({
          latitude,
          longitude,
          latitudeDelta: 0.025,
          longitudeDelta: 0.025,
        });
      }
    } catch (error) {
      console.error("Error getting location:", error);
      Alert.alert("GPS Error", "Could not get current location.");
    }
  };

  const startRun = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    if (!currentLocation)
      return Alert.alert(
        "Location not available",
        "Please wait for location to be determined.",
      );

    if (visibilityScope !== "private") {
      setLiveFriends([
        {
          id: 1,
          name: "Alice",
          avatar: "👩‍💼",
          latitude: currentLocation.latitude + 0.002,
          longitude: currentLocation.longitude + 0.001,
        },
        {
          id: 2,
          name: "Charlie",
          avatar: "👨‍🎨",
          latitude: currentLocation.latitude - 0.001,
          longitude: currentLocation.longitude - 0.003,
        },
      ]);
    } else {
      setLiveFriends([]);
    }

    setIsRunning(true);
    setIsPaused(false);
    setDurationInSeconds(0);
    lastLocation.current = currentLocation;
    setRunData({ distance: 0, calories: 0, coordinates: [currentLocation] });

    watchId.current = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.BestForNavigation,
        timeInterval: 2000,
        distanceInterval: 1,
      },
      (location) => updateLocation(location),
    );
  };

  const updateLocation = (location) => {
    // 2. High-accuracy GPS filter setup
    if (location.coords.accuracy > 15) {
      console.log("Ignored poor accuracy location:", location.coords.accuracy);
      return;
    }

    const { latitude, longitude } = location.coords;
    const newLocation = { latitude, longitude };
    setCurrentLocation(newLocation);
    
    // Convert 0.005 km (5 meters) to something smaller for short distances
    const distFromLast = lastLocation.current
      ? getDistance(lastLocation.current, newLocation)
      : 0;

    if (distFromLast > 0.001 && distFromLast < 1.0) {
      lastLocation.current = newLocation;
      setRunData((prev) => ({
        ...prev,
        distance: prev.distance + distFromLast,
        calories: (prev.distance + distFromLast) * 60,
        coordinates: [...prev.coordinates, newLocation],
      }));
    }
  };

  const pauseRun = () => {
    setIsPaused(true);
    if (watchId.current) {
      watchId.current.remove();
      watchId.current = null;
    }
    Location.hasStartedLocationUpdatesAsync(BACKGROUND_LOCATION_TASK).then(started => {
      if (started) {
        Location.stopLocationUpdatesAsync(BACKGROUND_LOCATION_TASK).catch(e => console.log(e));
      }
    });
  };

  const resumeRun = async () => {
    setIsPaused(false);
    watchId.current = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.BestForNavigation,
        timeInterval: 2000,
        distanceInterval: 1,
      },
      (location) => updateLocation(location),
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
    const finalPace =
      runData.distance > 0 ? currentDurationMinutes / runData.distance : 0;

    try {
      const runRecord = {
        date: new Date().toLocaleDateString(),
        distance: runData.distance.toFixed(2),
        duration: formatDuration(durationInSeconds),
        pace: finalPace.toFixed(1),
        calories: Math.round(runData.calories),
        coordinates: runData.coordinates,
        scope: visibilityScope,
      };

      const c = await AsyncStorage.getItem("currentUser");
      let userId = null;
      if (c) {
        const parsed = JSON.parse(c);
        userId = parsed.id;
      }

      // Save run to cloud Supabase runs table
      if (userId) {
        const { error: runErr } = await supabase.from("runs").insert([
          {
            user_id: userId,
            distance: runData.distance,
            duration_seconds: durationInSeconds,
            pace: finalPace,
            calories: runData.calories,
          },
        ]);
        if (runErr) console.error("Save Run Error", runErr);

        if (visibilityScope !== "private") {
          // Push to feed
          const { error: feedErr } = await supabase.from("feed").insert([
            {
              user_id: userId,
              distance: runData.distance,
              pace: finalPace,
              duration: formatDuration(durationInSeconds),
            },
          ]);
        }

        // Fetch current user stats and increments them
        const { data: userData } = await supabase
          .from("users")
          .select("weeklyDistance, totalRuns")
          .eq("id", userId)
          .single();
        if (userData) {
          await supabase
            .from("users")
            .update({
              weeklyDistance: (userData.weeklyDistance || 0) + runData.distance,
              totalRuns: (userData.totalRuns || 0) + 1,
            })
            .eq("id", userId);
        }
      }
      try {
        await AsyncStorage.removeItem(`liveRun_${c}`);
      } catch (e) {}

      // Removed Alert to show summary on screen
      setIsFinished(true);
    } catch (error) {
      console.error("Error saving run:", error);
    }
  };

  const closeRun = () => {
    setIsFinished(false);
    navigation.goBack();
  };

  return {
    signalLost,
    isRunning,
    isPaused,
    durationInSeconds,
    runData,
    currentLocation,
    region,
    liveFriends,
    startRun,
    pauseRun,
    resumeRun,
    stopRun,
    isFinished,
    closeRun,
  };
}

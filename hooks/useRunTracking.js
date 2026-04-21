import { useState, useEffect, useRef } from "react";
import * as Location from "expo-location";
import * as TaskManager from 'expo-task-manager';

const BACKGROUND_LOCATION_TASK = "BACKGROUND_LOCATION_TASK";
import { Alert, Platform } from "react-native";
import useUserStore from '../store/useUserStore';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "../services/supabase";
import * as Haptics from "expo-haptics";
import { getDistance } from "../utils/locationUtils";
import { formatDuration } from "../utils/timeUtils";
import useDemoMode from "./useDemoMode";

export function useRunTracking(visibilityScope, userAvatar, navigation, mode) {
  const {
    isDemoMode,
    demoRegion,
    demoLocation,
    demoSpeed,
    demoCoordinates,
    resetDemo,
  } = useDemoMode();

  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [durationInSeconds, setDurationInSeconds] = useState(0);
  const [runData, setRunData] = useState({
    distance: 0,
    calories: 0,
    coordinates: [],
    splits: [], // Array of { km: number, paceMinPerKm: number, durationSec: number }
  });

  // Tracks the cumulative duration at which the last whole-km was crossed.
  const lastSplitDistRef = useRef(0); // km floored at last split
  const lastSplitTimeRef = useRef(0); // durationInSeconds at last split
  // Keep a live ref so the callback always sees the current duration.
  const durationRef = useRef(0);
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
      const mockStartLat = 37.7674; // Kezar Stadium
      const mockStartLng = -122.4554;
      
    const heartbeat = setInterval(() => {
      if (Date.now() - lastUpdateTime.current > 10000) {
        setSignalLost(true);
      } else {
        setSignalLost(false);
      }
    }, 5000);

      setCurrentLocation({ latitude: mockStartLat + 0.0004 * Math.sin(0), longitude: mockStartLng + 0.0008 * Math.cos(0) });
      setRegion({
        latitude: mockStartLat,
        longitude: mockStartLng,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      });
      setDurationInSeconds(1240); // 20 minutes in
      setRunData({
        distance: 4.5,
        calories: 320,
        coordinates: [{ latitude: mockStartLat + 0.0004 * Math.sin(0), longitude: mockStartLng + 0.0008 * Math.cos(0) }],
      });
      
      let simTime = 0;
      const interval = setInterval(() => {
        simTime += 0.05;
        setRunData(prev => {
          const newLoc = {
            latitude: mockStartLat + 0.0004 * Math.sin(simTime),
            longitude: mockStartLng + 0.0008 * Math.cos(simTime)
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
      interval = setInterval(() => {
        setDurationInSeconds((prev) => {
          const next = prev + 1;
          durationRef.current = next;
          return next;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning, isPaused]);

  useEffect(() => {
    if (mode !== "spectate" && !isDemoMode) requestLocationPermission();
    if (isDemoMode && mode !== "spectate") {
      // Seed the map with the demo start location immediately.
      setCurrentLocation(demoLocation);
      setRegion(demoRegion);
    }
    return () => {
      if (watchId.current) watchId.current.remove();
    };
  }, [isDemoMode]);

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
        accuracy: Location.Accuracy.BestForNavigation,
      });
      if (!location) location = await Location.getLastKnownPositionAsync();
      if (location) {
        const { latitude, longitude } = location.coords;
        setCurrentLocation({ latitude, longitude });
        setRegion({
          latitude,
          longitude,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        });
      }
    } catch (error) {
      console.error("Error getting location:", error);
      Alert.alert("GPS Error", "Could not get current location.");
    }
  };

  const wakeLockRef = useRef(null);

  const requestWakeLock = async () => {
    if (Platform.OS === "web" && "wakeLock" in navigator) {
      try {
        wakeLockRef.current = await navigator.wakeLock.request("screen");
        console.log("Wake Lock is active!");
      } catch (err) {
        console.warn(`Wake Lock Error: ${err.name}, ${err.message}`);
      }
    }
  };

  const releaseWakeLock = async () => {
    if (wakeLockRef.current !== null && Platform.OS === "web") {
      try {
        await wakeLockRef.current.release();
        wakeLockRef.current = null;
        console.log("Wake Lock has been released.");
      } catch (err) {
        console.warn(`Failed to release Wake Lock: ${err.name}, ${err.message}`);
      }
    }
  };

  // Re-request wake lock when page regains visibility (if currently running)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (typeof document !== "undefined" && document.visibilityState === "visible" && isRunning && !isPaused && wakeLockRef.current === null) {
        requestWakeLock();
      }
    };
    if (Platform.OS === "web" && typeof document !== "undefined") {
      document.addEventListener("visibilitychange", handleVisibilityChange);
      return () => {
        document.removeEventListener("visibilitychange", handleVisibilityChange);
      };
    }
  }, [isRunning, isPaused]);

  // Track demo GPS updates during an active run.
  const prevDemoCoordLen = useRef(0);
  useEffect(() => {
    if (!isDemoMode || !isRunning || isPaused) return;
    const newPts = demoCoordinates.slice(prevDemoCoordLen.current);
    if (newPts.length === 0) return;
    prevDemoCoordLen.current = demoCoordinates.length;

    newPts.forEach((newLoc) => {
      setCurrentLocation({ latitude: newLoc.latitude, longitude: newLoc.longitude });
      const distFromLast = lastLocation.current
        ? getDistance(lastLocation.current, newLoc)
        : 0;
      if (distFromLast > 0.001 && distFromLast < 1.0) {
        lastLocation.current = newLoc;
        setRunData((prev) => {
          const newDist = prev.distance + distFromLast;
          const crossedKm = Math.floor(newDist);
          const prevKm = Math.floor(prev.distance);
          let newSplits = prev.splits;
          if (crossedKm > prevKm && crossedKm > 0) {
            const splitDurSec = durationRef.current - lastSplitTimeRef.current;
            const splitDistKm = crossedKm - lastSplitDistRef.current;
            const paceMinPerKm = splitDistKm > 0 ? splitDurSec / 60 / splitDistKm : 0;
            newSplits = [...prev.splits, { km: crossedKm, paceMinPerKm, durationSec: splitDurSec }];
            lastSplitDistRef.current = crossedKm;
            lastSplitTimeRef.current = durationRef.current;
          }
          return {
            ...prev,
            distance: newDist,
            calories: newDist * 60,
            coordinates: [...prev.coordinates, newLoc],
            splits: newSplits,
          };
        });
      }
    });
  }, [demoCoordinates, isDemoMode, isRunning, isPaused]);

  const startRun = async () => {
    requestWakeLock();
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
    durationRef.current = 0;
    lastSplitDistRef.current = 0;
    lastSplitTimeRef.current = 0;
    prevDemoCoordLen.current = demoCoordinates.length;
    lastLocation.current = currentLocation;
    setRunData({ distance: 0, calories: 0, coordinates: [currentLocation], splits: [] });

    if (isDemoMode) return; // demo location is fed via the useEffect above

    watchId.current = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.BestForNavigation,
        timeInterval: 1000,
        distanceInterval: 1,
      },
      (location) => updateLocation(location),
    );
  };

  const updateLocation = (location) => {
    // 2. High-accuracy GPS filter setup
    if (location.coords.accuracy > 30) {
      console.log("Ignored poor accuracy location:", location.coords.accuracy);
      return;
    }

    const { latitude, longitude } = location.coords;
    const newLocation = { latitude, longitude, timestamp: Date.now() };
    setCurrentLocation({ latitude, longitude });
    
    // Convert 0.005 km (5 meters) to something smaller for short distances
    const distFromLast = lastLocation.current
      ? getDistance(lastLocation.current, newLocation)
      : 0;

    if (distFromLast > 0.001 && distFromLast < 1.0) {
      lastLocation.current = newLocation;
      setRunData((prev) => {
        const newDist = prev.distance + distFromLast;
        const newCals = newDist * 60;

        // Detect crossing each 1-km milestone and record a real split.
        const crossedKm = Math.floor(newDist);
        const prevKm = Math.floor(prev.distance);
        let newSplits = prev.splits;
        if (crossedKm > prevKm && crossedKm > 0) {
          const splitDurSec = durationRef.current - lastSplitTimeRef.current;
          const splitDistKm = crossedKm - lastSplitDistRef.current;
          const paceMinPerKm = splitDistKm > 0 ? splitDurSec / 60 / splitDistKm : 0;
          newSplits = [
            ...prev.splits,
            { km: crossedKm, paceMinPerKm, durationSec: splitDurSec },
          ];
          lastSplitDistRef.current = crossedKm;
          lastSplitTimeRef.current = durationRef.current;
        }

        return {
          ...prev,
          distance: newDist,
          calories: newCals,
          coordinates: [...prev.coordinates, newLocation],
          splits: newSplits,
        };
      });
    }
  };

  const pauseRun = () => {
    setIsPaused(true);
    if (watchId.current) {
      watchId.current.remove();
      watchId.current = null;
    }
    if (Platform.OS !== "web") {
      Location.hasStartedLocationUpdatesAsync(BACKGROUND_LOCATION_TASK)
        .then((started) => {
          if (started) {
            Location.stopLocationUpdatesAsync(BACKGROUND_LOCATION_TASK).catch(
              (e) => console.log(e)
            );
          }
        })
        .catch((e) => console.log(e));
    }
  };

  const resumeRun = async () => {
    setIsPaused(false);
    watchId.current = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.BestForNavigation,
        timeInterval: 1000,
        distanceInterval: 1,
      },
      (location) => updateLocation(location),
    );
  };

  const stopRun = async () => {
    releaseWakeLock();
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
        splits: runData.splits || [],
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

      // Cache the last known position for HomeScreen weather lookup
      if (runData.coordinates.length > 0) {
        const last = runData.coordinates[runData.coordinates.length - 1];
        try {
          await AsyncStorage.setItem(
            'lastRunCoords',
            JSON.stringify({ latitude: last.latitude, longitude: last.longitude })
          );
        } catch (_) {}
      }

      // Persist the completed run locally so HomeScreen can show it instantly
      // even before the Supabase query refreshes.
      try {
        await AsyncStorage.setItem('lastCompletedRun', JSON.stringify({
          distance: runData.distance,
          duration_seconds: durationInSeconds,
          pace: finalPace,
          calories: Math.round(runData.calories),
          coordinates: runData.coordinates,
          splits: runData.splits || [],
          created_at: new Date().toISOString(),
        }));
      } catch (_) {}

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
    isDemoMode,
    demoSpeed,
  };
}

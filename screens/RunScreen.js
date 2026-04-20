import axios from 'axios';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import { BlurView } from 'expo-blur';
import React, { useState, useEffect, useRef } from "react";
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
  PanResponder,
  Animated,
} from "react-native";
import styles from "../styles/RunScreenStyles";
import useUserStore from '../store/useUserStore';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import * as Speech from "expo-speech";
import { Audio } from "expo-av";
import { supabase } from "../services/supabase";
import MapStyle from "./MapStyle.json";
import RunMapMemo from "../components/RunScreenUI/RunMapMemo";
import MetricDashboard from "../components/RunScreenUI/MetricDashboard";
import SpectatorControls from "../components/RunScreenUI/SpectatorControls";
import RunSummaryModal from "../components/RunScreenUI/RunSummaryModal";

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const { width, height } = Dimensions.get("window");

// --- FLOATING EMOJI COMPONENT ---

// ---------------------------------

import { useRunTracking } from "../hooks/useRunTracking";

const formatDuration = (totalSeconds) => {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  if (h > 0) return `${h}:${m < 10 ? "0" + m : m}:${s < 10 ? "0" + s : s}`;
  return `${m < 10 ? "0" + m : m}:${s < 10 ? "0" + s : s}`;
};

export default function RunScreen({ route, navigation }) {
  const { mode = "solo", spectateFriend = null } = route?.params || {};
  const user = useUserStore((s) => s.user);
  const [isPanelCollapsed, setIsPanelCollapsed] = useState(false);
  const [friendsWatching, setFriendsWatching] = useState(2);
  const [userAvatar, setUserAvatar] = useState(user?.avatar || null);
  const [cheers, setCheers] = useState([]);
  const [visibilityScope, setVisibilityScope] = useState("friends");

  const [liveEmojis, setLiveEmojis] = useState([]);
  const [regionSet, setRegionSet] = useState(false);
  const mapRef = useRef(null);
  const cheerQueue = useRef([]);
  const myIdRef = useRef("Unknown");
  const isPlayingCheer = useRef(false);

  // Background Audio Ducking Init
  useEffect(() => {
    if (Platform.OS !== "web") {
      try {
        Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          staysActiveInBackground: true,
          interruptionModeIOS: 1, // DO_NOT_MIX (lowers background volume)
          playsInSilentModeIOS: true,
          shouldDuckAndroid: true,
          interruptionModeAndroid: 1, // DO_NOT_MIX
          playThroughEarpieceAndroid: false,
        });
      } catch (err) {
        console.warn("Failed to set audio mode:", err);
      }
    }
  }, []);

  const processCheerQueue = async () => {
    if (isPlayingCheer.current || cheerQueue.current.length === 0) return;
    isPlayingCheer.current = true;

    // Detect Combo (if multiple identical emojis arrive at once)
    const currentCheer = cheerQueue.current.shift();
    let comboCount = 1;
    while (
      cheerQueue.current.length > 0 &&
      cheerQueue.current[0].emoji === currentCheer.emoji
    ) {
      comboCount++;
      cheerQueue.current.shift(); // absorb
    }

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

      const messageToSpeak =
        comboCount > 2
          ? `${comboCount} times ${currentCheer.emoji}! ${currentCheer.message}`
          : currentCheer.message;

      if (messageToSpeak) {
        try {
          Speech.speak(messageToSpeak, {
            rate: 0.95,
            onStart: async () => {
              // Audio ducking naturally handles background music lowering
            },
            onDone: () => {
              isPlayingCheer.current = false;
              setTimeout(processCheerQueue, 300); // Check if more in queue
            },
            onError: () => {
              isPlayingCheer.current = false;
              processCheerQueue();
            },
          });
        } catch (e) {
          console.warn("Speech playback error (e.g. Web autoplay blocked):", e);
          isPlayingCheer.current = false;
          processCheerQueue();
        }
      } else {
        isPlayingCheer.current = false;
        processCheerQueue();
      }
    } catch (err) {
      isPlayingCheer.current = false;
      processCheerQueue();
    }
  };

  useEffect(() => {
    let cheerSub;
    let isMounted = true;
    if (user && isMounted) {
      const myId = user.id || user.phone || user.username;
      myIdRef.current = myId;

      cheerSub = supabase
        .channel("public:live_cheers")
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "live_cheers",
            filter: `receiver_id=in.(${[user.id, user.phone, user.username].filter(Boolean).join(',')})`,
          },
          (payload) => {
            const newCheer = payload.new;
            const cheerId = Date.now().toString() + Math.random();

            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setLiveEmojis((prev) => {
              const limited = prev.length > 15 ? prev.slice(-14) : prev;
              return [...limited, { id: cheerId, emoji: newCheer.emoji || "🔥" }];
            });

            cheerQueue.current.push({ ...newCheer });
            processCheerQueue();
          },
        )
        .subscribe();
    }

    return () => {
      isMounted = false;
      if (cheerSub) supabase.removeChannel(cheerSub);
    };
  }, []);

  const {
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
    signalLost,
  } = useRunTracking(visibilityScope, userAvatar, navigation, mode);

  const recenterMap = () => {
    if (mapRef.current && currentLocation) {
      mapRef.current.animateCamera({
        center: currentLocation,
        pitch: 0,
        heading: 0,
        zoom: 18
      });
    }
  };

  useEffect(() => {
    // Only automatically force region once when first located
    if (currentLocation && !regionSet && mapRef.current) {
      recenterMap();
      setRegionSet(true);
    }
  }, [currentLocation, regionSet]);

  // Smooth MAP CAMERA for Spectate
  useEffect(() => {
    if (mode === "spectate" && currentLocation && mapRef.current && regionSet) {
      mapRef.current.animateCamera({
        center: currentLocation,
        pitch: 0,
        heading: 0,
        zoom: 18
      }, { duration: 1000 });
    }
  }, [currentLocation, mode, regionSet]);

  const panY = useRef(new Animated.Value(0)).current;

  const contentOpacity = panY.interpolate({
    inputRange: [0, Math.max(height * 0.75 - 220, 1)],
    outputRange: [1, 0],
    extrapolate: "clamp",
  });

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        // Only respond if moving vertically more than horizontally
        return (
          Math.abs(gestureState.dy) > Math.abs(gestureState.dx) &&
          Math.abs(gestureState.dy) > 5
        );
      },
      onPanResponderMove: (evt, gestureState) => {
        // Clamp panY to prevent over-scrolling beyond top
        const maxPanY = height * 0.75 - 200;
        const clampedDy = Math.max(gestureState.dy, 0); // Never go above 0 (top)
        panY.setValue(Math.min(clampedDy, maxPanY + 100)); // Max with some buffer
      },
      onPanResponderRelease: (evt, gestureState) => {
        if (gestureState.dy > 50) {
          // Dragged down
          Animated.spring(panY, {
            toValue: height * 0.75 - 200,
            useNativeDriver: false,
            tension: 65,
            friction: 10,
          }).start(() => setIsPanelCollapsed(true));
        } else if (gestureState.dy < -50) {
          // Dragged up
          Animated.spring(panY, {
            toValue: 0,
            useNativeDriver: false,
            tension: 65,
            friction: 10,
          }).start(() => setIsPanelCollapsed(false));
        } else {
          // Revert to original state
          Animated.spring(panY, {
            toValue: isPanelCollapsed ? height * 0.75 - 200 : 0,
            useNativeDriver: false,
            tension: 65,
            friction: 10,
          }).start();
        }
      },
    }),
  ).current;

  // React to programmatic toggle (clicking the bar)
  useEffect(() => {
    Animated.spring(panY, {
      toValue: isPanelCollapsed ? height * 0.75 - 200 : 0,
      useNativeDriver: false,
      tension: 65,
      friction: 10,
    }).start();
  }, [isPanelCollapsed]);

  const togglePanel = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsPanelCollapsed(!isPanelCollapsed);
  };

  useEffect(() => {
    if (user?.avatar) setUserAvatar(user.avatar);
  }, [user?.avatar]);

  useEffect(() => {
    loadUserAvatar();
  }, []);

  const loadUserAvatar = async () => {
    try {
      const currentUserStr = await AsyncStorage.getItem("currentUser");
      if (currentUserStr) {
        const currentUser = JSON.parse(currentUserStr);
        // Fallback to local avatar first
        if (currentUser.avatar) setUserAvatar(currentUser.avatar);

        // Fetch latest from DB
        if (currentUser.id) {
          const { data } = await supabase
            .from("users")
            .select("avatar")
            .eq("id", currentUser.id)
            .single();
          if (data && data.avatar) setUserAvatar(data.avatar);
        }
      }
    } catch (e) {
      console.log(e);
    }
  };


  const sendCheer = async (specificEmoji = null) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    const emojis = ["💪", "🔥", "🏃‍♂️", "🎉", "👍", "⚡️", "🚀"];
    const emojiToUse = specificEmoji || emojis[Math.floor(Math.random() * emojis.length)];
    
    // Render locally for instant feedback
    const cheerId = Date.now().toString() + Math.random();
    setLiveEmojis((prev) => {
      const limited = prev.length > 15 ? prev.slice(-14) : prev;
      return [...limited, { id: cheerId, emoji: emojiToUse }];
    });

    if (mode === "spectate" && spectateFriend) {
      let myId = myIdRef.current;

      // Only mock insertion, or try but don't crash
      const { error } = await supabase.from("live_cheers").insert([
        {
          sender_id: myId,
          receiver_id: spectateFriend.id || spectateFriend.phone || spectateFriend.name,
          emoji: emojiToUse,
          message: "Keep going!",
        },
      ]);
      if (error) console.warn("Mock cheer sent:", error);
    }
  };

  const removeCheer = (id) => {
    setCheers((prev) => prev.filter((c) => c.id !== id));
  };

  const currentSpeed = 
    runData.distance > 0 && durationInSeconds > 0
      ? ((runData.distance * 1000) / durationInSeconds).toFixed(1)
      : "0.0";

  if (!region) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Getting your location...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <RunMapMemo mode={mode} spectateFriend={spectateFriend} 
        navigation={navigation}
        region={region}
        currentLocation={currentLocation}
        runData={runData}
        mapRef={mapRef}
        userAvatar={userAvatar}
        visibilityScope={visibilityScope}
        isRunning={isRunning}
        liveFriends={liveFriends}
        liveEmojis={liveEmojis}
        cheers={cheers}
        recenterMap={recenterMap}
        setLiveEmojis={setLiveEmojis}
      />

      {mode === 'spectate' && (
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 150, zIndex: 100 }} pointerEvents="box-none">
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="chevron-back" size={28} color="#24C789" />
          </TouchableOpacity>

          {spectateFriend && (
            <View style={styles.spectatorBadge}>
              <BlurView intensity={80} tint="light" style={styles.spectatorBadgeInner}>
                <Text style={styles.spectatorBadgeText}>
                  {signalLost ? "🔴 信号弱" : "🟢 正在同步"} • {spectateFriend.name} {spectateFriend.avatar}
                </Text>
              </BlurView>
            </View>
          )}
        </View>
      )}

      <Animated.View
        style={[
          styles.dashboardContainer,
          { transform: [{ translateY: panY }] },
        ]}
        {...panResponder.panHandlers}
      >
        <BlurView intensity={85} tint="light" style={StyleSheet.absoluteFillObject} />
        <TouchableOpacity
          style={styles.dragHandleContainer}
          activeOpacity={0.8}
          onPress={togglePanel}
        >
          <View style={styles.dragHandle} />
        </TouchableOpacity>

              <MetricDashboard
          mode={mode}
          spectateFriend={spectateFriend}
          runData={runData}
          durationInSeconds={durationInSeconds}
          currentSpeed={currentSpeed}
          contentOpacity={contentOpacity}
          friendsWatching={friendsWatching}
          signalLost={signalLost}
        />


                <SpectatorControls
          mode={mode}
          isRunning={isRunning}
          isPaused={isPaused}
          isFinished={isFinished}
          visibilityScope={visibilityScope}
          setVisibilityScope={setVisibilityScope}
          startRun={startRun}
          pauseRun={pauseRun}
          resumeRun={resumeRun}
          stopRun={stopRun}
          closeRun={closeRun}
          sendCheer={sendCheer}
          contentOpacity={contentOpacity}
        />
        
      </Animated.View>
      {isFinished && (
        <RunSummaryModal
          durationInSeconds={durationInSeconds}
          runData={runData}
          currentSpeed={currentSpeed}
          closeRun={closeRun}
        />
      )}
    </View>
  );
}

import * as Haptics from 'expo-haptics';
import React, { useState, useEffect, useRef } from "react";
import BouncyButton from "../components/BouncyButton";
import {
  View,
  Text,
  Dimensions,
  Platform,
  UIManager,
  PanResponder,
  Animated,
  StyleSheet,
} from "react-native";
import styles from "../styles/RunScreenStyles";
import useUserStore from '../store/useUserStore';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import * as Speech from "expo-speech";
import { Audio } from "expo-av";
import { supabase } from "../services/supabase";
import RunMapMemo from "../components/RunScreenUI/RunMapMemo";
import MetricDashboard from "../components/RunScreenUI/MetricDashboard";
import RunLivePanel from "../components/RunScreenUI/RunLivePanel";
import CollapsedStatBar from "../components/RunScreenUI/CollapsedStatBar";
import SpectatorControls from "../components/RunScreenUI/SpectatorControls";
import RunSummaryModal from "../components/RunScreenUI/RunSummaryModal";
import { DEMO_FRIENDS, useDemoIncomingCheers, pickDemoReply } from "../hooks/useDemoSocial";

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

export default function RunScreen({ route, navigation }) {
  const { mode = "solo", spectateFriend = null } = route?.params || {};
  const user = useUserStore((s) => s.user);
  const [isPanelCollapsed, setIsPanelCollapsed] = useState(false);
  const [friendsWatching, setFriendsWatching] = useState(2);
  const [userAvatar, setUserAvatar] = useState(user?.avatar || null);
  const [cheers, setCheers] = useState([]);
  const [visibilityScope, setVisibilityScope] = useState("friends");
  const [spectatorExpanded, setSpectatorExpanded] = useState(false);

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
    isDemoMode,
    demoSpeed,
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
    if (mode === 'spectate') {
      panY.setValue(0);
      return;
    }
    Animated.spring(panY, {
      toValue: isPanelCollapsed ? height * 0.75 - 200 : 0,
      useNativeDriver: false,
      tension: 65,
      friction: 10,
    }).start();
  }, [isPanelCollapsed, mode]);

  // ── Glance Mode (Scheme A) ──────────────────────────────────────────
  // Drive the sliding panel automatically based on run state:
  //   • Active running   → collapse panel, show map + minimal top pill
  //   • Paused           → auto-expand panel so user can review stats
  //   • Pre-run / spectate → leave whatever the user last set
  useEffect(() => {
    if (mode === 'spectate') return;
    if (isRunning && !isPaused) {
      setIsPanelCollapsed(true);
    } else if (isRunning && isPaused) {
      setIsPanelCollapsed(false);
    }
  }, [isRunning, isPaused, mode]);

  const togglePanel = () => {
    if (isActiveRun || mode === 'spectate') return;
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


  // Top-of-screen ephemeral notification: "🔥 from Maya" or "Maya: thanks!"
  // Used by both the inbound demo-cheer feed and the demo-spectate reply
  // path. State is just a single slot — newer messages replace older ones.
  const [senderToast, setSenderToast] = useState(null);
  const senderToastTimerRef = useRef(null);
  const showSenderToast = (toast) => {
    if (senderToastTimerRef.current) clearTimeout(senderToastTimerRef.current);
    setSenderToast(toast);
    senderToastTimerRef.current = setTimeout(() => setSenderToast(null), 2400);
  };
  useEffect(() => () => {
    if (senderToastTimerRef.current) clearTimeout(senderToastTimerRef.current);
  }, []);

  const sendCheer = async (specificEmoji = null) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }
    const emojis = ["💪", "🔥", "🏃‍♂️", "🎉", "👍", "⚡️", "🚀"];
    const emojiToUse = specificEmoji || emojis[Math.floor(Math.random() * emojis.length)];

    // Render locally for instant feedback
    const cheerId = Date.now().toString() + Math.random();
    setLiveEmojis((prev) => {
      const limited = prev.length > 15 ? prev.slice(-14) : prev;
      return [...limited, { id: cheerId, emoji: emojiToUse }];
    });

    // Demo spectate: skip the Supabase round-trip (it would silently fail
    // for un-signed-in demo sessions anyway), and instead surface a fake
    // "delivered + reply" loop so the showcase feels bidirectional.
    if (isDemoMode && mode === 'spectate' && spectateFriend?._isDemo) {
      const friendName = spectateFriend.name || 'Demo runner';
      showSenderToast({ kind: 'reply', name: friendName, text: pickDemoReply(emojiToUse) });
      return;
    }

    if (mode === "spectate" && spectateFriend) {
      let myId = myIdRef.current;
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

  // Inbound demo cheers: while you're actively demo-running solo, fake
  // crew members periodically send you emoji cheers. Each one shows on
  // the FloatingEmoji surface (same render path real cheers use) plus a
  // top-screen toast naming the sender so it's clear who reacted.
  useDemoIncomingCheers({
    active: isDemoMode && isRunning && !isPaused && mode !== 'spectate',
    onCheer: ({ id, emoji, sender }) => {
      setLiveEmojis((prev) => {
        const limited = prev.length > 15 ? prev.slice(-14) : prev;
        return [...limited, { id, emoji }];
      });
      showSenderToast({ kind: 'incoming', name: sender.name, emoji, color: sender.color });
    },
  });

  const currentSpeed = isDemoMode
    ? demoSpeed
    : (runData.distance > 0 && durationInSeconds > 0
        ? ((runData.distance * 1000) / durationInSeconds).toFixed(1)
        : "0.0");

  const gpsAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!region) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(gpsAnim, { toValue: 1, duration: 1800, useNativeDriver: true }),
          Animated.timing(gpsAnim, { toValue: 0, duration: 700, useNativeDriver: true }),
        ])
      );
      loop.start();
      return () => loop.stop();
    }
  }, [region]);

  if (!region) {
    return (
      <View style={styles.gpsLoadingContainer}>
        <Animated.View style={[styles.gpsPulse3, {
          opacity: gpsAnim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.05, 0.14, 0.05] }),
          transform: [{ scale: gpsAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.35] }) }],
        }]} />
        <Animated.View style={[styles.gpsPulse2, {
          opacity: gpsAnim.interpolate({ inputRange: [0, 0.4, 1], outputRange: [0.08, 0.22, 0.08] }),
          transform: [{ scale: gpsAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.22] }) }],
        }]} />
        <View style={styles.gpsPulse1}>
          <Ionicons name="navigate" size={34} color="#FFF" />
        </View>
        <Text style={styles.gpsLoadingTitle}>Finding your location</Text>
        <Text style={styles.gpsLoadingDesc}>Make sure GPS is enabled</Text>
      </View>
    );
  }

  const isActiveRun = isRunning && !isPaused && mode !== 'spectate';
  const isPausedRun = isRunning && isPaused && mode !== 'spectate';
  const isPreRun = !isRunning && mode !== 'spectate';
  // Pre-run with the sheet pulled down: show the compact Keep-style data bar
  // instead of a half-cut giant number peeking above the dock.
  const collapsedPreRun = isPreRun && isPanelCollapsed;
  // Paused with the summary sheet pulled down: collapse to the same compact
  // data bar used while running, instead of a tall blank white panel.
  const collapsedPaused = isPausedRun && isPanelCollapsed;
  const showDashboard =
    mode === 'spectate' ||
    (isPreRun && !isPanelCollapsed) ||
    (isPausedRun && !isPanelCollapsed);
  const dashboardStateStyle =
    mode === 'spectate'
      ? spectatorExpanded ? styles.dashboardSpectateExpanded : styles.dashboardSpectate
      : isPausedRun
      ? styles.dashboardPaused
      : styles.dashboardPreRun;

  return (
    <View style={styles.container}>
      {isDemoMode && (
        <View style={styles.demoBanner} pointerEvents="none">
          <Ionicons name="flask" size={13} color="#FFF" />
          <Text style={styles.demoBannerText}>DEMO MODE · Simulated GPS</Text>
        </View>
      )}

      {/* Sender toast — shows under the demo banner so it never collides
          with the GPS pill. Driven by inbound demo cheers (solo run) AND
          the demo runner's reply when YOU cheer them (spectate). */}
      {senderToast && (
        <View
          style={[
            styles.senderToast,
            isDemoMode && styles.senderToastBelowBanner,
            senderToast.color && { borderColor: senderToast.color },
          ]}
          pointerEvents="none"
        >
          {senderToast.kind === 'incoming' ? (
            <>
              <Text style={styles.senderToastEmoji}>{senderToast.emoji}</Text>
              <Text style={styles.senderToastText}>
                <Text style={styles.senderToastName}>{senderToast.name}</Text>
                {' cheered you on!'}
              </Text>
            </>
          ) : (
            <>
              <Ionicons name="chatbubble-ellipses" size={14} color="#0B0F13" />
              <Text style={styles.senderToastText}>
                <Text style={styles.senderToastName}>{senderToast.name}: </Text>
                {senderToast.text}
              </Text>
            </>
          )}
        </View>
      )}

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
        <View
          style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 150, zIndex: 100 }}
          pointerEvents="box-none"
        >
          <BouncyButton
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="chevron-back" size={20} color="#0B0F13" />
          </BouncyButton>

          {spectateFriend && (
            <View style={styles.spectatorBadge}>
              <View style={styles.spectatorBadgeInner}>
                <View
                  style={[
                    styles.spectatorBadgeDot,
                    signalLost && styles.spectatorBadgeDotWeak,
                  ]}
                />
                <Text style={styles.spectatorBadgeText}>
                  {signalLost ? 'Weak signal' : 'Live'} • {spectateFriend.name}
                </Text>
              </View>
            </View>
          )}
        </View>
      )}

      {showDashboard && (
        <Animated.View
          style={[
            styles.dashboardContainer,
            dashboardStateStyle,
            // Paused sheet hugs content (override the base fixed height) so it
            // sits flush above the dock with no dead white space below.
            isPausedRun && { height: undefined },
            { transform: [{ translateY: panY }] },
          ]}
          {...(Platform.OS !== 'web' && mode !== 'spectate' ? panResponder.panHandlers : {})}
        >
          <BouncyButton
            style={styles.dragHandleContainer}
            activeOpacity={0.7}
            onPress={togglePanel}
            hitSlop={{ top: 12, bottom: 12, left: 80, right: 80 }}
          >
            <View style={styles.dragHandle} />
          </BouncyButton>

          <Animated.View style={{ opacity: contentOpacity }}>
            <MetricDashboard
              mode={mode}
              spectateFriend={spectateFriend}
              runData={runData}
              durationInSeconds={durationInSeconds}
              currentSpeed={currentSpeed}
              contentOpacity={contentOpacity}
              friendsWatching={friendsWatching}
              signalLost={signalLost}
              spectatorExpanded={spectatorExpanded}
            />
          </Animated.View>

          {/* Pause state = expanded stats review. Active running intentionally
              removes these detail cards so the phone can stay in-pocket. */}
          {isPausedRun && (
            <Animated.View style={{ opacity: contentOpacity }}>
              <RunLivePanel
                runData={runData}
                durationInSeconds={durationInSeconds}
                currentSpeed={currentSpeed}
                isRunning={isRunning}
              />

              {/* Figma-style circular controls — sit INSIDE the panel under
                  the pace data so they never overlap the content above. */}
              <View style={styles.pausedCircleRow}>
                <View style={styles.pausedCircleStack}>
                  <BouncyButton
                    style={styles.resumeCircle}
                    onPress={() => {
                      if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                      resumeRun();
                    }}
                    activeOpacity={0.85}
                    accessibilityLabel="Resume run"
                  >
                    <Ionicons name="play" size={28} color="#FFFFFF" />
                  </BouncyButton>
                  <Text style={styles.pausedCircleLabel}>Resume</Text>
                </View>

                <View style={styles.pausedCircleStack}>
                  <BouncyButton
                    style={styles.stopCircle}
                    onPress={() => {
                      if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                      stopRun();
                    }}
                    activeOpacity={0.85}
                    accessibilityLabel="Stop run"
                  >
                    <View style={styles.stopCircleInner} />
                  </BouncyButton>
                  <Text style={styles.pausedCircleLabel}>Stop</Text>
                </View>
              </View>
            </Animated.View>
          )}
          {mode === 'spectate' && <View style={{ height: 8 }} />}

          {(isPreRun || mode === 'spectate') && (
            <>
              <View style={styles.panelDivider} />

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
                sendCheer={(emoji) => {
                  sendCheer(emoji);
                  if (spectatorExpanded) setSpectatorExpanded(false);
                }}
                contentOpacity={contentOpacity}
                spectatorExpanded={spectatorExpanded}
                setSpectatorExpanded={setSpectatorExpanded}
              />
            </>
          )}
        </Animated.View>
      )}
      {/* Active-run only: floating Pause pill above the tab bar.
          Paused state renders Resume / Stop as circular buttons INSIDE
          the expanded dashboard so they don't float over pace data. */}
      {isActiveRun && mode !== 'spectate' && (
        <View style={styles.fixedControls} pointerEvents="box-none">
          <CollapsedStatBar
            runData={runData}
            durationInSeconds={durationInSeconds}
            style={styles.collapsedBarSpacing}
          />
          <View style={styles.fixedControlsSingle}>
            <BouncyButton
              style={styles.pauseBtn}
              onPress={() => {
                if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                pauseRun();
              }}
              activeOpacity={0.9}
            >
              <Text style={styles.fixedBtnText}>Pause</Text>
            </BouncyButton>
          </View>
        </View>
      )}

      {/* Pre-run, sheet collapsed: a complete compact data bar (tap to expand)
          plus a thumb-reachable GO, so the map stays visible without losing the
          start affordance. */}
      {collapsedPreRun && (
        <View style={styles.fixedControls} pointerEvents="box-none">
          <BouncyButton
            activeOpacity={0.9}
            onPress={togglePanel}
            style={styles.collapsedBarSpacing}
          >
            <CollapsedStatBar
              runData={runData}
              durationInSeconds={durationInSeconds}
            />
          </BouncyButton>
          <View style={styles.fixedControlsSingle}>
            <BouncyButton
              style={styles.pauseBtn}
              onPress={() => {
                if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                startRun();
              }}
              activeOpacity={0.9}
            >
              <Text style={styles.fixedBtnText}>Go</Text>
            </BouncyButton>
          </View>
        </View>
      )}

      {/* Paused, sheet collapsed: same compact data bar as the running view
          (tap to reopen the summary) with Resume / Stop kept reachable. */}
      {collapsedPaused && (
        <View style={styles.fixedControls} pointerEvents="box-none">
          <BouncyButton
            activeOpacity={0.9}
            onPress={togglePanel}
            style={styles.collapsedBarSpacing}
          >
            <CollapsedStatBar
              runData={runData}
              durationInSeconds={durationInSeconds}
            />
          </BouncyButton>
          <View style={styles.fixedControlsRow}>
            <BouncyButton
              style={styles.resumeBtn}
              onPress={() => {
                if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                resumeRun();
              }}
              activeOpacity={0.9}
            >
              <Text style={styles.fixedBtnText}>Resume</Text>
            </BouncyButton>
            <BouncyButton
              style={styles.stopBtn}
              onPress={() => {
                if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                stopRun();
              }}
              activeOpacity={0.9}
            >
              <Text style={styles.fixedBtnText}>Stop</Text>
            </BouncyButton>
          </View>
        </View>
      )}

      {isFinished && (
        <RunSummaryModal
          durationInSeconds={durationInSeconds}
          runData={runData}
          currentSpeed={currentSpeed}
          closeRun={closeRun}
          navigation={navigation}
        />
      )}
    </View>
  );
}

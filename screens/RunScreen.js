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
  PanResponder,
  Image,
  Animated
} from 'react-native';
import styles from '../styles/RunScreenStyles';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as Speech from 'expo-speech';
import { Audio } from 'expo-av';
import { supabase } from '../services/supabase';
import MapStyle from './MapStyle.json';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// Conditionally import MapView for native platforms only
let MapView, Polyline, Marker, PROVIDER_GOOGLE;
if (Platform.OS !== 'web') {
  const Maps = require('react-native-maps');
  MapView = Maps.default;
  Polyline = Maps.Polyline;
  Marker = Maps.Marker;
  PROVIDER_GOOGLE = Maps.PROVIDER_GOOGLE;
}

const { width, height } = Dimensions.get('window');



// --- FLOATING EMOJI COMPONENT ---
const FloatingEmoji = ({ emoji, onComplete }) => {
  const translateY = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  const scale = useRef(new Animated.Value(0.5)).current;
  const translateX = useRef(new Animated.Value(0)).current;

  // Randomize the horizontal drift
  const randomDrift = (Math.random() - 0.5) * 100;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -300, // Float upwards
        duration: 2500,
        useNativeDriver: true,
      }),
      Animated.timing(translateX, {
        toValue: randomDrift, // Drift sideways
        duration: 2500,
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.spring(scale, {
          toValue: 2, // Pop in
          friction: 3,
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 1.5,
          duration: 2000,
          useNativeDriver: true,
        })
      ]),
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0, // Fade out at the end
          delay: 1800,
          duration: 500,
          useNativeDriver: true,
        })
      ])
    ]).start(() => {
      if (onComplete) onComplete();
    });
  }, []);

  return (
    <Animated.View
      style={{
        position: 'absolute',
        bottom: 120, // Start just above the bottom panel
        right: 40,
        transform: [
          { translateY },
          { translateX },
          { scale }
        ],
        opacity,
        zIndex: 999,
        elevation: 999,
      }}
    >
      <Text style={{ fontSize: 48, textShadowColor: 'rgba(0,0,0,0.3)', textShadowOffset: {width: 0, height: 2}, textShadowRadius: 4 }}>{emoji}</Text>
    </Animated.View>
  );
};
// ---------------------------------

import { useRunTracking } from '../hooks/useRunTracking';


const formatDuration = (totalSeconds) => {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  if (h > 0) return `${h}:${m < 10 ? '0'+m : m}:${s < 10 ? '0'+s : s}`;
  return `${m < 10 ? '0'+m : m}:${s < 10 ? '0'+s : s}`;
};

export default function RunScreen({ route, navigation }) {
  const { mode = 'solo' } = route?.params || {};
  const [isPanelCollapsed, setIsPanelCollapsed] = useState(false);
  const [friendsWatching, setFriendsWatching] = useState(2);
  const [userAvatar, setUserAvatar] = useState(null);
  const [cheers, setCheers] = useState([]);
  const [visibilityScope, setVisibilityScope] = useState('friends');

  const [liveEmojis, setLiveEmojis] = useState([]);
  const cheerQueue = useRef([]);
  const isPlayingCheer = useRef(false);

  // Background Audio Ducking Init
  useEffect(() => {
    Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      staysActiveInBackground: true,
      interruptionModeIOS: 1, // DO_NOT_MIX (lowers background volume)
      playsInSilentModeIOS: true,
      shouldDuckAndroid: true,
      interruptionModeAndroid: 1,
      playThroughEarpieceAndroid: false
    });
  }, []);

  const processCheerQueue = async () => {
    if (isPlayingCheer.current || cheerQueue.current.length === 0) return;
    isPlayingCheer.current = true;

    // Detect Combo (if multiple identical emojis arrive at once)
    const currentCheer = cheerQueue.current.shift();
    let comboCount = 1;
    while(cheerQueue.current.length > 0 && cheerQueue.current[0].emoji === currentCheer.emoji) {
      comboCount++;
      cheerQueue.current.shift(); // absorb
    }

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      
      const messageToSpeak = comboCount > 2 
        ? `${comboCount} times ${currentCheer.emoji}! ${currentCheer.message}`
        : currentCheer.message;

      if (messageToSpeak) {
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
          }
        });
      } else {
        isPlayingCheer.current = false;
        processCheerQueue();
      }
    } catch(err) {
      isPlayingCheer.current = false;
      processCheerQueue();
    }
  };

  useEffect(() => {
    let cheerSub;
    AsyncStorage.getItem('currentUser').then(c => {
      if (c) {
        const cu = JSON.parse(c);
        const myId = cu.id || cu.phone; // Fallback to phone if no ID
        
        cheerSub = supabase
          .channel('public:live_cheers')
          .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'live_cheers' }, payload => {
             const newCheer = payload.new;
             // Check if it's meant for us (receiver_id matches our id or phone)
             if (newCheer.receiver_id === myId || newCheer.receiver_id === cu.phone || newCheer.receiver_id === cu.username) {
               const cheerId = Date.now().toString() + Math.random();
               
               // Render visual element immediately (max limit 15 to prevent lag)
               setLiveEmojis(prev => {
                 const limited = prev.length > 15 ? prev.slice(-14) : prev;
                 return [...limited, { id: cheerId, emoji: newCheer.emoji || '🔥' }];
               });

               // Queue up audio to prevent overlapping speech
               cheerQueue.current.push({ ...newCheer });
               processCheerQueue();
             }
          })
          .subscribe();
      }
    });

    return () => {
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
  } = useRunTracking(visibilityScope, userAvatar, navigation, mode);

  
  const panY = useRef(new Animated.Value(0)).current;

    const contentOpacity = panY.interpolate({
    inputRange: [0, Math.max((height * 0.75) - 320, 1)],
    outputRange: [1, 0],
    extrapolate: 'clamp'
  });


  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        // Only respond if moving vertically more than horizontally
        return Math.abs(gestureState.dy) > Math.abs(gestureState.dx) && Math.abs(gestureState.dy) > 5;
      },
      onPanResponderMove: Animated.event([null, { dy: panY }], { useNativeDriver: false }),
      onPanResponderRelease: (evt, gestureState) => {
        if (gestureState.dy > 50) {
          // Dragged down
          Animated.spring(panY, {
            toValue: (height * 0.75) - 300,
            useNativeDriver: false,
            tension: 65,
            friction: 10
          }).start(() => setIsPanelCollapsed(true));
        } else if (gestureState.dy < -50) {
          // Dragged up
          Animated.spring(panY, {
            toValue: 0,
            useNativeDriver: false,
            tension: 65,
            friction: 10
          }).start(() => setIsPanelCollapsed(false));
        } else {
          // Revert to original state
          Animated.spring(panY, {
            toValue: isPanelCollapsed ? (height * 0.75) - 300 : 0,
            useNativeDriver: false,
            tension: 65,
            friction: 10
          }).start();
        }
      },
    })
  ).current;

  // React to programmatic toggle (clicking the bar)
  useEffect(() => {
    Animated.spring(panY, {
      toValue: isPanelCollapsed ? (height * 0.75) - 300 : 0,
      useNativeDriver: false,
      tension: 65,
      friction: 10
    }).start();
  }, [isPanelCollapsed]);

  const togglePanel = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsPanelCollapsed(!isPanelCollapsed);
  };


  useEffect(() => {
    loadUserAvatar();
  }, []);

  const loadUserAvatar = async () => {
    try {
      const currentUser = await AsyncStorage.getItem('currentUser');
      if (currentUser) {
        const users = await AsyncStorage.getItem('users');
        if (users) {
          const parsedUsers = JSON.parse(users);
          const found = parsedUsers.find(u => u.username === currentUser);
          if (found && found.avatar) setUserAvatar(found.avatar);
        }
      }
    } catch (e) {
      console.log(e);
    }
  };

  const sendCheer = (specificEmoji = null) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    const emojis = ['💪', '🔥', '🏃‍♂️', '🎉', '👍', '⚡️', '🚀'];
    const emojiToUse = specificEmoji || emojis[Math.floor(Math.random() * emojis.length)];
    const newCheer = { id: Date.now() + Math.random(), emoji: emojiToUse };
    setCheers(prev => [...prev, newCheer]);
  };

  const removeCheer = (id) => {
    setCheers(prev => prev.filter(c => c.id !== id));
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
            provider={PROVIDER_GOOGLE}
            region={region}
            showsUserLocation={false}
            followsUserLocation={true}
            customMapStyle={MapStyle}
          >
            {runData.coordinates.length > 1 && (
              <Polyline
                coordinates={runData.coordinates}
                strokeColor="#24C789"
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
            {visibilityScope !== 'private' && isRunning && liveFriends.map((friend) => (
              <Marker
                key={friend.id}
                coordinate={{ latitude: friend.latitude, longitude: friend.longitude }}
                title={`${friend.name} is running`}
                anchor={{ x: 0.5, y: 0.5 }}
              >
                <View style={[styles.avatarHaloOuter, { backgroundColor: 'rgba(36, 199, 137, 0.2)' }]}>
                  <View style={[styles.avatarHaloInner, { borderColor: '#24C789' }]}>
                    <Text style={styles.mapAvatarEmoji}>{friend.avatar}</Text>
                  </View>
                </View>
              </Marker>
            ))}
          </MapView>
        )}

        {liveEmojis.map((c, i) => (
          <FloatingEmoji key={c.id} emoji={c.emoji} onComplete={() => setLiveEmojis(prev => prev.filter(e => e.id !== c.id))} />
        ))}

        {cheers.map((cheer, index) => (
          <View key={index} style={[styles.cheerBubble, { top: 50 + index * 60 }]}>
            <Text style={styles.cheerText}>{cheer.emoji}</Text>
          </View>
        ))}
      </View>

      <Animated.View style={[styles.dashboardContainer, { transform: [{ translateY: panY }] }]} {...panResponder.panHandlers}>
        <TouchableOpacity 
          style={styles.dragHandleContainer} 
          activeOpacity={0.8} 
          onPress={togglePanel}
        >
          <View style={styles.dragHandle} />
        </TouchableOpacity>
        
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
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{currentPace}</Text>
              <Text style={styles.statLabel}>PACE(M/KM)</Text>
            </View>
          </View>
          
          <Animated.View style={[styles.statsRow, { marginTop: 24, opacity: contentOpacity }]}>
            <View style={{flex:1}} />
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{Math.round(runData.calories)}</Text>
              <Text style={styles.statLabel}>KCAL BURNED</Text>
            </View>
            <View style={{flex:1}}>
              {mode === 'shared' && (
                <Text style={styles.friendsText}>👥 {friendsWatching} friends</Text>
              )}
            </View>
          </Animated.View>
        </View>


        <View style={styles.controlsContainer}>
          {isFinished ? (
            <View style={styles.activeControls}>
              <View style={[styles.statBox, {marginRight: 20}]}>
                <Text style={styles.statValue}>Done!</Text>
                <Text style={styles.statLabel}>Completed</Text>
              </View>
              <TouchableOpacity style={styles.circleStartButton} onPress={closeRun}>
                <Text style={styles.circleStartText}>DONE</Text>
              </TouchableOpacity>
            </View>
          ) : !isRunning ? (

            <View style={styles.preRunControls}>
              <Animated.View style={[styles.scopeSelectorContainer, { opacity: contentOpacity }]}>
                {['public', 'friends', 'private'].map((scope) => (
                  <TouchableOpacity
                    key={scope}
                    style={[styles.scopeBtn, visibilityScope === scope && styles.scopeBtnActive]}
                    onPress={() => setVisibilityScope(scope)}
                  >
                    <Text style={[styles.scopeBtnText, visibilityScope === scope && styles.scopeBtnTextActive]}>
                      {scope.charAt(0).toUpperCase() + scope.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </Animated.View>
              <TouchableOpacity style={styles.circleStartButton} onPress={startRun}>
                <Text style={styles.circleStartText}>GO</Text>
              </TouchableOpacity>
            </View>
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
      </Animated.View>
    </View>
  );
}


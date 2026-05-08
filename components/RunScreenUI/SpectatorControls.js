import React from 'react';
import * as Haptics from 'expo-haptics';
import BouncyButton from '../BouncyButton';
import { View, Text, Animated, Alert, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import styles from '../../styles/RunScreenStyles';

const CHEER_EMOJIS = ['🔥', '🚀', '💦', '💪'];

const SpectatorControls = ({
  mode,
  isRunning,
  isPaused,
  isFinished,
  visibilityScope,
  setVisibilityScope,
  startRun,
  pauseRun,
  resumeRun,
  stopRun,
  closeRun,
  sendCheer,
  contentOpacity,
}) => {
  if (mode === 'spectate') {
    return (
      <View style={[styles.controlsContainer, { paddingTop: 10 }]}>
        <View style={styles.spectatorTray}>
          {CHEER_EMOJIS.map((emoji) => (
            <BouncyButton
              key={emoji}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                sendCheer(emoji);
              }}
              style={styles.spectatorCheerBtn}
              activeOpacity={0.8}
            >
              <Text style={styles.spectatorCheerEmoji}>{emoji}</Text>
            </BouncyButton>
          ))}
          <BouncyButton
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              if (Platform.OS === 'web') {
                const text = window.prompt('Type a message to cheer them on!');
                if (text && text.trim().length > 0) {
                  sendCheer(text);
                }
              } else {
                Alert.prompt(
                  'Send message',
                  'Type a message to cheer them on!',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Send',
                      onPress: (text) => {
                        if (text && text.trim().length > 0) {
                          sendCheer(text);
                        }
                      },
                    },
                  ],
                );
              }
            }}
            style={styles.spectatorMessageBtn}
            activeOpacity={0.85}
          >
            <Ionicons name="chatbubble-outline" size={18} color="#FFFFFF" />
          </BouncyButton>
          <BouncyButton
            onPress={async () => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.1,
                base64: true,
              });

              if (!result.canceled && result.assets?.[0]?.base64) {
                sendCheer(`data:image/jpeg;base64,${result.assets[0].base64}`);
              }
            }}
            style={styles.spectatorPhotoBtn}
            activeOpacity={0.85}
          >
            <Ionicons name="image-outline" size={18} color="#0B0F13" />
          </BouncyButton>
        </View>
      </View>
    );
  }

  if (isFinished) {
    return (
      <View style={styles.controlsContainer}>
        <BouncyButton
          style={styles.circleStartButton}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            closeRun();
          }}
          activeOpacity={0.9}
        >
          <Text style={styles.circleStartText}>Done</Text>
        </BouncyButton>
      </View>
    );
  }

  if (!isRunning) {
    return (
      <View style={styles.preRunWrapper}>
        {/* Visibility row — sits directly above GO, compact */}
        <View style={styles.scopeRow}>
          {['public', 'friends', 'private'].map((scope) => (
            <BouncyButton
              key={scope}
              style={[
                styles.scopeChip,
                visibilityScope === scope && styles.scopeChipActive,
              ]}
              onPress={() => setVisibilityScope(scope)}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.scopeChipText,
                  visibilityScope === scope && styles.scopeChipTextActive,
                ]}
              >
                {scope.charAt(0).toUpperCase() + scope.slice(1)}
              </Text>
            </BouncyButton>
          ))}
        </View>

        <BouncyButton
          style={styles.goButton}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            startRun();
          }}
          activeOpacity={0.9}
        >
          <Text style={styles.goButtonText}>GO</Text>
        </BouncyButton>
      </View>
    );
  }

  return (
    <View style={styles.controlsContainer}>
      <View style={styles.activeControls}>
        <BouncyButton
          style={
            isPaused ? styles.circleResumeButton : styles.circlePauseButton
          }
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            if (isPaused) {
              resumeRun();
            } else {
              pauseRun();
            }
          }}
          activeOpacity={0.9}
        >
          <Text style={styles.circleButtonText}>
            {isPaused ? 'Resume' : 'Pause'}
          </Text>
        </BouncyButton>

        <BouncyButton
          style={styles.circleStopButton}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            stopRun();
          }}
          activeOpacity={0.9}
        >
          <Text style={styles.circleButtonText}>Stop</Text>
        </BouncyButton>
      </View>
    </View>
  );
};

export default SpectatorControls;

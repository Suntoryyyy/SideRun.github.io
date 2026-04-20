import React from 'react';
import * as Haptics from 'expo-haptics';
import { View, Text, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import styles from '../../styles/RunScreenStyles';

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
        <View style={{ flexDirection: 'row', justifyContent: 'space-evenly', width: '100%', paddingHorizontal: 10 }}>
          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
              sendCheer('🔥');
            }}
            style={{ backgroundColor: '#F0F0F0', width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginHorizontal: 5 }}
          >
            <Text style={{ fontSize: 20 }}>🔥</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
              sendCheer('🚀');
            }}
            style={{ backgroundColor: '#F0F0F0', width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginHorizontal: 5 }}
          >
            <Text style={{ fontSize: 20 }}>🚀</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
              sendCheer('💦');
            }}
            style={{ backgroundColor: '#F0F0F0', width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginHorizontal: 5 }}
          >
            <Text style={{ fontSize: 20 }}>💦</Text>
          </TouchableOpacity>
          <TouchableOpacity
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
            style={{ backgroundColor: '#E8F8F2', width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#24C789', marginHorizontal: 5 }}
          >
            <Ionicons name='add' size={24} color='#24C789' />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (isFinished) {
    return (
      <View style={styles.controlsContainer}>
        <View style={styles.activeControls}>
          <View style={[styles.statBox, { marginRight: 20 }]}>
            <Text style={styles.statValue}>Done!</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>
          <TouchableOpacity
            style={styles.circleStartButton}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              closeRun();
            }}
          >
            <Text style={styles.circleStartText}>DONE</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (!isRunning) {
    return (
      <View style={styles.controlsContainer}>
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

          <TouchableOpacity
            style={styles.circleStartButton}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
              startRun();
            }}
          >
            <Text style={styles.circleStartText}>GO</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.controlsContainer}>
      <View style={styles.activeControls}>
        <TouchableOpacity
          style={isPaused ? styles.circleResumeButton : styles.circlePauseButton}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            if (isPaused) {
              resumeRun();
            } else {
              pauseRun();
            }
          }}
        >
          <Text style={styles.circleButtonText}>{isPaused ? 'RESUME' : 'PAUSE'}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.circleStopButton}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            stopRun();
          }}
        >
          <Text style={styles.circleButtonText}>STOP</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default SpectatorControls;

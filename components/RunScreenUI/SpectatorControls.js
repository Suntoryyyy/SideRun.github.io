import React from 'react';
import { View, Text, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import styles from '../../styles/RunScreenStyles';

const SpectatorControls = ({ mode, isRunning, isPaused, isFinished, visibilityScope, setVisibilityScope, startRun, pauseRun, resumeRun, stopRun, closeRun, sendCheer, contentOpacity }) => {
  return (
    <View style={styles.controlsContainer}>
          {mode === "spectate" ? (
            <View style={{flexDirection: "row", justifyContent: "space-between", width: "100%", paddingHorizontal: 20}}>
              <TouchableOpacity onPress={() => sendCheer("🔥")} style={{backgroundColor: "#F0F0F0", width: 60, height: 60, borderRadius: 30, justifyContent: "center", alignItems: "center"}}>
                <Text style={{fontSize: 28}}>🔥</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => sendCheer("👏")} style={{backgroundColor: "#F0F0F0", width: 60, height: 60, borderRadius: 30, justifyContent: "center", alignItems: "center"}}>
                <Text style={{fontSize: 28}}>👏</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => sendCheer("🚀")} style={{backgroundColor: "#F0F0F0", width: 60, height: 60, borderRadius: 30, justifyContent: "center", alignItems: "center"}}>
                <Text style={{fontSize: 28}}>🚀</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => sendCheer("💦")} style={{backgroundColor: "#F0F0F0", width: 60, height: 60, borderRadius: 30, justifyContent: "center", alignItems: "center"}}>
                <Text style={{fontSize: 28}}>💦</Text>
              </TouchableOpacity>
            </View>
          ) : isFinished ? (
            <View style={styles.activeControls}>
              <View style={[styles.statBox, { marginRight: 20 }]}>
                <Text style={styles.statValue}>Done!</Text>
                <Text style={styles.statLabel}>Completed</Text>
              </View>
              <TouchableOpacity
                style={styles.circleStartButton}
                onPress={closeRun}
              >
                <Text style={styles.circleStartText}>DONE</Text>
              </TouchableOpacity>
            </View>
          ) : !isRunning ? (
            <View style={styles.preRunControls}>
              <Animated.View
                style={[
                  styles.scopeSelectorContainer,
                  { opacity: contentOpacity },
                ]}
              >
                {["public", "friends", "private"].map((scope) => (
                  <TouchableOpacity
                    key={scope}
                    style={[
                      styles.scopeBtn,
                      visibilityScope === scope && styles.scopeBtnActive,
                    ]}
                    onPress={() => setVisibilityScope(scope)}
                  >
                    <Text
                      style={[
                        styles.scopeBtnText,
                        visibilityScope === scope && styles.scopeBtnTextActive,
                      ]}
                    >
                      {scope.charAt(0).toUpperCase() + scope.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
  );
};

export default SpectatorControls;

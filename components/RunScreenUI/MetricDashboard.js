import React from 'react';
import { View, Text, Animated } from 'react-native';
import styles from '../../styles/RunScreenStyles';
import { formatDuration } from '../../utils/timeUtils';

const MetricDashboard = ({
  mode,
  spectateFriend,
  runData,
  durationInSeconds,
  currentSpeed,
  contentOpacity,
  friendsWatching,
  signalLost
}) => {
  return (
    <View style={styles.statsContainer}>
          {mode === "spectate" && spectateFriend && (
             <Animated.View style={{ alignItems: 'center', marginBottom: 10, opacity: contentOpacity }}>
               <Text style={{ fontSize: 16, fontWeight: '700', color: '#FF9500' }}>
                 {signalLost ? "🔴 信号较弱..." : "🟢 当前同步:"} {spectateFriend.name} {spectateFriend.avatar}
               </Text>
             </Animated.View>
          )}
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>
                {(runData.distance * 1000).toFixed(0)}
              </Text>
              <Text style={styles.statLabel}>METERS</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>
                {formatDuration(durationInSeconds)}
              </Text>
              <Text style={styles.statLabel}>TIME</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{currentSpeed}</Text>
              <Text style={styles.statLabel}>SPEED (M/S)</Text>
            </View>
          </View>

          <Animated.View
            style={[
              styles.statsRow,
              { marginTop: 24, opacity: contentOpacity },
            ]}
          >
            <View style={{ flex: 1 }} />
            <View style={styles.statBox}>
              <Text style={styles.statValue}>
                {Math.round(runData.calories)}
              </Text>
              <Text style={styles.statLabel}>KCAL BURNED</Text>
            </View>
            <View style={{ flex: 1 }}>
              {mode === "shared" && (
                <Text style={styles.friendsText}>
                  👥 {friendsWatching} friends
                </Text>
              )}
            </View>
          </Animated.View>
        </View>
  );
};

export default MetricDashboard;

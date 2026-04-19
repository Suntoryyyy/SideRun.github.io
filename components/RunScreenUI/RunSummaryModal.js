import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Dimensions } from 'react-native';
import { BlurView } from 'expo-blur';
import { formatDuration } from '../../utils/timeUtils';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');

const RunSummaryModal = ({ durationInSeconds, runData, currentSpeed, closeRun }) => {
  return (
    <Modal visible={true} transparent={true} animationType="slide">
      <BlurView intensity={90} tint="light" style={styles.blurContainer}>
        <View style={styles.card}>
          <View style={styles.iconContainer}>
            <Ionicons name="flag" size={40} color="#24C789" />
          </View>
          <Text style={styles.title}>Run Completed!</Text>
          
          <View style={styles.statsContainer}>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{(runData?.distance || 0).toFixed(2)}</Text>
              <Text style={styles.statLabel}>KM</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{formatDuration(durationInSeconds)}</Text>
              <Text style={styles.statLabel}>TIME</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{currentSpeed || "0.0"}</Text>
              <Text style={styles.statLabel}>M/S</Text>
            </View>
          </View>

          <TouchableOpacity 
            style={styles.doneButton} 
            activeOpacity={0.8}
            onPress={() => {
              if (global.Haptics) global.Haptics.impactAsync(global.Haptics.ImpactFeedbackStyle.Medium);
              closeRun();
            }}
          >
            <Text style={styles.doneButtonText}>Done</Text>
          </TouchableOpacity>
        </View>
      </BlurView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  blurContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  card: {
    width: width * 0.85,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 30,
    padding: 30,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(36, 199, 137, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: '#111',
    marginBottom: 30,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 40,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#111',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#888',
    letterSpacing: 1,
  },
  doneButton: {
    width: '100%',
    height: 56,
    borderRadius: 28,
    backgroundColor: '#24C789',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#24C789',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  doneButtonText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFF',
    letterSpacing: 1,
  },
});

export default RunSummaryModal;

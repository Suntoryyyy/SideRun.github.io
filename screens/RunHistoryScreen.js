import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

export default function RunHistoryScreen({ navigation }) {
  const [runs, setRuns] = useState([]);

  useEffect(() => {
    loadRuns();
  }, []);

  const loadRuns = async () => {
    try {
      const runsData = await AsyncStorage.getItem('recentRuns');
      if (runsData) {
        setRuns(JSON.parse(runsData));
      }
    } catch (e) {
      console.error('Failed to load runs', e);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
          >
            <Ionicons name="arrow-back" size={28} color="#111111" />
          </TouchableOpacity>
          <Text style={styles.title}>Run History</Text>
        </View>

        {runs.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="footsteps-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No runs yet!</Text>
            <Text style={styles.emptySubText}>Head out and record your first run to see it here.</Text>
          </View>
        ) : (
          runs.map((run, index) => (
            <View key={index} style={styles.runCard}>
              <View style={styles.runIconBox}>
                <Ionicons name="footsteps" size={24} color="#24C789" />
              </View>
              <View style={styles.runInfo}>
                <Text style={styles.runTitle}>Distance: {run.distance} km</Text>
                <Text style={styles.runDate}>{run.date} • {run.duration}</Text>
              </View>
              <View style={styles.runStats}>
                <Text style={styles.runPace}>{run.pace}'pace</Text>
                <Text style={styles.runCalories}>{run.calories} kcal</Text>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F5F7',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 30,
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    left: 0,
    zIndex: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#222222',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 60,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 16,
  },
  emptySubText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 30,
  },
  runCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  runIconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E8F8F2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  runInfo: {
    flex: 1,
  },
  runTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 4,
  },
  runDate: {
    fontSize: 13,
    color: '#888',
  },
  runStats: {
    alignItems: 'flex-end',
  },
  runPace: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#222',
  },
  runCalories: {
    fontSize: 13,
    color: '#FF9500',
    marginTop: 2,
  },
});

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, Modal, Dimensions } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import MapStyle from './MapStyle.json';

let MapView, Polyline, Marker;
if (Platform.OS !== 'web') {
  const Maps = require('react-native-maps');
  MapView = Maps.default;
  Polyline = Maps.Polyline;
  Marker = Maps.Marker;
}

const { width, height } = Dimensions.get('window');

export default function RunHistoryScreen({ navigation }) {
  const [runs, setRuns] = useState([]);
  const [selectedRun, setSelectedRun] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

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

  const openRunDetails = (run) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedRun(run);
    setModalVisible(true);
  };

  const closeRunDetails = () => {
    setModalVisible(false);
    setSelectedRun(null);
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
            <TouchableOpacity 
              key={index} 
              style={styles.runCard}
              activeOpacity={0.7}
              onPress={() => openRunDetails(run)}
            >
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
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* Run Details Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={closeRunDetails}
      >
        {selectedRun && (
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={closeRunDetails} style={styles.closeButton}>
                <Ionicons name="close" size={28} color="#333" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>{selectedRun.date} Run</Text>
              <View style={{ width: 28 }} />
            </View>

            <ScrollView contentContainerStyle={styles.modalScroll}>
              {/* Map Track */}
              <View style={styles.mapContainer}>
                {Platform.OS === 'web' ? (
                  <View style={styles.webMapPlaceholder}>
                    <Ionicons name="map-outline" size={48} color="#999" />
                    <Text style={styles.webMapText}>
                      Track visible on mobile app
                    </Text>
                  </View>
                ) : (
                  selectedRun.coordinates && selectedRun.coordinates.length > 0 ? (
                    <MapView
                      style={styles.map}
                      initialRegion={{
                        latitude: selectedRun.coordinates[0].latitude,
                        longitude: selectedRun.coordinates[0].longitude,
                        latitudeDelta: 0.02,
                        longitudeDelta: 0.02,
                      }}
                      scrollEnabled={false}
                      zoomEnabled={false}
                      customMapStyle={MapStyle}
                    >
                      <Polyline
                        coordinates={selectedRun.coordinates}
                        strokeColor="#FF9500"
                        strokeWidth={5}
                      />
                      <Marker coordinate={selectedRun.coordinates[0]} title="Start" pinColor="green" />
                      <Marker coordinate={selectedRun.coordinates[selectedRun.coordinates.length - 1]} title="Finish" pinColor="red" />
                    </MapView>
                  ) : (
                    <View style={styles.webMapPlaceholder}>
                      <Text style={styles.webMapText}>No GPS data for this run</Text>
                    </View>
                  )
                )}
              </View>

              {/* Stats Grid */}
              <View style={styles.statsGrid}>
                <View style={styles.statBox}>
                  <Text style={styles.statLabel}>Distance</Text>
                  <Text style={styles.statValue}>{selectedRun.distance} <Text style={styles.statUnit}>km</Text></Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statLabel}>Pace</Text>
                  <Text style={styles.statValue}>{selectedRun.pace} <Text style={styles.statUnit}>/km</Text></Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statLabel}>Duration</Text>
                  <Text style={styles.statValue}>{selectedRun.duration}</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statLabel}>Calories</Text>
                  <Text style={styles.statValue}>{selectedRun.calories} <Text style={styles.statUnit}>kcal</Text></Text>
                </View>
              </View>

              {/* Heart Rate Zones (Simulated Data) */}
              <View style={styles.sectionContainer}>
                <Text style={styles.sectionTitle}>Heart Rate Zones</Text>
                <View style={styles.zoneRow}>
                  <View style={[styles.zoneColor, { backgroundColor: '#FF3B30', width: '15%' }]} />
                  <Text style={styles.zoneName}>Peak (160+)</Text>
                  <Text style={styles.zoneTime}>15%</Text>
                </View>
                <View style={styles.zoneRow}>
                  <View style={[styles.zoneColor, { backgroundColor: '#FF9500', width: '45%' }]} />
                  <Text style={styles.zoneName}>Cardio (140-159)</Text>
                  <Text style={styles.zoneTime}>45%</Text>
                </View>
                <View style={styles.zoneRow}>
                  <View style={[styles.zoneColor, { backgroundColor: '#FFCC00', width: '30%' }]} />
                  <Text style={styles.zoneName}>Fat Burn (110-139)</Text>
                  <Text style={styles.zoneTime}>30%</Text>
                </View>
                <View style={styles.zoneRow}>
                  <View style={[styles.zoneColor, { backgroundColor: '#34C759', width: '10%' }]} />
                  <Text style={styles.zoneName}>Warm Up (<110)</Text>
                  <Text style={styles.zoneTime}>10%</Text>
                </View>
              </View>

            </ScrollView>
          </View>
        )}
      </Modal>
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
  modalContainer: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 60 : 20,
    paddingBottom: 20,
    paddingHorizontal: 20,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111',
  },
  closeButton: {
    padding: 5,
  },
  modalScroll: {
    paddingBottom: 40,
  },
  mapContainer: {
    width: width,
    height: width * 0.7,
    backgroundColor: '#FFF',
    marginBottom: 16,
  },
  map: {
    width: '100%',
    height: '100%',
  },
  webMapPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#EAEAEA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  webMapText: {
    fontSize: 16,
    color: '#666',
    marginTop: 10,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    backgroundColor: '#FFF',
    marginBottom: 16,
  },
  statBox: {
    width: '50%',
    padding: 12,
  },
  statLabel: {
    fontSize: 13,
    color: '#666',
    marginBottom: 4,
    fontWeight: '600',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#222',
  },
  statUnit: {
    fontSize: 14,
    fontWeight: 'normal',
    color: '#888',
  },
  sectionContainer: {
    backgroundColor: '#FFF',
    padding: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 15,
  },
  zoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  zoneName: {
    flex: 1,
    fontSize: 15,
    color: '#444',
  },
  zoneTime: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#222',
    width: 60,
    textAlign: 'right',
  },
  zoneColor: {
    height: 12,
    borderRadius: 6,
    marginRight: 10,
  },
});

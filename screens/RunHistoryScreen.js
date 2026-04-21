import React, { useState, useEffect } from "react";
import { Image } from 'expo-image';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Modal,
  Dimensions,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "../services/supabase";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import HistoryMap from "../components/RunScreenUI/HistoryMap";
import EmptyState from "../components/EmptyState";
import ThreeRings from "../components/ThreeRings";
import { T, FONT } from "../constants/typography";

const { width, height } = Dimensions.get("window");

export default function RunHistoryScreen({ navigation }) {
  const [runs, setRuns] = useState([]);
  const [selectedRun, setSelectedRun] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    loadRuns();
  }, []);

  const loadRuns = async () => {
    try {
      const c = await AsyncStorage.getItem("currentUser");
      if (c) {
        const parsed = JSON.parse(c);
        const { data, error } = await supabase
          .from("runs")
          .select("*")
          .eq("user_id", parsed.id)
          .order("created_at", { ascending: false })
          .limit(20);

        if (data && !error) {
          // Map DB columns to old expected properties
          const formattedRuns = data.map((r) => ({
            id: r.id,
            date: new Date(r.created_at).toLocaleDateString(),
            time: new Date(r.created_at).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
            distance: r.distance,
            duration: r.duration_seconds
              ? `${Math.floor(r.duration_seconds / 60)}:${r.duration_seconds % 60 < 10 ? "0" : ""}${r.duration_seconds % 60}`
              : "0:00",
            pace: r.pace,
            calories: r.calories,
            coordinates: [],
          }));
          setRuns(formattedRuns);
        }
      }
    } catch (e) {
      console.error("Failed to load runs from Supabase", e);
    }
  };

  const parseDurationSec = (str) => {
    if (!str || typeof str !== "string") return 0;
    const parts = str.split(":").map((n) => parseInt(n, 10) || 0);
    if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
    if (parts.length === 2) return parts[0] * 60 + parts[1];
    return 0;
  };

  // Format decimal min/km (e.g. 5.5) → "5:30 /km"
  const formatPaceMin = (pace) => {
    const p = Number(pace);
    if (!p || !isFinite(p) || p <= 0) return '—';
    const m = Math.floor(p);
    const s = Math.round((p - m) * 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Classify a run date string into a group label
  const dateGroup = (dateStr) => {
    const runDate = new Date(dateStr);
    if (isNaN(runDate)) return 'Earlier';
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const runDay = new Date(runDate);
    runDay.setHours(0, 0, 0, 0);
    const diff = Math.round((today - runDay) / 86400000);
    if (diff === 0) return 'Today';
    if (diff === 1) return 'Yesterday';
    if (diff < 7) return 'This week';
    if (diff < 14) return 'Last week';
    if (diff < 30) return 'This month';
    return 'Earlier';
  };

  // Build grouped list: [{ group, runs[] }, ...]
  const groupedRuns = (() => {
    const groups = [];
    const seen = new Map();
    for (const run of runs) {
      const g = dateGroup(run.date);
      if (!seen.has(g)) {
        seen.set(g, []);
        groups.push({ group: g, items: seen.get(g) });
      }
      seen.get(g).push(run);
    }
    return groups;
  })();

  // Aggregate stats for summary bar
  const totalKm = runs.reduce((s, r) => s + (Number(r.distance) || 0), 0);
  const totalRuns = runs.length;
  const bestKm = runs.reduce((m, r) => Math.max(m, Number(r.distance) || 0), 0);

  const runRingProgress = (run) => {
    const distance = Number(run.distance) || 0;
    const paceMin = Number(run.pace) || 8;
    const durSec = parseDurationSec(run.duration);
    return {
      dist: Math.min(1, distance / 5),
      pace: Math.min(1, Math.max(0, (8 - paceMin) / 4)),
      time: Math.min(1, durSec / 1800),
    };
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
          <EmptyState
            icon="footsteps-outline"
            title="No runs yet"
            desc="Your first run appears here with pace, splits, and the three-ring summary. Ready when you are."
            actionLabel="Start a run"
            onAction={() => navigation.navigate("Run")}
            accent="#FF5A36"
          />
        ) : (
          <>
            {/* Summary bar */}
            <View style={styles.summaryBar}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryValue}>{totalKm.toFixed(1)}</Text>
                <Text style={styles.summaryLabel}>KM TOTAL</Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryItem}>
                <Text style={styles.summaryValue}>{totalRuns}</Text>
                <Text style={styles.summaryLabel}>RUNS</Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryItem}>
                <Text style={styles.summaryValue}>{bestKm.toFixed(2)}</Text>
                <Text style={styles.summaryLabel}>BEST KM</Text>
              </View>
            </View>

            {groupedRuns.map(({ group, items }) => (
              <View key={group}>
                <Text style={styles.groupLabel}>{group}</Text>
                {items.map((run, index) => {
                  const progress = runRingProgress(run);
                  const distance = Number(run.distance) || 0;
                  const distanceDisplay = distance < 1
                    ? `${(distance * 1000).toFixed(0)} m`
                    : `${distance.toFixed(2)} km`;
                  return (
                    <TouchableOpacity
                      key={index}
                      style={styles.runCard}
                      activeOpacity={0.85}
                      onPress={() => openRunDetails(run)}
                    >
                      <View style={styles.runRingBox}>
                        <ThreeRings
                          size={56}
                          stroke={5}
                          gap={2}
                          rings={[
                            { progress: progress.dist, color: "#FF5A36", trackColor: "rgba(255,90,54,0.12)" },
                            { progress: progress.pace, color: "#24C789", trackColor: "rgba(36,199,137,0.12)" },
                            { progress: progress.time, color: "#00C2FF", trackColor: "rgba(0,194,255,0.12)" },
                          ]}
                        />
                      </View>
                      <View style={styles.runInfo}>
                        <Text style={styles.runTitle}>{distanceDisplay}</Text>
                        <Text style={styles.runDate}>{run.time} · {run.duration}</Text>
                      </View>
                      <View style={styles.runStats}>
                        <Text style={styles.runPace}>{formatPaceMin(run.pace)} /km</Text>
                        <Text style={styles.runCalories}>{run.calories ? `${Math.round(run.calories)} kcal` : '—'}</Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))}
          </>
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
              <TouchableOpacity
                onPress={closeRunDetails}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={28} color="#333" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>{selectedRun.date} Run</Text>
              <View style={{ width: 28 }} />
            </View>

            <ScrollView contentContainerStyle={styles.modalScroll}>
              {/* Map Track */}
              <View style={styles.mapContainer}>
                {selectedRun.coordinates && selectedRun.coordinates.length > 0 ? (
                  <HistoryMap coordinates={selectedRun.coordinates} />
                ) : (
                  <View style={styles.webMapPlaceholder}>
                    <Ionicons name="map-outline" size={48} color="#999" />
                    <Text style={styles.webMapText}>
                      No GPS data for this run
                    </Text>
                  </View>
                )}
              </View>

              {/* Stats Grid */}
              <View style={styles.statsGrid}>
                <View style={styles.statBox}>
                  <Text style={styles.statLabel}>DISTANCE</Text>
                  <Text style={styles.statValue}>
                    {Number(selectedRun.distance) < 1
                      ? `${(Number(selectedRun.distance) * 1000).toFixed(0)}`
                      : Number(selectedRun.distance).toFixed(2)}
                    <Text style={styles.statUnit}> {Number(selectedRun.distance) < 1 ? 'm' : 'km'}</Text>
                  </Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statLabel}>PACE</Text>
                  <Text style={styles.statValue}>
                    {formatPaceMin(selectedRun.pace)}
                    <Text style={styles.statUnit}> /km</Text>
                  </Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statLabel}>DURATION</Text>
                  <Text style={styles.statValue}>{selectedRun.duration}</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statLabel}>CALORIES</Text>
                  <Text style={styles.statValue}>
                    {selectedRun.calories ? Math.round(selectedRun.calories) : '—'}
                    {selectedRun.calories ? <Text style={styles.statUnit}> kcal</Text> : null}
                  </Text>
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
    backgroundColor: "#F4F5F7",
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
    paddingTop: Platform.OS === "ios" ? 60 : 40,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 30,
    position: "relative",
  },
  backButton: {
    position: "absolute",
    left: 0,
    zIndex: 10,
  },
  title: {
    ...T.title3,
    fontSize: 22,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 60,
  },
  emptyText: {
    ...T.title3,
    marginTop: 16,
  },
  emptySubText: {
    ...T.bodyMuted,
    textAlign: "center",
    marginTop: 8,
    paddingHorizontal: 30,
  },
  summaryBar: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    paddingVertical: 18,
    paddingHorizontal: 8,
    marginBottom: 20,
    alignItems: "center",
    justifyContent: "space-around",
    shadowColor: "#0B0F13",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 14,
    elevation: 2,
  },
  summaryItem: {
    flex: 1,
    alignItems: "center",
  },
  summaryValue: {
    fontFamily: FONT.extraBold,
    fontSize: 22,
    color: "#0B0F13",
    letterSpacing: -0.5,
    fontVariant: ["tabular-nums"],
  },
  summaryLabel: {
    ...T.eyebrow,
    fontSize: 9,
    marginTop: 3,
  },
  summaryDivider: {
    width: 1,
    height: 32,
    backgroundColor: "rgba(0,0,0,0.08)",
  },
  groupLabel: {
    fontFamily: FONT.bold,
    fontSize: 11,
    color: "#9AA0A6",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    marginBottom: 10,
    marginTop: 4,
    paddingLeft: 4,
  },
  runCard: {
    backgroundColor: "#FFF",
    borderRadius: 20,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    shadowColor: "#0B0F13",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 14,
    elevation: 2,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.04)",
  },
  runRingBox: {
    width: 56,
    height: 56,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  runInfo: {
    flex: 1,
  },
  runTitle: {
    ...T.metricL,
    fontSize: 18,
    marginBottom: 2,
  },
  runDate: {
    ...T.caption,
    color: "#888",
    fontVariant: ["tabular-nums"],
  },
  runStats: {
    alignItems: "flex-end",
  },
  runPace: {
    fontFamily: FONT.extraBold,
    fontSize: 14,
    color: "#0B0F13",
    letterSpacing: -0.2,
    fontVariant: ["tabular-nums"],
  },
  runCalories: {
    fontFamily: FONT.semibold,
    fontSize: 12,
    color: "#FF9500",
    marginTop: 2,
    fontVariant: ["tabular-nums"],
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "#FAFAFA",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: Platform.OS === "ios" ? 60 : 20,
    paddingBottom: 20,
    paddingHorizontal: 20,
    backgroundColor: "#FFF",
    borderBottomWidth: 1,
    borderBottomColor: "#EEE",
  },
  modalTitle: {
    ...T.title3,
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
    backgroundColor: "#FFF",
    marginBottom: 16,
  },
  map: {
    width: "100%",
    height: "100%",
  },
  webMapPlaceholder: {
    width: "100%",
    height: "100%",
    backgroundColor: "#EAEAEA",
    justifyContent: "center",
    alignItems: "center",
  },
  webMapText: {
    fontSize: 16,
    color: "#666",
    marginTop: 10,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    padding: 16,
    backgroundColor: "#FFF",
    marginBottom: 16,
  },
  statBox: {
    width: "50%",
    padding: 12,
  },
  statLabel: {
    ...T.label,
    marginBottom: 4,
  },
  statValue: {
    ...T.metricL,
    fontSize: 24,
  },
  statUnit: {
    ...T.metricUnit,
    fontSize: 14,
  },
  sectionContainer: {
    backgroundColor: "#FFF",
    padding: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    ...T.title4,
    marginBottom: 15,
  },
  zoneRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  zoneName: {
    ...T.body,
    flex: 1,
    color: "#444",
  },
  zoneTime: {
    ...T.metricM,
    fontSize: 15,
    width: 60,
    textAlign: "right",
  },
  zoneColor: {
    height: 12,
    borderRadius: 6,
    marginRight: 10,
  },
});

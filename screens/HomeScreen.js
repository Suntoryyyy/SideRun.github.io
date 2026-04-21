import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ScrollView,
  Dimensions,
  Image,
  Animated,
  Platform,
} from "react-native";
import useUserStore from '../store/useUserStore';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "../services/supabase";
import { useIsFocused } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { BlurView } from "expo-blur";
import * as Location from "expo-location";
import MapStyle from "./MapStyle.json";
import ProgressRing from "../components/ProgressRing";
import Sparkline from "../components/Sparkline";
import EmptyState from "../components/EmptyState";
import { T, FONT } from "../constants/typography";

let MapView, PROVIDER_GOOGLE;
if (Platform.OS !== "web") {
  const Maps = require("react-native-maps");
  MapView = Maps.default;
  PROVIDER_GOOGLE = Maps.PROVIDER_GOOGLE;
}

const { width } = Dimensions.get("window");

const DEFAULT_WEEKLY_GOAL_KM = 20;
const WEEKLY_GOAL_KEY = "siderun_weekly_goal_km";

export default function HomeScreen({ navigation }) {
  const isFocused = useIsFocused();
  const startButtonScale = useRef(new Animated.Value(1)).current;
  const [username, setUsername] = useState("Runner");
  const [avatar, setAvatar] = useState("");
  const [weeklyGoalKm, setWeeklyGoalKm] = useState(DEFAULT_WEEKLY_GOAL_KM);
  const [weekStats, setWeekStats] = useState({ km: 0, runs: 0, bestKm: 0 });
  const [weekSeries, setWeekSeries] = useState([0, 0, 0, 0, 0, 0, 0]);
  const [recentRun, setRecentRun] = useState(null);
  const [region, setRegion] = useState({
    latitude: 37.7749,
    longitude: -122.4194,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  });

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return;
      let location = await Location.getCurrentPositionAsync({});
      setRegion({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      });
    })();
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };

  useEffect(() => {
    if (isFocused) {
      loadUserData();
    }
  }, [isFocused]);

  const loadUserData = async () => {
    try {
      try {
        const goalStr = await AsyncStorage.getItem(WEEKLY_GOAL_KEY);
        const parsedGoal = Number(goalStr);
        if (parsedGoal && isFinite(parsedGoal) && parsedGoal > 0) {
          setWeeklyGoalKm(parsedGoal);
        }
      } catch (_) {}

      const cStr = await AsyncStorage.getItem("currentUser");
      if (!cStr) return;
      const c = JSON.parse(cStr);
      if (c.username) setUsername(c.username);
      if (c.avatar) setAvatar(c.avatar);

      if (!c.id) return;

      const { data: profile } = await supabase
        .from("users")
        .select("username, avatar")
        .eq("id", c.id)
        .single();
      if (profile) {
        if (profile.username) setUsername(profile.username);
        if (profile.avatar) setAvatar(profile.avatar);
      }

      const sevenDaysAgo = new Date();
      sevenDaysAgo.setHours(0, 0, 0, 0);
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
      const { data: weekRuns } = await supabase
        .from("runs")
        .select("distance, created_at")
        .eq("user_id", c.id)
        .gte("created_at", sevenDaysAgo.toISOString());
      if (Array.isArray(weekRuns)) {
        const totalKm = weekRuns.reduce(
          (sum, r) => sum + (Number(r.distance) || 0),
          0
        );
        const bestKm = weekRuns.reduce(
          (max, r) => Math.max(max, Number(r.distance) || 0),
          0
        );

        // Build a 7-day series ending today (oldest first)
        const series = Array(7).fill(0);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        weekRuns.forEach((r) => {
          const d = new Date(r.created_at);
          d.setHours(0, 0, 0, 0);
          const diffDays = Math.round((today - d) / 86400000);
          const idx = 6 - diffDays; // 0 = 6 days ago, 6 = today
          if (idx >= 0 && idx <= 6) {
            series[idx] += Number(r.distance) || 0;
          }
        });

        setWeekStats({ km: totalKm, runs: weekRuns.length, bestKm });
        setWeekSeries(series);
      }

      const { data: latest } = await supabase
        .from("runs")
        .select("id, distance, duration_seconds, created_at")
        .eq("user_id", c.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      setRecentRun(latest || null);
    } catch (e) {
      console.log("Error loading user data:", e);
    }
  };

  const formatDuration = (seconds) => {
    if (!seconds) return "0:00";
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const formatRelativeDate = (iso) => {
    if (!iso) return "";
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now - d;
    const diffH = Math.floor(diffMs / 36e5);
    if (diffH < 1) return "Just now";
    if (diffH < 24) return `${diffH}h ago`;
    const diffD = Math.floor(diffH / 24);
    if (diffD === 1) return "Yesterday";
    if (diffD < 7) return `${diffD}d ago`;
    return d.toLocaleDateString();
  };

  const handlePressIn = () => {
    Animated.spring(startButtonScale, {
      toValue: 0.92,
      useNativeDriver: true,
      speed: 20,
      bounciness: 10,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(startButtonScale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 20,
      bounciness: 10,
    }).start();
  };

  return (
    <View style={styles.container}>
      {/* Background Live Map */}
      {Platform.OS === "web" ? (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: -1,
          }}
        >
          <iframe
            width="100%"
            height="100%"
            frameBorder="0"
            scrolling="no"
            src={`https://www.openstreetmap.org/export/embed.html?bbox=${region.longitude - 0.025},${region.latitude - 0.025},${region.longitude + 0.025},${region.latitude + 0.025}&layer=mapnik`}
            style={{ border: "none", filter: "brightness(0.9) grayscale(0.8)" }}
          />
        </div>
      ) : (
        MapView && (
          <MapView
            style={StyleSheet.absoluteFillObject}
            provider={PROVIDER_GOOGLE}
            region={region}
            customMapStyle={MapStyle}
            showsUserLocation={false}
            pitchEnabled={false}
            rotateEnabled={false}
            scrollEnabled={false}
            zoomEnabled={false}
          />
        )
      )}

      {/* Main Content Overlay */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Dribbble-Style Greeting Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.menuButton}
            onPress={() => navigation.openDrawer()}
          >
            <BlurView intensity={60} tint="light" style={styles.iconCircle}>
              <Ionicons name="menu" size={24} color="#111" />
            </BlurView>
          </TouchableOpacity>
          <View style={styles.headerTop}>
            <View style={styles.greetingContainer}>
              <Text style={styles.greeting}>{getGreeting()}</Text>
              <Text style={styles.userName}>{username}</Text>
            </View>
            <View style={styles.userInfoContainer}>
              {avatar &&
              (avatar.startsWith("file:") ||
                avatar.startsWith("http") ||
                avatar.startsWith("data:")) ? (
                <Image
                  source={{ uri: avatar }}
                  style={styles.homeAvatarImage}
                />
              ) : (
                <BlurView intensity={60} tint="light" style={styles.iconCircle}>
                  <Ionicons name="person" size={24} color="#111" />
                </BlurView>
              )}
            </View>
          </View>
        </View>

        {/* Weekly Stats Card — Apple Fitness / Oura inspired */}
        <BlurView intensity={80} tint="light" style={styles.weekHeroCard}>
          <View style={styles.weekHeroTop}>
            <View style={styles.weekHeroLeft}>
              <Text style={styles.weekHeroLabel}>THIS WEEK</Text>
              <View style={styles.weekHeroNumRow}>
                <Text style={styles.weekHeroNum}>
                  {weekStats.km.toFixed(1)}
                </Text>
                <Text style={styles.weekHeroUnit}>km</Text>
              </View>
              <View style={styles.weekHeroChip}>
                <Text style={styles.weekHeroChipText}>
                  {Math.min(
                    100,
                    Math.round((weekStats.km / weeklyGoalKm) * 100)
                  )}
                  % of {weeklyGoalKm} km goal
                </Text>
              </View>
            </View>
            <ProgressRing
              size={92}
              stroke={10}
              progress={weekStats.km / weeklyGoalKm}
              color="#24C789"
              trackColor="rgba(0,0,0,0.06)"
              label="WEEK"
              textColor="#111"
            />
          </View>

          <View style={styles.weekHeroDivider} />

          <View style={styles.weekHeroStatsRow}>
            <View style={styles.weekHeroStat}>
              <Text style={styles.weekHeroStatLabel}>RUNS</Text>
              <Text style={styles.weekHeroStatValue}>{weekStats.runs}</Text>
            </View>
            <View style={styles.weekHeroStat}>
              <Text style={styles.weekHeroStatLabel}>BEST</Text>
              <Text style={styles.weekHeroStatValue}>
                {weekStats.bestKm.toFixed(1)}
                <Text style={styles.weekHeroStatUnit}> km</Text>
              </Text>
            </View>
            <View style={styles.weekHeroStat}>
              <Text style={styles.weekHeroStatLabel}>AVG</Text>
              <Text style={styles.weekHeroStatValue}>
                {weekStats.runs > 0
                  ? (weekStats.km / weekStats.runs).toFixed(1)
                  : "0.0"}
                <Text style={styles.weekHeroStatUnit}> km</Text>
              </Text>
            </View>
          </View>

          <Sparkline
            data={weekSeries.some((v) => v > 0) ? weekSeries : [0.1, 0.2, 0.15, 0.3, 0.2, 0.4, 0.25]}
            width={width - 24 * 2 - 24 * 2}
            height={32}
            color="#24C789"
            fillOpacity={0.18}
          />
        </BlurView>

        {/* Live Weather Preview */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            navigation.navigate("Weather");
          }}
        >
          <BlurView intensity={75} tint="light" style={styles.weatherCard}>
            <View style={styles.weatherIconContainer}>
              <Ionicons name="partly-sunny" size={32} color="#24C789" />
            </View>
            <View style={styles.weatherMeta}>
              <Text style={styles.weatherTemp}>18°C · Perfect Conditions</Text>
              <Text style={styles.weatherDesc}>
                Low wind, great time for a run
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#555" />
          </BlurView>
        </TouchableOpacity>

        {/* Recent Run - Mini Card */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Run</Text>
          <TouchableOpacity
            onPress={() => navigation.navigate("RunHistory")}
          >
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>

        {recentRun ? (
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => navigation.navigate("RunHistory")}
          >
            <BlurView intensity={80} tint="light" style={styles.recentRunCard}>
              <View style={styles.runIconBg}>
                <Ionicons name="location" size={20} color="#FFF" />
              </View>
              <View style={styles.runInfo}>
                <Text style={styles.runTitle}>
                  {Number(recentRun.distance).toFixed(2)} km run
                </Text>
                <Text style={styles.runDate}>
                  {formatRelativeDate(recentRun.created_at)}
                </Text>
              </View>
              <View style={styles.runStats}>
                <Text style={styles.runDistance}>
                  {Number(recentRun.distance).toFixed(2)} km
                </Text>
                <Text style={styles.runTime}>
                  {formatDuration(recentRun.duration_seconds)}
                </Text>
              </View>
            </BlurView>
          </TouchableOpacity>
        ) : (
          <EmptyState
            compact
            icon="footsteps-outline"
            title="No runs yet"
            desc="Tap START RUN to log your first one and light up the week ring."
            accent="#FF5A36"
          />
        )}
      </ScrollView>

      {/* Floating Big Start Button Component */}
      <View style={styles.startActionContainer}>
        <TouchableWithoutFeedback
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            navigation.navigate("Run");
          }}
        >
          <Animated.View
            style={[
              styles.startActionBtn,
              { transform: [{ scale: startButtonScale }] },
            ]}
          >
            <Ionicons
              name="play"
              size={32}
              color="#FFF"
              style={styles.playIcon}
            />
            <Text style={styles.startActionText}>START RUN</Text>
          </Animated.View>
        </TouchableWithoutFeedback>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#EAEAEA",
  },
  scrollContent: {
    padding: 24,
    paddingTop: Platform.OS === "ios" ? 60 : 40,
    paddingBottom: 140,
  },
  header: {
    marginBottom: 32,
    marginTop: 10,
  },
  menuButton: {
    marginBottom: 20,
    alignSelf: "flex-start",
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    backgroundColor: "rgba(255, 255, 255, 0.4)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.8)",
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  greetingContainer: {
    flex: 1,
  },
  greeting: {
    ...T.label,
    fontSize: 12,
    color: "#6B6F76",
    marginBottom: 4,
  },
  userName: {
    ...T.title1,
    fontSize: 30,
    letterSpacing: -1,
  },
  userInfoContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  homeAvatarImage: {
    width: 54,
    height: 54,
    borderRadius: 27,
    borderWidth: 2,
    borderColor: "#24C789",
  },
  weekHeroCard: {
    borderRadius: 28,
    padding: 20,
    marginBottom: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.9)",
    backgroundColor: "rgba(255, 255, 255, 0.72)",
  },
  weekHeroTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  weekHeroLeft: {
    flex: 1,
    paddingRight: 12,
  },
  weekHeroLabel: {
    ...T.eyebrow,
    color: "#6B6F76",
    marginBottom: 6,
  },
  weekHeroNumRow: {
    flexDirection: "row",
    alignItems: "baseline",
    marginBottom: 8,
  },
  weekHeroNum: {
    ...T.displayM,
  },
  weekHeroUnit: {
    fontFamily: FONT.semibold,
    fontSize: 16,
    color: "#6B6F76",
    marginLeft: 4,
  },
  weekHeroChip: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "rgba(36,199,137,0.15)",
  },
  weekHeroChipText: {
    ...T.pill,
    color: "#1EA574",
  },
  weekHeroDivider: {
    height: 1,
    backgroundColor: "rgba(0,0,0,0.08)",
    marginVertical: 14,
  },
  weekHeroStatsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  weekHeroStat: {
    alignItems: "flex-start",
  },
  weekHeroStatLabel: {
    ...T.label,
    marginBottom: 2,
  },
  weekHeroStatValue: {
    ...T.metricM,
  },
  weekHeroStatUnit: {
    ...T.metricUnit,
  },
  weatherCard: {
    borderRadius: 24,
    padding: 20,
    marginBottom: 32,
    flexDirection: "row",
    alignItems: "center",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.9)",
    backgroundColor: "rgba(255, 255, 255, 0.65)",
  },
  weatherIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "rgba(36, 199, 137, 0.15)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  weatherMeta: {
    flex: 1,
  },
  weatherTemp: {
    fontSize: 15,
    fontWeight: "800",
    color: "#111",
    marginBottom: 4,
  },
  weatherDesc: {
    fontSize: 13,
    color: "#666",
    fontWeight: "500",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontFamily: FONT.extraBold,
    fontSize: 20,
    color: "#111",
    letterSpacing: -0.5,
  },
  seeAllText: {
    fontFamily: FONT.bold,
    fontSize: 13,
    color: "#24C789",
    marginBottom: 4,
  },
  recentRunCard: {
    borderRadius: 24,
    padding: 20,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.9)",
    backgroundColor: "rgba(255, 255, 255, 0.75)",
    overflow: "hidden",
  },
  runIconBg: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#111",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  runInfo: {
    flex: 1,
  },
  runTitle: {
    fontFamily: FONT.extraBold,
    fontSize: 16,
    color: "#111",
    marginBottom: 4,
    letterSpacing: -0.2,
  },
  runDate: {
    fontFamily: FONT.medium,
    fontSize: 13,
    color: "#666",
  },
  runStats: {
    alignItems: "flex-end",
  },
  runDistance: {
    fontFamily: FONT.extraBold,
    fontSize: 16,
    color: "#24C789",
    marginBottom: 4,
    letterSpacing: -0.3,
    fontVariant: ["tabular-nums"],
  },
  runTime: {
    fontFamily: FONT.semibold,
    fontSize: 13,
    color: "#666",
    fontVariant: ["tabular-nums"],
  },
  emptyRunCard: {
    borderRadius: 24,
    padding: 24,
    marginBottom: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.9)",
    backgroundColor: "rgba(255, 255, 255, 0.65)",
    overflow: "hidden",
  },
  emptyRunText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#444",
    marginTop: 8,
  },
  emptyRunSub: {
    fontSize: 13,
    color: "#777",
    marginTop: 4,
    textAlign: "center",
  },
  startActionContainer: {
    position: "absolute",
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: "center",
    paddingHorizontal: 20,
  },
  startActionBtn: {
    backgroundColor: "#24C789",
    width: "100%",
    height: 64,
    borderRadius: 32,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#24C789",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  playIcon: {
    marginRight: 8,
  },
  startActionText: {
    fontFamily: FONT.extraBold,
    fontSize: 18,
    color: "#FFFFFF",
    letterSpacing: 1,
  },
});

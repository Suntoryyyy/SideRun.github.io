import React, { useState, useEffect } from "react";
import BouncyButton from "../components/BouncyButton";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  Image,
  Platform,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "../services/supabase";
import { useIsFocused } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import ProgressRing from "../components/ProgressRing";
import Sparkline from "../components/Sparkline";
import EmptyState from "../components/EmptyState";
import { T, FONT } from "../constants/typography";

const { width } = Dimensions.get("window");

const DEFAULT_WEEKLY_GOAL_KM = 20;
const WEEKLY_GOAL_KEY = "siderun_weekly_goal_km";
const EMPTY_WEEK_STATS = { km: 0, runs: 0, bestKm: 0 };
const EMPTY_WEEK_SERIES = [0, 0, 0, 0, 0, 0, 0];

const WEATHER_ICON_MAP = (wid) => {
  if (!wid) return 'partly-sunny';
  if (wid >= 200 && wid < 300) return 'thunderstorm';
  if (wid >= 300 && wid < 600) return 'rainy';
  if (wid >= 600 && wid < 700) return 'snow';
  if (wid >= 700 && wid < 800) return 'cloudy';
  if (wid === 800) return 'sunny';
  return 'partly-sunny';
};

const getRunCondition = (temp, wid) => {
  if (wid == null) return ['Perfect Conditions', 'Low wind, great time for a run'];
  if (wid >= 200 && wid < 300) return ['Storm — rest day', 'Thunder ahead, skip it'];
  if (wid >= 300 && wid < 600) return ['Wet conditions', 'Rainy — bring waterproof gear'];
  if (wid >= 600 && wid < 700) return ['Snow day', 'Careful on slippery roads'];
  if (temp < 0) return ['Very cold', 'Layer up, keep it short'];
  if (temp < 8) return ['Cool & crisp', 'Great for steady-pace runs'];
  if (temp < 16) return ['Perfect Conditions', 'Ideal running weather'];
  if (temp < 24) return ['Comfortable', 'Good conditions, stay hydrated'];
  if (temp < 30) return ['Warm run', 'Go early, hydrate frequently'];
  return ['Too hot', 'Prefer early AM or indoors'];
};

const hapticLight = () => {
  if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
};
const hapticHeavy = () => {
  if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
};

const isSameRun = (a, b) => {
  if (!a || !b) return false;
  return (
    a.created_at &&
    b.created_at &&
    a.created_at === b.created_at &&
    Number(a.distance || 0) === Number(b.distance || 0)
  );
};

const mergeLocalRun = (runs = [], localRun = null) => {
  if (!localRun) return runs;
  if (runs.some((run) => isSameRun(run, localRun))) return runs;
  return [...runs, localRun];
};

const buildWeekSummary = (runs = []) => {
  const series = [...EMPTY_WEEK_SERIES];
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setHours(0, 0, 0, 0);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);

  const inWindow = runs.filter((r) => {
    if (!r?.created_at) return false;
    return new Date(r.created_at) >= sevenDaysAgo;
  });

  const totalKm = inWindow.reduce((sum, r) => sum + (Number(r.distance) || 0), 0);
  const bestKm = inWindow.reduce((max, r) => Math.max(max, Number(r.distance) || 0), 0);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  inWindow.forEach((r) => {
    const d = new Date(r.created_at);
    d.setHours(0, 0, 0, 0);
    const diffDays = Math.round((today - d) / 86400000);
    const idx = 6 - diffDays;
    if (idx >= 0 && idx <= 6) {
      series[idx] += Number(r.distance) || 0;
    }
  });

  return {
    stats: { km: totalKm, runs: inWindow.length, bestKm },
    series,
  };
};

export default function HomeScreen({ navigation }) {
  const isFocused = useIsFocused();
  const [username, setUsername] = useState("Runner");
  const [avatar, setAvatar] = useState("");
  const [weeklyGoalKm, setWeeklyGoalKm] = useState(DEFAULT_WEEKLY_GOAL_KM);
  const [weekStats, setWeekStats] = useState(EMPTY_WEEK_STATS);
  const [weekSeries, setWeekSeries] = useState(EMPTY_WEEK_SERIES);
  const [recentRun, setRecentRun] = useState(null);
  const [nextTarget, setNextTarget] = useState(null); // { km, label }
  const [weather, setWeather] = useState(null);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "GOOD MORNING";
    if (hour < 18) return "GOOD AFTERNOON";
    return "GOOD EVENING";
  };

  useEffect(() => {
    if (isFocused) loadUserData();
  }, [isFocused]);

  useEffect(() => {
    fetchWeather();
  }, []);

  const getStoredCurrentUser = async () => {
    if (Platform.OS === "web") {
      try {
        const sessionUser = sessionStorage.getItem("currentUser");
        if (sessionUser) return sessionUser;
      } catch (_) {}
    }

    try {
      return await AsyncStorage.getItem("currentUser");
    } catch (_) {
      return null;
    }
  };

  const fetchWeather = async () => {
    try {
      const apiKey = process.env.EXPO_PUBLIC_OPENWEATHER_API_KEY;
      if (!apiKey) return;

      // Try cached run coords first (no permission needed)
      let lat = 31.2304;
      let lon = 121.4737;
      try {
        const cached = await AsyncStorage.getItem('lastRunCoords');
        if (cached) {
          const { latitude, longitude } = JSON.parse(cached);
          if (latitude && longitude) { lat = latitude; lon = longitude; }
        }
      } catch (_) {}

      const resp = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`
      );
      const data = await resp.json();
      if (data?.main) setWeather(data);
    } catch (e) {
      console.warn('[HomeScreen] weather fetch failed', e);
    }
  };

  const loadUserData = async () => {
    try {
      try {
        const goalStr = await AsyncStorage.getItem(WEEKLY_GOAL_KEY);
        const parsedGoal = Number(goalStr);
        if (parsedGoal && isFinite(parsedGoal) && parsedGoal > 0) {
          setWeeklyGoalKm(parsedGoal);
        }
      } catch (_) {}

      // Read the local seed/cache FIRST so Demo Mode works even while signed out.
      let localRun = null;
      try {
        const localStr = await AsyncStorage.getItem("lastCompletedRun");
        if (localStr) localRun = JSON.parse(localStr);
      } catch (_) {}
      setRecentRun(localRun || null);

      const localWeek = buildWeekSummary(localRun ? [localRun] : []);
      setWeekStats(localWeek.stats);
      setWeekSeries(localWeek.series);

      const cStr = await getStoredCurrentUser();
      if (!cStr) {
        setUsername("Runner");
        setAvatar("");
        setNextTarget(null);
        return;
      }
      const c = JSON.parse(cStr);
      if (c.username) setUsername(c.username);
      if (c.avatar) setAvatar(c.avatar);

      if (!c.id) {
        setNextTarget(null);
        return;
      }

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
        const mergedWeekRuns = mergeLocalRun(weekRuns, localRun);
        const weekSummary = buildWeekSummary(mergedWeekRuns);
        setWeekStats(weekSummary.stats);
        setWeekSeries(weekSummary.series);
      }

      // Supabase: last run + last 4 for next-target calculation
      const { data: latestRuns } = await supabase
        .from("runs")
        .select("id, distance, duration_seconds, pace, created_at")
        .eq("user_id", c.id)
        .order("created_at", { ascending: false })
        .limit(4);

      // Merge: prefer whichever entry has the MORE RECENT created_at so
      // that seeded demo runs always appear even when Supabase is empty,
      // but real completed runs correctly replace them once uploaded.
      const mergedRecentRuns = mergeLocalRun(latestRuns || [], localRun)
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 4);
      setRecentRun(mergedRecentRuns[0] || null);

      // Compute next-target suggestion from recent history.
      if (mergedRecentRuns.length > 0) {
        const avgKm =
          mergedRecentRuns.reduce((s, r) => s + (Number(r.distance) || 0), 0) /
          mergedRecentRuns.length;
        // Suggest 5–10 % more than average, rounded to nearest 0.5.
        const suggested = Math.round((avgKm * 1.075) / 0.5) * 0.5;
        const MILESTONES = [1, 2, 3, 5, 7, 10, 15, 21.1, 42.2];
        // Nearest milestone above suggested.
        const milestone = MILESTONES.find((m) => m >= suggested) || suggested;
        if (milestone > avgKm + 0.1) {
          setNextTarget({ km: milestone, label: getMilestoneLabel(milestone) });
        }
      }
    } catch (e) {
      console.log("Error loading user data:", e);
    }
  };

  const getMilestoneLabel = (km) => {
    if (km >= 42) return 'Marathon';
    if (km >= 21) return 'Half marathon';
    if (km >= 10) return '10K';
    if (km >= 5) return '5K';
    return `${km.toFixed(1)} km`;
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

  const goalProgress = Math.min(1, weekStats.km / weeklyGoalKm || 0);
  const goalPct = Math.min(100, Math.round(goalProgress * 100));

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Editorial header */}
        <View style={styles.header}>
          <View style={styles.headerTopRow}>
            <View style={styles.greetingContainer}>
              <Text style={styles.greeting}>{getGreeting()}</Text>
              <Text style={styles.userName}>{username}</Text>
            </View>
            <BouncyButton
              onPress={() => navigation.navigate('Profile')}
              activeOpacity={0.8}
            >
              {avatar &&
              (avatar.startsWith("file:") ||
                avatar.startsWith("http") ||
                avatar.startsWith("data:")) ? (
                <Image
                  source={{ uri: avatar }}
                  style={styles.homeAvatarImage}
                />
              ) : (
                <View style={styles.avatarFallback}>
                  <Text style={styles.avatarFallbackText}>
                    {(username || "R").trim().charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}
            </BouncyButton>
          </View>
        </View>

        {/* Weekly hero card — Apple Fitness / Oura inspired */}
        <View style={styles.weekHeroCard}>
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
                  {goalPct}% of {weeklyGoalKm} km goal
                </Text>
              </View>
            </View>
            <ProgressRing
              size={96}
              stroke={10}
              progress={goalProgress}
              color="#24C789"
              trackColor="rgba(0,0,0,0.06)"
              valueText={`${goalPct}%`}
              label="WEEK"
              textColor="#0B0F13"
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
            data={
              weekSeries.some((v) => v > 0)
                ? weekSeries
                : [0.1, 0.2, 0.15, 0.3, 0.2, 0.4, 0.25]
            }
            width={width - 24 * 2 - 20 * 2}
            height={32}
            color="#24C789"
            fillOpacity={0.18}
          />
        </View>

        {/* Weather preview */}
        {(() => {
          const wid = weather?.weather?.[0]?.id;
          const temp = weather?.main?.temp;
          const [condLabel, condDesc] = getRunCondition(temp, wid);
          const tempStr = temp != null ? `${Math.round(temp)}°C · ` : '';
          return (
            <BouncyButton
              activeOpacity={0.85}
              onPress={() => { hapticLight(); navigation.navigate("Weather"); }}
              style={styles.weatherCard}
            >
              <View style={styles.weatherIconContainer}>
                <Ionicons name={WEATHER_ICON_MAP(wid)} size={26} color="#1EA574" />
              </View>
              <View style={styles.weatherMeta}>
                <Text style={styles.weatherTemp}>{tempStr}{condLabel}</Text>
                <Text style={styles.weatherDesc}>{condDesc}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9AA0A6" />
            </BouncyButton>
          );
        })()}

        {/* Recent Run */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent run</Text>
          <BouncyButton onPress={() => navigation.navigate("RunHistory")}>
            <Text style={styles.seeAllText}>See all</Text>
          </BouncyButton>
        </View>

        {recentRun ? (
          <>
            <BouncyButton
              activeOpacity={0.85}
              onPress={() => navigation.navigate("RunHistory")}
              style={styles.recentRunCard}
            >
              <View style={styles.runIconBg}>
                <Ionicons name="footsteps" size={18} color="#FFF" />
              </View>
              <View style={styles.runInfo}>
                <Text style={styles.runTitle}>
                  {Number(recentRun.distance).toFixed(2)} km
                </Text>
                <Text style={styles.runDate}>
                  {formatRelativeDate(recentRun.created_at)}
                </Text>
              </View>
              <View style={styles.runStats}>
                <Text style={styles.runDistance}>
                  {formatDuration(recentRun.duration_seconds)}
                </Text>
                {recentRun.pace != null && Number(recentRun.pace) > 0 ? (
                  <Text style={styles.runTime}>
                    {(() => {
                      const p = Number(recentRun.pace);
                      const m = Math.floor(p);
                      const s = Math.round((p - m) * 60);
                      return `${m}:${s < 10 ? '0' : ''}${s} /km`;
                    })()}
                  </Text>
                ) : (
                  <Text style={styles.runTime}>duration</Text>
                )}
              </View>
            </BouncyButton>

            {nextTarget && (
              <BouncyButton
                activeOpacity={0.8}
                onPress={() => navigation.navigate("Run", { mode: 'solo', spectateFriend: null })}
                style={styles.nextTargetChip}
              >
                <Ionicons name="trending-up" size={14} color="#24C789" />
                <Text style={styles.nextTargetText}>
                  Next target: <Text style={styles.nextTargetBold}>{nextTarget.label} ({nextTarget.km.toFixed(1)} km)</Text>
                </Text>
                <Ionicons name="chevron-forward" size={14} color="#9AA0A6" />
              </BouncyButton>
            )}
          </>
        ) : (
          <EmptyState
            compact
            icon="footsteps-outline"
            title="No runs yet"
            desc="Tap the run button below to log your first one."
            accent="#FF5A36"
          />
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F8FA",
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: Platform.OS === "ios" ? 64 : 44,
    // just breathing room above the tab bar; Run button on the tab bar is the CTA
    paddingBottom: 40,
  },
  header: {
    marginBottom: 20,
  },
  headerTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  greetingContainer: {
    flex: 1,
    paddingRight: 12,
  },
  greeting: {
    ...T.eyebrow,
    marginBottom: 4,
  },
  userName: {
    ...T.title1,
    fontSize: 30,
    letterSpacing: -1,
  },
  homeAvatarImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  avatarFallback: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#0B0F13",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  avatarFallbackText: {
    fontFamily: FONT.bold,
    fontSize: 18,
    color: "#0B0F13",
  },
  weekHeroCard: {
    borderRadius: 28,
    padding: 20,
    marginBottom: 14,
    backgroundColor: "#FFFFFF",
    shadowColor: "#0B0F13",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 24,
    elevation: 2,
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
    marginBottom: 6,
  },
  weekHeroNumRow: {
    flexDirection: "row",
    alignItems: "baseline",
    marginBottom: 10,
  },
  weekHeroNum: {
    ...T.displayM,
    fontSize: 40,
    lineHeight: 44,
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
    backgroundColor: "rgba(36,199,137,0.12)",
  },
  weekHeroChipText: {
    ...T.pill,
    color: "#1EA574",
  },
  weekHeroDivider: {
    height: 1,
    backgroundColor: "rgba(11,15,19,0.06)",
    marginVertical: 14,
  },
  weekHeroStatsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 14,
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
    borderRadius: 22,
    padding: 16,
    marginBottom: 24,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    shadowColor: "#0B0F13",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.04,
    shadowRadius: 18,
    elevation: 1,
  },
  weatherIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(36,199,137,0.12)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  weatherMeta: {
    flex: 1,
  },
  weatherTemp: {
    fontFamily: FONT.extraBold,
    fontSize: 15,
    color: "#0B0F13",
    letterSpacing: -0.2,
    marginBottom: 2,
  },
  weatherDesc: {
    ...T.caption,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: 12,
    paddingHorizontal: 2,
  },
  sectionTitle: {
    ...T.title3,
  },
  seeAllText: {
    fontFamily: FONT.bold,
    fontSize: 13,
    color: "#0B0F13",
    textDecorationLine: "underline",
  },
  recentRunCard: {
    borderRadius: 22,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    shadowColor: "#0B0F13",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.04,
    shadowRadius: 18,
    elevation: 1,
  },
  runIconBg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#0B0F13",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  runInfo: {
    flex: 1,
  },
  runTitle: {
    fontFamily: FONT.extraBold,
    fontSize: 15,
    color: "#0B0F13",
    marginBottom: 2,
    letterSpacing: -0.2,
  },
  runDate: {
    ...T.caption,
  },
  runStats: {
    alignItems: "flex-end",
  },
  runDistance: {
    fontFamily: FONT.extraBold,
    fontSize: 15,
    color: "#0B0F13",
    letterSpacing: -0.2,
    fontVariant: ["tabular-nums"],
  },
  runTime: {
    ...T.label,
    marginTop: 2,
  },
  nextTargetChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: 'rgba(36,199,137,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(36,199,137,0.18)',
    marginBottom: 8,
  },
  nextTargetText: {
    flex: 1,
    fontFamily: FONT.semibold,
    fontSize: 13,
    color: '#0B0F13',
  },
  nextTargetBold: {
    fontFamily: FONT.extraBold,
    color: '#1EA574',
  },
  startActionContainer: {
    position: "absolute",
    // sit above the tab bar (TAB_BAR_HEIGHT) + a little breathing room
    bottom: Platform.OS === "ios" ? 99 : Platform.OS === "android" ? 80 : 84,
    left: 0,
    right: 0,
    alignItems: "center",
    paddingHorizontal: 24,
  },
  startActionBtn: {
    backgroundColor: "#0B0F13",
    width: "100%",
    height: 60,
    borderRadius: 30,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
    shadowColor: "#0B0F13",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 8,
  },
  playDot: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  playArrow: {
    marginLeft: 10,
  },
  startActionText: {
    ...T.button,
    fontSize: 16,
  },
});

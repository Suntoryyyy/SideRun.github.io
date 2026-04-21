import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "../services/supabase";
import { Ionicons } from "@expo/vector-icons";
import { T, FONT } from "../constants/typography";
import ProgressRing from "../components/ProgressRing";

// Badge catalog: id → { ion icon name, accent color }
const BADGE_ICONS = {
  first_steps: { icon: "footsteps-outline", color: "#24C789" },
  first_5k: { icon: "walk-outline", color: "#24C789" },
  first_10k: { icon: "flash-outline", color: "#FF5A36" },
  marathoner: { icon: "medal-outline", color: "#F6C65D" },
  week_warrior: { icon: "shield-checkmark-outline", color: "#0B0F13" },
  consistent_runner: { icon: "calendar-outline", color: "#00C2FF" },
  early_bird: { icon: "sunny-outline", color: "#F6C65D" },
  social_butterfly: { icon: "people-outline", color: "#00C2FF" },
  speed_demon: { icon: "flash-outline", color: "#FF5A36" },
  night_runner: { icon: "moon-outline", color: "#5B6CFF" },
  weather_warrior: { icon: "rainy-outline", color: "#00C2FF" },
  route_explorer: { icon: "map-outline", color: "#24C789" },
};

export default function BadgesScreen({ navigation }) {
  const [userStats, setUserStats] = useState({
    totalDistance: 0,
    totalRuns: 0,
    weeklyDistance: 0,
    weeklyRuns: 0,
  });
  const [unlockedBadges, setUnlockedBadges] = useState([]);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const currentUserStr = await AsyncStorage.getItem("currentUser");
      if (currentUserStr) {
        const currentUser = JSON.parse(currentUserStr);
        const { data, error } = await supabase
          .from("users")
          .select("weeklyDistance, totalRuns, unlocked_badges")
          .eq("id", currentUser.id)
          .single();

        if (data && !error) {
          const stats = {
            totalDistance: data.weeklyDistance || 0,
            totalRuns: data.totalRuns || 0,
            weeklyDistance: data.weeklyDistance || 0,
            weeklyRuns: data.totalRuns || 0,
          };
          setUserStats(stats);

          let badges = data.unlocked_badges || ["first_steps"];
          setUnlockedBadges(badges);
          checkBadgeUnlocks(stats, badges, currentUser.id);
        }
      }
    } catch (error) {
      console.error("Error loading badges:", error);
    }
  };

  const checkBadgeUnlocks = async (stats, currentBadges, userId) => {
    const badgesToCheck = [
      { id: "first_5k", condition: stats.totalDistance >= 5 },
      { id: "first_10k", condition: stats.totalDistance >= 10 },
      { id: "marathoner", condition: stats.totalDistance >= 42.2 },
      { id: "week_warrior", condition: stats.weeklyDistance >= 20 },
      { id: "consistent_runner", condition: stats.weeklyRuns >= 5 },
      { id: "early_bird", condition: stats.weeklyRuns >= 3 },
      { id: "social_butterfly", condition: stats.totalRuns >= 10 },
      { id: "speed_demon", condition: stats.totalRuns >= 5 },
      { id: "night_runner", condition: stats.totalRuns >= 3 },
    ];

    const newBadges = badgesToCheck
      .filter((badge) => badge.condition && !currentBadges.includes(badge.id))
      .map((badge) => badge.id);

    if (newBadges.length > 0) {
      const updatedBadges = [...currentBadges, ...newBadges];
      setUnlockedBadges(updatedBadges);
      if (userId) {
        await supabase
          .from("users")
          .update({ unlocked_badges: updatedBadges })
          .eq("id", userId);
      }
    }
  };

  const allBadges = [
    {
      id: "first_steps",
      name: "First Steps",
      description: "Complete your first run",
      category: "Getting Started",
      unlocked: unlockedBadges.includes("first_steps"),
    },
    {
      id: "first_5k",
      name: "First 5K",
      description: "Run your first 5 kilometers",
      category: "Distance",
      unlocked: unlockedBadges.includes("first_5k"),
      progress: Math.min(userStats.totalDistance / 5, 1),
    },
    {
      id: "first_10k",
      name: "First 10K",
      description: "Run your first 10 kilometers",
      category: "Distance",
      unlocked: unlockedBadges.includes("first_10k"),
      progress: Math.min(userStats.totalDistance / 10, 1),
    },
    {
      id: "marathoner",
      name: "Marathoner",
      description: "Complete a full marathon (42.2 km)",
      category: "Distance",
      unlocked: unlockedBadges.includes("marathoner"),
      progress: Math.min(userStats.totalDistance / 42.2, 1),
    },
    {
      id: "week_warrior",
      name: "Week Warrior",
      description: "Run 20+ km in a week",
      category: "Weekly",
      unlocked: unlockedBadges.includes("week_warrior"),
      progress: Math.min(userStats.weeklyDistance / 20, 1),
    },
    {
      id: "consistent_runner",
      name: "Consistent",
      description: "Complete 5 runs in a week",
      category: "Consistency",
      unlocked: unlockedBadges.includes("consistent_runner"),
      progress: Math.min(userStats.weeklyRuns / 5, 1),
    },
    {
      id: "early_bird",
      name: "Early Bird",
      description: "Run 5 times before 7 AM",
      category: "Time",
      unlocked: unlockedBadges.includes("early_bird"),
      progress: Math.min(userStats.weeklyRuns / 5, 1),
    },
    {
      id: "social_butterfly",
      name: "Social",
      description: "Share 10 runs with friends",
      category: "Social",
      unlocked: unlockedBadges.includes("social_butterfly"),
      progress: Math.min(userStats.totalRuns / 10, 1),
    },
    {
      id: "speed_demon",
      name: "Speed Demon",
      description: "Keep pace under 5 min/km",
      category: "Speed",
      unlocked: unlockedBadges.includes("speed_demon"),
      progress: 0.5,
    },
    {
      id: "night_runner",
      name: "Night Runner",
      description: "Complete 5 runs after sunset",
      category: "Time",
      unlocked: unlockedBadges.includes("night_runner"),
      progress: Math.min(userStats.totalRuns / 5, 1),
    },
    {
      id: "weather_warrior",
      name: "Weather Warrior",
      description: "Run in challenging weather conditions",
      category: "Adventure",
      unlocked: false,
      progress: 0,
    },
    {
      id: "route_explorer",
      name: "Route Explorer",
      description: "Discover and run 10 different routes",
      category: "Exploration",
      unlocked: false,
      progress: 0,
    },
  ];

  const categories = [
    "All",
    "Getting Started",
    "Distance",
    "Weekly",
    "Consistency",
    "Time",
    "Social",
    "Speed",
    "Adventure",
    "Exploration",
  ];
  const [selectedCategory, setSelectedCategory] = useState("All");

  const filteredBadges =
    selectedCategory === "All"
      ? allBadges
      : allBadges.filter((badge) => badge.category === selectedCategory);

  const unlockedCount = allBadges.filter((badge) => badge.unlocked).length;
  const totalCount = allBadges.length;
  const overallProgress = unlockedCount / totalCount;

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
          >
            <Ionicons name="chevron-back" size={22} color="#0B0F13" />
          </TouchableOpacity>
          <Text style={styles.eyebrow}>ACHIEVEMENTS</Text>
          <Text style={styles.title}>Badges</Text>
          <Text style={styles.subtitle}>
            Stack them up as your streak grows.
          </Text>
        </View>

        <View style={styles.heroCard}>
          <View style={styles.heroRing}>
            <ProgressRing
              progress={overallProgress}
              size={96}
              stroke={10}
              color="#0B0F13"
              trackColor="#F0F1F4"
              valueText={String(unlockedCount)}
              label={`OF ${totalCount}`}
            />
          </View>
          <View style={styles.heroCopy}>
            <Text style={styles.heroTitle}>
              {Math.round(overallProgress * 100)}% unlocked
            </Text>
            <Text style={styles.heroSubtitle}>
              Keep running to earn the next badge. Every kilometer counts.
            </Text>
          </View>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryRow}
        >
          {categories.map((category) => {
            const active = selectedCategory === category;
            return (
              <TouchableOpacity
                key={category}
                style={[
                  styles.categoryChip,
                  active && styles.categoryChipActive,
                ]}
                onPress={() => setSelectedCategory(category)}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.categoryText,
                    active && styles.categoryTextActive,
                  ]}
                >
                  {category}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <View style={styles.badgesContainer}>
          {filteredBadges.map((badge) => {
            const meta = BADGE_ICONS[badge.id] || {
              icon: "ribbon-outline",
              color: "#0B0F13",
            };
            const iconTint = badge.unlocked ? meta.color : "#C6C9CD";
            const iconBg = badge.unlocked ? `${meta.color}18` : "#F4F5F7";

            return (
              <View
                key={badge.id}
                style={[
                  styles.badgeCard,
                  !badge.unlocked && styles.badgeCardLocked,
                ]}
              >
                <View style={[styles.badgeIconWrap, { backgroundColor: iconBg }]}>
                  <Ionicons name={meta.icon} size={22} color={iconTint} />
                </View>
                <View style={styles.badgeInfo}>
                  <View style={styles.badgeNameRow}>
                    <Text
                      style={[
                        styles.badgeName,
                        !badge.unlocked && styles.badgeNameLocked,
                      ]}
                    >
                      {badge.name}
                    </Text>
                    {badge.unlocked && (
                      <Ionicons
                        name="checkmark-circle"
                        size={16}
                        color={meta.color}
                        style={{ marginLeft: 6 }}
                      />
                    )}
                  </View>
                  <Text style={styles.badgeCategory}>{badge.category}</Text>
                  <Text
                    style={[
                      styles.badgeDescription,
                      !badge.unlocked && styles.badgeDescriptionLocked,
                    ]}
                  >
                    {badge.description}
                  </Text>
                  {!badge.unlocked && badge.progress !== undefined && (
                    <View style={styles.progressRow}>
                      <View style={styles.progressTrack}>
                        <View
                          style={[
                            styles.progressFill,
                            {
                              width: `${badge.progress * 100}%`,
                              backgroundColor: meta.color,
                            },
                          ]}
                        />
                      </View>
                      <Text style={styles.progressText}>
                        {Math.round(badge.progress * 100)}%
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F4F5F7",
  },
  scrollContent: {
    paddingBottom: 48,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 64,
    paddingBottom: 20,
    backgroundColor: "#FFFFFF",
    position: "relative",
  },
  backButton: {
    position: "absolute",
    left: 20,
    top: 60,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F4F5F7",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  eyebrow: {
    ...T.eyebrow,
    marginTop: 6,
  },
  title: {
    ...T.title1,
    fontSize: 34,
    marginTop: 6,
    marginBottom: 6,
  },
  subtitle: {
    ...T.bodyMuted,
    fontSize: 14,
  },
  heroCard: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 20,
    marginTop: 16,
    padding: 20,
    borderRadius: 24,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#0B0F13",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 3,
  },
  heroRing: {
    marginRight: 18,
  },
  heroCopy: {
    flex: 1,
  },
  heroTitle: {
    ...T.title3,
    fontSize: 18,
    marginBottom: 4,
  },
  heroSubtitle: {
    ...T.bodyMuted,
    fontSize: 13,
    lineHeight: 18,
  },
  categoryRow: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    marginRight: 8,
  },
  categoryChipActive: {
    backgroundColor: "#0B0F13",
  },
  categoryText: {
    fontFamily: FONT.semibold,
    fontSize: 13,
    color: "#6B6F76",
    letterSpacing: 0.2,
  },
  categoryTextActive: {
    color: "#FFFFFF",
  },
  badgesContainer: {
    paddingHorizontal: 20,
  },
  badgeCard: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 20,
    marginBottom: 10,
    shadowColor: "#0B0F13",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 1,
  },
  badgeCardLocked: {
    backgroundColor: "#FFFFFF",
  },
  badgeIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  badgeInfo: {
    flex: 1,
  },
  badgeNameRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 2,
  },
  badgeName: {
    ...T.title4,
    fontSize: 15,
    color: "#0B0F13",
  },
  badgeNameLocked: {
    color: "#6B6F76",
  },
  badgeCategory: {
    ...T.label,
    fontSize: 10,
    marginBottom: 4,
  },
  badgeDescription: {
    fontFamily: FONT.medium,
    fontSize: 13,
    color: "#6B6F76",
    lineHeight: 18,
  },
  badgeDescriptionLocked: {
    color: "#9AA0A6",
  },
  progressRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
  },
  progressTrack: {
    flex: 1,
    height: 4,
    backgroundColor: "#F0F1F4",
    borderRadius: 2,
    overflow: "hidden",
    marginRight: 10,
  },
  progressFill: {
    height: "100%",
    borderRadius: 2,
  },
  progressText: {
    fontFamily: FONT.semibold,
    fontSize: 11,
    color: "#6B6F76",
    fontVariant: ["tabular-nums"],
    minWidth: 32,
    textAlign: "right",
  },
});

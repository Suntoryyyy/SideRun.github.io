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
import FadeInView from "../components/FadeInView";
import BadgeUnlockModal from "../components/BadgeUnlockModal";
import {
  BADGE_ICONS,
  BADGE_CATALOG,
  applyBadgeUnlocks,
} from "../constants/badges";

const LOCKED_EXTRAS = [
  {
    id: "weather_warrior",
    name: "Weather Warrior",
    description: "Run in challenging weather conditions",
    category: "Adventure",
  },
  {
    id: "route_explorer",
    name: "Route Explorer",
    description: "Discover and run 10 different routes",
    category: "Exploration",
  },
];

export default function BadgesScreen({ navigation }) {
  const [userStats, setUserStats] = useState({
    totalDistance: 0,
    totalRuns: 0,
    weeklyDistance: 0,
    weeklyRuns: 0,
  });
  const [unlockedBadges, setUnlockedBadges] = useState([]);
  const [badgeQueue, setBadgeQueue] = useState([]);

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
    const { updated, newIds } = await applyBadgeUnlocks(
      supabase,
      userId,
      currentBadges,
      stats
    );
    if (newIds.length > 0) {
      setUnlockedBadges(updated);
      setBadgeQueue(newIds);
    }
  };

  const allBadges = [
    ...BADGE_CATALOG.map((b) => ({
      ...b,
      unlocked: unlockedBadges.includes(b.id),
      progress: b.progressOf ? b.progressOf(userStats) : undefined,
    })),
    ...LOCKED_EXTRAS.map((b) => ({
      ...b,
      unlocked: unlockedBadges.includes(b.id),
      progress: 0,
    })),
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
      {badgeQueue.length > 0 && (
        <BadgeUnlockModal
          badgeId={badgeQueue[0]}
          onDismiss={() => setBadgeQueue((q) => q.slice(1))}
        />
      )}
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
          {filteredBadges.map((badge, index) => {
            const meta = BADGE_ICONS[badge.id] || {
              icon: "ribbon-outline",
              color: "#0B0F13",
            };
            const iconTint = badge.unlocked ? meta.color : "#C6C9CD";
            const iconBg = badge.unlocked ? `${meta.color}18` : "#F4F5F7";

            return (
              <FadeInView
                key={badge.id}
                delay={Math.min(index, 8) * 45}
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
              </FadeInView>
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

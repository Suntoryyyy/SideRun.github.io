import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function BadgesScreen() {
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
      const stats = await AsyncStorage.getItem('userStats');
      const badges = await AsyncStorage.getItem('unlockedBadges');

      if (stats) {
        const parsedStats = JSON.parse(stats);
        setUserStats(parsedStats);
        checkBadgeUnlocks(parsedStats);
      }

      if (badges) {
        setUnlockedBadges(JSON.parse(badges));
      } else {
        // Initialize with some default unlocked badges for demo
        const defaultBadges = ['first_steps'];
        setUnlockedBadges(defaultBadges);
        await AsyncStorage.setItem('unlockedBadges', JSON.stringify(defaultBadges));
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const checkBadgeUnlocks = async (stats) => {
    const badgesToCheck = [
      { id: 'first_5k', condition: stats.totalDistance >= 5, name: 'First 5K Runner' },
      { id: 'first_10k', condition: stats.totalDistance >= 10, name: 'First 10K Runner' },
      { id: 'marathoner', condition: stats.totalDistance >= 42.2, name: 'Marathoner' },
      { id: 'week_warrior', condition: stats.weeklyDistance >= 20, name: 'Week Warrior' },
      { id: 'consistent_runner', condition: stats.weeklyRuns >= 5, name: 'Consistent Runner' },
      { id: 'early_bird', condition: stats.weeklyRuns >= 3, name: 'Early Bird' }, // Assuming morning runs
      { id: 'social_butterfly', condition: stats.totalRuns >= 10, name: 'Social Butterfly' },
      { id: 'speed_demon', condition: stats.totalRuns >= 5, name: 'Speed Demon' },
      { id: 'night_runner', condition: stats.totalRuns >= 3, name: 'Night Runner' },
    ];

    const newBadges = badgesToCheck
      .filter(badge => badge.condition && !unlockedBadges.includes(badge.id))
      .map(badge => badge.id);

    if (newBadges.length > 0) {
      const updatedBadges = [...unlockedBadges, ...newBadges];
      setUnlockedBadges(updatedBadges);
      await AsyncStorage.setItem('unlockedBadges', JSON.stringify(updatedBadges));
    }
  };

  const allBadges = [
    {
      id: 'first_steps',
      name: 'First Steps',
      description: 'Complete your first run',
      icon: '👟',
      category: 'Getting Started',
      unlocked: unlockedBadges.includes('first_steps'),
    },
    {
      id: 'first_5k',
      name: 'First 5K Runner',
      description: 'Run your first 5 kilometers',
      icon: '🏃‍♂️',
      category: 'Distance',
      unlocked: unlockedBadges.includes('first_5k'),
      progress: Math.min(userStats.totalDistance / 5, 1),
    },
    {
      id: 'first_10k',
      name: 'First 10K Runner',
      description: 'Run your first 10 kilometers',
      icon: '🏃‍♀️',
      category: 'Distance',
      unlocked: unlockedBadges.includes('first_10k'),
      progress: Math.min(userStats.totalDistance / 10, 1),
    },
    {
      id: 'marathoner',
      name: 'Marathoner',
      description: 'Complete a full marathon (42.2 km)',
      icon: '🏅',
      category: 'Distance',
      unlocked: unlockedBadges.includes('marathoner'),
      progress: Math.min(userStats.totalDistance / 42.2, 1),
    },
    {
      id: 'week_warrior',
      name: 'Week Warrior',
      description: 'Run 20+ km in a week',
      icon: '⚔️',
      category: 'Weekly',
      unlocked: unlockedBadges.includes('week_warrior'),
      progress: Math.min(userStats.weeklyDistance / 20, 1),
    },
    {
      id: 'consistent_runner',
      name: 'Consistent Runner',
      description: 'Complete 5 runs in a week',
      icon: '📅',
      category: 'Consistency',
      unlocked: unlockedBadges.includes('consistent_runner'),
      progress: Math.min(userStats.weeklyRuns / 5, 1),
    },
    {
      id: 'early_bird',
      name: 'Early Bird',
      description: 'Run 5 times before 7 AM',
      icon: '🌅',
      category: 'Time',
      unlocked: unlockedBadges.includes('early_bird'),
      progress: Math.min(userStats.weeklyRuns / 5, 1), // Simplified
    },
    {
      id: 'social_butterfly',
      name: 'Social Butterfly',
      description: 'Share 10 runs with friends',
      icon: '🦋',
      category: 'Social',
      unlocked: unlockedBadges.includes('social_butterfly'),
      progress: Math.min(userStats.totalRuns / 10, 1),
    },
    {
      id: 'speed_demon',
      name: 'Speed Demon',
      description: 'Achieve an average pace under 5 min/km',
      icon: '💨',
      category: 'Speed',
      unlocked: unlockedBadges.includes('speed_demon'),
      progress: 0.5, // Mock progress
    },
    {
      id: 'night_runner',
      name: 'Night Runner',
      description: 'Complete 5 runs after sunset',
      icon: '🌙',
      category: 'Time',
      unlocked: unlockedBadges.includes('night_runner'),
      progress: Math.min(userStats.totalRuns / 5, 1),
    },
    {
      id: 'weather_warrior',
      name: 'Weather Warrior',
      description: 'Run in challenging weather conditions',
      icon: '🌧️',
      category: 'Adventure',
      unlocked: false,
      progress: 0,
    },
    {
      id: 'route_explorer',
      name: 'Route Explorer',
      description: 'Discover and run 10 different routes',
      icon: '🗺️',
      category: 'Exploration',
      unlocked: false,
      progress: 0,
    },
  ];

  const categories = ['All', 'Getting Started', 'Distance', 'Weekly', 'Consistency', 'Time', 'Social', 'Speed', 'Adventure', 'Exploration'];
  const [selectedCategory, setSelectedCategory] = useState('All');

  const filteredBadges = selectedCategory === 'All'
    ? allBadges
    : allBadges.filter(badge => badge.category === selectedCategory);

  const unlockedCount = allBadges.filter(badge => badge.unlocked).length;
  const totalCount = allBadges.length;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🏆 Badges & Achievements</Text>
        <Text style={styles.subtitle}>Unlock playful badges as you run!</Text>
        <View style={styles.progressContainer}>
          <Text style={styles.progressText}>
            {unlockedCount} of {totalCount} badges unlocked
          </Text>
          <View style={styles.progressBar}>
            <View
              style={[styles.progressFill, { width: `${(unlockedCount / totalCount) * 100}%` }]}
            />
          </View>
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoryScroll}
      >
        {categories.map((category) => (
          <TouchableOpacity
            key={category}
            style={[styles.categoryButton, selectedCategory === category && styles.activeCategory]}
            onPress={() => setSelectedCategory(category)}
          >
            <Text style={[styles.categoryText, selectedCategory === category && styles.activeCategoryText]}>
              {category}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.badgesContainer}>
        {filteredBadges.map((badge) => (
          <View key={badge.id} style={[styles.badgeCard, badge.unlocked && styles.unlockedBadge]}>
            <View style={styles.badgeHeader}>
              <Text style={styles.badgeIcon}>{badge.icon}</Text>
              <View style={styles.badgeInfo}>
                <Text style={[styles.badgeName, badge.unlocked && styles.unlockedText]}>
                  {badge.name}
                </Text>
                <Text style={[styles.badgeCategory, badge.unlocked && styles.unlockedText]}>
                  {badge.category}
                </Text>
              </View>
              {badge.unlocked && <Text style={styles.unlockedIndicator}>✓</Text>}
            </View>
            <Text style={[styles.badgeDescription, badge.unlocked && styles.unlockedText]}>
              {badge.description}
            </Text>
            {!badge.unlocked && badge.progress !== undefined && (
              <View style={styles.progressContainerSmall}>
                <View style={styles.progressBarSmall}>
                  <View
                    style={[styles.progressFillSmall, { width: `${badge.progress * 100}%` }]}
                  />
                </View>
                <Text style={styles.progressTextSmall}>
                  {Math.round(badge.progress * 100)}%
                </Text>
              </View>
            )}
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F8F8',
  },
  header: {
    alignItems: 'center',
    padding: 20,
    paddingTop: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FF9500',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  progressContainer: {
    width: '100%',
    alignItems: 'center',
  },
  progressText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  progressBar: {
    width: '80%',
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FF9500',
    borderRadius: 4,
  },
  categoryScroll: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  categoryButton: {
    backgroundColor: '#FFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  activeCategory: {
    backgroundColor: '#FF9500',
  },
  categoryText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  activeCategoryText: {
    color: '#FFF',
  },
  badgesContainer: {
    padding: 20,
    paddingTop: 0,
  },
  badgeCard: {
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    opacity: 0.6,
  },
  unlockedBadge: {
    opacity: 1,
    borderWidth: 2,
    borderColor: '#FF9500',
  },
  badgeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  badgeIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  badgeInfo: {
    flex: 1,
  },
  badgeName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#999',
  },
  unlockedText: {
    color: '#333',
  },
  badgeCategory: {
    fontSize: 12,
    color: '#999',
    textTransform: 'uppercase',
    fontWeight: '500',
  },
  unlockedIndicator: {
    fontSize: 20,
    color: '#FF9500',
    fontWeight: 'bold',
  },
  badgeDescription: {
    fontSize: 14,
    color: '#999',
    lineHeight: 20,
  },
  progressContainerSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  progressBarSmall: {
    flex: 1,
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    marginRight: 8,
  },
  progressFillSmall: {
    height: '100%',
    backgroundColor: '#FF9500',
    borderRadius: 2,
  },
  progressTextSmall: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
});

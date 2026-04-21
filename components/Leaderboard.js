import React from 'react';
import { Image } from 'expo-image';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import styles from '../styles/FriendsScreenStyles';
import EmptyState from './EmptyState';

const MEDAL_COLORS = ['#F6C65D', '#B9C1CA', '#D39A6A']; // gold / silver / bronze

export default function Leaderboard({ leaderboard }) {
  if (!leaderboard || leaderboard.length === 0) {
    return (
      <View style={styles.tabContent}>
        <Text style={styles.sectionTitle}>Weekly Leaderboard</Text>
        <EmptyState
          icon="trophy-outline"
          title="Leaderboard is quiet"
          desc="Log a run this week to get on the board — any distance counts."
          accent="#F6C65D"
          compact
        />
      </View>
    );
  }

  return (
    <View style={styles.tabContent}>
      <Text style={styles.sectionTitle}>Weekly Leaderboard</Text>
      {leaderboard.map((entry, index) => {
        const isImageAvatar =
          entry.avatar &&
          (entry.avatar.startsWith('file:') ||
            entry.avatar.startsWith('http') ||
            entry.avatar.startsWith('data:'));
        const initial = (entry.name || '?').trim().charAt(0).toUpperCase();
        const medalColor = index < 3 ? MEDAL_COLORS[index] : null;

        return (
          <View key={entry.id || entry.name || index} style={styles.leaderboardItem}>
            <View style={styles.rankContainer}>
              <Text style={styles.rank}>{index + 1}</Text>
            </View>
            {isImageAvatar ? (
              <Image source={{ uri: entry.avatar }} style={styles.leaderAvatarImage} />
            ) : (
              <View style={styles.leaderAvatarFallback}>
                <Text style={styles.leaderAvatarInitial}>{initial}</Text>
              </View>
            )}
            <View style={styles.leaderInfo}>
              <Text style={styles.leaderName}>{entry.name}</Text>
              <Text style={styles.leaderDistance}>
                {Number(entry.weeklyDistance || 0).toFixed(1)} km this week
              </Text>
            </View>
            {medalColor ? (
              <View style={[styles.medalBadge, { backgroundColor: `${medalColor}22` }]}>
                <Ionicons name="medal" size={16} color={medalColor} />
              </View>
            ) : null}
          </View>
        );
      })}
    </View>
  );
}

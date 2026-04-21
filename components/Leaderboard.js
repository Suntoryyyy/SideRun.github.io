import React from 'react';
import { Image } from 'expo-image';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import styles from '../styles/FriendsScreenStyles';

export default function Leaderboard({ leaderboard }) {
  if (!leaderboard || leaderboard.length === 0) {
    return (
      <View style={styles.tabContent}>
        <Text style={styles.sectionTitle}>Weekly Leaderboard</Text>
        <View style={{ alignItems: 'center', paddingVertical: 40 }}>
          <Ionicons name="trophy-outline" size={64} color="#DDD" />
          <Text style={{ fontSize: 16, fontWeight: '700', color: '#666', marginTop: 12 }}>
            Leaderboard is quiet
          </Text>
          <Text style={{ fontSize: 13, color: '#999', marginTop: 6, textAlign: 'center' }}>
            Log a run this week to get on the board.
          </Text>
        </View>
      </View>
    );
  }
  return (
    <View style={styles.tabContent}>
      <Text style={styles.sectionTitle}>Weekly Leaderboard</Text>
      {leaderboard.map((entry, index) => (
        <View key={index} style={styles.leaderboardItem}>
          <View style={styles.rankContainer}>
            <Text style={styles.rank}>#{index + 1}</Text>
          </View>
          {entry.avatar && (entry.avatar.startsWith('file:') || entry.avatar.startsWith('http') || entry.avatar.startsWith('data:')) ? (
            <Image source={{ uri: entry.avatar }} style={styles.leaderAvatarImage} />
          ) : (
            <Text style={styles.leaderAvatar}>{entry.avatar}</Text>
          )}
          <View style={styles.leaderInfo}>
            <Text style={styles.leaderName}>{entry.name}</Text>
            <Text style={styles.leaderDistance}>{entry.weeklyDistance} km</Text>
          </View>
          {index < 3 && (
            <Text style={styles.medal}>
              {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
            </Text>
          )}
        </View>
      ))}
    </View>
  );
}

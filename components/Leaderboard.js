import React from 'react';
import { View, Text, Image } from 'react-native';
import styles from '../styles/FriendsScreenStyles';

export default function Leaderboard({ leaderboard }) {
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
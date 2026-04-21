import React from 'react';
import { Image } from 'expo-image';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import styles from '../styles/FriendsScreenStyles';
import EmptyState from './EmptyState';

const isImageAvatar = (a) =>
  typeof a === 'string' &&
  (a.startsWith('file:') || a.startsWith('http') || a.startsWith('data:'));
const initialOf = (s) => (s || '?').trim().charAt(0).toUpperCase() || '?';

export default function ActivityFeed({ feed, onLike, onComment }) {
  if (!feed || feed.length === 0) {
    return (
      <View style={styles.tabContent}>
        <Text style={styles.sectionTitle}>Friend Activity</Text>
        <EmptyState
          icon="pulse-outline"
          title="No recent activity"
          desc="When you or your crew complete a run, the cheer-worthy details show up here."
          accent="#FF5A36"
          compact
        />
      </View>
    );
  }

  return (
    <View style={styles.tabContent}>
      <Text style={styles.sectionTitle}>Friend Activity</Text>
      {feed.map((item) => {
        const name = item.name || item.user || 'Runner';
        return (
          <View key={item.id ?? name + (item.time || '')} style={styles.feedCard}>
            <View style={styles.feedHeader}>
              {isImageAvatar(item.avatar) ? (
                <Image source={{ uri: item.avatar }} style={styles.feedAvatarImg} />
              ) : (
                <View style={styles.feedAvatarFallback}>
                  <Text style={styles.feedAvatarInitial}>{initialOf(name)}</Text>
                </View>
              )}
              <View style={styles.feedHeaderInfo}>
                <Text style={styles.feedName}>{name}</Text>
                <Text style={styles.feedTime}>{item.time || item.date}</Text>
              </View>
            </View>

            <View style={styles.feedMapPlaceholder}>
              <Ionicons name="map-outline" size={28} color="#9AA0A6" />
              <Text style={styles.feedMapText}>Track snapshot</Text>
            </View>

            <View style={styles.feedStats}>
              <View style={styles.feedStatBox}>
                <Text style={styles.feedStatVal}>{item.distance}</Text>
                <Text style={styles.feedStatLabel}>KM</Text>
              </View>
              <View style={styles.feedStatBox}>
                <Text style={styles.feedStatVal}>{item.pace || '—'}</Text>
                <Text style={styles.feedStatLabel}>PACE</Text>
              </View>
              <View style={styles.feedStatBox}>
                <Text style={styles.feedStatVal}>{item.duration}</Text>
                <Text style={styles.feedStatLabel}>TIME</Text>
              </View>
            </View>

            <View style={styles.feedActions}>
              <TouchableOpacity
                style={styles.feedActionBtn}
                onPress={() => onLike(item.id)}
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              >
                <Ionicons
                  name={item.hasLiked ? 'heart' : 'heart-outline'}
                  size={18}
                  color={item.hasLiked ? '#FF5A36' : '#6B6F76'}
                />
                <Text style={styles.feedActionText}>{item.likes}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.feedActionBtn}
                onPress={() => onComment(item.id)}
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              >
                <Ionicons name="chatbubble-outline" size={18} color="#6B6F76" />
                <Text style={styles.feedActionText}>{item.comments}</Text>
              </TouchableOpacity>
            </View>
          </View>
        );
      })}
    </View>
  );
}

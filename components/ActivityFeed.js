import React from 'react';
import { Image } from 'expo-image';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import styles from '../styles/FriendsScreenStyles';

export default function ActivityFeed({ feed, onLike, onComment }) {
  return (
    <View style={styles.tabContent}>
      <Text style={styles.sectionTitle}>Friend Activity</Text>
      {feed.length === 0 ? (
        <View style={styles.emptyFeedState}>
          <Ionicons name="people-circle-outline" size={64} color="#DDD" />
          <Text style={styles.emptyFeedText}>No recent activity</Text>
          <Text style={{color: '#999', marginTop: 8, textAlign: 'center'}}>When you or your friends complete a run, it will appear here!</Text>
        </View>
      ) : (
        feed.map((item, index) => (
          <View key={index} style={styles.feedCard}>
            <View style={styles.feedHeader}>
              {item.avatar && (item.avatar.startsWith('data:') || item.avatar.startsWith('http') || item.avatar.startsWith('file:')) ? (
                <Image source={{ uri: item.avatar }} style={styles.feedAvatarImg} />
              ) : (
                <Text style={styles.feedAvatarEmoji}>{item.avatar || '👤'}</Text>
              )}
              <View style={styles.feedHeaderInfo}>
                <Text style={styles.feedName}>{item.name || item.user}</Text>
                <Text style={styles.feedTime}>{item.time || item.date}</Text>
              </View>
            </View>
            
            <View style={styles.feedMapPlaceholder}>
              <Ionicons name="map" size={32} color="#CCC" />
              <Text style={styles.feedMapText}>Track Snapshot</Text>
            </View>

            <View style={styles.feedStats}>
              <View style={styles.feedStatBox}>
                <Text style={styles.feedStatVal}>{item.distance}</Text>
                <Text style={styles.feedStatLabel}>km</Text>
              </View>
              <View style={styles.feedStatBox}>
                <Text style={styles.feedStatVal}>{item.pace || '5.5'}</Text>
                <Text style={styles.feedStatLabel}>Pace</Text>
              </View>
              <View style={styles.feedStatBox}>
                <Text style={styles.feedStatVal}>{item.duration}</Text>
                <Text style={styles.feedStatLabel}>Time</Text>
              </View>
            </View>

            <View style={styles.feedActions}>
              <TouchableOpacity style={styles.feedActionBtn} onPress={() => onLike(item.id)}>
                <Ionicons name={item.hasLiked ? "heart" : "heart-outline"} size={20} color={item.hasLiked ? "#FF3B30" : "#666"} />
                <Text style={styles.feedActionText}>{item.likes} Likes</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.feedActionBtn} onPress={() => onComment(item.id)}>
                <Ionicons name="chatbubble-outline" size={20} color="#666" />
                <Text style={styles.feedActionText}>{item.comments} Comments</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))
      )}
    </View>
  );
}

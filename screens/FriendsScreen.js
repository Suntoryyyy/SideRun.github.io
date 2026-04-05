import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  Image,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

export default function FriendsScreen({ navigation }) {
  const [friends, setFriends] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [addFriendMode, setAddFriendMode] = useState(false);
  const [newFriendName, setNewFriendName] = useState('');
  const [activeTab, setActiveTab] = useState('friends');

  useEffect(() => {
    loadFriendsData();
  }, []);

  const loadFriendsData = async () => {
    try {
      const friendsData = await AsyncStorage.getItem('friends');
      const leaderboardData = await AsyncStorage.getItem('leaderboard');

      if (friendsData) {
        setFriends(JSON.parse(friendsData));
      } else {
        // Mock friends data
        const mockFriends = [
          {
            id: 1,
            name: 'Alice Johnson',
            weeklyDistance: 42,
            totalRuns: 8,
            isOnline: true,
            lastRun: '2 hours ago',
            avatar: '👩‍💼',
          },
          {
            id: 2,
            name: 'Bob Smith',
            weeklyDistance: 35,
            totalRuns: 6,
            isOnline: false,
            lastRun: '1 day ago',
            avatar: '👨‍💻',
          },
          {
            id: 3,
            name: 'Charlie Brown',
            weeklyDistance: 28,
            totalRuns: 5,
            isOnline: true,
            lastRun: '30 min ago',
            avatar: '👨‍🎨',
          },
        ];
        setFriends(mockFriends);
        await AsyncStorage.setItem('friends', JSON.stringify(mockFriends));
      }

      if (leaderboardData) {
        setLeaderboard(JSON.parse(leaderboardData));
      } else {
        // Mock leaderboard
        const mockLeaderboard = [
          { name: 'Alice Johnson', weeklyDistance: 42, avatar: '👩‍💼' },
          { name: 'Bob Smith', weeklyDistance: 35, avatar: '👨‍💻' },
          { name: 'Charlie Brown', weeklyDistance: 28, avatar: '👨‍🎨' },
          { name: 'You', weeklyDistance: 25, avatar: '🏃‍♂️' },
        ];
        setLeaderboard(mockLeaderboard);
        await AsyncStorage.setItem('leaderboard', JSON.stringify(mockLeaderboard));
      }
    } catch (error) {
      console.error('Error loading friends data:', error);
    }
  };

  const addFriend = async () => {
    if (!newFriendName.trim()) {
      Alert.alert('Error', 'Please enter a friend name or phone number');
      return;
    }

    try {
      const usersData = await AsyncStorage.getItem('users');
      const users = usersData ? JSON.parse(usersData) : {};
      
      const searchKey = newFriendName.trim();
      let foundUser = null;

      // search by phone
      if (users[searchKey]) {
        foundUser = users[searchKey];
      } else {
        // search by username
        foundUser = Object.values(users).find(
          user => user.username.toLowerCase() === searchKey.toLowerCase()
        );
      }

      const friendName = foundUser ? foundUser.username : searchKey; // use input as fallback if no account

      const newFriend = {
        id: Date.now(),
        name: friendName,
        phone: foundUser ? foundUser.phone : null,
        weeklyDistance: 0,
        totalRuns: 0,
        isOnline: false,
        lastRun: 'Never',
        avatar: '👤',
      };

      const updatedFriends = [...friends, newFriend];
      setFriends(updatedFriends);
      await AsyncStorage.setItem('friends', JSON.stringify(updatedFriends));

      setNewFriendName('');
      setAddFriendMode(false);
      Alert.alert('Success', `${friendName} has been added as a friend!`);
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Failed to add friend');
    }
  };

  const removeFriend = async (friendId) => {
    Alert.alert(
      'Remove Friend',
      'Are you sure you want to remove this friend?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            const updatedFriends = friends.filter(friend => friend.id !== friendId);
            setFriends(updatedFriends);
            await AsyncStorage.setItem('friends', JSON.stringify(updatedFriends));
          },
        },
      ]
    );
  };

  const sendCheer = (friendName) => {
    Alert.alert('Cheer Sent!', `You sent a cheer to ${friendName}! 🎉`);
  };

  const renderFriendsTab = () => (
    <View style={styles.tabContent}>
      <View style={styles.friendsHeader}>
        <Text style={styles.sectionTitle}>Your Friends ({friends.length})</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setAddFriendMode(!addFriendMode)}
        >
          <Text style={styles.addButtonText}>{addFriendMode ? 'Cancel' : '+ Add Friend'}</Text>
        </TouchableOpacity>
      </View>

      {addFriendMode && (
        <View style={styles.addFriendContainer}>
          <TextInput
            style={styles.input}
            placeholder="Search by phone number or username..."
            value={newFriendName}
            onChangeText={setNewFriendName}
            autoCapitalize="none"
          />
          <TouchableOpacity style={styles.confirmButton} onPress={addFriend}>
            <Text style={styles.confirmButtonText}>Add Friend</Text>
          </TouchableOpacity>
        </View>
      )}

      {friends.map((friend) => (
        <View key={friend.id} style={styles.friendCard}>
          <View style={styles.friendInfo}>
            <View style={styles.friendMain}>
              {friend.avatar && (friend.avatar.startsWith('file:') || friend.avatar.startsWith('http') || friend.avatar.startsWith('data:')) ? (
                <Image source={{ uri: friend.avatar }} style={styles.friendAvatarImage} />
              ) : (
                <Text style={styles.friendAvatar}>{friend.avatar}</Text>
              )}
              <View style={styles.friendDetails}>
                <Text style={styles.friendName}>{friend.name}</Text>
                <Text style={styles.friendStats}>
                  {friend.weeklyDistance} km this week • {friend.totalRuns} runs
                </Text>
                <Text style={styles.friendLastRun}>Last run: {friend.lastRun}</Text>
              </View>
            </View>
            <View style={styles.friendStatus}>
              <Text style={[styles.statusIndicator, friend.isOnline && styles.online]}>
                {friend.isOnline ? '🟢 Online' : '⚪ Offline'}
              </Text>
            </View>
          </View>
          <View style={styles.friendActions}>
            <TouchableOpacity
              style={styles.cheerButton}
              onPress={() => sendCheer(friend.name)}
            >
              <Text style={styles.cheerButtonText}>🎉 Cheer</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.removeButton}
              onPress={() => removeFriend(friend.id)}
            >
              <Text style={styles.removeButtonText}>Remove</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}

      {friends.length === 0 && !addFriendMode && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No friends yet!</Text>
          <Text style={styles.emptySubtext}>Add friends to share your running adventures</Text>
        </View>
      )}
    </View>
  );

  const renderLeaderboardTab = () => (
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

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
          >
            <Ionicons name="arrow-back" size={28} color="#111111" />
          </TouchableOpacity>
          <Text style={styles.title}>Friends & Community</Text>
          <Text style={styles.subtitle}>Connect with fellow runners</Text>
        </View>

        <View style={styles.tabBar}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'friends' && styles.activeTab]}
            onPress={() => setActiveTab('friends')}
          >
            <Text style={[styles.tabText, activeTab === 'friends' && styles.activeTabText]}>
              Friends
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'leaderboard' && styles.activeTab]}
            onPress={() => setActiveTab('leaderboard')}
          >
            <Text style={[styles.tabText, activeTab === 'leaderboard' && styles.activeTabText]}>
              Leaderboard
            </Text>
          </TouchableOpacity>
        </View>

        {activeTab === 'friends' ? renderFriendsTab() : renderLeaderboardTab()}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F5F7',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    left: 20,
    top: 60,
    zIndex: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: '#111111',
    marginBottom: 8,
    letterSpacing: -0.5,
    textTransform: 'uppercase',
  },
  subtitle: {
    fontSize: 16,
    color: '#888888',
    marginBottom: 10,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    margin: 20,
    marginTop: 0,
    borderRadius: 12,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  tab: {
    flex: 1,
    padding: 14,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: '#24C789',
  },
  tabText: {
    fontSize: 16,
    color: '#888888',
    fontWeight: '600',
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  tabContent: {
    padding: 20,
    paddingTop: 0,
  },
  friendsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#222222',
  },
  addButton: {
    backgroundColor: '#24C789',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  addFriendContainer: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  input: {
    backgroundColor: '#F4F5F7',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    fontSize: 16,
    color: '#222222',
  },
  confirmButton: {
    backgroundColor: '#24C789',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
    letterSpacing: 1,
  },
  friendCard: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  friendInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  friendMain: {
    flexDirection: 'row',
    flex: 1,
    alignItems: 'center',
  },
  friendAvatar: {
    fontSize: 40,
    marginRight: 16,
  },
  friendAvatarImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 16,
  },
  friendDetails: {
    flex: 1,
  },
  friendName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#222222',
    marginBottom: 4,
  },
  friendStats: {
    fontSize: 14,
    color: '#888888',
    marginBottom: 4,
    fontWeight: '500',
  },
  friendLastRun: {
    fontSize: 12,
    color: '#999999',
  },
  friendStatus: {
    alignItems: 'flex-end',
    justifyContent: 'flex-start',
    alignSelf: 'flex-start',
  },
  statusIndicator: {
    fontSize: 12,
    fontWeight: '700',
    color: '#999999',
  },
  online: {
    color: '#24C789',
  },
  friendActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  cheerButton: {
    backgroundColor: '#F0F0F0',
    paddingVertical: 12,
    borderRadius: 12,
    flex: 2,
    alignItems: 'center',
  },
  cheerButtonText: {
    color: '#444444',
    fontWeight: 'bold',
    fontSize: 15,
  },
  removeButton: {
    backgroundColor: '#FFEBEE',
    paddingVertical: 12,
    borderRadius: 12,
    flex: 1,
    alignItems: 'center',
  },
  removeButtonText: {
    color: '#FF453A',
    fontWeight: 'bold',
    fontSize: 15,
  },
  emptyState: {
    alignItems: 'center',
    padding: 60,
  },
  emptyText: {
    fontSize: 20,
    color: '#222222',
    fontWeight: 'bold',
    marginBottom: 10,
  },
  emptySubtext: {
    fontSize: 15,
    color: '#888888',
    textAlign: 'center',
    lineHeight: 22,
  },
  leaderboardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  rankContainer: {
    width: 40,
    alignItems: 'center',
  },
  rank: {
    fontSize: 18,
    fontWeight: '900',
    color: '#999999',
  },
  leaderAvatar: {
    fontSize: 32,
    marginRight: 16,
  },
  leaderAvatarImage: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 16,
  },
  leaderInfo: {
    flex: 1,
  },
  leaderName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#222222',
  },
  leaderDistance: {
    fontSize: 15,
    color: '#24C789',
    fontWeight: '600',
    marginTop: 4,
  },
  medal: {
    fontSize: 28,
  },
});

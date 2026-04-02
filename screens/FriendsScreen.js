import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function FriendsScreen() {
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
              <Text style={styles.friendAvatar}>{friend.avatar}</Text>
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
          <Text style={styles.leaderAvatar}>{entry.avatar}</Text>
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
    <ScrollView style={styles.container}>
      <View style={styles.header}>
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
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    margin: 20,
    marginTop: 0,
    borderRadius: 8,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tab: {
    flex: 1,
    padding: 12,
    alignItems: 'center',
    borderRadius: 6,
  },
  activeTab: {
    backgroundColor: '#FF9500',
  },
  tabText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#FFF',
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
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  addButton: {
    backgroundColor: '#FF9500',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  addButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  addFriendContainer: {
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  input: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 6,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
  },
  confirmButton: {
    backgroundColor: '#34C759',
    padding: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  friendCard: {
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  friendInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  friendMain: {
    flexDirection: 'row',
    flex: 1,
  },
  friendAvatar: {
    fontSize: 32,
    marginRight: 12,
  },
  friendDetails: {
    flex: 1,
  },
  friendName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  friendStats: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  friendLastRun: {
    fontSize: 12,
    color: '#888',
  },
  friendStatus: {
    alignItems: 'flex-end',
  },
  statusIndicator: {
    fontSize: 12,
    color: '#888',
  },
  online: {
    color: '#34C759',
  },
  friendActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cheerButton: {
    backgroundColor: '#5856D6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    flex: 1,
    marginRight: 8,
    alignItems: 'center',
  },
  cheerButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  removeButton: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  removeButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
  },
  leaderboardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  rankContainer: {
    width: 40,
    alignItems: 'center',
  },
  rank: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#666',
  },
  leaderAvatar: {
    fontSize: 24,
    marginRight: 12,
  },
  leaderInfo: {
    flex: 1,
  },
  leaderName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  leaderDistance: {
    fontSize: 14,
    color: '#666',
  },
  medal: {
    fontSize: 24,
  },
});

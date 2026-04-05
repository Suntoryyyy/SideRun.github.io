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
import styles from '../styles/FriendsScreenStyles';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import ActivityFeed from '../components/ActivityFeed';
import Leaderboard from '../components/Leaderboard';

export default function FriendsScreen({ navigation }) {
  const [friends, setFriends] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [feed, setFeed] = useState([]);
  const [addFriendMode, setAddFriendMode] = useState(false);
  const [newFriendName, setNewFriendName] = useState('');
  const [activeTab, setActiveTab] = useState('friends'); // 'friends', 'leaderboard', 'feed'

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

      // Load feed from memory + mocked defaults
      const existingFeed = await AsyncStorage.getItem('globalFeed');
      const mockFeed = [
        {
          id: 101,
          name: 'Alice Johnson',
          avatar: '👩‍💼',
          time: '2 hours ago',
          distance: '5.20',
          pace: '5.0',
          duration: '00:26:10',
          likes: 3,
          comments: 1,
          hasLiked: false
        },
        {
          id: 102,
          name: 'Charlie Brown',
          avatar: '👨‍🎨',
          time: 'Yesterday',
          distance: '10.00',
          pace: '6.5',
          duration: '01:05:40',
          likes: 12,
          comments: 4,
          hasLiked: false
        }
      ];

      const globalFeed = existingFeed ? JSON.parse(existingFeed) : [];
      setFeed([...globalFeed, ...mockFeed]);

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
          user => user.username && user.username.toLowerCase() === searchKey.toLowerCase()
        );
      }

      if (!foundUser) {
        Alert.alert('Not Found', 'Could not find a user with that username or phone number.');
        return;
      }

      if (foundUser.allowStrangersAdd === false) {
        Alert.alert('Private Profile', 'This user does not allow friend requests from strangers.');
        return;
      }

      // Check if already friends
      const isAlreadyFriend = friends.some(
        f => f.phone === foundUser.phone || f.name.toLowerCase() === foundUser.username.toLowerCase()
      );

      if (isAlreadyFriend) {
        Alert.alert('Already Friends', 'You are already friends with this user.');
        return;
      }

      const friendName = foundUser.username;

      const newFriend = {
        id: Date.now(),
        name: foundUser.username,
        phone: foundUser.phone,
        weeklyDistance: 0,
        totalRuns: 0,
        isOnline: false,
        lastRun: 'Never',
        avatar: foundUser.avatar || '👤',
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


  const handleLike = async (id) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setFeed(prev => Math.random() < 2 ? prev.map(item => {
      if (item.id === id) {
        return { ...item, hasLiked: !item.hasLiked, likes: item.hasLiked ? item.likes - 1 : item.likes + 1 };
      }
      return item;
    }) : prev);
  };

  const handleComment = (id) => {
    Alert.prompt('Add a comment', 'Type your praise...', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Post', onPress: text => {
        if(text) {
          setFeed(prev => prev.map(i => i.id === id ? { ...i, comments: i.comments + 1 } : i));
          Alert.alert('Posted!', `Your comment "${text}" was added.`);
        }
      }}
    ]);
  };


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
            style={[styles.tab, activeTab === 'feed' && styles.activeTab]}
            onPress={() => setActiveTab('feed')}
          >
            <Text style={[styles.tabText, activeTab === 'feed' && styles.activeTabText]}>
              Feed
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

        {activeTab === 'friends' ? renderFriendsTab() : (activeTab === 'feed' ? <ActivityFeed feed={feed} onLike={handleLike} onComment={handleComment} /> : <Leaderboard leaderboard={leaderboard} />)}
      </ScrollView>
    </View>
  );
}


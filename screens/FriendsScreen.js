import React, { useState, useEffect } from 'react';
import { BlurView } from 'expo-blur';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  Image,
  Modal,
  Animated,
  TouchableWithoutFeedback,
} from 'react-native';
import styles from '../styles/FriendsScreenStyles';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../services/supabase';
import ActivityFeed from '../components/ActivityFeed';
import CustomAlert from '../components/CustomAlert';
import Leaderboard from '../components/Leaderboard';

export default function FriendsScreen({ navigation }) {
  const [friends, setFriends] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [feed, setFeed] = useState([]);
  const [addFriendMode, setAddFriendMode] = useState(false);
  const [newFriendName, setNewFriendName] = useState('');
  const [activeTab, setActiveTab] = useState('friends');
  const [selectedFriend, setSelectedFriend] = useState(null);
  const slideAnim = React.useRef(new Animated.Value(300)).current;
  const [alertConfig, setAlertConfig] = useState({ visible: false, title: '', message: '', type: 'error' });

  const showAlert = (title, message, type = 'error') => setAlertConfig({ visible: true, title, message, type });

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
      showAlert('Error', 'Please enter a friend name or phone number', 'error');
      return;
    }

    try {
      const searchKey = newFriendName.trim();
      
      // Search user from Supabase Database
      // Try exact phone first
      let { data: foundUsers, error } = await supabase
        .from('users')
        .select('*')
        .eq('phone', searchKey);

      // If no phone match, try username
      if (!foundUsers || foundUsers.length === 0) {
        const { data: nameUsers, error: nameErr } = await supabase
          .from('users')
          .select('*')
          .ilike('username', `%${searchKey}%`);
        
        if (!nameErr && nameUsers) foundUsers = nameUsers;
      }

      if (error && !foundUsers) {
        console.error('Supabase search error:', error);
        showAlert('Error', 'Failed to search for user. Please try again later.', 'error');
        return;
      }

      if (!foundUsers || foundUsers.length === 0) {
        showAlert('Not Found', 'Could not find a user with that username or phone number.', 'error');
        return;
      }

      const foundUser = foundUsers[0];

      if (foundUser.allowStrangersAdd === false) {
        showAlert('Private Profile', 'This user does not allow friend requests from strangers.', 'error');
        return;
      }

      // Check if already friends
      const isAlreadyFriend = friends.some(
        f => f.phone === foundUser.phone || f.name.toLowerCase() === foundUser.username.toLowerCase()
      );

      if (isAlreadyFriend) {
        showAlert('Already Friends', 'You are already friends with this user.', 'info');
        return;
      }

      const friendName = foundUser.username;

      const newFriend = {
        id: foundUser.id || Date.now(),
        name: foundUser.username,
        phone: foundUser.phone,
        weeklyDistance: foundUser.weeklyDistance || 0,
        totalRuns: foundUser.totalRuns || 0,
        isOnline: false,
        lastRun: 'Never',
        avatar: foundUser.avatar || '👤',
      };

      const updatedFriends = [...friends, newFriend];
      setFriends(updatedFriends);
      await AsyncStorage.setItem('friends', JSON.stringify(updatedFriends));

      setNewFriendName('');
      setAddFriendMode(false);
      showAlert('Success', `${friendName} has been added as a friend!`, 'success');
    } catch (e) {
      console.error(e);
      showAlert('Error', 'Failed to add friend', 'error');
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
        <TouchableOpacity key={friend.id} style={styles.friendCard} onPress={() => openFriendProfile(friend)} activeOpacity={0.7}>
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
        </TouchableOpacity>
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



  const openFriendProfile = (friend) => {
    setSelectedFriend(friend);
    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
      tension: 60,
      friction: 10,
    }).start();
  };

  const sendLiveCheer = async (emoji, message) => {
    if (!selectedFriend) return;
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    let myId = 'Unknown';
    try {
      const c = await AsyncStorage.getItem('currentUser');
      if (c) {
        const cu = JSON.parse(c);
        myId = cu.id || cu.phone || cu.username;
      }
    } catch(e){}

    // Trigger Supabase Realtime
    const { error } = await supabase
      .from('live_cheers')
      .insert([
        {
          sender_id: myId,
          receiver_id: selectedFriend.id || selectedFriend.phone || selectedFriend.name,
          emoji,
          message
        }
      ]);
    
    if (error) {
      console.warn("Failed to send cheer:", error);
    } else {
      closeFriendProfile();
    }
  };

  const closeFriendProfile = () => {
    Animated.timing(slideAnim, {
      toValue: 300,
      duration: 200,
      useNativeDriver: true,
    }).start(() => setSelectedFriend(null));
  };

  const renderFriendModal = () => {
    if (!selectedFriend) return null;
    return (
      <Modal transparent visible={!!selectedFriend} animationType="fade" onRequestClose={closeFriendProfile}>
        <TouchableWithoutFeedback onPress={closeFriendProfile}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <Animated.View style={[styles.profileSheet, { transform: [{ translateY: slideAnim }] }]}>
                <View style={styles.sheetHandle} />
                
                <View style={styles.sheetHeader}>
                  <Text style={styles.sheetAvatar}>{selectedFriend.avatar}</Text>
                  <Text style={styles.sheetName}>{selectedFriend.name}</Text>
                  <Text style={styles.sheetPhone}>{selectedFriend.phone || 'Runner'}</Text>
                </View>

                <View style={styles.sheetStats}>
                  <View style={styles.sheetStatBox}>
                    <Text style={styles.sheetStatVal}>{selectedFriend.weeklyDistance} km</Text>
                    <Text style={styles.sheetStatLbl}>This Week</Text>
                  </View>
                  <View style={styles.sheetStatBox}>
                    <Text style={styles.sheetStatVal}>{selectedFriend.totalRuns}</Text>
                    <Text style={styles.sheetStatLbl}>Total Runs</Text>
                  </View>
                </View>

                {selectedFriend.isOnline && (
                  <View style={{ width: '100%', marginBottom: 20 }}>
                    <Text style={{ fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 10 }}>Send Live Cheer</Text>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
                      <TouchableOpacity onPress={() => sendLiveCheer('🔥', 'Fire! Keep the pace!')} style={styles.cheerQuickBtn}>
                        <Text style={{ fontSize: 32 }}>🔥</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => sendLiveCheer('👏', 'Awesome job!')} style={styles.cheerQuickBtn}>
                        <Text style={{ fontSize: 32 }}>👏</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => sendLiveCheer('🚀', 'Speed up! You got this!')} style={styles.cheerQuickBtn}>
                        <Text style={{ fontSize: 32 }}>🚀</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => sendLiveCheer('💦', 'Stay hydrated!')} style={styles.cheerQuickBtn}>
                        <Text style={{ fontSize: 32 }}>💦</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

                <TouchableOpacity 
                  style={styles.chatBtn} 
                  onPress={() => {
                    closeFriendProfile();
                    navigation.navigate('Chat', { friendName: selectedFriend.name, friendAvatar: selectedFriend.avatar });
                  }}
                >
                  <Ionicons name="chatbubble-outline" size={24} color="#FFF" />
                  <Text style={styles.chatBtnText}>Message</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.removeFriendBtn} 
                  onPress={() => {
                    closeFriendProfile();
                    setTimeout(() => removeFriend(selectedFriend.id), 300);
                  }}
                >
                  <Text style={styles.removeFriendBtnText}>Remove Friend</Text>
                </TouchableOpacity>

              </Animated.View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    );
  };

  return (
    <View style={styles.container}>
      {/* Background Map - Same as Register for visual cohesion */}
      {Platform.OS === 'web' ? (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: -1 }}>
          <iframe
            width="100%"
            height="100%"
            frameBorder="0"
            scrolling="no"
            src={`https://www.openstreetmap.org/export/embed.html?bbox=-122.46,37.72,-122.38,37.82&layer=mapnik`}
            style={{ border: 'none', filter: 'brightness(0.9) grayscale(0.8)' }}
          />
        </div>
      ) : (
        <View style={StyleSheet.absoluteFillObject} backgroundColor="#EAEAEA" />
      )}

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
      {renderFriendModal()}
      <CustomAlert
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        onClose={() => setAlertConfig({...alertConfig, visible: false})}
      />
    </View>
  );
}


import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TouchableWithoutFeedback, ScrollView, Dimensions, Image, Animated } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useIsFocused } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');

export default function HomeScreen({ navigation }) {
  const isFocused = useIsFocused();
  const startButtonScale = useRef(new Animated.Value(1)).current;
  const [username, setUsername] = useState('Runner');
  const [avatar, setAvatar] = useState(''); // no default fallback here to prefer the greeting without it if missing

  useEffect(() => {
    if (isFocused) {
      loadUserData();
    }
  }, [isFocused]);

  const loadUserData = async () => {
    try {
      const userString = await AsyncStorage.getItem('currentUser');
      if (userString) {
        const user = JSON.parse(userString);
        if (user.username) setUsername(user.username);
        if (user.avatar) setAvatar(user.avatar);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handlePressIn = () => {
    Animated.spring(startButtonScale, {
      toValue: 0.92,
      useNativeDriver: true,
      speed: 20,
      bounciness: 10
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(startButtonScale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 20,
      bounciness: 10
    }).start();
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning,';
    if (hour < 18) return 'Good Afternoon,';
    return 'Good Evening,';
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* Header Section */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.menuButton} onPress={() => navigation.openDrawer()}>
            <Ionicons name="menu" size={28} color="#222222" />
          </TouchableOpacity>
          <View style={styles.headerTop}>
            <View style={styles.userInfoContainer}>
              {avatar && (avatar.startsWith('file:') || avatar.startsWith('http') || avatar.startsWith('data:')) ? (
                <Image source={{ uri: avatar }} style={styles.homeAvatarImage} />
              ) : null}
              <View>
                <Text style={styles.greeting}>{getGreeting()}</Text>
                <Text style={styles.userName}>
                  {avatar && !(avatar.startsWith('file:') || avatar.startsWith('http') || avatar.startsWith('data:')) ? `${avatar} ` : ''}
                  {username}
                </Text>
              </View>
            </View>
            <View style={styles.brandBadge}>
              <Text style={styles.brandText}>siderun</Text>
            </View>
          </View>
        </View>

        {/* Weekly Stats Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>This Week's Activity</Text>
          <View style={styles.statsRow}>
            <View style={styles.statWrap}>
              <Text style={styles.statValue}>12.4</Text>
              <Text style={styles.statLabel}>Kilometers</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.statWrap}>
              <Text style={styles.statValue}>3</Text>
              <Text style={styles.statLabel}>Runs</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.statWrap}>
              <Text style={styles.statValue}>840</Text>
              <Text style={styles.statLabel}>Calories</Text>
            </View>
          </View>
          
          <View style={styles.progressContainer}>
            <View style={styles.progressTextRow}>
              <Text style={styles.progressTextLabel}>Weekly Goal: 20 km</Text>
              <Text style={styles.progressPercent}>62%</Text>
            </View>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: '62%' }]} />
            </View>
          </View>
        </View>

        {/* Live Weather Preview */}
        <TouchableOpacity 
          style={styles.weatherCard} 
          activeOpacity={0.9} 
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            navigation.navigate('Weather');
          }}
        >
          <View style={styles.weatherIconContainer}>
            <Ionicons name="partly-sunny" size={32} color="#24C789" />
          </View>
          <View style={styles.weatherMeta}>
             <Text style={styles.weatherTemp}>18°C · Perfect Conditions</Text>
             <Text style={styles.weatherDesc}>Low wind, great time for a run</Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color="#CCC" />
        </TouchableOpacity>

        {/* Friend Running Push */}
        <TouchableOpacity 
          style={styles.friendPushCard} 
          activeOpacity={0.9} 
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            navigation.navigate('Run', { mode: 'shared' });
          }}
        >
          <View style={styles.friendPushAvatar}>
            <Text style={styles.friendPushAvatarText}>🏃</Text>
          </View>
          <View style={styles.friendPushMeta}>
             <Text style={styles.friendPushName}>Alex is running nearby!</Text>
             <Text style={styles.friendPushAction}>Tap to join their live map</Text>
          </View>
          <Ionicons name="map-outline" size={24} color="#FF9500" />
        </TouchableOpacity>

        {/* Quick Actions Grid */}
        <Text style={styles.sectionTitle}>Explore</Text>
        <View style={styles.gridContainer}>
          <TouchableOpacity style={styles.gridBox} onPress={() => navigation.navigate('Friends')}>
            <Text style={styles.gridEmoji}>🤝</Text>
            <Text style={styles.gridText}>Friends & Feed</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.gridBox} onPress={() => navigation.navigate('Badges')}>
            <Text style={styles.gridEmoji}>🏅</Text>
            <Text style={styles.gridText}>My Badges</Text>
          </TouchableOpacity>
        </View>

        {/* Recent Runs Section */}
        <View style={styles.recentSectionHeader}>
          <Text style={styles.sectionTitle}>Recent Runs</Text>
          <TouchableOpacity onPress={() => navigation.navigate('RunHistory')}>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity activeOpacity={0.8} style={styles.recentRunCard} onPress={() => navigation.navigate('RunHistory')}>
          <View style={styles.runIconBox}>
            <Ionicons name="footsteps" size={24} color="#24C789" />
          </View>
          <View style={styles.runInfo}>
            <Text style={styles.runTitle}>Morning City Run</Text>
            <Text style={styles.runDate}>Today, 07:30 AM</Text>
          </View>
          <View style={styles.runStats}>
            <Text style={styles.runDistance}>5.2 km</Text>
            <Text style={styles.runTime}>28:14</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity activeOpacity={0.8} style={styles.recentRunCard} onPress={() => navigation.navigate('RunHistory')}>
          <View style={styles.runIconBox}>
            <Ionicons name="footsteps" size={24} color="#A0A0A0" />
          </View>
          <View style={styles.runInfo}>
            <Text style={styles.runTitle}>Evening Jog</Text>
            <Text style={styles.runDate}>Yesterday, 18:45</Text>
          </View>
          <View style={styles.runStats}>
            <Text style={styles.runDistance}>7.1 km</Text>
            <Text style={styles.runTime}>41:02</Text>
          </View>
        </TouchableOpacity>

      </ScrollView>

      {/* Floating Big Start Button Component */}
      <View style={styles.startActionContainer}>
        <TouchableWithoutFeedback
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            navigation.navigate('Run');
          }}
        >
          <Animated.View style={[styles.startButton, { transform: [{ scale: startButtonScale }] }]}>
            <Text style={styles.startButtonText}>START</Text>
          </Animated.View>
        </TouchableWithoutFeedback>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F5F7',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 140, // Space for the floating button
  },
  header: {
    marginTop: 10,
    marginBottom: 24,
  },
  menuButton: {
    marginBottom: 16,
    alignSelf: 'flex-start',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  homeAvatarImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 10,
  },
  brandBadge: {
    backgroundColor: '#24C789',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    opacity: 0.9,
  },
  brandText: {
    color: '#FFF',
    fontWeight: '900',
    fontStyle: 'italic',
    fontSize: 14,
    letterSpacing: 0.5,
  },
  greeting: {
    fontSize: 16,
    color: '#888888',
    marginBottom: 4,
    fontWeight: '500',
  },
  userName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#222222',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
    marginBottom: 30,
  },
  cardTitle: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '600',
    marginBottom: 20,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statWrap: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#222222',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#999999',
    fontWeight: '500',
  },
  divider: {
    width: 1,
    height: 30,
    backgroundColor: '#EEEEEE',
  },
  progressContainer: {
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  progressTextRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressTextLabel: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  progressPercent: {
    fontSize: 13,
    color: '#24C789',
    fontWeight: 'bold',
  },
  progressBarBg: {
    height: 8,
    backgroundColor: '#F0F0F0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#24C789',
    borderRadius: 4,
  },
  weatherCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 30,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  weatherIconContainer: {
    width: 50,
    height: 50,
    backgroundColor: '#E8F8F2',
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  weatherMeta: {
    flex: 1,
  },
  weatherTemp: {
    fontSize: 15,
    fontWeight: '700',
    color: '#222',
  },
  weatherTip: {
    fontSize: 13,
    color: '#777',
    marginTop: 4,
    lineHeight: 18,
  },
  weatherDesc: {
    fontSize: 13,
    color: '#777',
    marginTop: 4,
    lineHeight: 18,
  },
  friendPushCard: {
    backgroundColor: '#FFF4E5',
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#FFE0B2',
  },
  friendPushAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFD180',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  friendPushAvatarText: {
    fontSize: 24,
  },
  friendPushMeta: {
    flex: 1,
  },
  friendPushName: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#E65100',
    marginBottom: 2,
  },
  friendPushAction: {
    color: '#FF9800',
    fontSize: 13,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#222222',
    marginBottom: 16,
  },
  recentSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  seeAllText: {
    fontSize: 14,
    color: '#24C789',
    fontWeight: '600',
    marginBottom: 16,
  },
  recentRunCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  runIconBox: {
    width: 48,
    height: 48,
    backgroundColor: '#F7F7F7',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  runInfo: {
    flex: 1,
  },
  runTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#222',
    marginBottom: 4,
  },
  runDate: {
    fontSize: 13,
    color: '#888',
  },
  runStats: {
    alignItems: 'flex-end',
  },
  runDistance: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#24C789',
  },
  runTime: {
    fontSize: 13,
    color: '#888',
    marginTop: 2,
  },
  gridContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  gridBox: {
    width: (width - 56) / 2, // 20 padding each side + 16 gap
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    height: 110,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  gridBoxEmpty: {
    backgroundColor: 'transparent',
    elevation: 0,
    shadowOpacity: 0,
  },
  gridEmoji: {
    fontSize: 32,
    marginBottom: 10,
  },
  gridText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#444',
  },
  startActionContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 30,
    paddingTop: 10,
    backgroundColor: 'transparent', 
  },
  startButton: {
    backgroundColor: '#24C789',
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#24C789',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
  },
  startButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 2,
  }
});

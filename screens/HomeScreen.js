import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions, Image } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useIsFocused } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');

export default function HomeScreen({ navigation }) {
  const isFocused = useIsFocused();
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
            <Ionicons name="menu" size={28} color="#FFFFFF" />
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
            <Ionicons name="partly-sunny" size={32} color="#E11D48" />
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
            <Ionicons name="footsteps" size={24} color="#E11D48" />
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
        <TouchableOpacity
          style={styles.startButton}
          activeOpacity={0.8}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            navigation.navigate('Run');
          }}
        >
          <Text style={styles.startButtonText}>START</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000', // Dark premium mode
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
    backgroundColor: '#E11D48',
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
    color: '#8A8D93',
    marginBottom: 4,
    fontWeight: '600',
    letterSpacing: 1,
  },
  userName: {
    fontSize: 32,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  card: {
    backgroundColor: '#111214', // Deep athletic dark grey
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 8,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#2A2C31',
  },
  cardTitle: {
    fontSize: 14,
    color: '#8A8D93',
    fontWeight: '800',
    marginBottom: 24,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
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
    fontSize: 28,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 6,
    fontVariant: ['tabular-nums'],
  },
  statLabel: {
    fontSize: 11,
    color: '#8A8D93',
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  divider: {
    width: 1,
    height: 40,
    backgroundColor: '#2A2C31',
  },
  progressContainer: {
    marginTop: 24,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#2A2C31',
  },
  progressTextRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  progressTextLabel: {
    fontSize: 13,
    color: '#8A8D93',
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  progressPercent: {
    fontSize: 14,
    color: '#E11D48',
    fontWeight: '900',
  },
  progressBarBg: {
    height: 8,
    backgroundColor: '#1C1D21',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#E11D48',
    borderRadius: 4,
  },
  weatherCard: {
    backgroundColor: '#111214',
    borderRadius: 20,
    padding: 16,
    marginBottom: 24,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#2A2C31',
  },
  weatherIconContainer: {
    width: 50,
    height: 50,
    backgroundColor: 'rgba(225, 29, 72, 0.1)',
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  weatherMeta: {
    flex: 1,
  },
  weatherTemp: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  weatherTip: {
    fontSize: 13,
    color: '#8A8D93',
    marginTop: 4,
    fontWeight: '500',
  },
  weatherDesc: {
    fontSize: 13,
    color: '#8A8D93',
    marginTop: 4,
    fontWeight: '500',
  },
  friendPushCard: {
    backgroundColor: '#111214',
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E11D48',
    shadowColor: '#E11D48',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  friendPushAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1C1D21',
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
    fontWeight: '800',
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  friendPushAction: {
    color: '#E11D48',
    fontSize: 13,
    fontWeight: '700',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 16,
    letterSpacing: 0.5,
  },
  recentSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 5,
  },
  seeAllText: {
    fontSize: 14,
    color: '#E11D48',
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  recentRunCard: {
    backgroundColor: '#111214',
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#2A2C31',
  },
  runIconBox: {
    width: 48,
    height: 48,
    backgroundColor: '#1C1D21',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  runInfo: {
    flex: 1,
  },
  runTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  runDate: {
    fontSize: 13,
    color: '#8A8D93',
    fontWeight: '600',
  },
  runStats: {
    alignItems: 'flex-end',
  },
  runDistance: {
    fontSize: 18,
    fontWeight: '900',
    color: '#E11D48',
  },
  runTime: {
    fontSize: 13,
    color: '#8A8D93',
    marginTop: 4,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  gridContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  gridBox: {
    width: (width - 56) / 2, // 20 padding each side + 16 gap
    backgroundColor: '#111214',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    height: 110,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#2A2C31',
  },
  gridBoxEmpty: {
    backgroundColor: 'transparent',
    borderWidth: 0,
    elevation: 0,
    shadowOpacity: 0,
  },
  gridEmoji: {
    fontSize: 32,
    marginBottom: 12,
  },
  gridText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  startActionContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 30,
    paddingTop: 20,
    backgroundColor: 'rgba(0,0,0,0.85)',
  },
  startButton: {
    backgroundColor: '#E11D48',
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#E11D48',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.6,
    shadowRadius: 16,
    elevation: 10,
    borderWidth: 2,
    borderColor: 'rgba(225, 29, 72, 0.4)',
  },
  startButtonText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 4,
    textTransform: 'uppercase',
  }
});

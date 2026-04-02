import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useIsFocused } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

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
            <Ionicons name="menu" size={28} color="#222222" />
          </TouchableOpacity>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.greeting}>{getGreeting()}</Text>
              <Text style={styles.userName}>{avatar ? `${avatar} ` : ''}{username}</Text>
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
        <TouchableOpacity style={styles.weatherCard} activeOpacity={0.9} onPress={() => navigation.navigate('Weather')}>
          <View style={styles.weatherIconContainer}>
            <Ionicons name="partly-sunny" size={32} color="#24C789" />
          </View>
          <View style={styles.weatherMeta}>
             <Text style={styles.weatherTemp}>18°C · Perfect Conditions</Text>
             <Text style={styles.weatherTip}>Great time for a quick 5k run before sunset!</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#CCCCCC" />
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
          <TouchableOpacity onPress={() => navigation.navigate('Run')}>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity activeOpacity={0.8} style={styles.recentRunCard} onPress={() => navigation.navigate('Run')}>
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

        <TouchableOpacity activeOpacity={0.8} style={styles.recentRunCard} onPress={() => navigation.navigate('Run')}>
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
          onPress={() => navigation.navigate('Run')}
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
    fontSize: 14,
    fontWeight: '600',
    color: '#444444',
  },
  startActionContainer: {
    position: 'absolute',
    bottom: 25,
    width: '100%',
    alignItems: 'center',
  },
  startButton: {
    backgroundColor: '#24C789', // Keep bright green
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#24C789',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  startButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
});

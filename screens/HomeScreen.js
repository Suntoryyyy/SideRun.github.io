import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useIsFocused } from '@react-navigation/native';

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

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* Header Section */}
        <View style={styles.header}>
          <Text style={styles.greeting}>Good Morning,</Text>
          <Text style={styles.userName}>{avatar ? `${avatar} ` : ''}{username}</Text>
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
        </View>

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

        <View style={styles.gridContainer}>
          <TouchableOpacity style={styles.gridBox} onPress={() => navigation.navigate('Weather')}>
            <Text style={styles.gridEmoji}>🌤</Text>
            <Text style={styles.gridText}>Weather Alert</Text>
          </TouchableOpacity>
          <View style={[styles.gridBox, styles.gridBoxEmpty]} />
        </View>

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
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#222222',
    marginBottom: 16,
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

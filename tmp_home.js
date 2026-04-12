import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TouchableWithoutFeedback, ScrollView, Dimensions, Image, Animated, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import * as Location from 'expo-location';
import MapStyle from './MapStyle.json';

let MapView, PROVIDER_GOOGLE;
if (Platform.OS !== 'web') {
  const Maps = require('react-native-maps');
  MapView = Maps.default;
  PROVIDER_GOOGLE = Maps.PROVIDER_GOOGLE;
}
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useIsFocused } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');

export default function HomeScreen({ navigation }) {
  const isFocused = useIsFocused();
  const startButtonScale = useRef(new Animated.Value(1)).current;
  const [username, setUsername] = useState('Runner');
  const [avatar, setAvatar] = useState('');
  const [region, setRegion] = useState({ latitude: 37.7749, longitude: -122.4194, latitudeDelta: 0.05, longitudeDelta: 0.05 });

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      let location = await Location.getCurrentPositionAsync({});
      setRegion({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      });
    })();
  }, []);

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
      {Platform.OS === 'web' ? (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: -1 }}>
          <iframe
            width="100%"
            height="100%"
            frameBorder="0"
            scrolling="no"
            src={`https://www.openstreetmap.org/export/embed.html?bbox=${region.longitude - 0.025},${region.latitude - 0.025},${region.longitude + 0.025},${region.latitude + 0.025}&layer=mapnik`}
            style={{ border: 'none', filter: 'brightness(0.9) grayscale(0.8)' }}
          />
        </div>
      ) : (
        MapView && (
          <MapView
            style={StyleSheet.absoluteFillObject}
            provider={PROVIDER_GOOGLE}
            region={region}
            customMapStyle={MapStyle}
            showsUserLocation={false}
            pitchEnabled={false}
            rotateEnabled={false}
            scrollEnabled={false}
            zoomEnabled={false}
          />
        )
      )}
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* Header Section */}
        <BlurView intensity={80} tint="light" style={styles.header}>
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
              <Text style={styles.brandText}>SIDERUN</Text>
            </View>
          </View>
        </BlurView>

        {/* Weekly Stats Card */}
        <BlurView intensity={80} tint="light" style={styles.card}>
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
        </BlurView>

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
    backgroundColor: '#EAEAEA',
  },
  scrollContent: {
    padding: 20,
    paddingTop: 50,
    paddingBottom: 140,
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.70)',
    borderRadius: 24,
    padding: 24,
    marginBottom: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.9)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
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
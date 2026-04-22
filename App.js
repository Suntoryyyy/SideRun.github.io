import 'react-native-gesture-handler';
import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator, TransitionPresets } from '@react-navigation/stack';
import * as TaskManager from 'expo-task-manager';
import * as Location from 'expo-location';
import { View, ActivityIndicator, Platform, StyleSheet } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';

const BACKGROUND_LOCATION_TASK = "BACKGROUND_LOCATION_TASK";

if (Platform.OS !== 'web') {
  TaskManager.defineTask(BACKGROUND_LOCATION_TASK, ({ data: { locations }, error }) => {
    if (error) { console.error(error); return; }
    if (locations) {
      console.log("Background location heartbeat:", locations.length);
    }
  });
}

import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './services/supabase';
import * as Font from 'expo-font';
import useUserStore from './store/useUserStore';
import { Ionicons } from '@expo/vector-icons';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_800ExtraBold,
  Inter_900Black,
} from '@expo-google-fonts/inter';
import patchTextFonts from './utils/patchTextFonts';
import fixWebViewport from './utils/fixWebViewport';
import useWebViewportInset from './hooks/useWebViewportInset';

fixWebViewport();

import HomeScreen from './screens/HomeScreen';
import FriendsScreen from './screens/FriendsScreen';
import ChatScreen from './screens/ChatScreen';
import RunScreen from './screens/RunScreen';
import WeatherScreen from './screens/WeatherScreen';
import BadgesScreen from './screens/BadgesScreen';
import ProfileScreen from './screens/ProfileScreen';
import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import RunHistoryScreen from './screens/RunHistoryScreen';
import TrainingInsightScreen from './screens/TrainingInsightScreen';
import OnboardingWelcomeScreen from './screens/OnboardingWelcomeScreen';
import OnboardingPermissionsScreen from './screens/OnboardingPermissionsScreen';
import OnboardingGoalScreen, { ONBOARDING_KEY } from './screens/OnboardingGoalScreen';

// Visual height of icon + label; actual bar size adds safe-area bottom inset
const TAB_BAR_CONTENT_HEIGHT = 56;

// Backwards-compat export for screens that position floating CTAs above the
// bar (HomeScreen). We approximate here — the bar itself uses the live inset.
export const TAB_BAR_HEIGHT = Platform.OS === 'ios' ? 86 : Platform.OS === 'android' ? 64 : 86;

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

function MainTabNavigator({ handleLogout }) {
  const insets = useSafeAreaInsets();
  // `webChrome` is the height of iOS Safari's floating URL bar (or equivalent
  // on other mobile browsers). Measured live from `visualViewport`.
  const webChrome = useWebViewportInset();

  // iOS: home indicator inset (24–34pt).
  // Android: nothing special — software nav is already below.
  // Web: safe-area-inset-bottom rarely reports anything on Safari, so we use
  // the live browser-chrome measurement, plus a small visual buffer so labels
  // never sit flush against the URL bar.
  const bottomPad =
    Platform.OS === 'android'
      ? 8
      : Platform.OS === 'web'
      ? Math.max(insets.bottom, webChrome + 8, 12)
      : Math.max(insets.bottom, 12);

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: [
          styles.tabBar,
          {
            height: TAB_BAR_CONTENT_HEIGHT + bottomPad,
            paddingBottom: bottomPad,
          },
        ],
        tabBarActiveTintColor: '#0B0F13',
        tabBarInactiveTintColor: '#9AA0A6',
        tabBarLabelStyle: styles.tabLabel,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'home' : 'home-outline'} size={22} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Friends"
        component={FriendsScreen}
        options={{
          tabBarLabel: 'Crew',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'people' : 'people-outline'} size={22} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Run"
        component={RunScreen}
        options={{
          tabBarLabel: () => null,   // circular button is self-explanatory
          tabBarIcon: ({ focused }) => (
            <View style={[styles.runTab, focused && styles.runTabFocused]}>
              <Ionicons name="play" size={19} color="#FFFFFF" />
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="Weather"
        component={WeatherScreen}
        options={{
          tabBarLabel: 'Weather',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'partly-sunny' : 'partly-sunny-outline'} size={22} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        options={{
          tabBarLabel: 'Me',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'person' : 'person-outline'} size={22} color={color} />
          ),
        }}
      >
        {props => <ProfileScreen {...props} handleLogout={handleLogout} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}

export default function App() {
  const { initialize, isLoggedIn, isLoading, logout } = useUserStore();
  const [onboardingDone, setOnboardingDone] = useState(true);
  const [onboardingChecked, setOnboardingChecked] = useState(false);

  useEffect(() => {
    async function prepareApp() {
      try {
        const interFonts = {
          Inter_400Regular, Inter_500Medium, Inter_600SemiBold,
          Inter_700Bold, Inter_800ExtraBold, Inter_900Black,
        };
        if (Platform.OS === 'web') {
          await Font.loadAsync({
            Ionicons: 'https://unpkg.com/@expo/vector-icons@15.1.1/build/vendor/react-native-vector-icons/Fonts/Ionicons.ttf',
            ...interFonts,
          });
        } else {
          await Font.loadAsync({ ...Ionicons.font, ...interFonts });
        }
        patchTextFonts();
        await initialize();
        try {
          const flag = await AsyncStorage.getItem(ONBOARDING_KEY);
          setOnboardingDone(flag === '1');
        } catch (_) {
          setOnboardingDone(false);
        }
        setOnboardingChecked(true);
      } catch (e) {
        console.warn(e);
        setOnboardingChecked(true);
      }
    }
    prepareApp();
  }, []);

  const completeOnboarding = () => setOnboardingDone(true);

  const handleLogoutWrapper = async () => {
    try {
      if (global.account) await global.account.deleteSession('current');
    } catch (e) {}
    await logout();
  };

  if (isLoading || !onboardingChecked) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#24C789" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
    <NavigationContainer>
      <StatusBar style="auto" />
      <Stack.Navigator screenOptions={{ headerShown: false, ...TransitionPresets.SlideFromRightIOS }}>
        {!isLoggedIn ? (
          <>
            <Stack.Screen name="Login">
              {props => <LoginScreen {...props} />}
            </Stack.Screen>
            <Stack.Screen name="Register">
              {props => <RegisterScreen {...props} />}
            </Stack.Screen>
          </>
        ) : !onboardingDone ? (
          <>
            <Stack.Screen name="OnboardingWelcome" component={OnboardingWelcomeScreen} />
            <Stack.Screen name="OnboardingPermissions" component={OnboardingPermissionsScreen} />
            <Stack.Screen name="OnboardingGoal">
              {props => <OnboardingGoalScreen {...props} onComplete={completeOnboarding} />}
            </Stack.Screen>
          </>
        ) : (
          <>
            <Stack.Screen name="Main">
              {props => <MainTabNavigator {...props} handleLogout={handleLogoutWrapper} />}
            </Stack.Screen>
            {/* Overlay screens pushed on top of the tab bar */}
            <Stack.Screen name="Chat" component={ChatScreen} />
            <Stack.Screen name="RunHistory" component={RunHistoryScreen} />
            <Stack.Screen name="Badges" component={BadgesScreen} />
            <Stack.Screen name="TrainingInsight" component={TrainingInsightScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: 'rgba(11,15,19,0.07)',
    elevation: 0,
    shadowColor: 'transparent',
    paddingTop: 8,
    // height + paddingBottom applied dynamically from useSafeAreaInsets
  },
  tabLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 10,
    letterSpacing: 0.2,
    marginTop: 2,
  },
  runTab: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#0B0F13',
    justifyContent: 'center',
    alignItems: 'center',
    // without the label below, we can lift the button higher
    marginBottom: Platform.OS === 'ios' ? 16 : Platform.OS === 'android' ? 8 : 16,
    shadowColor: '#0B0F13',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
  },
  runTabFocused: {
    backgroundColor: '#24C789',
  },
});

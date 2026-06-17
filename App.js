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
import useWebBottomGuard from './hooks/useWebViewportInset';

fixWebViewport();

if (Platform.OS === 'web' && typeof document !== 'undefined') {
  const script = document.createElement('script');
  script.src = "https://mcp.figma.com/mcp/html-to-design/capture.js";
  script.async = true;
  document.head.appendChild(script);
}

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

// Floating-dock design: the tab bar is a rounded island that sits above a
// transparent strip of page background. TAB_BAR_CONTENT_HEIGHT is the fixed
// height of that island; the safe-area / URL-bar reservation becomes the
// `marginBottom` (i.e. the gap below the island), not padding inside it.
const TAB_BAR_CONTENT_HEIGHT = 64;

// Horizontal inset of the floating island.
const TAB_BAR_H_INSET = 12;

// Approximate total vertical footprint the tab bar reserves (island height
// + a typical bottom gap). Screens that need to clear the tab bar use this.
export const TAB_BAR_HEIGHT = Platform.OS === 'ios' ? 96 : Platform.OS === 'android' ? 76 : 96;

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

function MainTabNavigator({ handleLogout }) {
  const insets = useSafeAreaInsets();
  // `webGuard` combines safe-area, visualViewport chrome height, and
  // standalone-PWA detection into a single bottom-reserve value. It is 0
  // on native platforms.
  const webGuard = useWebBottomGuard();

  // Final bottom padding for the tab bar across every mode we support:
  //   • iOS native          → home indicator (24–34pt via insets.bottom)
  //   • Android native      → 8pt above gesture bar / 3-button nav
  //   • iOS Safari browser  → URL-bar height from visualViewport + buffer
  //   • iOS standalone PWA  → insets.bottom (34) OR conservative 24pt floor
  //   • Android browser PWA → insets.bottom OR gesture nav floor
  //   • Desktop             → 12pt visual buffer
  const bottomPad =
    Platform.OS === 'android'
      ? Math.max(insets.bottom, 8)
      : Platform.OS === 'web'
      ? Math.max(insets.bottom, webGuard, 12)
      : Math.max(insets.bottom, 12);

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: [
          styles.tabBar,
          {
            height: TAB_BAR_CONTENT_HEIGHT,
            // The safe-area / URL-bar reservation becomes the gap below
            // the island, so all four corners are visible on every device.
            marginBottom: bottomPad,
            marginHorizontal: TAB_BAR_H_INSET,
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
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            // Prevent default behavior so we can force a clean state
            e.preventDefault();
            // Navigate to Run tab and reset params to solo mode
            navigation.navigate('Run', { mode: 'solo', spectateFriend: null });
          },
        })}
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
      await supabase.auth.signOut();
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
  // Floating rounded-island tab bar. All four corners are rounded so the
  // bar reads as a distinct surface floating over the page background,
  // with clear visual separation from any browser chrome below.
  tabBar: {
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    borderTopWidth: 0,
    borderWidth: 1,
    borderColor: 'rgba(11,15,19,0.06)',
    paddingTop: 10,
    paddingBottom: 10,
    // Soft drop shadow for lift. shadow* is respected on iOS & web;
    // elevation covers Android.
    shadowColor: '#0B0F13',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 10,
    // Position overrides so React Navigation's default absolute/static
    // styling doesn't clash with our margin-based island layout.
    overflow: 'visible',
  },
  tabLabel: {
    fontFamily: 'Inter_600SemiBold',
    // Safari on iOS has a known rendering bug where fontSize <= 10 with
    // no explicit lineHeight clips the bottom of letter descenders inside
    // a flex child. Bumping to 11 and pinning lineHeight to 16 gives the
    // glyph box enough room on every browser.
    fontSize: 11,
    lineHeight: 16,
    letterSpacing: 0.2,
    marginTop: 3,
    includeFontPadding: false,
    // Ensure the label isn't clipped by parent overflow on web.
    ...(Platform.OS === 'web' ? { overflow: 'visible' } : null),
  },
  runTab: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#0B0F13',
    justifyContent: 'center',
    alignItems: 'center',
    // With the shorter floating island (64pt) we lift the play button
    // just enough to pop visually above the island's rounded top edge.
    marginBottom: Platform.OS === 'ios' ? 8 : Platform.OS === 'android' ? 4 : 8,
    shadowColor: '#0B0F13',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 10,
    elevation: 6,
  },
  runTabFocused: {
    // Keep the run button the same brand-dark across every tab. Turning it
    // green only on the Run screen read as inconsistent with the rest of the
    // app's primary-action language (GO / Pause / buttons are all #0B0F13).
    backgroundColor: '#0B0F13',
  },
});

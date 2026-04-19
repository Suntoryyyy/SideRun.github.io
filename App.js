import 'react-native-gesture-handler';
import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { createStackNavigator, TransitionPresets } from '@react-navigation/stack';
import * as TaskManager from 'expo-task-manager';
import * as Location from 'expo-location';
import { View, ActivityIndicator, Platform } from 'react-native';

const BACKGROUND_LOCATION_TASK = "BACKGROUND_LOCATION_TASK";

if (Platform.OS !== 'web') {
  TaskManager.defineTask(BACKGROUND_LOCATION_TASK, ({ data: { locations }, error }) => {
    if (error) {
      console.error(error);
      return;
    }
    if (locations) {
      // In a real app, you would sync this to AsyncStorage or Zustand here
      // For now we just define the task so the OS keeps the app alive
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

// Import screen components
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

const Drawer = createDrawerNavigator();
const Stack = createStackNavigator();

function DrawerNavigator({ handleLogout }) {
  return (
    <Drawer.Navigator
      screenOptions={{
        headerShown: false,
        drawerActiveBackgroundColor: '#E8F8F2',
        drawerActiveTintColor: '#24C789',
        drawerInactiveTintColor: '#666666',
        drawerStyle: {
          backgroundColor: '#FFFFFF',
          width: 240,
        }
      }}
    >
      <Drawer.Screen 
        name="Home" 
        component={HomeScreen} 
        options={{
          drawerIcon: ({ color, size }) => (
            <Ionicons name="home-outline" color={color} size={size} />
          )
        }}
      />
      <Drawer.Screen 
        name="Friends" 
        component={FriendsScreen} 
        options={{
          drawerIcon: ({ color, size }) => (
            <Ionicons name="people-outline" color={color} size={size} />
          )
        }}
      />
      <Drawer.Screen 
        name="Run" 
        component={RunScreen} 
        options={{
          drawerIcon: ({ color, size }) => (
            <Ionicons name="footsteps-outline" color={color} size={size} />
          )
        }}
      />
      <Drawer.Screen 
        name="Weather" 
        component={WeatherScreen} 
        options={{
          drawerIcon: ({ color, size }) => (
            <Ionicons name="partly-sunny-outline" color={color} size={size} />
          )
        }}
      />
      <Drawer.Screen 
        name="Profile"
        options={{
          drawerIcon: ({ color, size }) => (
            <Ionicons name="person-outline" color={color} size={size} />
          )
        }}
      >
        {props => <ProfileScreen {...props} handleLogout={handleLogout} />}
      </Drawer.Screen>
      <Drawer.Screen 
        name="Badges" 
        component={BadgesScreen} 
        options={{
          drawerItemStyle: { display: 'none' }
        }} 
      />
      <Drawer.Screen 
        name="RunHistory" 
        component={RunHistoryScreen} 
        options={{
          drawerItemStyle: { display: 'none' }
        }} 
      />
    </Drawer.Navigator>
  );
}

export default function App() {
  const { initialize, isLoggedIn, isLoading, logout } = useUserStore();

  useEffect(() => {
    async function prepareApp() {
      try {
        if (Platform.OS === 'web') {
          // Explicitly load font from CDN to avoid GitHub Pages base-path 404s
          await Font.loadAsync({
            Ionicons: 'https://unpkg.com/@expo/vector-icons@15.1.1/build/vendor/react-native-vector-icons/Fonts/Ionicons.ttf'
          });
        } else {
          await Font.loadAsync(Ionicons.font);
        }
        await initialize();
      } catch (e) {
        console.warn(e);
      }
    }
    prepareApp();
  }, []);



  const handleLogoutWrapper = async () => {
    try {
      if (global.account) await global.account.deleteSession('current');
    } catch (e) {}
    await logout();
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#24C789" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <StatusBar style="auto" />
      <Stack.Navigator screenOptions={{ headerShown: false, ...TransitionPresets.SlideFromRightIOS }}>
        {!isLoggedIn ? (
          <>
            <Stack.Screen name="Login">
              {props => <LoginScreen {...props}  />}
            </Stack.Screen>
            <Stack.Screen name="Register">
              {props => <RegisterScreen {...props}  />}
            </Stack.Screen>
          </>
        ) : (
          <>
            <Stack.Screen name="Main">
              {props => <DrawerNavigator {...props} handleLogout={handleLogoutWrapper} />}
            </Stack.Screen>
            <Stack.Screen name="Chat" component={ChatScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

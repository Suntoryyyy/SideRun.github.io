import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { View, ActivityIndicator } from 'react-native';

// Import screen components
import HomeScreen from './screens/HomeScreen';
import FriendsScreen from './screens/FriendsScreen';
import RunScreen from './screens/RunScreen';
import WeatherScreen from './screens/WeatherScreen';
import BadgesScreen from './screens/BadgesScreen';
import ProfileScreen from './screens/ProfileScreen';
import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';

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
      <Drawer.Screen name="Home" component={HomeScreen} />
      <Drawer.Screen name="Friends" component={FriendsScreen} />
      <Drawer.Screen name="Run" component={RunScreen} />
      <Drawer.Screen name="Weather" component={WeatherScreen} />
      <Drawer.Screen name="Profile">
        {props => <ProfileScreen {...props} handleLogout={handleLogout} />}
      </Drawer.Screen>
      <Drawer.Screen 
        name="Badges" 
        component={BadgesScreen} 
        options={{
          drawerItemStyle: { display: 'none' }
        }} 
      />
    </Drawer.Navigator>
  );
}

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkLoginStatus();
  }, []);

  const checkLoginStatus = async () => {
    try {
      const user = await AsyncStorage.getItem('currentUser');
      if (user) setIsLoggedIn(true);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await AsyncStorage.removeItem('currentUser');
    setIsLoggedIn(false);
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
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isLoggedIn ? (
          <>
            <Stack.Screen name="Login">
              {props => <LoginScreen {...props} setLoggedIn={setIsLoggedIn} />}
            </Stack.Screen>
            <Stack.Screen name="Register">
              {props => <RegisterScreen {...props} setLoggedIn={setIsLoggedIn} />}
            </Stack.Screen>
          </>
        ) : (
          <Stack.Screen name="Main">
            {props => <DrawerNavigator {...props} handleLogout={handleLogout} />}
          </Stack.Screen>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const useUserStore = create((set, get) => ({
  user: null,
  isLoggedIn: false,
  isLoading: true,

  // Initialize the store by reading from storage once
  initialize: async () => {
    try {
      let userData = null;
      if (Platform.OS === 'web') {
        userData = sessionStorage.getItem('currentUser');
      }
      
      if (!userData) {
        userData = await AsyncStorage.getItem('currentUser');
      }

      if (userData) {
        const parsedUser = JSON.parse(userData);
        set({ user: parsedUser, isLoggedIn: true, isLoading: false });
      } else {
        set({ user: null, isLoggedIn: false, isLoading: false });
      }
    } catch (e) {
      console.error('Failed to initialize user store:', e);
      set({ user: null, isLoggedIn: false, isLoading: false });
    }
  },

  // Login sets the state and persists to storage
  login: async (userData, rememberMe = true) => {
    try {
      const stringifiedUser = JSON.stringify(userData);
      if (rememberMe || Platform.OS !== 'web') {
        await AsyncStorage.setItem('currentUser', stringifiedUser);
      } else {
        sessionStorage.setItem('currentUser', stringifiedUser);
      }
      set({ user: userData, isLoggedIn: true });
    } catch (e) {
      console.error('Failed to save login data:', e);
    }
  },

  // Update user profile info (like avatar or name)
  updateProfile: async (updates) => {
    try {
      const currentUser = get().user;
      if (!currentUser) return;
      
      const updatedUser = { ...currentUser, ...updates };
      const stringifiedUser = JSON.stringify(updatedUser);
      
      await AsyncStorage.setItem('currentUser', stringifiedUser);
      if (Platform.OS === 'web' && sessionStorage.getItem('currentUser')) {
        sessionStorage.setItem('currentUser', stringifiedUser);
      }
      
      set({ user: updatedUser });
    } catch (e) {
      console.error('Failed to update profile data:', e);
    }
  },

  // Logout clears state and storage
  logout: async () => {
    try {
      await AsyncStorage.removeItem('currentUser');
      if (Platform.OS === 'web') {
        sessionStorage.removeItem('currentUser');
      }
      set({ user: null, isLoggedIn: false });
    } catch (e) {
      console.error('Failed to clear user data during logout:', e);
    }
  }
}));

export default useUserStore;

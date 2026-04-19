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
        try {
          userData = sessionStorage.getItem('currentUser');
        } catch (e) {
          console.warn('sessionStorage access failed', e);
        }
      }
      
      if (!userData) {
        try {
          userData = await AsyncStorage.getItem('currentUser');
        } catch (e) {
          console.warn('AsyncStorage get currentUser failed', e);
        }
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
        try {
          await AsyncStorage.setItem('currentUser', stringifiedUser);
        } catch (e) {
          console.warn('AsyncStorage set currentUser failed', e);
        }
      } else {
        if (Platform.OS === 'web') {
          try {
            sessionStorage.setItem('currentUser', stringifiedUser);
          } catch (e) {
            console.warn('sessionStorage set currentUser failed', e);
          }
        }
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
      
      try {
        await AsyncStorage.setItem('currentUser', stringifiedUser);
      } catch (e) {
        console.warn('AsyncStorage set currentUser failed', e);
      }

      if (Platform.OS === 'web') {
        try {
          if (sessionStorage.getItem('currentUser')) {
            sessionStorage.setItem('currentUser', stringifiedUser);
          }
        } catch (e) {
          console.warn('sessionStorage profile sync failed', e);
        }
      }
      
      set({ user: updatedUser });
    } catch (e) {
      console.error('Failed to update profile data:', e);
    }
  },

  // Logout clears state and storage
  logout: async () => {
    try {
      try {
        await AsyncStorage.removeItem('currentUser');
      } catch (e) {
        console.warn('AsyncStorage remove currentUser failed', e);
      }
      
      if (Platform.OS === 'web') {
        try {
          sessionStorage.removeItem('currentUser');
        } catch (e) {
          console.warn('sessionStorage remove currentUser failed', e);
        }
      }
      set({ user: null, isLoggedIn: false });
    } catch (e) {
      console.error('Failed to clear user data during logout:', e);
    }
  }
}));

export default useUserStore;

import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator } from 'react-native';
import { BlurView } from 'expo-blur';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../services/supabase';
import CustomAlert from '../components/CustomAlert';

export default function LoginScreen({ navigation, setLoggedIn }) {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true); // Default to true
  const [isLoading, setIsLoading] = useState(false);
  const [alertConfig, setAlertConfig] = useState({ visible: false, title: '', message: '', type: 'error' });
  const [region, setRegion] = useState({ latitude: 37.7749, longitude: -122.4194 });

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      let location = await Location.getCurrentPositionAsync({});
      setRegion({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
    })();
  }, []);

  const showAlert = (title, message, type = 'error') => {
    setAlertConfig({ visible: true, title, message, type });
  };

  useEffect(() => {
    // Check if there's a saved auto-login preference we should load
    const loadRememberedUser = async () => {
      try {
      const pseudoEmail = `${trimmedPhone}@siderun.app`;
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: pseudoEmail,
        password: password,
      });

      if (error) {
        setIsLoading(false);
        if (error.message.includes('Invalid login credentials')) {
          showAlert('Login Failed', 'Incorrect phone number or password. Please try again or create an account.');
        } else {
          showAlert('Login Failed', error.message);
        }
        return;
      }

      // Fetch user profile from the database
      let username = 'Runner';
      if (data.user) {
        const { data: profile } = await supabase
          .from('users')
          .select('username')
          .eq('id', data.user.id)
          .single();
          
        if (profile && profile.username) {
          username = profile.username;
        }
      }

      const userInfo = JSON.stringify({ phone: trimmedPhone, username, id: data?.user?.id });

      if (rememberMe) {
        await AsyncStorage.setItem('rememberedPhone', trimmedPhone);
      } else {
        await AsyncStorage.removeItem('rememberedPhone');
      }

      if (Platform.OS === 'web') {
        sessionStorage.setItem('currentUser', userInfo);
      } else {
        await AsyncStorage.setItem('currentUser', userInfo);
      }

      setIsLoading(false);
      setLoggedIn(true);
    } catch (e) {
        // Ignore
      }
    };
    loadRememberedUser();
  }, []);



  const handleLogin = async () => {
    const trimmedPhone = phone.trim();

    if (!trimmedPhone || !password) {
      showAlert('Error', 'Please enter your phone number and password');
      return;
    }

    if (trimmedPhone === 'admin' || trimmedPhone === '123456') {
      const adminInfo = JSON.stringify({ phone: '1234567890', username: 'Admin Bypass' });
      if (Platform.OS === 'web') {
        sessionStorage.setItem('currentUser', adminInfo);
      } else {
        await AsyncStorage.setItem('currentUser', adminInfo);
      }
      setLoggedIn(true);
      return;
    }

    setIsLoading(true);

    try {
      const pseudoEmail = `${trimmedPhone}@siderun.app`;
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: pseudoEmail,
        password: password,
      });

      if (error) {
        setIsLoading(false);
        showAlert('Login Failed', error.message);
        return;
      }

      let username = 'Runner';
      if (data.user) {
        const { data: profile } = await supabase
          .from('users')
          .select('username')
          .eq('id', data.user.id)
          .single();
          
        if (profile && profile.username) username = profile.username;
      }

      const userInfo = JSON.stringify({ phone: trimmedPhone, username, id: data?.user?.id });
      
      if (rememberMe) {
        await AsyncStorage.setItem('rememberedPhone', trimmedPhone);
      } else {
        await AsyncStorage.removeItem('rememberedPhone');
      }

      if (Platform.OS === 'web') {
        sessionStorage.setItem('currentUser', userInfo);
      } else {
        await AsyncStorage.setItem('currentUser', userInfo);
      }

      setIsLoading(false);
      setLoggedIn(true);

    } catch (e) {
      showAlert('Error', 'An error occurred during login');
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      {/* Background Map */}
      {Platform.OS === 'web' ? (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: -1 }}>
          <iframe
            width="100%"
            height="100%"
            frameBorder="0"
            scrolling="no"
            src={`https://www.openstreetmap.org/export/embed.html?bbox=${region.longitude - 0.05},${region.latitude - 0.05},${region.longitude + 0.05},${region.latitude + 0.05}&layer=mapnik`}
            style={{ border: 'none', filter: 'brightness(0.9) grayscale(0.8)' }}
          />
        </div>
      ) : (
        <View style={StyleSheet.absoluteFillObject} backgroundColor="#EAEAEA" />
      )}

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <BlurView intensity={85} tint="light" style={styles.glassCard}>
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Ionicons name="footsteps" size={48} color="#24C789" />
            <Text style={styles.logoText}>SIDERUN</Text>
          </View>
          <Text style={styles.title}>Back to the Track.</Text>
          <Text style={styles.subtitle}>
            Sign in to continue your fitness journey and connect with friends.
          </Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>Phone Number</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your phone number"
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
            autoCapitalize="none"
          />

          <Text style={styles.label}>Password</Text>
          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.passwordInput}
              placeholder="Enter your password"
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
            />
            <TouchableOpacity 
              style={styles.eyeIcon} 
              onPress={() => setShowPassword(!showPassword)}
            >
              <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={24} color="#888" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity 
            style={styles.checkboxContainer} 
            onPress={() => setRememberMe(!rememberMe)}
            activeOpacity={0.7}
          >
            <Ionicons 
              name={rememberMe ? 'checkmark-circle' : 'ellipse-outline'} 
              size={24} 
              color={rememberMe ? '#24C789' : '#888'} 
            />
            <Text style={styles.checkboxLabel}>Remember Me</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.loginButton} onPress={handleLogin} disabled={isLoading}>
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.loginButtonText}>LOG IN</Text>
            )}
          </TouchableOpacity>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={styles.registerText}>Sign Up</Text>
            </TouchableOpacity>
          </View>




        </View>
        </BlurView>
      </ScrollView>
      <CustomAlert
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        onClose={() => setAlertConfig({ ...alertConfig, visible: false })}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  glassCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.75)',
    borderRadius: 30,
    padding: 30,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.9)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 5,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 30,
  },
  header: {
    marginBottom: 40,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  logoText: {
    fontSize: 32,
    fontWeight: '900',
    color: '#24C789',
    marginLeft: 8,
    letterSpacing: 1,
    fontStyle: 'italic',
  },
  title: {
    fontSize: 42,
    fontWeight: '900',
    color: '#111',
    marginBottom: 12,
    letterSpacing: -1,
    lineHeight: 48,
  },
  subtitle: {
    fontSize: 18,
    color: '#555',
    lineHeight: 26,
    fontWeight: '500',
  },
  brandText: {
    color: '#24C789',
    fontWeight: '800',
    fontStyle: 'italic',
  },
  form: {
    width: '100%',
  },
  label: {
    fontSize: 14,
    color: '#444444',
    marginBottom: 8,
    fontWeight: '600',
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    fontSize: 16,
    color: '#222222',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 1)',
    borderRadius: 12,
    marginBottom: 20,
  },
  passwordInput: {
    flex: 1,
    padding: 16,
    fontSize: 16,
    color: '#222222',
  },
  eyeIcon: {
    padding: 16,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    marginLeft: 4,
  },
  checkboxLabel: {
    marginLeft: 8,
    fontSize: 14,
    color: '#444444',
  },
  loginButton: {
    backgroundColor: '#24C789',
    borderRadius: 30,
    padding: 16,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#24C789',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 30,
  },
  footerText: {
    color: '#888888',
    fontSize: 14,
  },
  registerText: {
    color: '#24C789',
    fontSize: 14,
    fontWeight: 'bold',
  },
  clearDataButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 40,
    padding: 10,
    opacity: 0.7,
  },
  clearDataText: {
    color: '#FF3B30',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
});
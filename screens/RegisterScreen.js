import React, { useState, useEffect } from 'react';
import { BlurView } from 'expo-blur';
import * as Location from 'expo-location';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../services/supabase';

import CustomAlert from '../components/CustomAlert';

export default function RegisterScreen({ navigation, setLoggedIn }) {
  const [phone, setPhone] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
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

  const handleRegister = async () => {
    const trimmedPhone = phone.trim();
    const trimmedUsername = username.trim();

    if (!trimmedPhone || !trimmedUsername || !password) {
      showAlert('Error', 'Please fill all fields');
      return;
    }
    setIsLoading(true);

    try {
      const pseudoEmail = `${trimmedPhone}@siderun.app`;
      
      const { data, error } = await supabase.auth.signUp({
        email: pseudoEmail,
        password: password,
      });

      if (error) {
        setIsLoading(false);
        showAlert('Registration Failed', error.message || 'Error from MemFire');
        return;
      }

      if (data.user) {
        await supabase
          .from('users')
          .insert([
            { id: data.user.id, phone: trimmedPhone, username: trimmedUsername, weeklyDistance: 0, totalRuns: 0 }
          ]);
      }

      const currentUser = JSON.stringify({ phone: trimmedPhone, username: trimmedUsername, id: data?.user?.id });
      if (Platform.OS === 'web') {
        sessionStorage.setItem('currentUser', currentUser);
      } else {
        await AsyncStorage.setItem('currentUser', currentUser);
      }

      setIsLoading(false);
      setLoggedIn(true);

    } catch (e) {
      showAlert('Error', 'An error occurred during registration');
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
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
          >
            <Ionicons name="arrow-back" size={28} color="#111111" />
          </TouchableOpacity>
          <Text style={styles.title}>JOIN SIDERUN</Text>
          <Text style={styles.subtitle}>
            Create an account to start sharing runs on <Text style={styles.brandText}>SideRun</Text>
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

          <Text style={styles.label}>Username</Text>
          <TextInput
            style={styles.input}
            placeholder="Choose a display name"
            value={username}
            onChangeText={setUsername}
          />

          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            placeholder="Create a password"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          <TouchableOpacity style={styles.registerButton} onPress={handleRegister} disabled={isLoading}>
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.registerButtonText}>SIGN UP</Text>
            )}
          </TouchableOpacity>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.loginText}>Log In</Text>
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
        onClose={() => {
          setAlertConfig({ ...alertConfig, visible: false });
          if (alertConfig.type === 'success') setLoggedIn(true);
        }}
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
    paddingTop: 60,
  },
  header: {
    marginBottom: 30,
  },
  backButton: {
    marginBottom: 20,
    alignSelf: 'flex-start',
    padding: 8,
    marginLeft: -8,
  },
  title: {
    fontSize: 36,
    fontWeight: '900', // Extra bold for a sporty feel
    color: '#111111',
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: '#888888',
    lineHeight: 24,
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
  registerButton: {
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
  registerButtonText: {
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
  loginText: {
    color: '#24C789',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function LoginScreen({ navigation, setLoggedIn }) {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    const trimmedPhone = phone.trim();

    if (!trimmedPhone || !password) {
      Alert.alert('Error', 'Please enter your phone number and password');
      return;
    }

    try {
      const usersData = await AsyncStorage.getItem('users');
      const users = usersData ? JSON.parse(usersData) : {};

      if (users[trimmedPhone] && users[trimmedPhone].password === password) {
        await AsyncStorage.setItem('currentUser', JSON.stringify({ phone: trimmedPhone, username: users[trimmedPhone].username }));
        setLoggedIn(true);
      } else {
        Alert.alert('Login Failed', 'Invalid phone number or password');
      }
    } catch (e) {
      Alert.alert('Error', 'An error occurred during login');
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>WELCOME BACK</Text>
          <Text style={styles.subtitle}>
            Log in to <Text style={styles.brandText}>SideRun</Text> to track your progress
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
          <TextInput
            style={styles.input}
            placeholder="Enter your password"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
            <Text style={styles.loginButtonText}>LOG IN</Text>
          </TouchableOpacity>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={styles.registerText}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 30,
  },
  header: {
    marginBottom: 40,
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
    backgroundColor: '#F4F5F7',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    fontSize: 16,
    color: '#222222',
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
});
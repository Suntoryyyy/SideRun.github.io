import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

export default function RegisterScreen({ navigation, setLoggedIn }) {
  const [phone, setPhone] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleRegister = async () => {
    const trimmedPhone = phone.trim();
    const trimmedUsername = username.trim();

    if (!trimmedPhone || !trimmedUsername || !password) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }

    try {
      const usersData = await AsyncStorage.getItem('users');
      const users = usersData ? JSON.parse(usersData) : {};

      const isUsernameTaken = Object.values(users).some(
        user => user.username.toLowerCase() === trimmedUsername.toLowerCase()
      );

      if (users[trimmedPhone]) {
        Alert.alert('Registration Failed', 'This phone number is already registered.');
      } else if (isUsernameTaken) {
        Alert.alert('Registration Failed', 'This username is already taken. Please choose another one.');
      } else {
        users[trimmedPhone] = { phone: trimmedPhone, username: trimmedUsername, password };
        await AsyncStorage.setItem('users', JSON.stringify(users));
        await AsyncStorage.setItem('currentUser', JSON.stringify({ phone: trimmedPhone, username: trimmedUsername }));
        Alert.alert('Success', 'Account created successfully!');
        setLoggedIn(true);
      }
    } catch (e) {
      Alert.alert('Error', 'An error occurred during registration');
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
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

          <TouchableOpacity style={styles.registerButton} onPress={handleRegister}>
            <Text style={styles.registerButtonText}>SIGN UP</Text>
          </TouchableOpacity>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.loginText}>Log In</Text>
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
    paddingTop: 60,
  },
  header: {
    marginBottom: 40,
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    top: -40,
    left: -10,
    zIndex: 10,
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
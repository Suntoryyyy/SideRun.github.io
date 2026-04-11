import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

export default function LoginScreen({ navigation, setLoggedIn }) {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true); // Default to true
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Check if there's a saved auto-login preference we should load
    const loadRememberedUser = async () => {
      try {
        const savedPhone = await AsyncStorage.getItem('rememberedPhone');
        if (savedPhone) {
          setPhone(savedPhone);
        }
      } catch (e) {
        // Ignore
      }
    };
    loadRememberedUser();
  }, []);

  const handleLogin = async () => {
    const trimmedPhone = phone.trim();

    if (!trimmedPhone || !password) {
      Alert.alert('Error', 'Please enter your phone number and password');
      return;
    }

    setIsLoading(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 800)); // Show loading animation
      const usersData = await AsyncStorage.getItem('users');
      const users = usersData ? JSON.parse(usersData) : {};

      if (users[trimmedPhone]) {
        if (users[trimmedPhone].password === password) {
          const userInfo = JSON.stringify({ phone: trimmedPhone, username: users[trimmedPhone].username });
          if (rememberMe) {
            await AsyncStorage.setItem('rememberedPhone', trimmedPhone);
            await AsyncStorage.setItem('currentUser', userInfo);
          } else {
            await AsyncStorage.removeItem('rememberedPhone');
            if (Platform.OS === 'web') {
              sessionStorage.setItem('currentUser', userInfo);
            } else {
              await AsyncStorage.setItem('currentUser', userInfo);
            }
          }
          setLoggedIn(true);
        } else {
          Alert.alert('Login Failed', 'The password you entered is incorrect.');
          setIsLoading(false);
        }
      } else {
        Alert.alert('Login Failed', 'This phone number is not registered.');
        setIsLoading(false);
      }
    } catch (e) {
      Alert.alert('Error', 'An error occurred during login');
      setIsLoading(false);
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
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F4F5F7',
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


});
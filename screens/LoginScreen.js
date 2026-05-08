import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Animated,
} from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop, G } from 'react-native-svg';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { supabase } from '../services/supabase';
import CustomAlert from '../components/CustomAlert';
import AuthField from '../components/AuthField';
import AuthButton from '../components/AuthButton';
import useUserStore from '../store/useUserStore';
import { T, FONT } from '../constants/typography';

export default function LoginScreen({ navigation }) {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    title: '',
    message: '',
    type: 'error',
  });

  const login = useUserStore((s) => s.login);
  const spin = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(spin, {
        toValue: 1,
        duration: 22000,
        useNativeDriver: true,
      })
    ).start();
  }, [spin]);

  useEffect(() => {
    (async () => {
      try {
        const rememberedPhone = await AsyncStorage.getItem('rememberedPhone');
        if (rememberedPhone) {
          setPhone(rememberedPhone);
          setRememberMe(true);
        }
      } catch (e) {
        console.warn('Failed to load remembered phone', e);
      }
    })();
  }, []);

  const rotate = spin.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const showAlert = (title, message, type = 'error') => {
    setAlertConfig({ visible: true, title, message, type });
  };

  const handleLogin = async () => {
    const trimmedPhone = phone.trim();
    if (!trimmedPhone || !password) {
      showAlert('Missing info', 'Enter your phone number and password to continue.');
      return;
    }
    if (Platform.OS !== 'web') Haptics.selectionAsync();
    setIsLoading(true);
    try {
      const pseudoEmail = `${trimmedPhone}@siderun.app`;
      const { data, error } = await supabase.auth.signInWithPassword({
        email: pseudoEmail,
        password,
      });
      if (error) {
        setIsLoading(false);
        showAlert('Login failed', error.message);
        return;
      }
      let username = 'Runner';
      let avatar = null;
      if (data.user) {
        const { data: profile, error: profileError } = await supabase
          .from('users')
          .select('*')
          .eq('id', data.user.id)
          .single();
        
        if (profileError) {
          console.warn("Could not fetch user profile on login:", profileError);
          // Fallback: try fetching by phone
          const { data: phoneProfile } = await supabase
            .from('users')
            .select('*')
            .eq('phone', trimmedPhone)
            .single();
          if (phoneProfile?.username) username = phoneProfile.username;
          if (phoneProfile?.avatar) avatar = phoneProfile.avatar;
        } else {
          if (profile?.username) username = profile.username;
          if (profile?.avatar) avatar = profile.avatar;
        }
      }
      const userInfo = { phone: trimmedPhone, username, avatar, id: data?.user?.id };
      if (rememberMe) {
        try { await AsyncStorage.setItem('rememberedPhone', trimmedPhone); } catch (_) {}
      } else {
        try { await AsyncStorage.removeItem('rememberedPhone'); } catch (_) {}
      }
      await login(userInfo, rememberMe);
      setIsLoading(false);
    } catch (e) {
      console.error(e);
      showAlert('Error', `Login exception: ${e.message || JSON.stringify(e)}`);
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.root}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroWrap}>
          <Animated.View style={{ transform: [{ rotate }] }}>
            <Svg width={200} height={200} viewBox="0 0 280 280">
              <Defs>
                <LinearGradient id="lg1" x1="0" y1="0" x2="1" y2="1">
                  <Stop offset="0" stopColor="#FF5A36" />
                  <Stop offset="1" stopColor="#FF8A64" />
                </LinearGradient>
                <LinearGradient id="lg2" x1="0" y1="0" x2="1" y2="1">
                  <Stop offset="0" stopColor="#24C789" />
                  <Stop offset="1" stopColor="#8AE676" />
                </LinearGradient>
                <LinearGradient id="lg3" x1="0" y1="0" x2="1" y2="1">
                  <Stop offset="0" stopColor="#00C2FF" />
                  <Stop offset="1" stopColor="#6AA8FF" />
                </LinearGradient>
              </Defs>
              <G>
                <Circle
                  cx="140" cy="140" r="120"
                  stroke="url(#lg1)" strokeWidth="14"
                  strokeLinecap="round" strokeDasharray="540 200" fill="none"
                />
                <Circle
                  cx="140" cy="140" r="96"
                  stroke="url(#lg2)" strokeWidth="14"
                  strokeLinecap="round" strokeDasharray="390 210" fill="none"
                  transform="rotate(120 140 140)"
                />
                <Circle
                  cx="140" cy="140" r="72"
                  stroke="url(#lg3)" strokeWidth="14"
                  strokeLinecap="round" strokeDasharray="260 190" fill="none"
                  transform="rotate(220 140 140)"
                />
              </G>
            </Svg>
          </Animated.View>
          <View style={styles.heroCenter} pointerEvents="none">
            <Ionicons name="footsteps" size={32} color="#0B0F13" />
          </View>
        </View>

        <View style={styles.textWrap}>
          <Text style={styles.eyebrow}>SIDERUN</Text>
          <Text style={styles.title}>Welcome back.</Text>
          <Text style={styles.sub}>
            Sign in to pick up your runs, goals, and crew.
          </Text>
        </View>

        <View style={styles.form}>
          <AuthField
            icon="call-outline"
            label="Phone number"
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
          />

          <AuthField
            icon="lock-closed-outline"
            label="Password"
            secure
            value={password}
            onChangeText={setPassword}
          />

          <View style={styles.optionsRow}>
            <TouchableOpacity
              style={styles.rememberRow}
              onPress={() => setRememberMe(!rememberMe)}
              activeOpacity={0.7}
            >
              <View style={[styles.checkbox, rememberMe && styles.checkboxOn]}>
                {rememberMe ? (
                  <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                ) : null}
              </View>
              <Text style={styles.rememberText}>Remember me</Text>
            </TouchableOpacity>

            <TouchableOpacity activeOpacity={0.6} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
              <Text style={styles.linkText}>Forgot?</Text>
            </TouchableOpacity>
          </View>

          <AuthButton
            label="Log in"
            loading={isLoading}
            onPress={handleLogin}
          />

          <View style={styles.footer}>
            <Text style={styles.footerText}>New to SideRun? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')} activeOpacity={0.6}>
              <Text style={styles.footerLink}>Create account</Text>
            </TouchableOpacity>
          </View>
        </View>
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
  root: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 28,
    paddingTop: 64,
    // Extra bottom padding on web so Safari's floating address bar never hides the sign-up link
    paddingBottom: Platform.OS === 'web' ? 120 : 48,
  },
  heroWrap: {
    alignSelf: 'center',
    width: 200,
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  heroCenter: {
    position: 'absolute',
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#F4F5F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrap: {
    alignItems: 'center',
    marginBottom: 36,
  },
  eyebrow: {
    ...T.eyebrow,
    marginBottom: 10,
  },
  title: {
    ...T.title1,
    textAlign: 'center',
  },
  sub: {
    ...T.bodyMuted,
    fontSize: 15,
    textAlign: 'center',
    marginTop: 8,
    maxWidth: 320,
  },
  form: {
    width: '100%',
  },
  optionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
    marginBottom: 24,
  },
  rememberRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#C9CCD1',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  checkboxOn: {
    backgroundColor: '#0B0F13',
    borderColor: '#0B0F13',
  },
  rememberText: {
    ...T.body,
    fontSize: 13,
    color: '#6B6F76',
  },
  linkText: {
    ...T.body,
    fontFamily: FONT.bold,
    fontSize: 13,
    color: '#0B0F13',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 28,
  },
  footerText: {
    ...T.bodyMuted,
    fontSize: 14,
  },
  footerLink: {
    ...T.body,
    fontFamily: FONT.bold,
    fontSize: 14,
    color: '#0B0F13',
  },
});

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Animated,
} from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop, G } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { supabase } from '../services/supabase';
import CustomAlert from '../components/CustomAlert';
import useUserStore from '../store/useUserStore';
import { T, FONT } from '../constants/typography';

export default function RegisterScreen({ navigation }) {
  const [phone, setPhone] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [focused, setFocused] = useState(null);
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

  const rotate = spin.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const showAlert = (title, message, type = 'error') => {
    setAlertConfig({ visible: true, title, message, type });
  };

  const passStrength = (() => {
    if (!password) return { level: 0, label: '' };
    let score = 0;
    if (password.length >= 6) score += 1;
    if (password.length >= 10) score += 1;
    if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 1;
    if (/\d/.test(password) && /[^A-Za-z0-9]/.test(password)) score += 1;
    const levels = ['Too short', 'Weak', 'Okay', 'Strong', 'Great'];
    return { level: score, label: levels[score] };
  })();

  const handleRegister = async () => {
    const trimmedPhone = phone.trim();
    const trimmedUsername = username.trim();

    if (!trimmedPhone || !trimmedUsername || !password) {
      showAlert('Missing info', 'Please fill in all three fields to create an account.');
      return;
    }
    if (password.length < 6) {
      showAlert('Weak password', 'Use at least 6 characters for your password.');
      return;
    }

    if (Platform.OS !== 'web') Haptics.selectionAsync();
    setIsLoading(true);
    try {
      const pseudoEmail = `${trimmedPhone}@siderun.app`;
      const { data, error } = await supabase.auth.signUp({
        email: pseudoEmail,
        password,
      });
      if (error) {
        setIsLoading(false);
        showAlert('Registration failed', error.message || 'Error from backend');
        return;
      }
      if (data.user) {
        const { error: insertError } = await supabase
          .from('users')
          .insert([
            {
              id: data.user.id,
              phone: trimmedPhone,
              username: trimmedUsername,
              weeklyDistance: 0,
              totalRuns: 0,
            },
          ]);
        if (insertError) {
          console.error('Database Insert Error:', insertError);
          setIsLoading(false);
          showAlert(
            'Database error',
            `Auth succeeded, but we couldn't save your profile: ${insertError.message}`
          );
          return;
        }
      }

      const currentUser = {
        phone: trimmedPhone,
        username: trimmedUsername,
        id: data?.user?.id,
      };
      await login(currentUser, true);
      setIsLoading(false);
    } catch (e) {
      showAlert('Error', 'An error occurred during registration');
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
        <View style={styles.topBar}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="chevron-back" size={22} color="#0B0F13" />
          </TouchableOpacity>
        </View>

        <View style={styles.heroWrap}>
          <Animated.View style={{ transform: [{ rotate }] }}>
            <Svg width={160} height={160} viewBox="0 0 280 280">
              <Defs>
                <LinearGradient id="rg1" x1="0" y1="0" x2="1" y2="1">
                  <Stop offset="0" stopColor="#24C789" />
                  <Stop offset="1" stopColor="#8AE676" />
                </LinearGradient>
                <LinearGradient id="rg2" x1="0" y1="0" x2="1" y2="1">
                  <Stop offset="0" stopColor="#FF5A36" />
                  <Stop offset="1" stopColor="#FF8A64" />
                </LinearGradient>
                <LinearGradient id="rg3" x1="0" y1="0" x2="1" y2="1">
                  <Stop offset="0" stopColor="#00C2FF" />
                  <Stop offset="1" stopColor="#6AA8FF" />
                </LinearGradient>
              </Defs>
              <G>
                <Circle
                  cx="140" cy="140" r="120"
                  stroke="url(#rg1)" strokeWidth="14"
                  strokeLinecap="round" strokeDasharray="540 200" fill="none"
                />
                <Circle
                  cx="140" cy="140" r="96"
                  stroke="url(#rg2)" strokeWidth="14"
                  strokeLinecap="round" strokeDasharray="390 210" fill="none"
                  transform="rotate(120 140 140)"
                />
                <Circle
                  cx="140" cy="140" r="72"
                  stroke="url(#rg3)" strokeWidth="14"
                  strokeLinecap="round" strokeDasharray="260 190" fill="none"
                  transform="rotate(220 140 140)"
                />
              </G>
            </Svg>
          </Animated.View>
          <View style={styles.heroCenter} pointerEvents="none">
            <Ionicons name="sparkles" size={26} color="#0B0F13" />
          </View>
        </View>

        <View style={styles.textWrap}>
          <Text style={styles.eyebrow}>JOIN SIDERUN</Text>
          <Text style={styles.title}>Create your{'\n'}running home.</Text>
          <Text style={styles.sub}>
            One account to share runs, cheer friends, and close your weekly goal.
          </Text>
        </View>

        <View style={styles.form}>
          <View style={[styles.field, focused === 'phone' && styles.fieldFocus]}>
            <Ionicons name="call-outline" size={18} color="#6B6F76" style={styles.fieldIcon} />
            <TextInput
              style={styles.input}
              placeholder="Phone number"
              placeholderTextColor="#A5A9B0"
              keyboardType="phone-pad"
              value={phone}
              onChangeText={setPhone}
              autoCapitalize="none"
              onFocus={() => setFocused('phone')}
              onBlur={() => setFocused(null)}
            />
          </View>

          <View style={[styles.field, focused === 'username' && styles.fieldFocus]}>
            <Ionicons name="person-outline" size={18} color="#6B6F76" style={styles.fieldIcon} />
            <TextInput
              style={styles.input}
              placeholder="Display name"
              placeholderTextColor="#A5A9B0"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              onFocus={() => setFocused('username')}
              onBlur={() => setFocused(null)}
            />
          </View>

          <View style={[styles.field, focused === 'password' && styles.fieldFocus]}>
            <Ionicons name="lock-closed-outline" size={18} color="#6B6F76" style={styles.fieldIcon} />
            <TextInput
              style={styles.input}
              placeholder="Create a password"
              placeholderTextColor="#A5A9B0"
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
              onFocus={() => setFocused('password')}
              onBlur={() => setFocused(null)}
            />
            <TouchableOpacity
              style={styles.eye}
              onPress={() => setShowPassword(!showPassword)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons
                name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                size={18}
                color="#6B6F76"
              />
            </TouchableOpacity>
          </View>

          {password.length > 0 ? (
            <View style={styles.strengthRow}>
              <View style={styles.strengthBars}>
                {[0, 1, 2, 3].map((i) => (
                  <View
                    key={i}
                    style={[
                      styles.strengthBar,
                      i < passStrength.level && styles.strengthBarOn,
                    ]}
                  />
                ))}
              </View>
              <Text style={styles.strengthLabel}>{passStrength.label}</Text>
            </View>
          ) : null}

          <Text style={styles.terms}>
            By continuing you agree to SideRun's Terms and acknowledge our Privacy
            Policy. We never share your runs without your permission.
          </Text>

          <TouchableOpacity
            style={[styles.primaryBtn, isLoading && styles.primaryBtnDisabled]}
            onPress={handleRegister}
            disabled={isLoading}
            activeOpacity={0.85}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Text style={styles.primaryBtnText}>Create account</Text>
                <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
              </>
            )}
          </TouchableOpacity>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')} activeOpacity={0.6}>
              <Text style={styles.footerLink}>Log in</Text>
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
    paddingTop: 56,
    paddingBottom: 48,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F4F5F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroWrap: {
    alignSelf: 'center',
    width: 160,
    height: 160,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  heroCenter: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F4F5F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrap: {
    alignItems: 'center',
    marginBottom: 28,
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
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F4F5F7',
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 56,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  fieldFocus: {
    borderColor: '#0B0F13',
    backgroundColor: '#FFFFFF',
  },
  fieldIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontFamily: FONT.semibold,
    fontSize: 15,
    color: '#0B0F13',
    paddingVertical: 0,
  },
  eye: {
    padding: 4,
    marginLeft: 8,
  },
  strengthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  strengthBars: {
    flexDirection: 'row',
    flex: 1,
    gap: 4,
  },
  strengthBar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#ECEEF1',
  },
  strengthBarOn: {
    backgroundColor: '#24C789',
  },
  strengthLabel: {
    ...T.caption,
    marginLeft: 12,
    minWidth: 60,
    textAlign: 'right',
  },
  terms: {
    ...T.caption,
    marginTop: 12,
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  primaryBtn: {
    flexDirection: 'row',
    backgroundColor: '#0B0F13',
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#0B0F13',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 22,
    elevation: 6,
  },
  primaryBtnDisabled: {
    opacity: 0.6,
  },
  primaryBtnText: {
    ...T.button,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
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

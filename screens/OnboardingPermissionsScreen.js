import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import * as Haptics from 'expo-haptics';
import { T, FONT } from '../constants/typography';

const STATUSES = {
  idle: { label: 'Enable', color: '#0B0F13', bg: '#FFFFFF', border: '#0B0F13' },
  granted: {
    label: 'Granted',
    color: '#1EA574',
    bg: 'rgba(36,199,137,0.15)',
    border: 'transparent',
  },
  denied: {
    label: 'Skipped',
    color: '#E07A3A',
    bg: 'rgba(224,122,58,0.15)',
    border: 'transparent',
  },
};

function PermissionRow({ icon, title, desc, status, onPress }) {
  const s = STATUSES[status] || STATUSES.idle;
  return (
    <View style={styles.row}>
      <View style={styles.rowIcon}>
        <Ionicons name={icon} size={22} color="#0B0F13" />
      </View>
      <View style={styles.rowBody}>
        <Text style={styles.rowTitle}>{title}</Text>
        <Text style={styles.rowDesc}>{desc}</Text>
      </View>
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={onPress}
        disabled={status === 'granted'}
        style={[
          styles.rowBtn,
          {
            backgroundColor: s.bg,
            borderColor: s.border,
            borderWidth: status === 'idle' ? 1.5 : 0,
          },
        ]}
      >
        <Text style={[styles.rowBtnText, { color: s.color }]}>{s.label}</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function OnboardingPermissionsScreen({ navigation }) {
  const [locationStatus, setLocationStatus] = useState('idle');
  const [notifStatus, setNotifStatus] = useState('idle');

  const requestLocation = async () => {
    try {
      if (Platform.OS !== 'web') {
        Haptics.selectionAsync();
      }
      const { status } = await Location.requestForegroundPermissionsAsync();
      setLocationStatus(status === 'granted' ? 'granted' : 'denied');
    } catch (e) {
      setLocationStatus('denied');
      Alert.alert('Permission error', 'Could not request location permission.');
    }
  };

  const requestNotifications = async () => {
    try {
      if (Platform.OS !== 'web') {
        Haptics.selectionAsync();
      }
      if (Platform.OS === 'web' && 'Notification' in window) {
        const r = await Notification.requestPermission();
        setNotifStatus(r === 'granted' ? 'granted' : 'denied');
        return;
      }
      // Native: defer to system-level settings; optimistically mark as granted.
      // (expo-notifications can be wired up later without changing onboarding UX.)
      setNotifStatus('granted');
    } catch (e) {
      setNotifStatus('denied');
    }
  };

  const canContinue = locationStatus !== 'idle';

  return (
    <View style={styles.root}>
      <TouchableOpacity
        onPress={() => navigation.goBack()}
        hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
        style={styles.back}
      >
        <Ionicons name="arrow-back" size={24} color="#0B0F13" />
      </TouchableOpacity>

      <View style={styles.topDots}>
        <View style={styles.dot} />
        <View style={[styles.dot, styles.dotActive]} />
        <View style={styles.dot} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.eyebrow}>STEP 2 OF 3</Text>
        <Text style={styles.title}>A few permissions{'\n'}to make runs magic.</Text>
        <Text style={styles.sub}>
          You can change these anytime in Settings. We only use what we need.
        </Text>

        <View style={styles.list}>
          <PermissionRow
            icon="navigate"
            title="Location"
            desc="Track your pace, route, and distance in real time."
            status={locationStatus}
            onPress={requestLocation}
          />
          <PermissionRow
            icon="notifications"
            title="Notifications"
            desc="Friends can cheer mid-run and you'll get goal reminders."
            status={notifStatus}
            onPress={requestNotifications}
          />
        </View>

        <View style={styles.privacyBox}>
          <Ionicons name="lock-closed" size={14} color="#6B6F76" />
          <Text style={styles.privacyText}>
            SideRun never sells your data. Live runs default to friends-only.
          </Text>
        </View>
      </ScrollView>

      <View style={styles.ctaWrap}>
        <TouchableOpacity
          activeOpacity={canContinue ? 0.85 : 1}
          onPress={() => {
            if (!canContinue) return;
            if (Platform.OS !== 'web') {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }
            navigation.navigate('OnboardingGoal');
          }}
          style={[
            styles.primaryBtn,
            { backgroundColor: canContinue ? '#0B0F13' : 'rgba(11,15,19,0.25)' },
          ]}
        >
          <Text style={styles.primaryBtnText}>Continue</Text>
          <Ionicons name="arrow-forward" size={18} color="#FFF" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
    paddingTop: 70,
    paddingBottom: 40,
  },
  back: {
    position: 'absolute',
    left: 20,
    top: 60,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  topDots: {
    flexDirection: 'row',
    gap: 6,
    alignSelf: 'center',
    marginBottom: 28,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(0,0,0,0.12)',
  },
  dotActive: {
    width: 24,
    backgroundColor: '#0B0F13',
  },
  content: {
    paddingBottom: 20,
  },
  eyebrow: {
    ...T.eyebrow,
    marginBottom: 10,
  },
  title: {
    ...T.title2,
  },
  sub: {
    ...T.bodyMuted,
    marginTop: 8,
  },
  list: {
    marginTop: 24,
    gap: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 20,
    backgroundColor: '#F4F5F7',
  },
  rowIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  rowBody: {
    flex: 1,
    paddingRight: 8,
  },
  rowTitle: {
    fontFamily: FONT.extraBold,
    fontSize: 15,
    color: '#0B0F13',
    letterSpacing: -0.2,
  },
  rowDesc: {
    ...T.caption,
    marginTop: 2,
  },
  rowBtn: {
    paddingHorizontal: 12,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 74,
  },
  rowBtnText: {
    fontFamily: FONT.extraBold,
    fontSize: 12,
    letterSpacing: 0.3,
  },
  privacyBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 20,
    paddingHorizontal: 4,
  },
  privacyText: {
    ...T.caption,
    flex: 1,
  },
  ctaWrap: {
    paddingTop: 16,
  },
  primaryBtn: {
    flexDirection: 'row',
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryBtnText: {
    ...T.button,
  },
});

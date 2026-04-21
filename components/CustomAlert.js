import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { T } from '../constants/typography';

const TYPE_MAP = {
  success: { icon: 'checkmark-circle', color: '#24C789' },
  error: { icon: 'alert-circle', color: '#FF5A36' },
  info: { icon: 'information-circle', color: '#00C2FF' },
};

export default function CustomAlert({ visible, title, message, onClose, type = 'error' }) {
  const scaleValue = useRef(new Animated.Value(0.92)).current;
  const opacityValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleValue, {
          toValue: 1,
          friction: 7,
          tension: 80,
          useNativeDriver: true,
        }),
        Animated.timing(opacityValue, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      scaleValue.setValue(0.92);
      opacityValue.setValue(0);
    }
  }, [visible]);

  const meta = TYPE_MAP[type] || TYPE_MAP.error;

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.alertBox,
            { transform: [{ scale: scaleValue }], opacity: opacityValue },
          ]}
        >
          <View style={[styles.iconHalo, { backgroundColor: `${meta.color}22` }]}>
            <Ionicons name={meta.icon} size={32} color={meta.color} />
          </View>
          <Text style={styles.title}>{title}</Text>
          {message ? <Text style={styles.message}>{message}</Text> : null}
          <TouchableOpacity
            style={styles.button}
            onPress={onClose}
            activeOpacity={0.85}
          >
            <Text style={styles.buttonText}>OK</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(11, 15, 19, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  alertBox: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingTop: 28,
    paddingBottom: 20,
    paddingHorizontal: 24,
    alignItems: 'center',
    shadowColor: '#0B0F13',
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.18,
    shadowRadius: 32,
    elevation: 10,
  },
  iconHalo: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  title: {
    ...T.title3,
    textAlign: 'center',
    marginBottom: 8,
  },
  message: {
    ...T.bodyMuted,
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 22,
    paddingHorizontal: 4,
  },
  button: {
    backgroundColor: '#0B0F13',
    height: 52,
    borderRadius: 26,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0B0F13',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 18,
    elevation: 4,
  },
  buttonText: {
    ...T.button,
    fontSize: 15,
  },
});

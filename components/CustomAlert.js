import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function CustomAlert({ visible, title, message, onClose, type = 'error' }) {
  const scaleValue = useRef(new Animated.Value(0.8)).current;
  const opacityValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleValue, {
          toValue: 1,
          friction: 6,
          tension: 8,
          useNativeDriver: true,
        }),
        Animated.timing(opacityValue, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      scaleValue.setValue(0.8);
      opacityValue.setValue(0);
    }
  }, [visible]);

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Animated.View style={[styles.alertBox, { transform: [{ scale: scaleValue }], opacity: opacityValue }]}>
          <View style={styles.iconContainer}>
            <Ionicons
              name={type === 'success' ? 'checkmark-circle' : 'alert-circle'}
              size={56}
              color={type === 'success' ? '#24C789' : '#FF4B4B'}
            />
          </View>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          <TouchableOpacity style={[styles.button, type === 'success' && styles.successButton]} onPress={onClose}>
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
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  alertBox: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 30,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 30,
    elevation: 10,
  },
  iconContainer: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: '#111111',
    marginBottom: 12,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  message: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 28,
    lineHeight: 24,
  },
  button: {
    backgroundColor: '#FF4B4B',
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 30,
    width: '100%',
  },
  successButton: {
    backgroundColor: '#24C789',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    letterSpacing: 1,
  },
});

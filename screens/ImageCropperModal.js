import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';

export default function ImageCropperModal({ visible, onCancel, onSave }) {
  // On Native, ImagePicker's built-in `allowsEditing` feature already opens a crop view natively,
  // thus this modal is simply a null op to prevent crashes.
  return null;
}

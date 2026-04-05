import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import AvatarEditor from 'react-avatar-editor';

export default function ImageCropperModal({ visible, imageUri, onCancel, onSave }) {
  const editorRef = useRef(null);
  const [scale, setScale] = useState(1);

  const handleSave = () => {
    if (editorRef.current) {
      const canvasScaled = editorRef.current.getImageScaledToCanvas();
      const base64Image = canvasScaled.toDataURL('image/jpeg');
      onSave(base64Image);
    }
  };

  return (
    <Modal visible={visible} transparent={true} animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={styles.cropperContainer}>
          <Text style={styles.title}>Crop Your Avatar</Text>
          
          {imageUri ? (
            <View style={styles.editorWrapper}>
              <AvatarEditor
                ref={editorRef}
                image={imageUri}
                width={200}
                height={200}
                border={30}
                borderRadius={100}
                color={[0, 0, 0, 0.6]}
                scale={scale}
                rotate={0}
              />
            </View>
          ) : null}

          <View style={styles.sliderContainer}>
            <Text style={styles.label}>Zoom</Text>
            <input
              type="range"
              min="1"
              max="3"
              step="0.01"
              value={scale}
              onChange={(e) => setScale(parseFloat(e.target.value))}
              style={{ width: '100%' }}
            />
          </View>

          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              <Text style={styles.saveButtonText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cropperContainer: {
    backgroundColor: '#FFF',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    width: '90%',
    maxWidth: 400,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  editorWrapper: {
    alignItems: 'center',
    marginBottom: 20,
  },
  sliderContainer: {
    width: '100%',
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    textAlign: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  cancelButton: {
    padding: 12,
    flex: 1,
    marginRight: 10,
    backgroundColor: '#EAEAEA',
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#333',
    fontWeight: 'bold',
  },
  saveButton: {
    padding: 12,
    flex: 1,
    marginLeft: 10,
    backgroundColor: '#24C789',
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
  },
});

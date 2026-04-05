import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

export default function ProfileScreen({ navigation, handleLogout }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [username, setUsername] = useState('');
  const [avatar, setAvatar] = useState('👤');
  const [isEditing, setIsEditing] = useState(false);

  const avatars = ['👤', '🏃‍♂️', '🏃‍♀️', '😎', '🌟', '🦄', '🐶', '🦊'];

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
      base64: true, // Request base64 data for persistence
    });

    if (!result.canceled) {
      if (result.assets[0].base64) {
        // Build data URI for permanent storage, particularly important for Web fallback
        setAvatar(`data:image/jpeg;base64,${result.assets[0].base64}`);
      } else {
        setAvatar(result.assets[0].uri);
      }
    }
  };

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      const userString = await AsyncStorage.getItem('currentUser');
      if (userString) {
        const user = JSON.parse(userString);
        setCurrentUser(user);
        setUsername(user.username || '');
        setAvatar(user.avatar || '👤');
      }
    } catch (e) {
      console.error('Failed to load user profile', e);
    }
  };

  const handleSaveProfile = async () => {
    if (!username.trim()) {
      Alert.alert('Error', 'Username cannot be empty');
      return;
    }

    try {
      const userString = await AsyncStorage.getItem('currentUser');
      const user = userString ? JSON.parse(userString) : {};
      
      const updatedUser = { ...user, username, avatar };
      await AsyncStorage.setItem('currentUser', JSON.stringify(updatedUser));
      
      // Update in the central users DB so friend search also sees the updated name/avatar
      const usersData = await AsyncStorage.getItem('users');
      if (usersData) {
        const users = JSON.parse(usersData);
        if (updatedUser.phone && users[updatedUser.phone]) {
          users[updatedUser.phone].username = username;
          users[updatedUser.phone].avatar = avatar;
          await AsyncStorage.setItem('users', JSON.stringify(users));
        }
      }

      setCurrentUser(updatedUser);
      setIsEditing(false);
      Alert.alert('Success', 'Profile updated successfully!');
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Failed to update profile');
    }
  };

  const onLogoutPress = async () => {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out',
        style: 'destructive',
        onPress: () => {
          if (handleLogout) {
            handleLogout();
          } else {
            AsyncStorage.removeItem('currentUser').then(() => {
              Alert.alert('Logged Out', 'Please restart the app to return to the login screen.');
            });
          }
        }
      }
    ]);
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
          >
            <Ionicons name="arrow-back" size={28} color="#111111" />
          </TouchableOpacity>
          <Text style={styles.title}>Personal Settings</Text>
        </View>

        <View style={styles.profileCard}>
          <View style={styles.avatarSection}>
            {avatar && (avatar.startsWith('file:') || avatar.startsWith('http') || avatar.startsWith('data:')) ? (
              <Image source={{ uri: avatar }} style={styles.largeAvatarImage} />
            ) : (
              <Text style={styles.largeAvatar}>{avatar}</Text>
            )}
            
            {isEditing && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.avatarSelector}>
                {/* Image upload button */}
                <TouchableOpacity
                  style={styles.avatarOption}
                  onPress={pickImage}
                >
                  <Ionicons name="camera" size={24} color="#666" />
                </TouchableOpacity>
                
                {avatars.map((emoji, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[styles.avatarOption, avatar === emoji && styles.avatarOptionSelected]}
                    onPress={() => setAvatar(emoji)}
                  >
                    <Text style={styles.avatarOptionText}>{emoji}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>

          <View style={styles.infoSection}>
            <Text style={styles.label}>Nickname / Username</Text>
            {isEditing ? (
              <TextInput
                style={styles.input}
                value={username}
                onChangeText={setUsername}
                placeholder="Enter your nickname"
              />
            ) : (
               <Text style={styles.valueText}>{username || 'Not set'}</Text>
            )}

            <Text style={styles.label}>Phone Number</Text>
            <Text style={styles.valueTextDisabled}>{currentUser?.phone || 'Unknown'}</Text>
          </View>

          <View style={styles.actionButtons}>
            {isEditing ? (
              <>
                <TouchableOpacity style={styles.saveButton} onPress={handleSaveProfile}>
                  <Text style={styles.buttonText}>Save Changes</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.cancelButton} onPress={() => {
                  setIsEditing(false);
                  setUsername(currentUser?.username || '');
                  setAvatar(currentUser?.avatar || '👤');
                }}>
                  <Text style={styles.buttonTextDark}>Cancel</Text>
                </TouchableOpacity>
              </>
            ) : (
               <TouchableOpacity style={styles.editButton} onPress={() => setIsEditing(true)}>
                 <Text style={styles.buttonText}>Edit Profile</Text>
               </TouchableOpacity>
            )}
          </View>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={onLogoutPress}>
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F5F7',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 20,
    marginTop: 10,
    position: 'relative',
    alignItems: 'center',
    paddingTop: 10,
  },
  backButton: {
    position: 'absolute',
    left: 0,
    top: 10,
    zIndex: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#222222',
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  largeAvatar: {
    fontSize: 72,
    marginBottom: 10,
  },
  largeAvatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 10,
  },
  avatarSelector: {
    flexDirection: 'row',
    marginTop: 10,
    paddingVertical: 10,
  },
  avatarOption: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 5,
  },
  avatarOptionSelected: {
    backgroundColor: '#24C789',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  avatarOptionText: {
    fontSize: 24,
  },
  infoSection: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    color: '#888888',
    marginBottom: 8,
    fontWeight: '600',
  },
  input: {
    backgroundColor: '#F4F5F7',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    color: '#222222',
    marginBottom: 15,
  },
  valueText: {
    fontSize: 18,
    color: '#222',
    fontWeight: '500',
    marginBottom: 20,
    paddingVertical: 5,
  },
  valueTextDisabled: {
    fontSize: 18,
    color: '#999',
    fontWeight: '500',
    marginBottom: 20,
    paddingVertical: 5,
  },
  actionButtons: {
    marginTop: 10,
  },
  editButton: {
    backgroundColor: '#24C789',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  saveButton: {
    backgroundColor: '#24C789',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 10,
  },
  cancelButton: {
    backgroundColor: '#EAEAEA',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  buttonTextDark: {
    color: '#444444',
    fontSize: 16,
    fontWeight: 'bold',
  },
  logoutButton: {
    marginTop: 30,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FF3B30',
  },
  logoutText: {
    color: '#FF3B30',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
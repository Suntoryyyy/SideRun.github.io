import React, { useState, useEffect } from "react";
import { Image } from 'expo-image';
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
  Switch,
} from "react-native";
import useUserStore from '../store/useUserStore';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { supabase } from "../services/supabase";
import ImageCropperModal from "./ImageCropperModal";
import CustomAlert from '../components/CustomAlert';
import NativeFilePicker from "./NativeFilePicker";
import { T, FONT } from "../constants/typography";

const isPhoto = (src) =>
  typeof src === "string" &&
  (src.startsWith("file:") || src.startsWith("http") || src.startsWith("data:"));

const initials = (name) =>
  (name || "?").trim().charAt(0).toUpperCase();

export default function ProfileScreen({ navigation, handleLogout }) {
  const currentUser = useUserStore((s) => s.user);
  const updateProfile = useUserStore((s) => s.updateProfile);
  const [username, setUsername] = useState("");
  const [avatar, setAvatar] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [allowFriendsViewRecord, setAllowFriendsViewRecord] = useState(true);
  const [allowStrangersAdd, setAllowStrangersAdd] = useState(false);
  const [alertConfig, setAlertConfig] = useState({ visible: false, title: "", message: "", type: "error" });
  const [cropModalVisible, setCropModalVisible] = useState(false);
  const [rawImageUri, setRawImageUri] = useState(null);

  const showAlert = (title, message, type = "error") =>
    setAlertConfig({ visible: true, title, message, type });

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: Platform.OS !== "web",
        aspect: [1, 1],
        quality: 0.3,
        base64: true,
      });
      if (!result.canceled) {
        if (Platform.OS === 'web') {
          setRawImageUri(result.assets[0].uri);
          setCropModalVisible(true);
        } else {
          if (result.assets[0].base64) {
            const b64 = result.assets[0].base64;
            const mime = result.assets[0].mimeType || "image/jpeg";
            setAvatar(`data:${mime};base64,${b64}`);
          } else {
            setAvatar(result.assets[0].uri);
          }
        }
      }
    } catch (e) {
      console.warn("Image Picker Error:", e);
    }
  };

  const handleWebCropSave = (b64) => { setAvatar(b64); setCropModalVisible(false); setRawImageUri(null); };
  const handleWebCropCancel = () => { setCropModalVisible(false); setRawImageUri(null); };

  useEffect(() => { loadUserProfile(); }, []);

  const loadUserProfile = async () => {
    try {
      const userString = await AsyncStorage.getItem("currentUser");
      if (userString) {
        const user = JSON.parse(userString);
        if (!user.phone || !user.id) {
          const { data: sessionData } = await supabase.auth.getSession();
          if (sessionData?.session?.user) {
            const su = sessionData.session.user;
            if (su.email?.endsWith('@siderun.app') && !user.phone)
              user.phone = su.email.replace('@siderun.app', '');
            if (!user.id) user.id = su.id;
            if (Platform.OS === "web") sessionStorage.setItem("currentUser", JSON.stringify(user));
            await AsyncStorage.setItem("currentUser", JSON.stringify(user));
          }
        }
        updateProfile(user);
        setUsername(user.username || "");
        setAvatar(user.avatar || "");
        setAllowFriendsViewRecord(user.allowFriendsViewRecord !== false);
        setAllowStrangersAdd(user.allowStrangersAdd === true);
      }
    } catch (e) {
      console.error("Failed to load user profile", e);
    }
  };

  const handleSaveProfile = async () => {
    try {
      if (!username?.trim()) { showAlert("Error", "Username cannot be empty"); return; }
      const userString = await AsyncStorage.getItem("currentUser");
      const user = userString ? JSON.parse(userString) : {};
      const updatedUser = { ...user, username, avatar, allowFriendsViewRecord, allowStrangersAdd };
      if (Platform.OS === "web") sessionStorage.setItem("currentUser", JSON.stringify(updatedUser));
      await AsyncStorage.setItem("currentUser", JSON.stringify(updatedUser));
      if (updatedUser.id) {
        const { error } = await supabase.from("users")
          .update({ username, avatar, allowFriendsViewRecord, allowStrangersAdd })
          .eq("id", updatedUser.id);
        if (error) {
          if (error.message.includes("does not exist")) {
            const { error: fe } = await supabase.from("users")
              .update({ username, avatar }).eq("id", updatedUser.id);
            if (fe) { showAlert("Cloud Sync Error", fe.message); return; }
            showAlert("Partial Success", "Profile saved (privacy columns missing in DB).", "info");
            updateProfile(updatedUser); setIsEditing(false); return;
          }
          showAlert("Cloud Sync Error", error.message); return;
        }
      }
      updateProfile(updatedUser);
      setIsEditing(false);
      showAlert("Saved", "Profile updated.", "success");
    } catch (e) {
      showAlert("Error", "Failed to update profile");
    }
  };

  const onLogoutPress = async () => {
    if (Platform.OS === "web") {
      if (window.confirm("Log out of SideRun?")) {
        if (handleLogout) handleLogout();
        else AsyncStorage.removeItem("currentUser").then(() => window.location.reload());
      }
      return;
    }
    Alert.alert("Log Out", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      { text: "Log Out", style: "destructive", onPress: () => {
        if (handleLogout) handleLogout();
        else AsyncStorage.removeItem("currentUser");
      }},
    ]);
  };

  const phone = currentUser?.phone || "";

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.root}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ── */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Ionicons name="chevron-back" size={22} color="#0B0F13" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Settings</Text>
          <View style={styles.headerRight} />
        </View>

        {/* ── Avatar ── */}
        <View style={styles.avatarSection}>
          <TouchableOpacity
            style={styles.avatarWrap}
            onPress={isEditing ? pickImage : undefined}
            activeOpacity={isEditing ? 0.8 : 1}
          >
            {isPhoto(avatar) ? (
              <Image source={{ uri: avatar }} style={styles.avatarImg} />
            ) : (
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarInitial}>{initials(username)}</Text>
              </View>
            )}
            {isEditing && (
              <View style={styles.avatarEditBadge}>
                <Ionicons name="camera" size={14} color="#FFFFFF" />
              </View>
            )}
          </TouchableOpacity>
          <Text style={styles.avatarName}>{username || "Runner"}</Text>
          <Text style={styles.avatarPhone}>{phone}</Text>
        </View>

        {/* ── Profile info card ── */}
        <View style={styles.card}>
          <Text style={styles.cardSection}>ACCOUNT</Text>

          <View style={styles.row}>
            <Text style={styles.rowLabel}>Username</Text>
            {isEditing ? (
              <TextInput
                style={styles.rowInput}
                value={username}
                onChangeText={setUsername}
                placeholder="Your name"
                placeholderTextColor="#A5A9B0"
              />
            ) : (
              <Text style={styles.rowValue}>{username || "Not set"}</Text>
            )}
          </View>

          <View style={[styles.row, styles.rowLast]}>
            <Text style={styles.rowLabel}>Phone</Text>
            <Text style={[styles.rowValue, styles.rowValueMuted]}>{phone || "—"}</Text>
          </View>
        </View>

        {/* ── Privacy card ── */}
        <View style={styles.card}>
          <Text style={styles.cardSection}>PRIVACY</Text>

          <View style={styles.switchRow}>
            <View style={styles.switchText}>
              <Text style={styles.switchTitle}>Share Running Records</Text>
              <Text style={styles.switchDesc}>Friends can view your run history</Text>
            </View>
            <Switch
              value={allowFriendsViewRecord}
              onValueChange={setAllowFriendsViewRecord}
              trackColor={{ false: "#E5E7EB", true: "#0B0F13" }}
              thumbColor="#FFFFFF"
              disabled={!isEditing}
            />
          </View>

          <View style={[styles.switchRow, styles.rowLast]}>
            <View style={styles.switchText}>
              <Text style={styles.switchTitle}>Allow Strangers to Add</Text>
              <Text style={styles.switchDesc}>Others can send you friend requests</Text>
            </View>
            <Switch
              value={allowStrangersAdd}
              onValueChange={setAllowStrangersAdd}
              trackColor={{ false: "#E5E7EB", true: "#0B0F13" }}
              thumbColor="#FFFFFF"
              disabled={!isEditing}
            />
          </View>
        </View>

        {/* ── Action buttons ── */}
        {isEditing ? (
          <View style={styles.actions}>
            <TouchableOpacity style={styles.btnPrimary} onPress={handleSaveProfile}>
              <Text style={styles.btnPrimaryText}>Save Changes</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.btnSecondary}
              onPress={() => {
                setIsEditing(false);
                setUsername(currentUser?.username || "");
                setAvatar(currentUser?.avatar || "");
              }}
            >
              <Text style={styles.btnSecondaryText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.actions}>
            <TouchableOpacity style={styles.btnPrimary} onPress={() => setIsEditing(true)}>
              <Text style={styles.btnPrimaryText}>Edit Profile</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── Log out ── */}
        <TouchableOpacity style={styles.logoutBtn} onPress={onLogoutPress}>
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
      </ScrollView>

      <CustomAlert
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        onClose={() => setAlertConfig({ ...alertConfig, visible: false })}
      />

      {Platform.OS === "web" && (
        <ImageCropperModal
          visible={cropModalVisible}
          imageUri={rawImageUri}
          onSave={handleWebCropSave}
          onCancel={handleWebCropCancel}
        />
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#F7F8FA",
  },
  scroll: {
    paddingBottom: Platform.OS === 'web' ? 120 : 60,
  },

  /* header */
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "ios" ? 60 : 40,
    paddingBottom: 16,
    backgroundColor: "#FFFFFF",
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F4F5F7",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontFamily: FONT.bold,
    fontSize: 17,
    color: "#0B0F13",
    letterSpacing: -0.3,
  },
  headerRight: { width: 40 },

  /* avatar */
  avatarSection: {
    alignItems: "center",
    paddingVertical: 28,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(11,15,19,0.06)",
    marginBottom: 20,
  },
  avatarWrap: {
    position: "relative",
    marginBottom: 12,
  },
  avatarCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: "#0B0F13",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarInitial: {
    fontFamily: FONT.extraBold,
    fontSize: 34,
    color: "#FFFFFF",
    lineHeight: 40,
  },
  avatarImg: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: "#F4F5F7",
  },
  avatarEditBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#24C789",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  avatarName: {
    fontFamily: FONT.extraBold,
    fontSize: 20,
    color: "#0B0F13",
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  avatarPhone: {
    ...T.bodyMuted,
    fontSize: 13,
  },

  /* cards */
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    marginHorizontal: 20,
    marginBottom: 12,
    paddingHorizontal: 20,
    paddingTop: 6,
    shadowColor: "#0B0F13",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
  },
  cardSection: {
    ...T.eyebrow,
    paddingTop: 16,
    paddingBottom: 10,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: "rgba(11,15,19,0.05)",
  },
  rowLast: {
    marginBottom: 8,
  },
  rowLabel: {
    fontFamily: FONT.semibold,
    fontSize: 15,
    color: "#0B0F13",
  },
  rowValue: {
    fontFamily: FONT.semibold,
    fontSize: 15,
    color: "#0B0F13",
  },
  rowValueMuted: {
    color: "#9AA0A6",
  },
  rowInput: {
    fontFamily: FONT.semibold,
    fontSize: 15,
    color: "#0B0F13",
    textAlign: "right",
    flex: 1,
    marginLeft: 12,
  },

  /* switch rows */
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: "rgba(11,15,19,0.05)",
  },
  switchText: {
    flex: 1,
    paddingRight: 16,
  },
  switchTitle: {
    fontFamily: FONT.semibold,
    fontSize: 15,
    color: "#0B0F13",
    marginBottom: 2,
  },
  switchDesc: {
    ...T.caption,
    color: "#9AA0A6",
  },

  /* action buttons */
  actions: {
    marginHorizontal: 20,
    marginTop: 8,
    marginBottom: 12,
    gap: 10,
  },
  btnPrimary: {
    backgroundColor: "#0B0F13",
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#0B0F13",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 18,
    elevation: 6,
  },
  btnPrimaryText: {
    ...T.button,
  },
  btnSecondary: {
    backgroundColor: "#F4F5F7",
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  btnSecondaryText: {
    ...T.button,
    color: "#0B0F13",
  },

  /* log out */
  logoutBtn: {
    marginHorizontal: 20,
    marginTop: 8,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,59,48,0.3)",
    backgroundColor: "rgba(255,59,48,0.04)",
  },
  logoutText: {
    fontFamily: FONT.bold,
    fontSize: 15,
    color: "#FF3B30",
  },
});

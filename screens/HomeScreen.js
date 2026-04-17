import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ScrollView,
  Dimensions,
  Image,
  Animated,
  Platform,
} from "react-native";
import useUserStore from '../store/useUserStore';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "../services/supabase";
import { useIsFocused } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { BlurView } from "expo-blur";
import * as Location from "expo-location";
import MapStyle from "./MapStyle.json";

let MapView, PROVIDER_GOOGLE;
if (Platform.OS !== "web") {
  const Maps = require("react-native-maps");
  MapView = Maps.default;
  PROVIDER_GOOGLE = Maps.PROVIDER_GOOGLE;
}

const { width } = Dimensions.get("window");

export default function HomeScreen({ navigation }) {
  const isFocused = useIsFocused();
  const startButtonScale = useRef(new Animated.Value(1)).current;
  const [username, setUsername] = useState("Runner");
  const [avatar, setAvatar] = useState("");
  const [region, setRegion] = useState({
    latitude: 37.7749,
    longitude: -122.4194,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  });

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return;
      let location = await Location.getCurrentPositionAsync({});
      setRegion({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      });
    })();
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };

  useEffect(() => {
    if (isFocused) {
      loadUserData();
    }
  }, [isFocused]);

  const loadUserData = async () => {
    try {
      const cStr = await AsyncStorage.getItem("currentUser");
      if (cStr) {
        const c = JSON.parse(cStr);
        if (c.username) setUsername(c.username);
        if (c.avatar) setAvatar(c.avatar);

        // Fetch up to date from DB just in case
        if (c.id) {
          const { data } = await supabase
            .from("users")
            .select("username, avatar")
            .eq("id", c.id)
            .single();
          if (data) {
            if (data.username) setUsername(data.username);
            if (data.avatar) setAvatar(data.avatar);
          }
        }
      }
    } catch (e) {
      console.log("Error loading user data:", e);
    }
  };

  const handlePressIn = () => {
    Animated.spring(startButtonScale, {
      toValue: 0.92,
      useNativeDriver: true,
      speed: 20,
      bounciness: 10,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(startButtonScale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 20,
      bounciness: 10,
    }).start();
  };

  return (
    <View style={styles.container}>
      {/* Background Live Map */}
      {Platform.OS === "web" ? (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: -1,
          }}
        >
          <iframe
            width="100%"
            height="100%"
            frameBorder="0"
            scrolling="no"
            src={`https://www.openstreetmap.org/export/embed.html?bbox=${region.longitude - 0.025},${region.latitude - 0.025},${region.longitude + 0.025},${region.latitude + 0.025}&layer=mapnik`}
            style={{ border: "none", filter: "brightness(0.9) grayscale(0.8)" }}
          />
        </div>
      ) : (
        MapView && (
          <MapView
            style={StyleSheet.absoluteFillObject}
            provider={PROVIDER_GOOGLE}
            region={region}
            customMapStyle={MapStyle}
            showsUserLocation={false}
            pitchEnabled={false}
            rotateEnabled={false}
            scrollEnabled={false}
            zoomEnabled={false}
          />
        )
      )}

      {/* Main Content Overlay */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Dribbble-Style Greeting Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.menuButton}
            onPress={() => navigation.openDrawer()}
          >
            <BlurView intensity={60} tint="light" style={styles.iconCircle}>
              <Ionicons name="menu" size={24} color="#111" />
            </BlurView>
          </TouchableOpacity>
          <View style={styles.headerTop}>
            <View style={styles.greetingContainer}>
              <Text style={styles.greeting}>{getGreeting()}</Text>
              <Text style={styles.userName}>{username}</Text>
            </View>
            <View style={styles.userInfoContainer}>
              {avatar &&
              (avatar.startsWith("file:") ||
                avatar.startsWith("http") ||
                avatar.startsWith("data:")) ? (
                <Image
                  source={{ uri: avatar }}
                  style={styles.homeAvatarImage}
                />
              ) : (
                <BlurView intensity={60} tint="light" style={styles.iconCircle}>
                  <Ionicons name="person" size={24} color="#111" />
                </BlurView>
              )}
            </View>
          </View>
        </View>

        {/* Weekly Stats Card - Glassmorphism */}
        <BlurView intensity={75} tint="light" style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>This Week's Activity</Text>
            <Ionicons name="stats-chart" size={20} color="#24C789" />
          </View>
          <View style={styles.statsRow}>
            <View style={styles.statWrap}>
              <Text style={styles.statValue}>12.4</Text>
              <Text style={styles.statLabel}>Kilometers</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.statWrap}>
              <Text style={styles.statValue}>3</Text>
              <Text style={styles.statLabel}>Runs</Text>
            </View>
          </View>

          <View style={styles.progressContainer}>
            <View style={styles.progressTextRow}>
              <Text style={styles.progressTextLabel}>Weekly Goal: 20 km</Text>
              <Text style={styles.progressPercent}>62%</Text>
            </View>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: "62%" }]} />
            </View>
          </View>
        </BlurView>

        {/* Live Weather Preview */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            navigation.navigate("Weather");
          }}
        >
          <BlurView intensity={75} tint="light" style={styles.weatherCard}>
            <View style={styles.weatherIconContainer}>
              <Ionicons name="partly-sunny" size={32} color="#24C789" />
            </View>
            <View style={styles.weatherMeta}>
              <Text style={styles.weatherTemp}>18°C · Perfect Conditions</Text>
              <Text style={styles.weatherDesc}>
                Low wind, great time for a run
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#555" />
          </BlurView>
        </TouchableOpacity>

        {/* Recent Run - Mini Card */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Run</Text>
          <TouchableOpacity>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity activeOpacity={0.8}>
          <BlurView intensity={80} tint="light" style={styles.recentRunCard}>
            <View style={styles.runIconBg}>
              <Ionicons name="location" size={20} color="#FFF" />
            </View>
            <View style={styles.runInfo}>
              <Text style={styles.runTitle}>Evening Jog</Text>
              <Text style={styles.runDate}>Yesterday, 18:45</Text>
            </View>
            <View style={styles.runStats}>
              <Text style={styles.runDistance}>7.1 km</Text>
              <Text style={styles.runTime}>41:02</Text>
            </View>
          </BlurView>
        </TouchableOpacity>
      </ScrollView>

      {/* Floating Big Start Button Component */}
      <View style={styles.startActionContainer}>
        <TouchableWithoutFeedback
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            navigation.navigate("Run");
          }}
        >
          <Animated.View
            style={[
              styles.startActionBtn,
              { transform: [{ scale: startButtonScale }] },
            ]}
          >
            <Ionicons
              name="play"
              size={32}
              color="#FFF"
              style={styles.playIcon}
            />
            <Text style={styles.startActionText}>START RUN</Text>
          </Animated.View>
        </TouchableWithoutFeedback>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#EAEAEA",
  },
  scrollContent: {
    padding: 24,
    paddingTop: Platform.OS === "ios" ? 60 : 40,
    paddingBottom: 140,
  },
  header: {
    marginBottom: 32,
    marginTop: 10,
  },
  menuButton: {
    marginBottom: 20,
    alignSelf: "flex-start",
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    backgroundColor: "rgba(255, 255, 255, 0.4)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.8)",
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  greetingContainer: {
    flex: 1,
  },
  greeting: {
    fontSize: 16,
    color: "#444",
    marginBottom: 4,
    fontWeight: "600",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  userName: {
    fontSize: 32,
    fontWeight: "900",
    color: "#111",
    letterSpacing: -1,
  },
  userInfoContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  homeAvatarImage: {
    width: 54,
    height: 54,
    borderRadius: 27,
    borderWidth: 2,
    borderColor: "#24C789",
  },
  card: {
    borderRadius: 28,
    padding: 24,
    marginBottom: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.9)",
    backgroundColor: "rgba(255, 255, 255, 0.65)",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#111",
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    marginBottom: 24,
  },
  statWrap: {
    alignItems: "center",
  },
  statValue: {
    fontSize: 42,
    fontWeight: "900",
    color: "#111",
    letterSpacing: -1,
  },
  statLabel: {
    fontSize: 14,
    color: "#555",
    fontWeight: "600",
    marginTop: 4,
  },
  divider: {
    width: 1,
    height: 40,
    backgroundColor: "rgba(0,0,0,0.1)",
  },
  progressContainer: {
    marginTop: 10,
  },
  progressTextRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  progressTextLabel: {
    fontSize: 13,
    color: "#555",
    fontWeight: "600",
  },
  progressPercent: {
    fontSize: 13,
    color: "#24C789",
    fontWeight: "800",
  },
  progressBarBg: {
    height: 8,
    backgroundColor: "rgba(0,0,0,0.06)",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: "#24C789",
    borderRadius: 4,
  },
  weatherCard: {
    borderRadius: 24,
    padding: 20,
    marginBottom: 32,
    flexDirection: "row",
    alignItems: "center",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.9)",
    backgroundColor: "rgba(255, 255, 255, 0.65)",
  },
  weatherIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "rgba(36, 199, 137, 0.15)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  weatherMeta: {
    flex: 1,
  },
  weatherTemp: {
    fontSize: 15,
    fontWeight: "800",
    color: "#111",
    marginBottom: 4,
  },
  weatherDesc: {
    fontSize: 13,
    color: "#666",
    fontWeight: "500",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: "#111",
    letterSpacing: -0.5,
  },
  seeAllText: {
    fontSize: 14,
    color: "#24C789",
    fontWeight: "700",
    marginBottom: 4,
  },
  recentRunCard: {
    borderRadius: 24,
    padding: 20,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.9)",
    backgroundColor: "rgba(255, 255, 255, 0.75)",
    overflow: "hidden",
  },
  runIconBg: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#111",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  runInfo: {
    flex: 1,
  },
  runTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#111",
    marginBottom: 4,
  },
  runDate: {
    fontSize: 13,
    color: "#666",
    fontWeight: "500",
  },
  runStats: {
    alignItems: "flex-end",
  },
  runDistance: {
    fontSize: 16,
    fontWeight: "900",
    color: "#24C789",
    marginBottom: 4,
  },
  runTime: {
    fontSize: 13,
    color: "#666",
    fontWeight: "600",
  },
  startActionContainer: {
    position: "absolute",
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: "center",
    paddingHorizontal: 20,
  },
  startActionBtn: {
    backgroundColor: "#24C789",
    width: "100%",
    height: 64,
    borderRadius: 32,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#24C789",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  playIcon: {
    marginRight: 8,
  },
  startActionText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: 1,
  },
});

import React, { useState, useEffect } from "react";
import { Image } from "expo-image";
import BouncyButton from "../components/BouncyButton";
import {
  View,
  Text,
  ScrollView,
  Alert,
  TextInput,
  Modal,
  Animated,
  StyleSheet,
  TouchableWithoutFeedback,
} from "react-native";
import styles from "../styles/FriendsScreenStyles";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../services/supabase";
import ActivityFeed from "../components/ActivityFeed";
import CustomAlert from "../components/CustomAlert";
import Leaderboard from "../components/Leaderboard";
import EmptyState from "../components/EmptyState";
import useDemoMode, { DEMO_MODE_KEY } from "../hooks/useDemoMode";
import { DEMO_FRIENDS } from "../hooks/useDemoSocial";
import useMapVisibilityStore from "../store/useMapVisibilityStore";
import FadeInView from "../components/FadeInView";
import PrefToggleRow from "../components/PrefToggleRow";

const isImageAvatar = (a) =>
  typeof a === "string" &&
  (a.startsWith("file:") || a.startsWith("http") || a.startsWith("data:"));
const avatarInitial = (name) =>
  (name || "?").trim().charAt(0).toUpperCase() || "?";

const PREF = StyleSheet.create({
  section: {
    marginTop: 18,
    marginBottom: 20,
    alignSelf: 'stretch',
    width: '100%',
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.2,
    color: "#9AA0A6",
    marginBottom: 8,
    marginLeft: 4,
  },
  group: {
    backgroundColor: "#F4F5F7",
    borderRadius: 16,
    paddingHorizontal: 14,
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(11,15,19,0.06)",
    marginLeft: 46,
  },
});

export default function FriendsScreen({ navigation }) {
  const { isDemoMode } = useDemoMode();
  // Map visibility — shared with the Run map so toggling here updates the
  // markers live, and hiding a marker on the map flips the switch here.
  const mapVisibility = useMapVisibilityStore((s) => s.visibility);
  const setMapVisible = useMapVisibilityStore((s) => s.setVisible);
  const hydrateMapVisibility = useMapVisibilityStore((s) => s.hydrate);
  useEffect(() => { hydrateMapVisibility(); }, [hydrateMapVisibility]);
  const [friends, setFriends] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [feed, setFeed] = useState([]);
  const [addFriendMode, setAddFriendMode] = useState(false);
  const [newFriendName, setNewFriendName] = useState("");
  const [activeTab, setActiveTab] = useState("friends");
  const [selectedFriend, setSelectedFriend] = useState(null);
  const slideAnim = React.useRef(new Animated.Value(300)).current;
  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    title: "",
    message: "",
    type: "error",
  });

  const showAlert = (title, message, type = "error") =>
    setAlertConfig({ visible: true, title, message, type });

  const displayFriends = React.useMemo(() => {
    if (!isDemoMode) return friends;
    const demos = DEMO_FRIENDS.map((f) => ({
      id: f.id,
      name: f.name,
      phone: 'Demo',
      weeklyDistance: 8.4 + Math.random() * 12,
      totalRuns: 18 + Math.floor(Math.random() * 30),
      isOnline: true,
      lastRun: 'Live now',
      avatar: f.avatar,
      _isDemo: true,
      color: f.color,
    }));
    const existingIds = new Set(friends.map((f) => f.id));
    return [...demos.filter((d) => !existingIds.has(d.id)), ...friends];
  }, [friends, isDemoMode]);

  useEffect(() => {
    loadFriendsData();
  }, []);

  const loadFriendsData = async () => {
    try {
      const c = await AsyncStorage.getItem("currentUser");
      let currentUserId = null;
      if (c) {
        const parsed = JSON.parse(c);
        currentUserId = parsed.id;
      }

      // SUPABASE FETCH
      let dbFriends = [];
      let feedData = [];
      let dbFailed = false;

      if (currentUserId) {
        // Fetch friends (assuming relational schema exists: 'friend:users!friend_id(id, phone, username, avatar, weeklyDistance, totalRuns)')
        // For simplicity and fallback, we might just fetch all friends if the schema lacks foreign keys
        const { data: friendsList, error: friendsErr } = await supabase
          .from("friends")
          .select("friend_id")
          .eq("user_id", currentUserId);

        if (!friendsErr && friendsList && friendsList.length > 0) {
          const fIds = friendsList.map((f) => f.friend_id);
          const { data: usersData, error: usrErr } = await supabase
            .from("users")
            .select("*")
            .in("id", fIds);
          if (!usrErr && usersData) {
            dbFriends = usersData.map((u) => ({
              id: u.id,
              name: u.username,
              phone: u.phone,
              weeklyDistance: u.weeklyDistance || 0,
              totalRuns: u.totalRuns || 0,
              isOnline: false,
              lastRun: "Unknown",
              avatar: u.avatar || "👤",
            }));
          }
        } else if (friendsErr) {
          dbFailed = true;
        }

        // Feed
        const { data: rawFeed, error: fErr } = await supabase
          .from("feed")
          .select("*, user:users!user_id(username, avatar)")
          .order("created_at", { ascending: false })
          .limit(20);
        if (!fErr && rawFeed) {
          feedData = rawFeed.map((f) => ({
            id: f.id,
            user: f.user?.username || "Unknown Runner",
            avatar: f.user?.avatar || "👤",
            time: new Date(f.created_at).toLocaleDateString(),
            distance: f.distance,
            pace: f.pace,
            duration: f.duration,
            likes: f.likes || 0,
            comments: 0,
            hasLiked: false,
          }));
        } else if (fErr) {
          dbFailed = true;
        }
      }

        if (!dbFailed && dbFriends.length > 0) {
          setFriends(dbFriends);
        } else {
          const friendsData = await AsyncStorage.getItem("friends");
          const local = friendsData ? JSON.parse(friendsData) : [];
          setFriends(local);
        }

      if (!dbFailed && feedData.length > 0) {
        setFeed(feedData);
        await AsyncStorage.setItem("globalFeed", JSON.stringify(feedData));
      } else {
        const existingFeed = await AsyncStorage.getItem("globalFeed");
        if (existingFeed && JSON.parse(existingFeed).length > 0) {
          setFeed(JSON.parse(existingFeed));
        } else {
          setFeed([]);
        }
      }

      // Leaderboard
      const { data: lbData, error: lbErr } = await supabase
        .from("users")
        .select("id, username, weeklyDistance, avatar")
        .order("weeklyDistance", { ascending: false })
        .limit(10);
      if (!lbErr && lbData && lbData.length > 0) {
        const formattedLb = lbData.map((u) => ({
          name: u.username,
          weeklyDistance: u.weeklyDistance || 0,
          avatar: u.avatar || "👤",
        }));
        setLeaderboard(formattedLb);
        await AsyncStorage.setItem("leaderboard", JSON.stringify(formattedLb));
      } else {
        const leaderboardData = await AsyncStorage.getItem("leaderboard");
        setLeaderboard(leaderboardData ? JSON.parse(leaderboardData) : []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const addFriend = async () => {
    if (!newFriendName.trim()) {
      showAlert("Error", "Please enter a friend name or phone number", "error");
      return;
    }

    try {
      const searchKey = newFriendName.trim();

      // Search user from Supabase Database
      // Try exact phone first
      let { data: foundUsers, error } = await supabase
        .from("users")
        .select("*")
        .eq("phone", searchKey);

      // If no phone match, try username
      if (!foundUsers || foundUsers.length === 0) {
        const { data: nameUsers, error: nameErr } = await supabase
          .from("users")
          .select("*")
          .ilike("username", `%${searchKey}%`);

        if (!nameErr && nameUsers) foundUsers = nameUsers;
      }

      if (error && !foundUsers) {
        console.error("Supabase search error:", error);
        showAlert(
          "Error",
          "Failed to search for user. Please try again later.",
          "error",
        );
        return;
      }

      if (!foundUsers || foundUsers.length === 0) {
        showAlert(
          "Not Found",
          "Could not find a user with that username or phone number.",
          "error",
        );
        return;
      }

      const foundUser = foundUsers[0];

      if (foundUser.allowStrangersAdd === false) {
        showAlert(
          "Private Profile",
          "This user does not allow friend requests from strangers.",
          "error",
        );
        return;
      }

      // Check if already friends
      const isAlreadyFriend = friends.some(
        (f) =>
          f.phone === foundUser.phone ||
          f.name.toLowerCase() === foundUser.username.toLowerCase(),
      );

      if (isAlreadyFriend) {
        showAlert(
          "Already Friends",
          "You are already friends with this user.",
          "info",
        );
        return;
      }

      const friendName = foundUser.username;

      const newFriend = {
        id: foundUser.id || Date.now(),
        name: foundUser.username,
        phone: foundUser.phone,
        weeklyDistance: foundUser.weeklyDistance || 0,
        totalRuns: foundUser.totalRuns || 0,
        isOnline: false,
        lastRun: "Never",
        avatar: foundUser.avatar || "👤",
      };

      const updatedFriends = [...friends, newFriend];
      setFriends(updatedFriends);

      // Save locally as fallback
      await AsyncStorage.setItem("friends", JSON.stringify(updatedFriends));

      // Save securely into DB
      const c = await AsyncStorage.getItem("currentUser");
      if (c) {
        const cu = JSON.parse(c);
        if (cu.id && foundUser.id) {
          await supabase
            .from("friends")
            .insert({ user_id: cu.id, friend_id: foundUser.id });
          // bidirectional?
          await supabase
            .from("friends")
            .insert({ user_id: foundUser.id, friend_id: cu.id });
        }
      }

      setNewFriendName("");
      setAddFriendMode(false);
      showAlert(
        "Success",
        `${friendName} has been added as a friend!`,
        "success",
      );
    } catch (e) {
      console.error(e);
      showAlert("Error", "Failed to add friend", "error");
    }
  };

  const removeFriend = async (friendId) => {
    Alert.alert(
      "Remove Friend",
      "Are you sure you want to remove this friend?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            const updatedFriends = friends.filter(
              (friend) => friend.id !== friendId,
            );
            setFriends(updatedFriends);
            await AsyncStorage.setItem(
              "friends",
              JSON.stringify(updatedFriends),
            );

            const c = await AsyncStorage.getItem("currentUser");
            if (c) {
              const cu = JSON.parse(c);
              if (cu.id) {
                await supabase
                  .from("friends")
                  .delete()
                  .match({ user_id: cu.id, friend_id: friendId });
                await supabase
                  .from("friends")
                  .delete()
                  .match({ user_id: friendId, friend_id: cu.id });
              }
            }
          },
        },
      ],
    );
  };

  const sendCheer = (friendName) => {
    Alert.alert("Cheer sent", `You sent a cheer to ${friendName}.`);
  };

  // Hero bubble colours — cycled deterministically per friend index.
  const BUBBLE_COLORS = [
    '#24C789', '#FF5A36', '#00C2FF', '#F5A623', '#8AE676',
    '#A78BFA', '#FB7185', '#34D399', '#60A5FA', '#FBBF24',
  ];

  const renderFriendsTab = () => {
    // Simulate "active now" — real apps would use presence channels.
    const activeFriends = displayFriends.slice(0, Math.min(displayFriends.length, 5));
    return (
    <View style={styles.tabContent}>

      {/* ── Active hero section ── */}
      {displayFriends.length > 0 && (
        <View style={styles.heroSection}>
          <View style={styles.heroTop}>
            <View>
              <Text style={styles.heroEyebrow}>ACTIVE NOW</Text>
              <Text style={styles.heroHeading}>
                {activeFriends.length > 0 ? `${activeFriends.length} crew members` : 'No one active'}
              </Text>
            </View>
            <BouncyButton style={styles.cheerBtn} activeOpacity={0.8}>
              <Ionicons name="heart" size={13} color="#FF5A36" />
              <Text style={styles.cheerBtnText}>Cheer all</Text>
            </BouncyButton>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.bubblesRow}
          >
            {activeFriends.map((friend, idx) => {
              const color = BUBBLE_COLORS[idx % BUBBLE_COLORS.length];
              return (
                <BouncyButton
                  key={friend.id}
                  style={[styles.bubble, { borderColor: color }]}
                  activeOpacity={0.8}
                  onPress={() => openFriendProfile(friend)}
                >
                  {/* Coloured accent ring */}
                  <View style={[styles.bubbleRing, { backgroundColor: `${color}22` }]}>
                    {isImageAvatar(friend.avatar) ? (
                      <Image
                        source={{ uri: friend.avatar }}
                        style={styles.bubbleAvatar}
                      />
                    ) : (
                      <View style={[styles.bubbleAvatarFallback, { backgroundColor: `${color}33` }]}>
                        <Text style={[styles.bubbleInitial, { color }]}>
                          {avatarInitial(friend.name)}
                        </Text>
                      </View>
                    )}
                  </View>
                  {/* Active dot */}
                  <View style={[styles.bubbleDot, { backgroundColor: color }]} />
                  <Text style={styles.bubbleName} numberOfLines={1}>
                    {friend.name.split(' ')[0]}
                  </Text>
                  {friend.weeklyDistance > 0 && (
                    <Text style={styles.bubbleSub}>
                      {friend.weeklyDistance.toFixed(1)} km
                    </Text>
                  )}
                </BouncyButton>
              );
            })}
          </ScrollView>
        </View>
      )}

      <View style={styles.friendsHeader}>
        <Text style={styles.sectionTitle}>Your Friends ({displayFriends.length})</Text>
        <BouncyButton
          style={styles.addButton}
          onPress={() => setAddFriendMode(!addFriendMode)}
        >
          <Text style={styles.addButtonText}>
            {addFriendMode ? "Cancel" : "+ Add Friend"}
          </Text>
        </BouncyButton>
      </View>

      {addFriendMode && (
        <View style={styles.addFriendContainer}>
          <TextInput
            style={styles.input}
            placeholder="Search by phone number or username..."
            value={newFriendName}
            onChangeText={setNewFriendName}
            autoCapitalize="none"
          />
          <BouncyButton style={styles.confirmButton} onPress={addFriend}>
            <Text style={styles.confirmButtonText}>Add Friend</Text>
          </BouncyButton>
        </View>
      )}

      {displayFriends.map((friend, index) => (
        <FadeInView key={friend.id} delay={Math.min(index, 8) * 45}>
        <BouncyButton
          style={styles.friendCard}
          onPress={() => openFriendProfile(friend)}
          activeOpacity={0.7}
        >
          <View style={styles.friendInfo}>
            <View style={styles.friendMain}>
              {isImageAvatar(friend.avatar) ? (
                <Image
                  source={{ uri: friend.avatar }}
                  style={styles.friendAvatarImage}
                />
              ) : (
                <View style={styles.friendAvatarFallback}>
                  <Text style={styles.friendAvatarInitial}>
                    {avatarInitial(friend.name)}
                  </Text>
                </View>
              )}
              <View style={styles.friendDetails}>
                <Text style={styles.friendName}>{friend.name}</Text>
                <Text style={styles.friendStats}>
                  {friend.weeklyDistance < 1
                    ? (friend.weeklyDistance * 1000).toFixed(0) + " m"
                    : (friend.weeklyDistance || 0).toFixed(2) + " km"}{" "}
                  this week • {friend.totalRuns} runs
                </Text>
                <Text style={styles.friendLastRun}>
                  Last run: {friend.lastRun}
                </Text>
              </View>
            </View>
            <View style={styles.friendStatus}>
              <View style={styles.statusPill}>
                <View
                  style={[
                    styles.statusDot,
                    friend.isOnline && styles.statusDotOnline,
                  ]}
                />
                <Text
                  style={[
                    styles.statusPillText,
                    friend.isOnline && styles.statusPillTextOnline,
                  ]}
                >
                  {friend.isOnline ? "ONLINE" : "OFFLINE"}
                </Text>
              </View>
            </View>
          </View>
        </BouncyButton>
        </FadeInView>
      ))}

      {displayFriends.length === 0 && !addFriendMode && (
        <EmptyState
          icon="people-outline"
          title="Your crew is empty"
          desc="Add friends to share live runs, cheer each other on, and climb the leaderboard together."
          actionLabel="Add a friend"
          onAction={() => setAddFriendMode(true)}
        />
      )}
    </View>
  );};

  const handleLike = async (id) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setFeed((prev) =>
      Math.random() < 2
        ? prev.map((item) => {
            if (item.id === id) {
              return {
                ...item,
                hasLiked: !item.hasLiked,
                likes: item.hasLiked ? item.likes - 1 : item.likes + 1,
              };
            }
            return item;
          })
        : prev,
    );
  };

  const handleComment = (id) => {
    Alert.prompt("Add a comment", "Type your praise...", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Post",
        onPress: (text) => {
          if (text) {
            setFeed((prev) =>
              prev.map((i) =>
                i.id === id ? { ...i, comments: i.comments + 1 } : i,
              ),
            );
            Alert.alert("Posted!", `Your comment "${text}" was added.`);
          }
        },
      },
    ]);
  };

  const openFriendProfile = (friend) => {
    setSelectedFriend(friend);
    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
      tension: 60,
      friction: 10,
    }).start();
  };



  const closeFriendProfile = () => {
    Animated.timing(slideAnim, {
      toValue: 300,
      duration: 200,
      useNativeDriver: true,
    }).start(() => setSelectedFriend(null));
  };

  const renderFriendModal = () => {
    if (!selectedFriend) return null;
    return (
      <Modal
        transparent
        visible={!!selectedFriend}
        animationType="fade"
        onRequestClose={closeFriendProfile}
      >
        <TouchableWithoutFeedback onPress={closeFriendProfile}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <Animated.View
                style={[
                  styles.profileSheet,
                  { transform: [{ translateY: slideAnim }] },
                ]}
              >
                <View style={styles.sheetHandle} />

                <View style={styles.sheetHeader}>
                  {isImageAvatar(selectedFriend.avatar) ? (
                    <Image
                      source={{ uri: selectedFriend.avatar }}
                      style={styles.sheetAvatarImage}
                    />
                  ) : (
                    <View style={styles.sheetAvatarFallback}>
                      <Text style={styles.sheetAvatarInitial}>
                        {avatarInitial(selectedFriend.name)}
                      </Text>
                    </View>
                  )}
                  <Text style={styles.sheetName}>{selectedFriend.name}</Text>
                  <Text style={styles.sheetPhone}>
                    {selectedFriend.phone || "Runner"}
                  </Text>
                  <BouncyButton
                    style={styles.sheetClose}
                    onPress={closeFriendProfile}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons name="close" size={18} color="#0B0F13" />
                  </BouncyButton>
                </View>

                <View style={styles.sheetStats}>
                  <View style={styles.sheetStatBox}>
                    <Text style={styles.sheetStatVal}>
                      {selectedFriend.weeklyDistance < 1 ? (selectedFriend.weeklyDistance * 1000).toFixed(0) + ' m' : (selectedFriend.weeklyDistance || 0).toFixed(2) + ' km'}
                    </Text>
                    <Text style={styles.sheetStatLbl}>This Week</Text>
                  </View>
                  <View style={styles.sheetStatBox}>
                    <Text style={styles.sheetStatVal}>
                      {selectedFriend.totalRuns}
                    </Text>
                    <Text style={styles.sheetStatLbl}>Total Runs</Text>
                  </View>
                </View>

                {/* Privacy & map preferences — the dedicated home for these
                    settings (moved off the list row to stop mis-taps). */}
                <View style={PREF.section}>
                  <Text style={PREF.sectionLabel}>PRIVACY & MAP</Text>
                  <View style={PREF.group}>
                    <PrefToggleRow
                      icon={<Ionicons name="map-outline" size={18} color="#24C789" />}
                      iconBg="rgba(36,199,137,0.12)"
                      title="Show on map"
                      description="Display their live marker on your run map"
                      value={mapVisibility[selectedFriend.id] !== false}
                      onChange={(v) => {
                        Haptics.selectionAsync();
                        setMapVisible(selectedFriend.id, v);
                      }}
                    />
                    <View style={PREF.divider} />
                    <PrefToggleRow
                      icon={<Ionicons name="eye-outline" size={18} color="#0B0F13" />}
                      iconBg="rgba(11,15,19,0.06)"
                      title="Show their nickname"
                      description="Show the name label under their marker"
                      value={mapVisibility[`${selectedFriend.id}:label`] !== false}
                      disabled={mapVisibility[selectedFriend.id] === false}
                      onChange={(v) => {
                        Haptics.selectionAsync();
                        setMapVisible(`${selectedFriend.id}:label`, v);
                      }}
                    />
                  </View>
                </View>

                {selectedFriend.isOnline && (
                  <BouncyButton
                    style={[styles.chatBtn, styles.chatBtnSecondary, styles.chatBtnAfterPrefs]}
                    onPress={() => {
                      closeFriendProfile();
                      navigation.navigate("Run", {
                        mode: "spectate",
                        spectateFriend: selectedFriend,
                      });
                    }}
                  >
                    <Ionicons name="eye-outline" size={18} color="#FFF" />
                    <Text style={styles.chatBtnText}>Spectate live run</Text>
                  </BouncyButton>
                )}

                <BouncyButton
                  style={styles.chatBtn}
                  onPress={() => {
                    closeFriendProfile();
                    navigation.navigate("Chat", {
                      friendName: selectedFriend.name,
                      friendAvatar: selectedFriend.avatar,
                    });
                  }}
                >
                  <Ionicons name="chatbubble-outline" size={18} color="#FFF" />
                  <Text style={styles.chatBtnText}>Message</Text>
                </BouncyButton>

                <BouncyButton
                  style={styles.removeFriendBtn}
                  onPress={() => {
                    closeFriendProfile();
                    setTimeout(() => removeFriend(selectedFriend.id), 300);
                  }}
                >
                  <Text style={styles.removeFriendBtnText}>Remove Friend</Text>
                </BouncyButton>
              </Animated.View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        scrollIndicatorInsets={{ top: 1 }}
      >
        <View style={styles.header}>
          <View style={styles.headerTopRow}>
            <BouncyButton
              style={styles.backButton}
              onPress={() => navigation.goBack()}
              hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
            >
              <Ionicons name="chevron-back" size={22} color="#0B0F13" />
            </BouncyButton>
          </View>
          <Text style={styles.title}>Crew</Text>
          <Text style={styles.subtitle}>
            Run together, cheer each other on, climb the board.
          </Text>
        </View>

        <View style={styles.tabBar}>
          <BouncyButton
            style={[styles.tab, activeTab === "friends" && styles.activeTab]}
            onPress={() => setActiveTab("friends")}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "friends" && styles.activeTabText,
              ]}
            >
              Friends
            </Text>
          </BouncyButton>
          <BouncyButton
            style={[styles.tab, activeTab === "feed" && styles.activeTab]}
            onPress={() => setActiveTab("feed")}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "feed" && styles.activeTabText,
              ]}
            >
              Feed
            </Text>
          </BouncyButton>
          <BouncyButton
            style={[
              styles.tab,
              activeTab === "leaderboard" && styles.activeTab,
            ]}
            onPress={() => setActiveTab("leaderboard")}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "leaderboard" && styles.activeTabText,
              ]}
            >
              Leaderboard
            </Text>
          </BouncyButton>
        </View>

        {activeTab === "friends" ? (
          renderFriendsTab()
        ) : activeTab === "feed" ? (
          <ActivityFeed
            feed={feed}
            onLike={handleLike}
            onComment={handleComment}
          />
        ) : (
          <Leaderboard leaderboard={leaderboard} />
        )}
      </ScrollView>
      {renderFriendModal()}
      <CustomAlert
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        onClose={() => setAlertConfig({ ...alertConfig, visible: false })}
      />
    </View>
  );
}

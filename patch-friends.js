const fs = require('fs');
let code = fs.readFileSync('screens/FriendsScreen.js', 'utf-8');

// Imports
code = code.replace(
  "import {\n  View,\n  Text,\n  StyleSheet,\n  ScrollView,\n  TouchableOpacity,\n  Alert,\n  TextInput,\n  Image,\n} from 'react-native';",
  "import {\n  View,\n  Text,\n  StyleSheet,\n  ScrollView,\n  TouchableOpacity,\n  Alert,\n  TextInput,\n  Image,\n  Modal,\n  Animated,\n  TouchableWithoutFeedback,\n} from 'react-native';"
);

// State
code = code.replace(
  "const [activeTab, setActiveTab] = useState('friends'); // 'friends', 'leaderboard', 'feed'",
  "const [activeTab, setActiveTab] = useState('friends');\n  const [selectedFriend, setSelectedFriend] = useState(null);\n  const slideAnim = React.useRef(new Animated.Value(300)).current;"
);

// We need to inject the Modal rendering function before the main return
const modalRenderCode = `
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
      <Modal transparent visible={!!selectedFriend} animationType="fade" onRequestClose={closeFriendProfile}>
        <TouchableWithoutFeedback onPress={closeFriendProfile}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <Animated.View style={[styles.profileSheet, { transform: [{ translateY: slideAnim }] }]}>
                <View style={styles.sheetHandle} />
                
                <View style={styles.sheetHeader}>
                  <Text style={styles.sheetAvatar}>{selectedFriend.avatar}</Text>
                  <Text style={styles.sheetName}>{selectedFriend.name}</Text>
                  <Text style={styles.sheetPhone}>{selectedFriend.phone || 'Runner'}</Text>
                </View>

                <View style={styles.sheetStats}>
                  <View style={styles.sheetStatBox}>
                    <Text style={styles.sheetStatVal}>{selectedFriend.weeklyDistance} km</Text>
                    <Text style={styles.sheetStatLbl}>This Week</Text>
                  </View>
                  <View style={styles.sheetStatBox}>
                    <Text style={styles.sheetStatVal}>{selectedFriend.totalRuns}</Text>
                    <Text style={styles.sheetStatLbl}>Total Runs</Text>
                  </View>
                </View>

                <TouchableOpacity 
                  style={styles.chatBtn} 
                  onPress={() => {
                    closeFriendProfile();
                    navigation.navigate('Chat', { friendName: selectedFriend.name, friendAvatar: selectedFriend.avatar });
                  }}
                >
                  <Ionicons name="chatbubble-outline" size={24} color="#FFF" />
                  <Text style={styles.chatBtnText}>Message</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.removeFriendBtn} 
                  onPress={() => {
                    closeFriendProfile();
                    setTimeout(() => removeFriend(selectedFriend.id), 300);
                  }}
                >
                  <Text style={styles.removeFriendBtnText}>Remove Friend</Text>
                </TouchableOpacity>

              </Animated.View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    );
  };
`;

code = code.replace(
  "  return (\n    <View style={styles.container}>",
  modalRenderCode + "\n  return (\n    <View style={styles.container}>"
);

// Map the modal down at the bottom of the root view
code = code.replace(
  "      </ScrollView>\n    </View>\n  );\n}",
  "      </ScrollView>\n      {renderFriendModal()}\n    </View>\n  );\n}"
);

// Update renderFriendsTab inside:
code = code.replace(
  /<View key=\{friend\.id\} style=\{styles\.friendCard\}>/g,
  '<TouchableOpacity key={friend.id} style={styles.friendCard} onPress={() => openFriendProfile(friend)} activeOpacity={0.7}>'
);

code = code.replace(
  /<\/View>\n\s*<View style=\{styles\.friendActions\}>[\s\S]*?<\/View>\n\s*<\/View>\n\s*\}\)/g,
  '</View>\n        </TouchableOpacity>\n      ))'
);

fs.writeFileSync('screens/FriendsScreen.js', code);

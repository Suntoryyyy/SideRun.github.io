const fs = require('fs');
let code = fs.readFileSync('screens/FriendsScreen.js', 'utf8');

const regex = /\{selectedFriend\.isOnline && \(\s*<View style=\{\{\s*width: "100%", marginBottom: 20\s*\}\}\>[\s\S]*?<\/View>\s*\)\s*\}/m;

const replacement = `
                {selectedFriend.isOnline && (
                  <TouchableOpacity
                    style={[styles.chatBtn, { backgroundColor: "#FF9500", marginBottom: 15 }]}
                    onPress={() => {
                        closeFriendProfile();
                        navigation.navigate("Run", { mode: "spectate", spectateFriend: selectedFriend });
                    }}
                  >
                    <Ionicons name="eye-outline" size={24} color="#FFF" />
                    <Text style={styles.chatBtnText}>Spectate Live Run</Text>
                  </TouchableOpacity>
                )}
`;

code = code.replace(regex, replacement.trim());
fs.writeFileSync('screens/FriendsScreen.js', code);

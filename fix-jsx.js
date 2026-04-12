const fs = require('fs');
let code = fs.readFileSync('screens/FriendsScreen.js', 'utf-8');

// Replace the start tag
code = code.replace(
  '<View key={friend.id} style={styles.friendCard}>',
  '<TouchableOpacity key={friend.id} style={styles.friendCard} onPress={() => openFriendProfile(friend)} activeOpacity={0.7}>'
);

// We need to REMOVE the friendActions block and fix the closing tag at the end of the loop:
const blockToRemove = `          </View>
          <View style={styles.friendActions}>
            <TouchableOpacity
              style={styles.cheerButton}
              onPress={() => sendCheer(friend.name)}
            >
              <Text style={styles.cheerButtonText}>🎉 Cheer</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.removeButton}
              onPress={() => removeFriend(friend.id)}
            >
              <Text style={styles.removeButtonText}>Remove</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}`;

const blockReplacement = `          </View>
        </TouchableOpacity>
      ))}`;

code = code.replace(blockToRemove, blockReplacement);

// Just in case it got duplicated earlier
code = code.replace('<TouchableOpacity key={friend.id} style={styles.friendCard} onPress={() => openFriendProfile(friend)} activeOpacity={0.7}>\n          <View style={styles.friendInfo}>\n            <View style={styles.friendMain>', '');

fs.writeFileSync('screens/FriendsScreen.js', code);

const fs = require('fs');
let code = fs.readFileSync('screens/FriendsScreen.js', 'utf-8');

const closeButtonCode = `                  </Text>
                  <TouchableOpacity
                    style={{ position: 'absolute', right: 20, top: 15, padding: 10 }}
                    onPress={closeFriendProfile}
                  >
                    <Ionicons name="close" size={24} color="#666" />
                  </TouchableOpacity>
                </View>

                <View style={styles.sheetStats}>`;

if (!code.includes('name="close" size={24}')) {
  // We look for sheetPhone block
  const target = `                  </Text>
                </View>

                <View style={styles.sheetStats}>`;
  
  if (code.includes(target)) {
    code = code.replace(target, closeButtonCode);
  } else {
    // try another target
    const target2 = `                  </Text>
                </View>
                <View style={styles.sheetStats}>`;
    if (code.includes(target2)) {
      code = code.replace(target2, closeButtonCode);
    }
  }

  // Also remove sendLiveCheer just in case it exists.
  if (code.includes('const sendLiveCheer')) {
    code = code.replace(/const sendLiveCheer[\s\S]*?};/g, '');
  }

  // Also, replace any Send Live Cheer block if it somehow exists
  if (code.includes('Send Live Cheer')) {
    code = code.replace(/\{selectedFriend\.isOnline && \(\s*<View style=\{\{\s*width[\s\S]*?<\/View>\s*\)\}/, '');
  }

  fs.writeFileSync('screens/FriendsScreen.js', code);
}

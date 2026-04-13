const fs = require('fs');

let code = fs.readFileSync('screens/FriendsScreen.js', 'utf-8');

// Ensure supabase is imported
if (!code.includes("import { supabase }")) {
  code = code.replace(
    "import { Ionicons } from '@expo/vector-icons';",
    "import { Ionicons } from '@expo/vector-icons';\nimport { supabase } from '../services/supabase';"
  );
}

// Ensure Haptics is imported
if (!code.includes("import * as Haptics")) {
  code = code.replace(
    "import { Ionicons }",
    "import * as Haptics from 'expo-haptics';\nimport { Ionicons }"
  );
}

const sendCheerFunc = `  const sendLiveCheer = async (emoji, message) => {
    if (!selectedFriend) return;
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    let myId = 'Unknown';
    try {
      const c = await AsyncStorage.getItem('currentUser');
      if (c) {
        const cu = JSON.parse(c);
        myId = cu.id || cu.phone || cu.username;
      }
    } catch(e){}

    // Trigger Supabase Realtime
    const { error } = await supabase
      .from('live_cheers')
      .insert([
        {
          sender_id: myId,
          receiver_id: selectedFriend.id || selectedFriend.phone || selectedFriend.name,
          emoji,
          message
        }
      ]);
    
    if (error) {
      console.warn("Failed to send cheer:", error);
    } else {
      closeFriendProfile();
    }
  };

  const closeFriendProfile`;

code = code.replace("  const closeFriendProfile", sendCheerFunc);

const cheerBoardDOM = `                {selectedFriend.isOnline && (
                  <View style={{ width: '100%', marginBottom: 20 }}>
                    <Text style={{ fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 10 }}>Send Live Cheer</Text>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
                      <TouchableOpacity onPress={() => sendLiveCheer('🔥', 'Fire! Keep the pace!')} style={styles.cheerQuickBtn}>
                        <Text style={{ fontSize: 32 }}>🔥</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => sendLiveCheer('👏', 'Awesome job!')} style={styles.cheerQuickBtn}>
                        <Text style={{ fontSize: 32 }}>👏</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => sendLiveCheer('🚀', 'Speed up! You got this!')} style={styles.cheerQuickBtn}>
                        <Text style={{ fontSize: 32 }}>🚀</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => sendLiveCheer('💦', 'Stay hydrated!')} style={styles.cheerQuickBtn}>
                        <Text style={{ fontSize: 32 }}>💦</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

                <TouchableOpacity 
                  style={styles.chatBtn} `;

code = code.replace(
  "                <TouchableOpacity \n                  style={styles.chatBtn} ",
  cheerBoardDOM
);

fs.writeFileSync('screens/FriendsScreen.js', code);

// Update styles
let stylesCode = fs.readFileSync('styles/FriendsScreenStyles.js', 'utf-8');
if (!stylesCode.includes("cheerQuickBtn:")) {
  stylesCode = stylesCode.replace("  chatBtn: {", `  cheerQuickBtn: {
    backgroundColor: '#F0F0F5',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  chatBtn: {`);
  fs.writeFileSync('styles/FriendsScreenStyles.js', stylesCode);
}


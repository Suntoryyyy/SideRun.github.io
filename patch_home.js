const fs = require('fs');
let code = fs.readFileSync('screens/HomeScreen.js', 'utf-8');

const liveAlert = `        {/* Live Runner Alert */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => {
            if (global.Haptics) global.Haptics.impactAsync(global.Haptics.ImpactFeedbackStyle.Medium);
            navigation.navigate("Run", { mode: "spectate", spectateFriend: { id: "mock_live_runner", name: "Runner Pro (Live)", avatar: "🔥", phone: "1234567890", isOnline: true }});
          }}
          style={{ marginBottom: 20 }}
        >
          <BlurView intensity={75} tint="light" style={[styles.weatherCard, { backgroundColor: 'rgba(36, 199, 137, 0.1)', borderColor: '#24C789', borderWidth: 1 }]}>
            <View style={[styles.weatherIconContainer, { backgroundColor: '#24C789' }]}>
              <Text style={{ fontSize: 24 }}>🔥</Text>
            </View>
            <View style={styles.weatherMeta || styles.weatherInfo}>
              <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#24C789' }}>Runner Pro is live!</Text>
              <Text style={{ fontSize: 13, color: '#666' }}>Tap to spectate & cheer them on</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#24C789" />
          </BlurView>
        </TouchableOpacity>

        {/* Live Weather Preview */}`;

if (!code.includes("Runner Pro is live!")) {
  code = code.replace("{/* Live Weather Preview */}", liveAlert);
  fs.writeFileSync('screens/HomeScreen.js', code);
}

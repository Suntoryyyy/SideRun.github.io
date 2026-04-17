const fs = require('fs');
let code = fs.readFileSync('components/RunScreenUI/RunMapMemo.js', 'utf-8');

if (!code.includes("mode,")) {
  code = code.replace("userAvatar,", "mode,\n  spectateFriend,\n  userAvatar,");
}

code = code.replace("showsUserLocation={true}", "showsUserLocation={mode !== 'spectate'}");

const trackingSelf = `            <Text style={{ fontWeight: 'bold', color: '#24C789', fontSize: 14 }}>Tracking You</Text>
          </View>`;

const trackingSwitch = `            <Text style={{ fontWeight: 'bold', color: '#24C789', fontSize: 14 }}>{mode === 'spectate' ? 'Watching: ' + (spectateFriend?.name || 'Live') : 'Tracking You'}</Text>
          </View>`;

code = code.replace(trackingSelf, trackingSwitch);

const userAvatarPill = `{userAvatar && (userAvatar.startsWith("file:") || userAvatar.startsWith("http") || userAvatar.startsWith("data:")) ? (
              <Image source={{ uri: userAvatar }} style={{ width: 24, height: 24, borderRadius: 12, marginRight: 8 }} />
            ) : (
              <Text style={{ fontSize: 18, marginRight: 8 }}>{userAvatar || "👤"}</Text>
            )}`;

const dualPill = `{mode === 'spectate' && spectateFriend ? (
              spectateFriend.avatar && (spectateFriend.avatar.startsWith("file:") || spectateFriend.avatar.startsWith("http") || spectateFriend.avatar.startsWith("data:")) ? (
                <Image source={{ uri: spectateFriend.avatar }} style={{ width: 24, height: 24, borderRadius: 12, marginRight: 8 }} />
              ) : (
                <Text style={{ fontSize: 18, marginRight: 8 }}>{spectateFriend.avatar || "👤"}</Text>
              )
            ) : userAvatar && (userAvatar.startsWith("file:") || userAvatar.startsWith("http") || userAvatar.startsWith("data:")) ? (
              <Image source={{ uri: userAvatar }} style={{ width: 24, height: 24, borderRadius: 12, marginRight: 8 }} />
            ) : (
              <Text style={{ fontSize: 18, marginRight: 8 }}>{userAvatar || "👤"}</Text>
            )}`;

code = code.replace(userAvatarPill, dualPill);

const fakeMarker = `{mode === 'spectate' && currentLocation && spectateFriend && (
                <Marker
                  coordinate={{ latitude: currentLocation.latitude, longitude: currentLocation.longitude }}
                  title={spectateFriend.name}
                  anchor={{ x: 0.5, y: 0.5 }}
                >
                  <View style={{
                    width: 40, height: 40, borderRadius: 20,
                    backgroundColor: '#FFF', borderWidth: 2, borderColor: '#FF9500',
                    justifyContent: 'center', alignItems: 'center',
                    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 5
                  }}>
                    {spectateFriend.avatar && (spectateFriend.avatar.startsWith("http") || spectateFriend.avatar.startsWith("file:")) ? (
                      <Image source={{ uri: spectateFriend.avatar }} style={{ width: 36, height: 36, borderRadius: 18 }} />
                    ) : (
                      <Text style={{ fontSize: 18 }}>{spectateFriend.avatar || "🏃"}</Text>
                    )}
                  </View>
                </Marker>
              )}`;

if (!code.includes("mode === 'spectate' && currentLocation && spectateFriend")) {
  code = code.replace(
    /\{\s*visibilityScope \!== "private"\s*&&\s*isRunning &&\s*liveFriends\.map/m,
    fakeMarker + "\n            {visibilityScope !== \"private\" && isRunning && liveFriends.map"
  );
}

fs.writeFileSync('components/RunScreenUI/RunMapMemo.js', code);

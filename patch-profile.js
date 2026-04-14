const fs = require('fs');
let code = fs.readFileSync('screens/ProfileScreen.js', 'utf8');

// Fix image uploading (remove useless web cropper branch)
const oldPick = `  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: Platform.OS !== "web", // Native uses built-in, Web uses our custom web cropper
      aspect: [1, 1],
      quality: 0.5,
      base64: true, // lower quality for base64 limits
    });

    if (!result.canceled) {
      if (Platform.OS === "web") {
        const rawUri = result.assets[0].uri;
        setRawImageUri(rawUri);
        setCropModalVisible(true);
      } else {
        // Native path sets it directly from built-in cropped output
        if (result.assets[0].base64) {
          setAvatar(\`data:image/jpeg;base64,\${result.assets[0].base64}\`);
        } else {
          setAvatar(result.assets[0].uri);
        }
      }
    }
  };`;

const newPick = `  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true, // Let Expo handle its default Web UI cropper if any
      aspect: [1, 1],
      quality: 0.5,
      base64: true, 
    });

    if (!result.canceled) {
      if (result.assets[0].base64) {
        setAvatar(\`data:\${result.assets[0].mimeType || 'image/jpeg'};base64,\${result.assets[0].base64}\`);
      } else {
        setAvatar(result.assets[0].uri);
      }
    }
  };`;

code = code.replace(oldPick, newPick);

// Fix avatar overflow
const oldAvStyles = `  avatarSelector: {
    flexDirection: "row",
    marginTop: 10,
    paddingVertical: 10,
  },`;
const newAvStyles = `  avatarSelector: {
    flexDirection: "row",
    marginTop: 10,
  },
  avatarSelectorContent: {
    paddingVertical: 10,
    paddingHorizontal: 5,
  },
  avatarScrollWrap: {
    width: '100%',
    overflow: 'hidden',
  },`;

code = code.replace(oldAvStyles, newAvStyles);

const oldScroll = `            {isEditing && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.avatarSelector}
              >
                {/* Image upload button */}
                <TouchableOpacity
                  style={styles.avatarOption}
                  onPress={pickImage}
                >
                  <Ionicons name="camera" size={24} color="#666" />
                </TouchableOpacity>

                {avatars.map((emoji, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.avatarOption,
                      avatar === emoji && styles.avatarOptionSelected,
                    ]}
                    onPress={() => setAvatar(emoji)}
                  >
                    <Text style={styles.avatarOptionText}>{emoji}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}`;

const newScroll = `            {isEditing && (
              <View style={styles.avatarScrollWrap}>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.avatarSelector}
                  contentContainerStyle={styles.avatarSelectorContent}
                >
                  {/* Image upload button */}
                  <TouchableOpacity
                    style={styles.avatarOption}
                    onPress={pickImage}
                  >
                    <Ionicons name="camera" size={24} color="#666" />
                  </TouchableOpacity>

                  {avatars.map((emoji, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.avatarOption,
                        avatar === emoji && styles.avatarOptionSelected,
                      ]}
                      onPress={() => setAvatar(emoji)}
                    >
                      <Text style={styles.avatarOptionText}>{emoji}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}`;

code = code.replace(oldScroll, newScroll);
fs.writeFileSync('screens/ProfileScreen.js', code);
console.log('patched');

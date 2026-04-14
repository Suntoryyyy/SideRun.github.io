const fs = require('fs');
let code = fs.readFileSync('screens/ProfileScreen.js', 'utf8');

const oldPick = `  const pickImage = async () => {
    try {
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true, // Let Expo handle its default Web UI cropper if any
        aspect: [1, 1],
        quality: 0.3,
        base64: true,
      });

      if (!result.canceled) {
        if (result.assets[0].base64) {
          // Additional safety check: PostgREST limit is around 1MB payload.
          // 0.3 quality coupled with automatic resizing should be small enough.
          const base64Data = result.assets[0].base64;
          const mimeType = result.assets[0].mimeType || "image/jpeg";
          setAvatar(\`data:\${mimeType};base64,\${base64Data}\`);
        } else {
          setAvatar(result.assets[0].uri);
        }
      }
    } catch (e) {
      console.warn("Image Picker Error:", e);
    }
  };`;

const newPick = `  const pickImage = async () => {
    try {
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: Platform.OS !== "web", // Native allows built-in cropping directly
        aspect: [1, 1],
        quality: 0.3,
        base64: true,
      });

      if (!result.canceled) {
        if (Platform.OS === 'web') {
           // For Web, pass the raw selected image to our react-easy-crop modal
           setRawImageUri(result.assets[0].uri);
           setCropModalVisible(true);
        } else {
          // Native uses built-in cropper, we can save base64 directly
          if (result.assets[0].base64) {
            const base64Data = result.assets[0].base64;
            const mimeType = result.assets[0].mimeType || "image/jpeg";
            setAvatar(\`data:\${mimeType};base64,\${base64Data}\`);
          } else {
            setAvatar(result.assets[0].uri);
          }
        }
      }
    } catch (e) {
      console.warn("Image Picker Error:", e);
    }
  };`;

if (code.includes('allowsEditing: true, // Let Expo handle its default Web UI cropper if any')) {
  code = code.replace(oldPick, newPick);
  fs.writeFileSync('screens/ProfileScreen.js', code);
  console.log('patched pickImage');
} else {
  console.log('not found old pick');
}

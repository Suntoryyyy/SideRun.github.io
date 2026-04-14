const fs = require('fs');
let code = fs.readFileSync('screens/ProfileScreen.js', 'utf8');

const oldSave = `  const handleSaveProfile = async () => {
    if (!username.trim()) {
      Alert.alert("Error", "Username cannot be empty");
      return;
    }

    try {`;

const newSave = `  const handleSaveProfile = async () => {
    try {
      if (!username || typeof username !== "string" || !username.trim()) {
        if (Platform.OS === 'web') window.alert("Username cannot be empty");
        else Alert.alert("Error", "Username cannot be empty");
        return;
      }`;
code = code.replace(oldSave, newSave);

code = code.replace(/Alert\.alert\("Success", "Profile updated successfully!"\);/g, `if (Platform.OS === "web") { window.alert("Profile updated successfully!"); } else { Alert.alert("Success", "Profile updated successfully!"); }`);
code = code.replace(/Alert\.alert\("Error", "Failed to update profile"\);/g, `if (Platform.OS === "web") { window.alert("Failed to update profile"); } else { Alert.alert("Error", "Failed to update profile"); }`);
code = code.replace(/Alert\.alert\("Cloud Sync Error", error\.message\);/g, `if (Platform.OS === "web") { window.alert("Cloud Sync Error: " + error.message); } else { Alert.alert("Cloud Sync Error", error.message); }`);

fs.writeFileSync('screens/ProfileScreen.js', code);
console.log('Patched handleSaveProfile');

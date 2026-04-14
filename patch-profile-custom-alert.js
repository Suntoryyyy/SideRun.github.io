const fs = require('fs');
let code = fs.readFileSync('screens/ProfileScreen.js', 'utf8');

// Ensure import
if (!code.includes('import CustomAlert')) {
  code = code.replace(
    "import ImageCropperModal from \"./ImageCropperModal\";",
    "import ImageCropperModal from \"./ImageCropperModal\";\nimport CustomAlert from '../components/CustomAlert';"
  );
}

// Add state for alert
if (!code.includes('const [alertConfig,')) {
  code = code.replace(
    '  const [cropModalVisible, setCropModalVisible] = useState(false);',
    '  const [alertConfig, setAlertConfig] = useState({ visible: false, title: "", message: "", type: "error" });\n  const [cropModalVisible, setCropModalVisible] = useState(false);'
  );
  
  code = code.replace(
    '  const pickImage = async () => {',
    '  const showAlert = (title, message, type = "error") => {\n    setAlertConfig({ visible: true, title, message, type });\n  };\n\n  const pickImage = async () => {'
  );
}

// Replace all Alerts with showAlert inside handleSaveProfile
code = code.replace(/if \(Platform\.OS === 'web'\) window\.alert\("Username cannot be empty"\);\n\s*else Alert\.alert\("Error", "Username cannot be empty"\);/g, 'showAlert("Error", "Username cannot be empty");');
code = code.replace(/if \(Platform\.OS === "web"\) { window\.alert\("Profile updated successfully!"\); } else { Alert\.alert\("Success", "Profile updated successfully!"\); }/g, 'showAlert("Success", "Profile updated successfully!", "success");');
code = code.replace(/if \(Platform\.OS === "web"\) { window\.alert\("Failed to update profile"\); } else { Alert\.alert\("Error", "Failed to update profile"\); }/g, 'showAlert("Error", "Failed to update profile");');
code = code.replace(/if \(Platform\.OS === "web"\) { window\.alert\("Cloud Sync Error: " \+ error\.message\); } else { Alert\.alert\("Cloud Sync Error", error\.message\); }/g, 'showAlert("Cloud Sync Error", error.message);');
code = code.replace(/Alert\.alert\("Error", "Username cannot be empty"\);/g, 'showAlert("Error", "Username cannot be empty");');
code = code.replace(/Alert\.alert\("Cloud Sync Error", error\.message\);/g, 'showAlert("Cloud Sync Error", error.message);');
code = code.replace(/Alert\.alert\("Success", "Profile updated successfully!"\);/g, 'showAlert("Success", "Profile updated successfully!", "success");');
code = code.replace(/Alert\.alert\("Error", "Failed to update profile"\);/g, 'showAlert("Error", "Failed to update profile");');

// Add the CustomAlert component to the render tree
if (!code.includes('<CustomAlert')) {
  code = code.replace(
    '{Platform.OS === "web" && (',
    '<CustomAlert visible={alertConfig.visible} title={alertConfig.title} message={alertConfig.message} type={alertConfig.type} onClose={() => setAlertConfig({ ...alertConfig, visible: false })} />\n\n      {Platform.OS === "web" && ('
  );
}

fs.writeFileSync('screens/ProfileScreen.js', code);
console.log('Patched CustomAlert to ProfileScreen');

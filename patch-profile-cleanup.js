const fs = require('fs');
let code = fs.readFileSync('screens/ProfileScreen.js', 'utf8');

// Revert read fallback:
code = code.replace(
  /let userString = null;\n\s*if\s*\(Platform\.OS === 'web'\)\s*userString = sessionStorage\.getItem\("currentUser"\);\n\s*if\s*\(!userString\)\s*userString = await AsyncStorage\.getItem\("currentUser"\);/g,
  'const userString = await AsyncStorage.getItem("currentUser");'
);

// Revert write fallback inside save:
code = code.replace(
  /if\s*\(Platform\.OS === 'web' && sessionStorage\.getItem\("currentUser"\)\)\s*{\n\s*sessionStorage\.setItem\("currentUser", JSON\.stringify\(updatedUser\)\);\n\s*}\s*else\s*{\n\s*await AsyncStorage\.setItem\("currentUser", JSON\.stringify\(updatedUser\)\);\n\s*}/g,
  '      if (Platform.OS === "web") sessionStorage.setItem("currentUser", JSON.stringify(updatedUser));\n      await AsyncStorage.setItem("currentUser", JSON.stringify(updatedUser));'
);

// Update the recovery chunk:
code = code.replace(
  /if\s*\(Platform\.OS === 'web' && sessionStorage\.getItem\("currentUser"\)\)\s*{\n\s*sessionStorage\.setItem\("currentUser", JSON\.stringify\(user\)\);\n\s*}\s*else\s*{\n\s*await AsyncStorage\.setItem\("currentUser", JSON\.stringify\(user\)\);\n\s*}/g,
  '      if (Platform.OS === "web") sessionStorage.setItem("currentUser", JSON.stringify(user));\n      await AsyncStorage.setItem("currentUser", JSON.stringify(user));'
);

fs.writeFileSync('screens/ProfileScreen.js', code);
console.log('Cleaned up ProfileScreen');

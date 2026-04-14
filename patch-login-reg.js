const fs = require('fs');

function patch(file) {
  let content = fs.readFileSync(file, 'utf8');
  let replaced = content.replace(
    /if\s*\(Platform\.OS\s*===\s*'web'\)\s*{\s*sessionStorage\.setItem\('currentUser',\s*([^)]+)\);\s*}\s*else\s*{\s*await\s+AsyncStorage\.setItem\('currentUser',\s*([^)]+)\);\s*}/g,
    "if (Platform.OS === 'web') {\n        sessionStorage.setItem('currentUser', $1);\n      }\n      await AsyncStorage.setItem('currentUser', $1);"
  );
  if (content !== replaced) {
    fs.writeFileSync(file, replaced);
    console.log("Patched", file);
  } else {
    console.log("No match in", file);
  }
}

patch('screens/LoginScreen.js');
patch('screens/RegisterScreen.js');

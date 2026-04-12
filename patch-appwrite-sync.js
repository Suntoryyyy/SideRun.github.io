const fs = require('fs');

// Patch App.js to logout of Appwrite
let appCode = fs.readFileSync('App.js', 'utf-8');
if (!appCode.includes("import { account } from './services/appwrite';")) {
  appCode = appCode.replace(
    "import AsyncStorage from '@react-native-async-storage/async-storage';",
    "import AsyncStorage from '@react-native-async-storage/async-storage';\nimport { account } from './services/appwrite';"
  );
}

appCode = appCode.replace(
  "  const handleLogout = async () => {",
  "  const handleLogout = async () => {\n    try {\n      await account.deleteSession('current');\n    } catch (e) {}\n"
);
fs.writeFileSync('App.js', appCode);


// Patch RegisterScreen.js to create Appwrite Auth user
let regCode = fs.readFileSync('screens/RegisterScreen.js', 'utf-8');
if (!regCode.includes("import { databases, account }")) {
  regCode = regCode.replace(
    "import { databases } from '../services/appwrite';",
    "import { databases, account } from '../services/appwrite';"
  );
}

let regAuthBlock = `
      // 2. CLOUD AUTH SYNC (Creates the real user in Appwrite Users panel)
      const email = \`\${trimmedPhone}@siderun.app\`;
      try {
        await account.create(
          ID.unique(),
          email,
          password,
          trimmedUsername
        );
        console.log("SUCCESS: User Auth created in Appwrite!");
      } catch (authError) {
        console.warn("APPWRITE AUTH ERROR:", authError);
      }

      // 3. CLOUD DATABASE SYNC (The massive upgrade!)
`;

regCode = regCode.replace(
  "      // 2. CLOUD DATABASE SYNC (The massive upgrade!)",
  regAuthBlock
);
fs.writeFileSync('screens/RegisterScreen.js', regCode);


// Patch LoginScreen.js to sign into Appwrite
let loginCode = fs.readFileSync('screens/LoginScreen.js', 'utf-8');
if (!loginCode.includes("import { account } from '../services/appwrite';")) {
  loginCode = loginCode.replace(
    "import { Ionicons } from '@expo/vector-icons';",
    "import { Ionicons } from '@expo/vector-icons';\nimport { account } from '../services/appwrite';"
  );
}

// Add appwrite login inside handleLogin
let loginBlock = `
    try {
      await new Promise(resolve => setTimeout(resolve, 800)); // Show loading animation
      
      const email = \`\${trimmedPhone}@siderun.app\`;
      try {
        await account.createEmailPasswordSession(email, password);
        console.log("SUCCESS: Appwrite session started.");
      } catch (authError) {
        console.warn("Appwrite auth failed (maybe not synced):", authError);
      }

      const usersData = await AsyncStorage.getItem('users');
`;

loginCode = loginCode.replace(
  `    try {\n      await new Promise(resolve => setTimeout(resolve, 800)); // Show loading animation\n      const usersData = await AsyncStorage.getItem('users');`,
  loginBlock
);
fs.writeFileSync('screens/LoginScreen.js', loginCode);

console.log("Patches complete.");

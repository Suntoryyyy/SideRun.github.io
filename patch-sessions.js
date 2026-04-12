const fs = require('fs');

let regCode = fs.readFileSync('screens/RegisterScreen.js', 'utf-8');
const createSession = `
      try {
        await account.createEmailPasswordSession(email, password);
        console.log("SUCCESS: Session started in Appwrite!");
      } catch (sessionError) {
        console.warn("APPWRITE SESSION ERROR:", sessionError);
      }
`;
if (!regCode.includes("account.createEmailPasswordSession(")) {
  regCode = regCode.replace(
    '      // 3. CLOUD DATABASE SYNC (The massive upgrade!)',
    createSession + '\n      // 3. CLOUD DATABASE SYNC (The massive upgrade!)'
  );
  fs.writeFileSync('screens/RegisterScreen.js', regCode);
  console.log("Register session patched.");
}

let loginCode = fs.readFileSync('screens/LoginScreen.js', 'utf-8');
if (!loginCode.includes("account.createEmailPasswordSession(")) {
  const loginSession = `
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
    "    try {\n      await new Promise(resolve => setTimeout(resolve, 800)); // Show loading animation\n      const usersData = await AsyncStorage.getItem('users');",
    loginSession
  );
  fs.writeFileSync('screens/LoginScreen.js', loginCode);
  console.log("Login session patched.");
}


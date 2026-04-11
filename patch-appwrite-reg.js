const fs = require('fs');
let code = fs.readFileSync('screens/RegisterScreen.js', 'utf8');

// Update imports
code = code.replace(
  "import { Ionicons } from '@expo/vector-icons';",
  "import { Ionicons } from '@expo/vector-icons';\nimport { databases } from '../services/appwrite';\nimport { ID } from 'appwrite';"
);

// Update handleRegister to sync to Appwrite
const databaseLogic = `
      // 1. LOCAL FALLBACK & CHECK (Keep the original fast logic)
      const usersData = await AsyncStorage.getItem('users');
      const users = usersData ? JSON.parse(usersData) : {};
      const isUsernameTaken = Object.values(users).some(user => user.username.toLowerCase() === trimmedUsername.toLowerCase());

      if (users[trimmedPhone]) {
        showAlert('Registration Failed', 'This phone number is already registered.');
        setIsLoading(false);
        return;
      } else if (isUsernameTaken) {
        showAlert('Registration Failed', 'This username is already taken. Please choose another one.');
        setIsLoading(false);
        return;
      }

      // 2. CLOUD DATABASE SYNC (The massive upgrade!)
      try {
        await databases.createDocument(
          '69da562e0023693b307a', // Database ID
          'users',               // Table/Collection ID
          ID.unique(),           // Auto-generate Document ID
          {
            phone: trimmedPhone,
            username: trimmedUsername,
            password: password
          }
        );
        console.log("SUCCESS: User beamed to Appwrite Cloud!");
      } catch (cloudError) {
        console.warn("CLOUD SYNC ERROR: Could not reach Appwrite.", cloudError);
        // We let the app continue even if the cloud fails, so they can still run locally!
      }

      // 3. FINAL LOCAL SAVE
      users[trimmedPhone] = { phone: trimmedPhone, username: trimmedUsername, password };
      await AsyncStorage.setItem('users', JSON.stringify(users));
      await AsyncStorage.setItem('currentUser', JSON.stringify({ phone: trimmedPhone, username: trimmedUsername }));
      
      showAlert('Success', 'Account created successfully!', 'success');
`;

// Inject the rewrite logic
code = code.replace(
  /const usersData = await AsyncStorage\.getItem\('users'\);[\s\S]*?showAlert\('Success', 'Account created successfully!', 'success'\);\n      }/g,
  databaseLogic
);

fs.writeFileSync('screens/RegisterScreen.js', code);
console.log('RegisterScreen wired to Appwrite Cloud');

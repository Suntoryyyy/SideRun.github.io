const fs = require('fs');

let registerCode = fs.readFileSync('screens/RegisterScreen.js', 'utf-8');

registerCode = registerCode.replace(
  /      \/\/ 2\. CLOUD AUTH SYNC[\s\S]*?showAlert\('Success', 'Account created successfully!', 'success'\);/m,
  `      // 2. ENFORCED CLOUD AUTH
      const email = \`\${trimmedPhone}@siderun.app\`;
      
      // Ensure password is at least 8 chars for Appwrite
      if (password.length < 8) {
        showAlert('Registration Failed', 'Password must be at least 8 characters long for cloud security.');
        setIsLoading(false);
        return;
      }

      try {
        await account.create(ID.unique(), email, password, trimmedUsername);
        console.log("SUCCESS: User Auth created in Appwrite!");
      } catch (authError) {
        console.warn("APPWRITE AUTH ERROR:", authError);
        showAlert('Cloud Error', authError.message || 'Failed to create user on cloud.');
        setIsLoading(false);
        return;
      }

      try {
        await account.createEmailPasswordSession(email, password);
        console.log("SUCCESS: Session started in Appwrite!");
      } catch (sessionError) {
        console.warn("APPWRITE SESSION ERROR:", sessionError);
      }

      try {
        await databases.createDocument(
          '69da562e0023693b307a', // Database ID
          'users',               // Table/Collection ID
          ID.unique(),
          {
            phone: trimmedPhone,
            username: trimmedUsername,
            password: password
          }
        );
        console.log("SUCCESS: User beamed to Appwrite Cloud DB!");
      } catch (cloudError) {
        console.warn("CLOUD DB SYNC ERROR:", cloudError);
      }

      // 3. FINAL LOCAL SAVE
      users[trimmedPhone] = { phone: trimmedPhone, username: trimmedUsername, password };
      await AsyncStorage.setItem('users', JSON.stringify(users));
      await AsyncStorage.setItem('currentUser', JSON.stringify({ phone: trimmedPhone, username: trimmedUsername }));
      
      showAlert('Success', 'Account created successfully!', 'success');`
);

let loginCode = fs.readFileSync('screens/LoginScreen.js', 'utf-8');

loginCode = loginCode.replace(
  /      const email = `\$\\{trimmedPhone\\}@siderun\.app`;[\s\S]*?showAlert\('Error', 'An error occurred during login'\);/m,
  `      const email = \`\${trimmedPhone}@siderun.app\`;
      let userAuthenticated = false;
      let CloudUsername = "";

      // 1. TRY APPWRITE FIRST
      try {
        await account.createEmailPasswordSession(email, password);
        const accountDetails = await account.get();
        CloudUsername = accountDetails.name;
        userAuthenticated = true;
        console.log("SUCCESS: Appwrite session started & validated.");
      } catch (authError) {
        console.warn("Appwrite auth failed:", authError);
        // Might be not found, or wrong password. We will fallback to local check.
      }

      // 2. CHECK LOCAL STORAGE
      const usersData = await AsyncStorage.getItem('users');
      const users = usersData ? JSON.parse(usersData) : {};
      
      // 3. FINAL DECISION
      if (userAuthenticated || (users[trimmedPhone] && users[trimmedPhone].password === password)) {
        // Recover username from Cloud if local is missing
        const finalUsername = userAuthenticated ? CloudUsername : users[trimmedPhone].username;
        const userInfo = JSON.stringify({ phone: trimmedPhone, username: finalUsername });
        
        // Cache them locally if they only existed on cloud
        if (userAuthenticated && !users[trimmedPhone]) {
            users[trimmedPhone] = { phone: trimmedPhone, username: finalUsername, password: password };
            await AsyncStorage.setItem('users', JSON.stringify(users));
        }

        if (rememberMe) {
          await AsyncStorage.setItem('rememberedPhone', trimmedPhone);
          await AsyncStorage.setItem('currentUser', userInfo);
        } else {
          await AsyncStorage.removeItem('rememberedPhone');
          if (Platform.OS === 'web') {
            sessionStorage.setItem('currentUser', userInfo);
          } else {
            await AsyncStorage.setItem('currentUser', userInfo);
          }
        }
        setLoggedIn(true);
      } else {
        if (!users[trimmedPhone] && !userAuthenticated) {
            showAlert('Login Failed', 'This phone number is not registered.');
        } else {
            showAlert('Login Failed', 'The password you entered is incorrect.');
        }
        setIsLoading(false);
      }
    } catch (e) {
      showAlert('Error', 'An error occurred during login');`
);

fs.writeFileSync('screens/RegisterScreen.js', registerCode);
fs.writeFileSync('screens/LoginScreen.js', loginCode);
console.log('Fixed Auth sync!');

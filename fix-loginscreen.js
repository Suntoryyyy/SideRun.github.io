const fs = require('fs');

let loginCode = fs.readFileSync('screens/LoginScreen.js', 'utf-8');

const target = `      const email = \`\${trimmedPhone}@siderun.app\`;
      try {
        await account.createEmailPasswordSession(email, password);
        console.log("SUCCESS: Appwrite session started.");
      } catch (authError) {
        console.warn("Appwrite auth failed (maybe not synced):", authError);
      }

      const usersData = await AsyncStorage.getItem('users');

      const users = usersData ? JSON.parse(usersData) : {};

      if (users[trimmedPhone]) {
        if (users[trimmedPhone].password === password) {
          const userInfo = JSON.stringify({ phone: trimmedPhone, username: users[trimmedPhone].username });
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
          showAlert('Login Failed', 'The password you entered is incorrect.');
          setIsLoading(false);
        }
      } else {
        showAlert('Login Failed', 'This phone number is not registered.');
        setIsLoading(false);
      }
    } catch (e) {
      showAlert('Error', 'An error occurred during login');
      setIsLoading(false);
    }`;

const newAuthCode = `      const email = \`\${trimmedPhone}@siderun.app\`;
      let userAuthenticated = false;
      let CloudUsername = "";

      // 1. TRY APPWRITE FIRST
      try {
        const session = await account.createEmailPasswordSession(email, password);
        const accountDetails = await account.get();
        CloudUsername = accountDetails.name || 'Runner';
        userAuthenticated = true;
        console.log("SUCCESS: Appwrite session started & validated.");
      } catch (authError) {
        console.warn("Appwrite auth failed:", authError);
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
      showAlert('Error', 'An error occurred during login');
      setIsLoading(false);
    }`;

loginCode = loginCode.replace(target, newAuthCode);
fs.writeFileSync('screens/LoginScreen.js', loginCode);
console.log('Fixed LoginAuth!');

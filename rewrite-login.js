const fs = require('fs');

let loginCode = fs.readFileSync('screens/LoginScreen.js', 'utf-8');

loginCode = loginCode.replace(
  "import { account } from '../services/appwrite';",
  "import { supabase } from '../services/supabase';"
);

const newLoginCode = `      // 1. TRY MEMFIRE CLOUD FIRST (Supabase SDK)
      const email = \`\${trimmedPhone}@siderun.app\`;
      let userAuthenticated = false;
      let cloudUsername = "Runner";

      try {
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
          email: email,
          password: password,
        });

        if (authError) {
          console.warn("MemFire auth failed (might be incorrect password):", authError.message);
        } else if (authData.user) {
          userAuthenticated = true;
          cloudUsername = authData.user.user_metadata?.username || 'Runner';
          console.log("SUCCESS: MemFire session started & validated.");
        }
      } catch (err) {
        console.warn("Exception during MemFire login:", err);
      }

      // 2. CHECK LOCAL STORAGE
      const usersData = await AsyncStorage.getItem('users');
      const users = usersData ? JSON.parse(usersData) : {};
      
      // 3. FINAL DECISION
      if (userAuthenticated || (users[trimmedPhone] && users[trimmedPhone].password === password)) {
        // Recover username from Cloud if local is missing
        const finalUsername = userAuthenticated ? cloudUsername : users[trimmedPhone].username;
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
      }`;

loginCode = loginCode.replace(
  /      const email = \`\$\\{trimmedPhone\\}@siderun\.app\`;[\s\S]*?showAlert\('Error', 'An error occurred during login'\);\n      setIsLoading\(false\);\n    \}/m,
  newLoginCode + "\n    } catch (e) {\n      showAlert('Error', 'An error occurred during login');\n      setIsLoading(false);\n    }"
);

fs.writeFileSync('screens/LoginScreen.js', loginCode);

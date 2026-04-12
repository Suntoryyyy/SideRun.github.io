const fs = require('fs');

let registerCode = fs.readFileSync('screens/RegisterScreen.js', 'utf-8');

registerCode = registerCode.replace(
  "import { databases, account } from '../services/appwrite';",
  "import { supabase } from '../services/supabase';"
);
registerCode = registerCode.replace(
  "import { ID } from 'appwrite';",
  ""
);

const newAuthCode = `      // 2. MEMFIRE CLOUD AUTH (Supabase SDK)
      const email = \`\${trimmedPhone}@siderun.app\`;
      
      // Ensure password is at least 6 chars for Supabase
      if (password.length < 6) {
        showAlert('Registration Failed', 'Password must be at least 6 characters long for cloud security.');
        setIsLoading(false);
        return;
      }

      try {
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: email,
          password: password,
          options: {
            data: {
              username: trimmedUsername,
              phone: trimmedPhone
            }
          }
        });

        if (authError) {
          console.warn("MEMFIRE AUTH ERROR:", authError);
          showAlert('Cloud Error', authError.message || 'Failed to create user on cloud.');
          setIsLoading(false);
          return;
        }
        console.log("SUCCESS: User Auth created in MemFire!");
      } catch (e) {
        console.warn("Exception during Auth:", e);
        showAlert('Cloud Error', 'Something went completely wrong trying to connect to MemFire.');
        setIsLoading(false);
        return;
      }

      // 3. MEMFIRE DATABASE SYNC
      try {
        const { error: dbError } = await supabase
          .from('users')
          .insert([
            { phone: trimmedPhone, username: trimmedUsername, password: password }
          ]);
          
        if (dbError) {
          console.warn("MEMFIRE DB SYNC ERROR:", dbError);
        } else {
          console.log("SUCCESS: User beamed to MemFire Cloud DB!");
        }
      } catch (cloudError) {
        console.warn("MEMFIRE GENERAL DB ERROR:", cloudError);
      }

      // 4. FINAL LOCAL SAVE
      users[trimmedPhone] = { phone: trimmedPhone, username: trimmedUsername, password };
      await AsyncStorage.setItem('users', JSON.stringify(users));
      await AsyncStorage.setItem('currentUser', JSON.stringify({ phone: trimmedPhone, username: trimmedUsername }));
      
      showAlert('Success', 'Account created successfully!', 'success');`;

registerCode = registerCode.replace(
  /      \/\/ 2\. ENFORCED CLOUD AUTH[\s\S]*?showAlert\('Success', 'Account created successfully!', 'success'\);/m,
  newAuthCode
);

fs.writeFileSync('screens/RegisterScreen.js', registerCode);

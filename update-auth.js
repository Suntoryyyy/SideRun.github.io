const fs = require('fs');

let rs = fs.readFileSync('screens/RegisterScreen.js', 'utf-8');
// remove local check and inject memfire real auth
rs = rs.replace(/const handleRegister = async \(\) => \{[\s\S]*?\} catch \(e\) \{/g, `const handleRegister = async () => {
    const trimmedPhone = phone.trim();
    const trimmedUsername = username.trim();

    if (!trimmedPhone || !trimmedUsername || !password) {
      showAlert('Error', 'Please fill all fields');
      return;
    }

    setIsLoading(true);

    try {
      // Create a pseudo-email for Supabase Auth using the phone number
      const pseudoEmail = \`\${trimmedPhone}@siderun.app\`;
      
      const { data, error } = await supabase.auth.signUp({
        email: pseudoEmail,
        password: password,
      });

      if (error) {
        setIsLoading(false);
        showAlert('Registration Failed', error.message || 'Could not register user in MemFire');
        return;
      }

      // Store user profile details in public 'users' table
      if (data.user) {
        const { error: dbError } = await supabase
          .from('users')
          .insert([
            { id: data.user.id, phone: trimmedPhone, username: trimmedUsername, weeklyDistance: 0, totalRuns: 0 }
          ]);
          
        if (dbError) {
          console.error("MemFire DB Error:", dbError);
          // Optional: handle profile creation error here
        }
      }

      // Save locally to bypass any loading on reload
      const currentUser = JSON.stringify({ phone: trimmedPhone, username: trimmedUsername, id: data?.user?.id });
      if (Platform.OS === 'web') {
        sessionStorage.setItem('currentUser', currentUser);
      } else {
        await AsyncStorage.setItem('currentUser', currentUser);
      }

      setIsLoading(false);
      setLoggedIn(true);

    } catch (e) {`);

fs.writeFileSync('screens/RegisterScreen.js', rs);

let ls = fs.readFileSync('screens/LoginScreen.js', 'utf-8');
ls = ls.replace(/try \{[\s\S]*?\} catch \(e\) \{/g, `try {
      const pseudoEmail = \`\${trimmedPhone}@siderun.app\`;
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: pseudoEmail,
        password: password,
      });

      if (error) {
        setIsLoading(false);
        if (error.message.includes('Invalid login credentials')) {
          showAlert('Login Failed', 'Incorrect phone number or password. Please try again or create an account.');
        } else {
          showAlert('Login Failed', error.message);
        }
        return;
      }

      // Fetch user profile from the database
      let username = 'Runner';
      if (data.user) {
        const { data: profile } = await supabase
          .from('users')
          .select('username')
          .eq('id', data.user.id)
          .single();
          
        if (profile && profile.username) {
          username = profile.username;
        }
      }

      const userInfo = JSON.stringify({ phone: trimmedPhone, username, id: data?.user?.id });

      if (rememberMe) {
        await AsyncStorage.setItem('rememberedPhone', trimmedPhone);
      } else {
        await AsyncStorage.removeItem('rememberedPhone');
      }

      if (Platform.OS === 'web') {
        sessionStorage.setItem('currentUser', userInfo);
      } else {
        await AsyncStorage.setItem('currentUser', userInfo);
      }

      setIsLoading(false);
      setLoggedIn(true);
    } catch (e) {`);

fs.writeFileSync('screens/LoginScreen.js', ls);


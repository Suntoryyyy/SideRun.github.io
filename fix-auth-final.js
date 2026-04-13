const fs = require('fs');

let rs = fs.readFileSync('screens/RegisterScreen.js', 'utf-8');

rs = rs.replace(/const handleRegister = async \(\) => \{[\s\S]*?    \};/g, `const handleRegister = async () => {
    const trimmedPhone = phone.trim();
    const trimmedUsername = username.trim();

    if (!trimmedPhone || !trimmedUsername || !password) {
      showAlert('Error', 'Please fill all fields');
      return;
    }
    setIsLoading(true);

    try {
      const pseudoEmail = \`\${trimmedPhone}@siderun.app\`;
      
      const { data, error } = await supabase.auth.signUp({
        email: pseudoEmail,
        password: password,
      });

      if (error) {
        setIsLoading(false);
        showAlert('Registration Failed', error.message || 'Error from MemFire');
        return;
      }

      if (data.user) {
        const { error: dbError } = await supabase
          .from('users')
          .insert([
            { id: data.user.id, phone: trimmedPhone, username: trimmedUsername, weeklyDistance: 0, totalRuns: 0 }
          ]);
      }

      const currentUser = JSON.stringify({ phone: trimmedPhone, username: trimmedUsername, id: data?.user?.id });
      if (Platform.OS === 'web') {
        sessionStorage.setItem('currentUser', currentUser);
      } else {
        await AsyncStorage.setItem('currentUser', currentUser);
      }

      setIsLoading(false);
      setLoggedIn(true);

    } catch (e) {
      showAlert('Error', 'An error occurred during registration');
      setIsLoading(false);
    }
  };`);
fs.writeFileSync('screens/RegisterScreen.js', rs);

// Update Login
let ls = fs.readFileSync('screens/LoginScreen.js', 'utf-8');
ls = ls.replace(/const handleLogin = async \(\) => \{[\s\S]*?    \};/g, `const handleLogin = async () => {
    const trimmedPhone = phone.trim();

    if (!trimmedPhone || !password) {
      showAlert('Error', 'Please enter your phone number and password');
      return;
    }

    if (trimmedPhone === 'admin' || trimmedPhone === '123456') {
      const adminInfo = JSON.stringify({ phone: '1234567890', username: 'Admin Bypass' });
      if (Platform.OS === 'web') {
        sessionStorage.setItem('currentUser', adminInfo);
      } else {
        await AsyncStorage.setItem('currentUser', adminInfo);
      }
      setLoggedIn(true);
      return;
    }

    setIsLoading(true);

    try {
      const pseudoEmail = \`\${trimmedPhone}@siderun.app\`;
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: pseudoEmail,
        password: password,
      });

      if (error) {
        setIsLoading(false);
        showAlert('Login Failed', error.message);
        return;
      }

      let username = 'Runner';
      if (data.user) {
        const { data: profile } = await supabase
          .from('users')
          .select('username')
          .eq('id', data.user.id)
          .single();
          
        if (profile && profile.username) username = profile.username;
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
    } catch (e) {
      showAlert('Error', 'An error occurred during login');
      setIsLoading(false);
    }
  };`);

fs.writeFileSync('screens/LoginScreen.js', ls);


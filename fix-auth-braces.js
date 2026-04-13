const fs = require('fs');

let rs = fs.readFileSync('screens/RegisterScreen.js', 'utf-8');
rs = rs.replace(/const handleRegister = async \(\) => \{[\s\S]*?  return \(/, `const handleRegister = async () => {
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
        await supabase
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
  };

  return (`);
fs.writeFileSync('screens/RegisterScreen.js', rs);

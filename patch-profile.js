const fs = require('fs');
let code = fs.readFileSync('screens/ProfileScreen.js', 'utf-8');

const newLogout = `  const onLogoutPress = async () => {
    if (Platform.OS === 'web') {
      const confirmLogout = window.confirm('Are you sure you want to log out?');
      if (confirmLogout) {
        if (handleLogout) handleLogout();
        else AsyncStorage.removeItem('currentUser').then(() => window.location.reload());
      }
      return;
    }

    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out',
        style: 'destructive',
        onPress: () => {
          if (handleLogout) {
            handleLogout();
          } else {
            AsyncStorage.removeItem('currentUser').then(() => {
              Alert.alert('Logged Out', 'Please restart the app to return to the login screen.');
            });
          }
        }
      }
    ]);
  };`;

// replace the old function block
code = code.replace(/  const onLogoutPress = async \(\) => \{\n(?:.|\n)*?  \};\n/m, newLogout + "\n");
fs.writeFileSync('screens/ProfileScreen.js', code);
console.log('Profile patched');

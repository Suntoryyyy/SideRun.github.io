const fs = require('fs');
let code = fs.readFileSync('screens/ProfileScreen.js', 'utf8');

const oldCheck = `        setCurrentUser(user);
        setUsername(user.username || "");`;

const newCheck = `        // Recover missing phone from Supabase auth if it got wiped
        if (!user.phone) {
          const { data: sessionData } = await supabase.auth.getSession();
          if (sessionData?.session?.user?.email && sessionData.session.user.email.endsWith('@siderun.app')) {
            user.phone = sessionData.session.user.email.replace('@siderun.app', '');
            if (Platform.OS === 'web' && sessionStorage.getItem("currentUser")) {
              sessionStorage.setItem("currentUser", JSON.stringify(user));
            } else {
              await AsyncStorage.setItem("currentUser", JSON.stringify(user));
            }
          }
        }

        setCurrentUser(user);
        setUsername(user.username || "");`;

if (code.includes(oldCheck)) {
  code = code.replace(oldCheck, newCheck);
  fs.writeFileSync('screens/ProfileScreen.js', code);
  console.log('patched ProfileScreen with phone recovery');
} else {
  console.log('could not find oldCheck in ProfileScreen.js');
}

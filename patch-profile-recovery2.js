const fs = require('fs');
let code = fs.readFileSync('screens/ProfileScreen.js', 'utf8');

const oldCheck = `        // Recover missing phone from Supabase auth if it got wiped
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
        }`;

const newCheck = `        // Recover missing phone or ID from Supabase auth if it got wiped
        if (!user.phone || !user.id) {
          const { data: sessionData } = await supabase.auth.getSession();
          if (sessionData?.session?.user) {
            const su = sessionData.session.user;
            if (su.email && su.email.endsWith('@siderun.app')) {
              if (!user.phone) user.phone = su.email.replace('@siderun.app', '');
            }
            if (!user.id) user.id = su.id;
            
            if (Platform.OS === 'web' && sessionStorage.getItem("currentUser")) {
              sessionStorage.setItem("currentUser", JSON.stringify(user));
            } else {
              await AsyncStorage.setItem("currentUser", JSON.stringify(user));
            }
          }
        }`;

if (code.includes(oldCheck)) {
  code = code.replace(oldCheck, newCheck);
  fs.writeFileSync('screens/ProfileScreen.js', code);
  console.log('patched ProfileScreen with ID/PHONE recovery');
} else {
  console.log('could not find oldCheck in ProfileScreen.js');
}

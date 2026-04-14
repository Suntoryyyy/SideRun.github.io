const fs = require('fs');

let code = fs.readFileSync('screens/ProfileScreen.js', 'utf8');
const oldText = `      const userString = await AsyncStorage.getItem("currentUser");
      const user = userString ? JSON.parse(userString) : {};`;

const newText = `      let userString = null;
      if (Platform.OS === 'web') userString = sessionStorage.getItem("currentUser");
      if (!userString) userString = await AsyncStorage.getItem("currentUser");
      const user = userString ? JSON.parse(userString) : {};`;

code = code.replace(oldText, newText);
fs.writeFileSync('screens/ProfileScreen.js', code);
console.log('Patched 2');

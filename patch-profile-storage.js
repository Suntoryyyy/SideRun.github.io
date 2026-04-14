const fs = require('fs');

function replaceInFile(path) {
  let code = fs.readFileSync(path, 'utf8');
  if (code.includes('AsyncStorage.getItem("currentUser")')) {
    const old1 = `    try {
      const userString = await AsyncStorage.getItem("currentUser");`;
    const new1 = `    try {
      let userString = null;
      if (Platform.OS === 'web') userString = sessionStorage.getItem("currentUser");
      if (!userString) userString = await AsyncStorage.getItem("currentUser");`;
    
    code = code.replace(old1, new1);
  }
  
  if (code.includes('await AsyncStorage.setItem("currentUser", JSON.stringify(updatedUser));')) {
      const old2 = `      await AsyncStorage.setItem("currentUser", JSON.stringify(updatedUser));`;
      const new2 = `      if (Platform.OS === 'web' && sessionStorage.getItem("currentUser")) {
        sessionStorage.setItem("currentUser", JSON.stringify(updatedUser));
      } else {
        await AsyncStorage.setItem("currentUser", JSON.stringify(updatedUser));
      }`;
      code = code.replace(old2, new2);
  }
  fs.writeFileSync(path, code);
}

replaceInFile('screens/ProfileScreen.js');
console.log('Patched ProfileScreen');

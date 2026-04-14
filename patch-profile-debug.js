const fs = require('fs');
let code = fs.readFileSync('screens/ProfileScreen.js', 'utf8');

code = code.replace(
  'const handleSaveProfile = async () => {',
  'const handleSaveProfile = async () => {\n    console.log("handleSaveProfile triggered. User:", username);'
);

fs.writeFileSync('screens/ProfileScreen.js', code);
console.log('Patched debug');

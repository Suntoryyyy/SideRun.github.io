const fs = require('fs');
let ss = fs.readFileSync('styles/FriendsScreenStyles.js', 'utf8');

ss = ss.replace(/medal: {\n\s*fontSize: 24,\n\s*}/, 'medal: {\n      fontSize: 24,\n    },');
fs.writeFileSync('styles/FriendsScreenStyles.js', ss);
console.log('done running script');

const fs = require('fs');
let code = fs.readFileSync('screens/ProfileScreen.js', 'utf8');
code = code.replace(/allowFriendsViewRecord,\n            allowStrangersAdd,\n          \}\)/g, 'allowFriendsViewRecord,\n            allowStrangersAdd,\n          })\n          .select()');
console.log('done');

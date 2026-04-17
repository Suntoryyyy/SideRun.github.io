const fs = require('fs');
let code = fs.readFileSync('screens/RunScreen.js', 'utf-8');

code = code.replace(
  "<RunMapMemo \\",
  "<RunMapMemo \n        mode={mode}\n        spectateFriend={spectateFriend} \\"
);
fs.writeFileSync('screens/RunScreen.js', code);

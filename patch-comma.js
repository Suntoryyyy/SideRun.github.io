const fs = require('fs');
let code = fs.readFileSync('styles/FriendsScreenStyles.js', 'utf8');
code = code.replace(/fontSize: 24,\n    }\n\n  feedCard: \{/g, 'fontSize: 24,\n    },\n  feedCard: {');
fs.writeFileSync('styles/FriendsScreenStyles.js', code);

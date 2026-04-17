const fs = require('fs');
let code = fs.readFileSync('components/ActivityFeed.js', 'utf8');
code = code.replace(/}\)\)\}/, '}))\n      )}');
fs.writeFileSync('components/ActivityFeed.js', code);

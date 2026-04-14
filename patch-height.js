const fs = require('fs');

let rs = fs.readFileSync('screens/RunScreen.js', 'utf8');

// Replace all occurrences of height * 0.75 - 300
rs = rs.replace(/height \* 0.75 - 300/g, "height * 0.75 - 200");
rs = rs.replace(/height \* 0.75 - 320/g, "height * 0.75 - 220");

fs.writeFileSync('screens/RunScreen.js', rs);
console.log('done running script');

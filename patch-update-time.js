const fs = require('fs');
let code = fs.readFileSync('hooks/useRunTracking.js', 'utf8');

const rxInsert = /          setCurrentLocation\(newLoc\);/;
code = code.replace(rxInsert, '          setCurrentLocation(newLoc);\n          lastUpdateTime.current = Date.now();');
fs.writeFileSync('hooks/useRunTracking.js', code);

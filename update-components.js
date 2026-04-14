const fs = require('fs');

// Use short names/units globally (meters/speed M/S)
let rs = fs.readFileSync('screens/RunHistoryScreen.js', 'utf8');
rs = rs.replace(/distance: \{run.distance\} km/g, "distance: {run.distance < 1 ? (run.distance * 1000).toFixed(0) + ' m' : run.distance + ' km'}");
rs = rs.replace(/<Text style=\{styles.statUnit\}>km<\/Text>/g, "<Text style={styles.statUnit}>{selectedRun.distance < 1 ? 'm' : 'km'}</Text>");
rs = rs.replace(/\{selectedRun.distance\}\s+\{""\}\s+<Text/g, "{selectedRun.distance < 1 ? (selectedRun.distance * 1000).toFixed(0) : selectedRun.distance} <Text");
fs.writeFileSync('screens/RunHistoryScreen.js', rs);

let fs2 = fs.readFileSync('screens/FriendsScreen.js', 'utf8');
fs2 = fs2.replace(/\{item.distance\} km/g, "{item.distance < 1 ? (item.distance * 1000).toFixed(0) + ' m' : item.distance.toFixed(2) + ' km'}");
fs.writeFileSync('screens/FriendsScreen.js', fs2);
console.log('done');

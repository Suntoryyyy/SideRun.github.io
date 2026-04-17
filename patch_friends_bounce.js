const fs = require('fs');
let code = fs.readFileSync('screens/FriendsScreen.js', 'utf-8');

if (!code.includes("position: 'absolute', top: -1000")) {
  code = code.replace(
    "<View style={styles.header}>",
    "<View style={{ position: 'absolute', top: -1000, left: 0, right: 0, height: 1000, backgroundColor: 'rgba(255, 255, 255, 0.85)' }} />\n        <View style={styles.header}>"
  );
  fs.writeFileSync('screens/FriendsScreen.js', code);
}

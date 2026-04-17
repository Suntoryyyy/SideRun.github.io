const fs = require('fs');
let code = fs.readFileSync('screens/FriendsScreen.js', 'utf8');
code = code.replace(/<Text style=\{styles\.title\}>Friends \& Community<\/Text>/, '<Text style={styles.title} numberOfLines={1} adjustsFontSizeToFit>FRIENDS</Text>');
fs.writeFileSync('screens/FriendsScreen.js', code);

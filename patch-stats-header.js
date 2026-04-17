const fs = require('fs');
let code = fs.readFileSync('screens/RunScreen.js', 'utf8');

const regex = /<View style=\{styles\.statsContainer\}>/;

const replacement = `
        <View style={styles.statsContainer}>
          {mode === "spectate" && spectateFriend && (
             <View style={{ alignItems: 'center', marginBottom: 10 }}>
               <Text style={{ fontSize: 16, fontWeight: '700', color: '#FF9500' }}>
                 🔴 Spectating: {spectateFriend.name} {spectateFriend.avatar}
               </Text>
             </View>
          )}
`;

code = code.replace(regex, replacement.trim());
fs.writeFileSync('screens/RunScreen.js', code);

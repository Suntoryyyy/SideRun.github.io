const fs = require('fs');
let code = fs.readFileSync('screens/RunScreen.js', 'utf-8');

code = code.replace(/{!isPanelCollapsed && \(\n\s*<View style=\{styles.statsContainer\}>/, '<View style={styles.statsContainer}>');
// We also need to remove the closing )} for that condition
// Wait, I need to make sure I don't break anything. Let's just use regex.


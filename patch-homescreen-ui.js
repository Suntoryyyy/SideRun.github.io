const fs = require('fs');

let code = fs.readFileSync('screens/HomeScreen.js', 'utf-8');

// Update brandText styles to be big, bold, like a modern Tracker app
const oldBrandStyle = `  brandText: {
    color: '#FFF',
    fontWeight: '900',
    fontStyle: 'italic',
    fontSize: 14,
    letterSpacing: 0.5,
  },`;

const newBrandStyle = `  brandText: {
    color: '#24C789',
    fontWeight: '900',
    fontStyle: 'italic',
    fontSize: 28,
    letterSpacing: -1,
    textTransform: 'uppercase',
  },`;

code = code.replace(oldBrandStyle, newBrandStyle);

// Update brandBadge styles to remove background block since we're making the text huge
const oldBadge = `  brandBadge: {
    backgroundColor: '#24C789',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },`;

const newBadge = `  brandBadge: {
    backgroundColor: 'transparent',
    paddingHorizontal: 0,
    paddingVertical: 0,
    borderRadius: 0,
  },`;
code = code.replace(oldBadge, newBadge);

// Render "SIDERUN" instead of siderun lower case (even though textTransform fixes it, good to have it pure)
code = code.replace(
  "<Text style={styles.brandText}>siderun</Text>",
  "<Text style={styles.brandText}>SIDERUN</Text>"
);

// Add a sub-header typography style update for userName greetings to match the Tracker bold look
code = code.replace(
  "  userName: {\n    fontSize: 28,\n    fontWeight: 'bold',\n    color: '#222222',\n  },",
  "  userName: {\n    fontSize: 34,\n    fontWeight: '900',\n    color: '#111',\n    letterSpacing: -0.5,\n  },"
);

fs.writeFileSync('screens/HomeScreen.js', code);
console.log('HomeScreen updated');

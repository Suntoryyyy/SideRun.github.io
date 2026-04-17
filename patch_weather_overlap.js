const fs = require('fs');
let code = fs.readFileSync('screens/WeatherScreen.js', 'utf-8');

// The best way to fix the overlap is to give the header the exact same padding/margins
const newStyles = `title: {
    fontSize: 22,
    fontWeight: '900',
    color: '#111111',
    marginBottom: 8,
    marginTop: 4,
    maxWidth: '70%',
    textAlign: 'center',
    letterSpacing: -0.5,
    textTransform: 'uppercase',
  }`;

if (code.includes('title: {') && !code.includes('maxWidth:')) {
  code = code.replace(/title: \{\s*fontSize: 28[\s\S]*?\}/, newStyles);
}

// Add top anti-bounce filler to Weather as well to be safe
if (!code.includes("position: 'absolute', top: -1000")) {
  code = code.replace(
    "<View style={styles.header}>",
    "<View style={{ position: 'absolute', top: -1000, left: 0, right: 0, height: 1000, backgroundColor: '#F4F5F7' }} />\n        <View style={styles.header}>"
  );
}

// Adjust the backButton to have the same spacing logic
code = code.replace(
  "top: 60,\n    zIndex: 10",
  "top: 60,\n    zIndex: 10,\n    width: 40,\n    height: 40,\n    justifyContent: 'center',\n    alignItems: 'center'"
);

fs.writeFileSync('screens/WeatherScreen.js', code);

const fs = require('fs');

// Empty the map style so it reverts to default light
fs.writeFileSync('screens/MapStyle.json', JSON.stringify([], null, 2));

// Update RunScreen.js
let code = fs.readFileSync('screens/RunScreen.js', 'utf8');

// The most critical bug: formatDuration is missing:
if (!code.includes('formatDuration(') || !code.includes('const formatDuration')) {
  // Let's just define it before the RunScreen component
  const formatDurationFunc = `\nconst formatDuration = (totalSeconds) => {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  if (h > 0) return \`\${h}:\${m < 10 ? '0'+m : m}:\${s < 10 ? '0'+s : s}\`;
  return \`\${m < 10 ? '0'+m : m}:\${s < 10 ? '0'+s : s}\`;
};\n\nexport default function RunScreen({ route, navigation }) {`;

  code = code.replace("export default function RunScreen({ route, navigation }) {", formatDurationFunc);
}

// Restore arrow-back to dark color
code = code.replace(
  '<Ionicons name="arrow-back" size={28} color="#FFF" />',
  '<Ionicons name="arrow-back" size={28} color="#333" />'
);

// Restore Polyline color to green
code = code.replace(
  'strokeColor="#E11D48"',
  'strokeColor="#24C789"'
);

fs.writeFileSync('screens/RunScreen.js', code);
console.log('RunScreen.js restored to light theme and fixed formatDuration blank bug');

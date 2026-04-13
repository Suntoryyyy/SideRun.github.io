const fs = require('fs');

let code = fs.readFileSync('screens/RunScreen.js', 'utf-8');

const regex = /const FloatingEmoji = \(\{ emoji, index \}\) => \{[\s\S]*?  \);\n\};\n\n\/\/ Conditionally import MapView/;

code = code.replace(regex, "// Conditionally import MapView");

// Let's also fix my injected `liveEmojis.map`
code = code.replace(
  `<FloatingEmoji key={c.id} emoji={c.emoji} index={i} />`,
  `<FloatingEmoji key={c.id} emoji={c.emoji} onComplete={() => setLiveEmojis(prev => prev.filter(e => e.id !== c.id))} />`
);

fs.writeFileSync('screens/RunScreen.js', code);

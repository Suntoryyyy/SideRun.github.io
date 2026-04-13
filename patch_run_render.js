const fs = require('fs');

let code = fs.readFileSync('screens/RunScreen.js', 'utf-8');

const target = `        {cheers.map((cheer, index) => (
          <View key={index} style={[styles.cheerBubble, { top: 50 + index * 60 }]}>
            <Text style={styles.cheerText}>{cheer.emoji}</Text>`;

const replacement = `        {liveEmojis.map((c, i) => (
          <FloatingEmoji key={c.id} emoji={c.emoji} index={i} />
        ))}

        {cheers.map((cheer, index) => (
          <View key={index} style={[styles.cheerBubble, { top: 50 + index * 60 }]}>
            <Text style={styles.cheerText}>{cheer.emoji}</Text>`;

if (!code.includes('<FloatingEmoji key={c.id}')) {
  code = code.replace(target, replacement);
  fs.writeFileSync('screens/RunScreen.js', code);
}

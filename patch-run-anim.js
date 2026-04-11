const fs = require('fs');
let code = fs.readFileSync('screens/RunScreen.js', 'utf8');

// Add Animated to imports
if (!code.includes('Animated')) {
  code = code.replace(
    "  Image\n}",
    "  Image,\n  Animated\n}"
  );
}

// Write the FloatingEmoji component at the top
const floatingEmojiCode = `
// --- FLOATING EMOJI COMPONENT ---
const FloatingEmoji = ({ emoji, onComplete }) => {
  const translateY = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  const scale = useRef(new Animated.Value(0.5)).current;
  const translateX = useRef(new Animated.Value(0)).current;

  // Randomize the horizontal drift
  const randomDrift = (Math.random() - 0.5) * 100;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -300, // Float upwards
        duration: 2500,
        useNativeDriver: true,
      }),
      Animated.timing(translateX, {
        toValue: randomDrift, // Drift sideways
        duration: 2500,
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.spring(scale, {
          toValue: 2, // Pop in
          friction: 3,
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 1.5,
          duration: 2000,
          useNativeDriver: true,
        })
      ]),
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0, // Fade out at the end
          delay: 1800,
          duration: 500,
          useNativeDriver: true,
        })
      ])
    ]).start(() => {
      if (onComplete) onComplete();
    });
  }, []);

  return (
    <Animated.View
      style={{
        position: 'absolute',
        bottom: 120, // Start just above the bottom panel
        right: 40,
        transform: [
          { translateY },
          { translateX },
          { scale }
        ],
        opacity,
        zIndex: 999,
        elevation: 999,
      }}
    >
      <Text style={{ fontSize: 48, textShadowColor: 'rgba(0,0,0,0.3)', textShadowOffset: {width: 0, height: 2}, textShadowRadius: 4 }}>{emoji}</Text>
    </Animated.View>
  );
};
// ---------------------------------
`;

code = code.replace(
  "import { useRunTracking } from '../hooks/useRunTracking';",
  floatingEmojiCode + "\nimport { useRunTracking } from '../hooks/useRunTracking';"
);

// Update the sendCheer function to not auto-delete after 3s, let the component handle it or keep a unique ID
code = code.replace(
  "  const sendCheer = () => {\n    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);\n    const emojis = ['💪', '🔥', '🏃‍♂️', '🎉', '👍'];\n    const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];\n    setCheers(prev => [...prev, { emoji: randomEmoji, time: Date.now() }]);\n    setTimeout(() => {\n      setCheers(prev => prev.slice(1));\n    }, 3000);\n  };",
  "  const sendCheer = (specificEmoji = null) => {\n    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);\n    const emojis = ['💪', '🔥', '🏃‍♂️', '🎉', '👍', '⚡️', '🚀'];\n    const emojiToUse = specificEmoji || emojis[Math.floor(Math.random() * emojis.length)];\n    const newCheer = { id: Date.now() + Math.random(), emoji: emojiToUse };\n    setCheers(prev => [...prev, newCheer]);\n  };\n\n  const removeCheer = (id) => {\n    setCheers(prev => prev.filter(c => c.id !== id));\n  };"
);

// Inject the floating emojis into the JSX right before the Bottom Panel
code = code.replace(
  "{/* Bottom Panel */}",
  "{/* Floating Emojis Rendered Here */}\n        {cheers.map(cheer => (\n          <FloatingEmoji \n            key={cheer.id} \n            emoji={cheer.emoji} \n            onComplete={() => removeCheer(cheer.id)}\n          />\n        ))}\n\n        {/* Bottom Panel */}"
);

fs.writeFileSync('screens/RunScreen.js', code);
console.log('RunScreen animations injected');

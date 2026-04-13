const fs = require('fs');

let code = fs.readFileSync('screens/RunScreen.js', 'utf-8');

// 1. Imports
code = code.replace(
  "import * as Haptics from 'expo-haptics';",
  "import * as Haptics from 'expo-haptics';\nimport * as Speech from 'expo-speech';\nimport { supabase } from '../services/supabase';"
);

// 2. Floating Emoji Component (add it before the map import checks context)
code = code.replace(
  "// Conditionally import MapView",
  `const FloatingEmoji = ({ emoji, index }) => {
  const animY = useRef(new Animated.Value(0)).current;
  const animOpacity = useRef(new Animated.Value(1)).current;
  const shiftX = (Math.random() - 0.5) * 100; // random slight x offset

  useEffect(() => {
    Animated.parallel([
      Animated.timing(animY, {
        toValue: -400,
        duration: 3000,
        useNativeDriver: true,
      }),
      Animated.timing(animOpacity, {
        toValue: 0,
        duration: 3000,
        delay: 500,
        useNativeDriver: true,
      })
    ]).start();
  }, []);

  return (
    <Animated.Text
      style={{
        position: 'absolute',
        bottom: 250 + (index * 10),
        alignSelf: 'center',
        left: '40%',
        marginLeft: shiftX,
        fontSize: 70,
        transform: [{ translateY: animY }],
        opacity: animOpacity,
        zIndex: 999,
        textShadowColor: 'rgba(0,0,0,0.2)',
        textShadowOffset: {width: 0, height: 2},
        textShadowRadius: 4,
      }}
    >
      {emoji}
    </Animated.Text>
  );
};

// Conditionally import MapView`
);

// 3. State and useEffect for Supabase Realtime
const stateInjection = `  const [liveEmojis, setLiveEmojis] = useState([]);

  useEffect(() => {
    let cheerSub;
    AsyncStorage.getItem('currentUser').then(c => {
      if (c) {
        const cu = JSON.parse(c);
        const myId = cu.id || cu.phone; // Fallback to phone if no ID
        
        cheerSub = supabase
          .channel('public:live_cheers')
          .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'live_cheers' }, payload => {
             const newCheer = payload.new;
             // Check if it's meant for us (receiver_id matches our id or phone)
             if (newCheer.receiver_id === myId || newCheer.receiver_id === cu.phone || newCheer.receiver_id === cu.username) {
               Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
               
               if (newCheer.message) {
                 Speech.speak(\`\${newCheer.message}\`, { rate: 0.95 });
               }

               const cheerId = Date.now().toString() + Math.random();
               setLiveEmojis(prev => [...prev, { id: cheerId, emoji: newCheer.emoji || '🔥' }]);
               
               setTimeout(() => {
                 setLiveEmojis(prev => prev.filter(c => c.id !== cheerId));
               }, 3500);
             }
          })
          .subscribe();
      }
    });

    return () => {
      if (cheerSub) supabase.removeChannel(cheerSub);
    };
  }, []);

  const {`;

code = code.replace(
  "  const {\n    isRunning,",
  stateInjection + "\n    isRunning,"
);

// 4. Render FloatingEmojis
const mapRenderInjection = `        {liveEmojis.map((c, i) => (
          <FloatingEmoji key={c.id} emoji={c.emoji} index={i} />
        ))}`;

code = code.replace(
  "</View>\n      <View style={styles.topBar}>",
  mapRenderInjection + "\n      </View>\n      <View style={styles.topBar}>"
);


fs.writeFileSync('screens/RunScreen.js', code);

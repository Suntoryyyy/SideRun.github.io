const fs = require('fs');
let code = fs.readFileSync('screens/RunScreen.js', 'utf-8');

// 1. IMPORT expo-av and useRef
if (!code.includes("import { Audio }")) {
  code = code.replace(
    "import * as Speech from 'expo-speech';",
    "import * as Speech from 'expo-speech';\nimport { Audio } from 'expo-av';"
  );
}

// 2. Insert Debounce/Audio Ducking/Combo State right inside the component start
const hookInjection = `  const [liveEmojis, setLiveEmojis] = useState([]);
  const cheerQueue = useRef([]);
  const isPlayingCheer = useRef(false);

  // Background Audio Ducking Init
  useEffect(() => {
    Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      staysActiveInBackground: true,
      interruptionModeIOS: 1, // DO_NOT_MIX (lowers background volume)
      playsInSilentModeIOS: true,
      shouldDuckAndroid: true,
      interruptionModeAndroid: 1,
      playThroughEarpieceAndroid: false
    });
  }, []);

  const processCheerQueue = async () => {
    if (isPlayingCheer.current || cheerQueue.current.length === 0) return;
    isPlayingCheer.current = true;

    // Detect Combo (if multiple identical emojis arrive at once)
    const currentCheer = cheerQueue.current.shift();
    let comboCount = 1;
    while(cheerQueue.current.length > 0 && cheerQueue.current[0].emoji === currentCheer.emoji) {
      comboCount++;
      cheerQueue.current.shift(); // absorb
    }

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      
      const messageToSpeak = comboCount > 2 
        ? \`\${comboCount} times \${currentCheer.emoji}! \${currentCheer.message}\`
        : currentCheer.message;

      if (messageToSpeak) {
        Speech.speak(messageToSpeak, { 
          rate: 0.95,
          onStart: async () => {
            // Audio ducking naturally handles background music lowering
          },
          onDone: () => {
            isPlayingCheer.current = false;
            setTimeout(processCheerQueue, 300); // Check if more in queue
          },
          onError: () => {
            isPlayingCheer.current = false;
            processCheerQueue();
          }
        });
      } else {
        isPlayingCheer.current = false;
        processCheerQueue();
      }
    } catch(err) {
      isPlayingCheer.current = false;
      processCheerQueue();
    }
  };`;

// Replace old state hook
code = code.replace("  const [liveEmojis, setLiveEmojis] = useState([]);", hookInjection);

// 3. Update the realtime listener payload handler
const oldPayloadHandler = `             if (newCheer.receiver_id === myId || newCheer.receiver_id === cu.phone || newCheer.receiver_id === cu.username) {
               Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
               
               if (newCheer.message) {
                 Speech.speak(\`\${newCheer.message}\`, { rate: 0.95 });
               }

               const cheerId = Date.now().toString() + Math.random();
               setLiveEmojis(prev => [...prev, { id: cheerId, emoji: newCheer.emoji || '🔥' }]);
               
               setTimeout(() => {
                 setLiveEmojis(prev => prev.filter(c => c.id !== cheerId));
               }, 3500);
             }`;

const newPayloadHandler = `             if (newCheer.receiver_id === myId || newCheer.receiver_id === cu.phone || newCheer.receiver_id === cu.username) {
               const cheerId = Date.now().toString() + Math.random();
               
               // Render visual element immediately (max limit 15 to prevent lag)
               setLiveEmojis(prev => {
                 const limited = prev.length > 15 ? prev.slice(-14) : prev;
                 return [...limited, { id: cheerId, emoji: newCheer.emoji || '🔥' }];
               });

               // Queue up audio to prevent overlapping speech
               cheerQueue.current.push({ ...newCheer });
               processCheerQueue();
             }`;

code = code.replace(oldPayloadHandler, newPayloadHandler);

fs.writeFileSync('screens/RunScreen.js', code);

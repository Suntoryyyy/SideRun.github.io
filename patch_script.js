const fs = require('fs');
let code = fs.readFileSync('screens/RunScreen.js', 'utf-8');

const startMarker = "export default function RunScreen({ route, navigation }) {";
const endMarker = "const currentPace = (runData.distance > 0) ? ((durationInSeconds / 60) / runData.distance).toFixed(1) : '0.0';";

const newLogic = `
import { useRunTracking } from '../hooks/useRunTracking';

export default function RunScreen({ route, navigation }) {
  const { mode = 'solo' } = route?.params || {};
  const [isPanelCollapsed, setIsPanelCollapsed] = useState(false);
  const [friendsWatching, setFriendsWatching] = useState(2);
  const [userAvatar, setUserAvatar] = useState(null);
  const [cheers, setCheers] = useState([]);
  const [visibilityScope, setVisibilityScope] = useState('friends');

  const {
    isRunning,
    isPaused,
    durationInSeconds,
    runData,
    currentLocation,
    region,
    liveFriends,
    startRun,
    pauseRun,
    resumeRun,
    stopRun,
  } = useRunTracking(visibilityScope, userAvatar, navigation, mode);

  const togglePanel = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsPanelCollapsed(!isPanelCollapsed);
  };

  useEffect(() => {
    loadUserAvatar();
  }, []);

  const loadUserAvatar = async () => {
    try {
      const currentUser = await AsyncStorage.getItem('currentUser');
      if (currentUser) {
        const users = await AsyncStorage.getItem('users');
        if (users) {
          const parsedUsers = JSON.parse(users);
          const found = parsedUsers.find(u => u.username === currentUser);
          if (found && found.avatar) setUserAvatar(found.avatar);
        }
      }
    } catch (e) {
      console.log(e);
    }
  };

  const sendCheer = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const emojis = ['💪', '🔥', '🏃‍♂️', '🎉', '👍'];
    const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
    setCheers(prev => [...prev, { emoji: randomEmoji, time: Date.now() }]);
    setTimeout(() => {
      setCheers(prev => prev.slice(1));
    }, 3000);
  };

  const currentPace = (runData.distance > 0) ? ((durationInSeconds / 60) / runData.distance).toFixed(1) : '0.0';
`;

const replaceStart = code.indexOf(startMarker);
const replaceEnd = code.indexOf(endMarker) + endMarker.length;

if (replaceStart !== -1 && replaceEnd !== -1) {
  const updatedCode = code.substring(0, replaceStart) + newLogic + code.substring(replaceEnd);
  // Also clean up imports
  const finalCode = updatedCode.replace("import * as Location from 'expo-location';", "");
  fs.writeFileSync('screens/RunScreen.js', finalCode, 'utf-8');
  console.log('Success');
} else {
  console.log('Markers not found');
}

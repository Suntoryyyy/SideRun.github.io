const fs = require('fs');

let code = fs.readFileSync('screens/RunScreen.js', 'utf8');

// Regex to capture mapContainer and everything inside it
const mapRegex = /(<View style=\{styles\.mapContainer\}>[\s\S]*?)(?=\s*<Animated\.View\n\s*style=\{\[\n\s*styles\.dashboardContainer,)/m;

const match = code.match(mapRegex);
if (!match) {
  console.log("Regex failed to find map container.");
  process.exit(1);
}

const originalMapContainer = match[1];

let newMapComponent = `import React from 'react';
import { View, Text, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Polyline, Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import MapStyle from '../../screens/MapStyle.json';
import { Image } from 'expo-image';
import styles from '../../styles/RunScreenStyles';

const FloatingEmoji = ({ emoji, onComplete }) => {
  const [anim] = React.useState(new Animated.Value(0));

  React.useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration: 2000,
      useNativeDriver: true,
    }).start(onComplete);
  }, []);

  return (
    <Animated.View
      style={[
        styles.floatingEmoji,
        {
          bottom: anim.interpolate({
            inputRange: [0, 1],
            outputRange: [100, 400],
          }),
          opacity: anim.interpolate({
            inputRange: [0, 0.8, 1],
            outputRange: [1, 1, 0],
          }),
        },
      ]}
    >
      <Text style={styles.floatingEmojiText}>{emoji}</Text>
    </Animated.View>
  );
};

const RunMapMemo = React.memo(({
  navigation,
  region,
  currentLocation,
  runData,
  mapRef,
  userAvatar,
  visibilityScope,
  isRunning,
  liveFriends,
  liveEmojis,
  cheers,
  recenterMap
}) => {
  return (
    ${originalMapContainer.trim().replace(/Animated/g, "import_Animated")}
  );
}, (prevProps, nextProps) => {
  // Prevent re-render when only durationInSeconds (timer) changes!
  return (
    prevProps.region === nextProps.region &&
    prevProps.currentLocation === nextProps.currentLocation &&
    prevProps.runData.coordinates.length === nextProps.runData.coordinates.length &&
    prevProps.liveEmojis.length === nextProps.liveEmojis.length &&
    prevProps.cheers.length === nextProps.cheers.length &&
    prevProps.isRunning === nextProps.isRunning
  );
});

export default RunMapMemo;
`;

// Fix Animated in the extracted code
newMapComponent = newMapComponent.replace(/import_Animated/g, "Animated");
newMapComponent = "import { Animated } from 'react-native';\n" + newMapComponent;

fs.writeFileSync('components/RunScreenUI/RunMapMemo.js', newMapComponent);

const replacedRunScreen = code.replace(
  originalMapContainer,
  `      <RunMapMemo 
        navigation={navigation}
        region={region}
        currentLocation={currentLocation}
        runData={runData}
        mapRef={mapRef}
        userAvatar={userAvatar}
        visibilityScope={visibilityScope}
        isRunning={isRunning}
        liveFriends={liveFriends}
        liveEmojis={liveEmojis}
        cheers={cheers}
        recenterMap={recenterMap}
        setLiveEmojis={setLiveEmojis}
      />\n`
);

let finalRunCode = replacedRunScreen.replace(
  "import MapStyle from \"./MapStyle.json\";",
  "import MapStyle from \"./MapStyle.json\";\nimport RunMapMemo from \"../components/RunScreenUI/RunMapMemo\";"
);

// Remove FloatingEmoji from RunScreen since it's moved
finalRunCode = finalRunCode.replace(/const FloatingEmoji = \(\{[^}]+\}\) => \{[\s\S]+?return \([\s\S]+?<\/Animated\.View>\s*\);\s*\};/, "");

fs.writeFileSync('screens/RunScreen.js', finalRunCode);
console.log("Map Extracted successfully.");

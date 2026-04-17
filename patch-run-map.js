const fs = require('fs');

let code = fs.readFileSync('screens/RunScreen.js', 'utf8');

const mapBlockRegex = /(<View style=\{styles\.mapContainer\}>[\s\S]*?)<Animated\.View\n\s*style=\{\[\n\s*styles\.dashboard,\n\s*\{\n\s*transform: \[\{ translateY: panY \}\],\n\s*\},\n\s*\]\}/;

const match = code.match(mapBlockRegex);
if (!match) {
  console.log("Could not find map block.");
  process.exit(1);
}

const mapContainerStr = match[1];

const runMapMemoCode = `import React from 'react';
import { View, Text, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Polyline, Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import MapStyle from '../../screens/MapStyle.json';
import { Image } from 'expo-image';
import styles from '../../styles/RunScreenStyles';

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
  cheers
}) => {
  return (
    ${mapContainerStr.trim()}
  );
}, (prevProps, nextProps) => {
  // Only re-render the map if coordinates change or there's a new live emoji/cheer, preventing heavy map redraws on timer ticks
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

fs.writeFileSync('components/RunScreenUI/RunMapMemo.js', runMapMemoCode);

// Replace the block in RunScreen.js
const newCode = code.replace(
  mapContainerStr,
  `<RunMapMemo 
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
      />\n      `
);

// We also need to add the import to RunScreen.js
const finalCode = newCode.replace(
  "import MapStyle from \"./MapStyle.json\";",
  "import MapStyle from \"./MapStyle.json\";\nimport RunMapMemo from \"../components/RunScreenUI/RunMapMemo\";"
);

fs.writeFileSync('screens/RunScreen.js', finalCode);

console.log("Successfully extracted RunMapMemo.");

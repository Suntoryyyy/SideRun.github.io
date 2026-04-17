const fs = require('fs');
let code = fs.readFileSync('screens/RunScreen.js', 'utf8');

const controlsRegex = /(<View style=\{styles\.controlsContainer\}>[\s\S]*?)(?=<\/Animated\.View>)/m;

const match = code.match(controlsRegex);
if (!match) {
  console.log("Regex failed to find controls.");
  process.exit(1);
}

const origControls = match[1];

const newControlsComp = `import React from 'react';
import { View, Text, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import styles from '../../styles/RunScreenStyles';

const SpectatorControls = ({ mode, isRunning, isPaused, isFinished, visibilityScope, setVisibilityScope, startRun, pauseRun, resumeRun, stopRun, closeRun, sendCheer, contentOpacity }) => {
  return (
    ${origControls.trim().replace(/Animated\.View/g, 'import_Animated.View')}
  );
};

export default SpectatorControls;
`;

const cleanedControlsComp = newControlsComp.replace(/import_Animated\.View/g, 'Animated.View');
fs.writeFileSync('components/RunScreenUI/SpectatorControls.js', cleanedControlsComp);

const replacedRunScreen = code.replace(
  origControls,
  `        <SpectatorControls\n          mode={mode}\n          isRunning={isRunning}\n          isPaused={isPaused}\n          isFinished={isFinished}\n          visibilityScope={visibilityScope}\n          setVisibilityScope={setVisibilityScope}\n          startRun={startRun}\n          pauseRun={pauseRun}\n          resumeRun={resumeRun}\n          stopRun={stopRun}\n          closeRun={closeRun}\n          sendCheer={sendCheer}\n          contentOpacity={contentOpacity}\n        />\n`
);

let finalRunCode = replacedRunScreen.replace(
  "import MetricDashboard from \"../components/RunScreenUI/MetricDashboard\";",
  "import MetricDashboard from \"../components/RunScreenUI/MetricDashboard\";\nimport SpectatorControls from \"../components/RunScreenUI/SpectatorControls\";"
);

fs.writeFileSync('screens/RunScreen.js', finalRunCode);
console.log("Controls Extracted successfully.");

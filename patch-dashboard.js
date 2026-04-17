const fs = require('fs');

let code = fs.readFileSync('screens/RunScreen.js', 'utf8');

const statsRegex = /(<View style=\{styles\.statsContainer\}>[\s\S]*?)(?=\s*<View style=\{styles\.controlsContainer\}>)/m;

const match = code.match(statsRegex);
if (!match) {
  console.log("Regex failed to find stats container.");
  process.exit(1);
}

const originalStatsContainer = match[1];

let newMetricComponent = `import React from 'react';
import { View, Text, Animated } from 'react-native';
import styles from '../../styles/RunScreenStyles';
import { formatDuration } from '../../utils/timeUtils';

const MetricDashboard = ({
  mode,
  spectateFriend,
  runData,
  durationInSeconds,
  currentSpeed,
  contentOpacity,
  friendsWatching,
  signalLost
}) => {
  return (
    ${originalStatsContainer.trim()}
  );
};

export default MetricDashboard;
`;

fs.writeFileSync('components/RunScreenUI/MetricDashboard.js', newMetricComponent);

const replacedRunScreen = code.replace(
  originalStatsContainer,
  `      <MetricDashboard
          mode={mode}
          spectateFriend={spectateFriend}
          runData={runData}
          durationInSeconds={durationInSeconds}
          currentSpeed={currentSpeed}
          contentOpacity={contentOpacity}
          friendsWatching={friendsWatching}
          signalLost={signalLost}
        />\n`
);

let finalRunCode = replacedRunScreen.replace(
  "import RunMapMemo from \"../components/RunScreenUI/RunMapMemo\";",
  "import RunMapMemo from \"../components/RunScreenUI/RunMapMemo\";\nimport MetricDashboard from \"../components/RunScreenUI/MetricDashboard\";"
);

fs.writeFileSync('screens/RunScreen.js', finalRunCode);
console.log("Dashboard Extracted successfully.");

const fs = require('fs');
let code = fs.readFileSync('screens/RunScreen.js', 'utf-8');

// 1. Add PROVIDER_GOOGLE
code = code.replace(
  "let MapView, Polyline, Marker;",
  "let MapView, Polyline, Marker, PROVIDER_GOOGLE;"
);
code = code.replace(
  "  Marker = Maps.Marker;\n}",
  "  Marker = Maps.Marker;\n  PROVIDER_GOOGLE = Maps.PROVIDER_GOOGLE;\n}"
);

// 2. Add provider={PROVIDER_GOOGLE} to MapView
code = code.replace(
  "          <MapView\n            style={styles.map}\n            region={region}",
  "          <MapView\n            style={styles.map}\n            provider={PROVIDER_GOOGLE}\n            region={region}"
);

// 3. Destructure isFinished, closeRun
code = code.replace(
  "    resumeRun,\n    stopRun,\n  } = useRunTracking",
  "    resumeRun,\n    stopRun,\n    isFinished,\n    closeRun,\n  } = useRunTracking"
);

// 4. Modify the bottom controls to show the Finished state
let newControls = `
          {isFinished ? (
            <View style={styles.activeControls}>
              <View style={styles.finishSummary}>
                <Text style={styles.finishTitle}>Run Completed!</Text>
                <Text style={styles.finishSubtitle}>{runData.distance.toFixed(2)} km  •  {Math.round(runData.calories)} kcal</Text>
              </View>
              <TouchableOpacity style={[styles.circleStartButton, { backgroundColor: '#222' }]} onPress={closeRun}>
                <Text style={styles.circleStartText}>DONE</Text>
              </TouchableOpacity>
            </View>
          ) : (!isRunning && !isPaused ? (
`;

code = code.replace(
  "          {!isRunning && !isPaused ? (",
  newControls
);

// Close the injected parenthesis
code = code.replace(
  "              <TouchableOpacity style={styles.circleStopButton} onPress={stopRun}>\n                <Text style={styles.circleButtonText}>FINISH</Text>\n              </TouchableOpacity>\n            </View>\n          )}",
  "              <TouchableOpacity style={styles.circleStopButton} onPress={stopRun}>\n                <Text style={styles.circleButtonText}>FINISH</Text>\n              </TouchableOpacity>\n            </View>\n          ))}"
);

// Also modify the Web Iframe embedded map bounding box slightly if necessary, let's keep layer=hot for web OSM if available.
code = code.replace(
  "layer=mapnik",
  "layer=mapnik" // keeping it same for now, OpenStreetMap mapnik is standard but hot is humanitarian. mapnik doesn't change color.
);

fs.writeFileSync('screens/RunScreen.js', code);
console.log('RunScreen patched');

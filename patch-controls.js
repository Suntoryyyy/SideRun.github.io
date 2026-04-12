const fs = require('fs');
let code = fs.readFileSync('screens/RunScreen.js', 'utf-8');

let newControls = `
        <View style={styles.controlsContainer}>
          {isFinished ? (
            <View style={styles.activeControls}>
              <View style={[styles.statBox, {marginRight: 20}]}>
                <Text style={styles.statValue}>Done!</Text>
                <Text style={styles.statLabel}>Completed</Text>
              </View>
              <TouchableOpacity style={styles.circleStartButton} onPress={closeRun}>
                <Text style={styles.circleStartText}>DONE</Text>
              </TouchableOpacity>
            </View>
          ) : !isRunning ? (
`;

code = code.replace(
  "        <View style={styles.controlsContainer}>\n          {!isRunning ? (",
  newControls
);

code = code.replace(
  "              <TouchableOpacity style={styles.circleStopButton} onPress={stopRun}>\n                <Text style={styles.circleButtonText}>FINISH</Text>\n              </TouchableOpacity>\n            </View>\n          )}",
  "              <TouchableOpacity style={styles.circleStopButton} onPress={stopRun}>\n                <Text style={styles.circleButtonText}>FINISH</Text>\n              </TouchableOpacity>\n            </View>\n          )}"
); // Wait, just need to close the ternary for isFinished.

fs.writeFileSync('screens/RunScreen.js', code);
console.log('Controls patched');

const fs = require('fs');

let runCode = fs.readFileSync('screens/RunScreen.js', 'utf-8');

// 1. Calculate the collapsed position differently.
// 3/4 height is expanded (panY = 0).
// Collapsed height should be around 220px to show distance, time, and pace.
// So, collapsed translate Y = (height * 0.75) - 200

// In injectCode, find the hook:
runCode = runCode.replace(
  "toValue: 200, // Move it down",
  "toValue: (height * 0.75) - 200, // Move it down to Keep-style minimized bar"
);

runCode = runCode.replace(
  "toValue: isPanelCollapsed ? 200 : 0,",
  "toValue: isPanelCollapsed ? (height * 0.75) - 200 : 0,"
);
runCode = runCode.replace(
  "toValue: isPanelCollapsed ? 200 : 0,",
  "toValue: isPanelCollapsed ? (height * 0.75) - 200 : 0,"
);

// We need to pass opacity for the Kcal and Scope Selector buttons based on panel state, so it fades out elegantly
const animatedInject = `
  const contentOpacity = panY.interpolate({
    inputRange: [0, (height * 0.75) - 210],
    outputRange: [1, 0],
    extrapolate: 'clamp'
  });
`;

runCode = runCode.replace(
  "const panY = useRef(new Animated.Value(0)).current;",
  "const panY = useRef(new Animated.Value(0)).current;\n" + animatedInject
);

// Update Scope Selector JSX in RunScreen.js to include emoji icons
const oldScopeRegex = /\{?\['public', 'friends', 'private'\]\.map\(\(scope\) => \([\s\S]*?\}\)\}/m;

const newScopeJSX = `
                {[
                  { id: 'public', label: 'Public', icon: '🌍' },
                  { id: 'friends', label: 'Friends', icon: '👥' },
                  { id: 'private', label: 'Private', icon: '🔒' }
                ].map((scope) => (
                  <TouchableOpacity
                    key={scope.id}
                    style={[styles.scopeBtn, visibilityScope === scope.id && styles.scopeBtnActive]}
                    onPress={() => setVisibilityScope(scope.id)}
                  >
                    <Text style={[styles.scopeBtnText, visibilityScope === scope.id && styles.scopeBtnTextActive]}>
                      {scope.icon} {scope.label}
                    </Text>
                  </TouchableOpacity>
                ))}
`;

runCode = runCode.replace(oldScopeRegex, newScopeJSX);

// Now apply contentOpacity to Kcal and Scope Selector.

// Stat Box for Kcal and Scope Selector Container logic:
// We'll wrap the 2nd stats column (Pace and Kcal) and adjust how it displays. But wait, Pace needs to show in collapsed state right?
// The user said: "at this status(collapsed), the bar only shows the distance, time, and the speed(pace)."
// And "at this status(expanded), the bar additionally shows the kcal burned and the selection of public, private and friend."

// Current JSX:
// <View style={[styles.statsRow, { marginTop: 24 }]}>
//   <View style={styles.statBox}> PACE </View>
//   <View style={styles.statBox}> KCAL </View>
// </View>

// New Structure to match Keep:
// We need Distance, Time, and Speed in ONE ROW or 3 columns so they all stay visible when collapsed.
// The KCAL and Scope Selector fade away.

const newStatsJSX = `
          <View style={styles.statsContainer}>
            {/* Top Row: Distance, Time, Speed (Always visible) */}
            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{runData.distance.toFixed(2)}</Text>
                <Text style={styles.statLabel}>KM</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{formatDuration(durationInSeconds)}</Text>
                <Text style={styles.statLabel}>TIME</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{currentPace}</Text>
                <Text style={styles.statLabel}>PACE(M/KM)</Text>
              </View>
            </View>
            
            {/* Bottom Row: Kcal Burned (Only Expanded) */}
            <Animated.View style={[styles.statsRow, { marginTop: 24, opacity: contentOpacity }]}>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{Math.round(runData.calories)}</Text>
                <Text style={styles.statLabel}>KCAL BURNED</Text>
              </View>
              <View style={styles.statBox}>
                {mode === 'shared' && (
                  <Text style={styles.friendsText}>👥 {friendsWatching} watching</Text>
                )}
              </View>
            </Animated.View>
          </View>
`;

runCode = runCode.replace(
  /<View style=\{styles\.statsContainer\}>(?:[\s\S]*?)<\/View>\n\s*\{mode === 'shared'[\s\S]*?<\/View>\n\s*\}/m,
  newStatsJSX
);

// We also need to wrap the Scope Selector container with Animated.View and contentOpacity so it hides
runCode = runCode.replace(
  /<View style=\{styles\.scopeSelectorContainer\}>/g,
  '<Animated.View style={[styles.scopeSelectorContainer, { opacity: contentOpacity }]}>'
);

runCode = runCode.replace(
  /<\/TouchableOpacity>\n\s*\}\)\]\}\n\s*<\/View>/m,
  '</TouchableOpacity>\n                ))}\n              </Animated.View>'
);

fs.writeFileSync('screens/RunScreen.js', runCode);

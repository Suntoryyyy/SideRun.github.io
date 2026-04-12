const fs = require('fs');
let code = fs.readFileSync('screens/RunScreen.js', 'utf-8');

// I need to adjust the Drag handle release numbers because we changed "200" to "height * 0.75 - 200". 
const correctPanY = `  const contentOpacity = panY.interpolate({
    inputRange: [0, Math.max((height * 0.75) - 260, 1)],
    outputRange: [1, 0],
    extrapolate: 'clamp'
  });`;

// Swap out old interpolate
// Check if the file successfully took the panY change.
const regex = /const contentOpacity = panY\.interpolate\(\{[\s\S]*?\}\);/;
code = code.replace(regex, correctPanY);

// Also need to rewrite the PanResponder logic using the screen heights accurately:

code = code.replace(
  "toValue: 200, // Move it down",
  "toValue: (height * 0.75) - 240, // Collapse keeping only top stats visible"
);

code = code.replace(
  "toValue: isPanelCollapsed ? 200 : 0,",
  "toValue: isPanelCollapsed ? (height * 0.75) - 240 : 0,"
);
code = code.replace(
  "toValue: isPanelCollapsed ? 200 : 0,",
  "toValue: isPanelCollapsed ? (height * 0.75) - 240 : 0,"
);

// We need to fix up the conditional rending of <Animated.View style={[styles.scopeSelectorContainer, { opacity: contentOpacity }]}>
// because previous JS script might have mismatched the closing tag.
// Let's use string operations manually.

fs.writeFileSync('screens/RunScreen.js', code);

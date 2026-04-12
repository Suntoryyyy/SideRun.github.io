const fs = require('fs');
let code = fs.readFileSync('screens/RunScreen.js', 'utf-8');

// Change the collapse boundary from 200 to 260
code = code.replace(
  "toValue: (height * 0.75) - 200, // Move it down to Keep-style minimized bar",
  "toValue: (height * 0.75) - 260, // Move it down to Keep-style minimized bar"
);

code = code.replace(
  "toValue: isPanelCollapsed ? (height * 0.75) - 200 : 0,",
  "toValue: isPanelCollapsed ? (height * 0.75) - 260 : 0,"
);
code = code.replace(
  "toValue: isPanelCollapsed ? (height * 0.75) - 200 : 0,",
  "toValue: isPanelCollapsed ? (height * 0.75) - 260 : 0,"
);

// We need to adjust the opacity fade-out bounds so it fades proportionally
code = code.replace(
  "inputRange: [0, (height * 0.75) - 210],",
  "inputRange: [0, Math.max((height * 0.75) - 270, 1)],"
);

fs.writeFileSync('screens/RunScreen.js', code);

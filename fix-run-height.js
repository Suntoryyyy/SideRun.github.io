const fs = require('fs');
let code = fs.readFileSync('screens/RunScreen.js', 'utf-8');

code = code.replace(
  "toValue: (height * 0.75) - 260, // Move it down to Keep-style minimized bar",
  "toValue: (height * 0.75) - 300, // Move it down to Keep-style minimized bar"
);

code = code.replace(
  /toValue: isPanelCollapsed \? \(height \* 0\.75\) - \d+ : 0,/g,
  "toValue: isPanelCollapsed ? (height * 0.75) - 300 : 0,"
);

code = code.replace(
  /inputRange: \[0, Math\.max\(\(height \* 0\.75\) - \d+, 1\)\],/,
  "inputRange: [0, Math.max((height * 0.75) - 320, 1)],"
);

fs.writeFileSync('screens/RunScreen.js', code);

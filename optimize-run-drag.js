const fs = require('fs');
let code = fs.readFileSync('screens/RunScreen.js', 'utf-8');

// Replace default animated spring with optimized physics parameters:
// tension: 65, friction: 10 -> Gives a snappy, non-bouncy, apple-like slide.
code = code.replace(
  "Animated.spring(panY, {\n            toValue: (height * 0.75) - 300, // Move it down to Keep-style minimized bar\n            useNativeDriver: false,\n          }).start",
  "Animated.spring(panY, {\n            toValue: (height * 0.75) - 300,\n            useNativeDriver: false,\n            tension: 65,\n            friction: 10\n          }).start"
);

code = code.replace(
  "Animated.spring(panY, {\n            toValue: 0,\n            useNativeDriver: false,\n          }).start",
  "Animated.spring(panY, {\n            toValue: 0,\n            useNativeDriver: false,\n            tension: 65,\n            friction: 10\n          }).start"
);

code = code.replace(
  "Animated.spring(panY, {\n            toValue: isPanelCollapsed ? (height * 0.75) - 300 : 0,\n            useNativeDriver: false,\n          }).start",
  "Animated.spring(panY, {\n            toValue: isPanelCollapsed ? (height * 0.75) - 300 : 0,\n            useNativeDriver: false,\n            tension: 65,\n            friction: 10\n          }).start"
);

code = code.replace(
  "Animated.spring(panY, {\n      toValue: isPanelCollapsed ? (height * 0.75) - 300 : 0,\n      useNativeDriver: false,\n    }).start",
  "Animated.spring(panY, {\n      toValue: isPanelCollapsed ? (height * 0.75) - 300 : 0,\n      useNativeDriver: false,\n      tension: 65,\n      friction: 10\n    }).start"
);

fs.writeFileSync('screens/RunScreen.js', code);

const fs = require('fs');
let code = fs.readFileSync('hooks/useRunTracking.js', 'utf-8');

// Add isFinished to state
code = code.replace(
  "const [isPaused, setIsPaused] = useState(false);",
  "const [isPaused, setIsPaused] = useState(false);\n  const [isFinished, setIsFinished] = useState(false);"
);

// In stopRun, remove navigation.goBack() and Alert, replace with setIsFinished(true)
code = code.replace(
  "Alert.alert('Run Completed!', `Distance: ${runData.distance.toFixed(2)} km\\nDuration: ${formatDuration(durationInSeconds)}`);",
  "// Removed Alert to show summary on screen"
);
code = code.replace(
  "navigation.goBack();",
  "setIsFinished(true);"
);

// Add closeRun method
code = code.replace(
  "  return {",
  "  const closeRun = () => {\n    setIsFinished(false);\n    navigation.goBack();\n  };\n\n  return {"
);

// Add isFinished and closeRun to return object
code = code.replace(
  "    pauseRun,\n    resumeRun,\n    stopRun,\n  };",
  "    pauseRun,\n    resumeRun,\n    stopRun,\n    isFinished,\n    closeRun,\n  };"
);

fs.writeFileSync('hooks/useRunTracking.js', code);
console.log('useRunTracking patched');

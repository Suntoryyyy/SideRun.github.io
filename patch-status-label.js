const fs = require('fs');
let code = fs.readFileSync('screens/RunScreen.js', 'utf8');

const rxUseTracking = /    isFinished,\n    closeRun,\n  \} = useRunTracking\(/m;
const repUseTracking = `    isFinished,\n    closeRun,\n    signalLost,\n  } = useRunTracking(`;
code = code.replace(rxUseTracking, repUseTracking);

const rxSpectatingLabel = /<Text style=\{styles\.friendsText\}>🔴 Spectating: \{spectateFriend\?.name \|\| "Friend"\} 🔥<\/Text>/;
const repSpectatingLabel = `<Text style={styles.friendsText}> {signalLost ? "🔴 信号较弱..." : "🟢 当前同步:"} {spectateFriend?.name || "Friend"} 🔥</Text>`;
code = code.replace(rxSpectatingLabel, repSpectatingLabel);

fs.writeFileSync('screens/RunScreen.js', code);

const fs = require('fs');
let code = fs.readFileSync('hooks/useRunTracking.js', 'utf8');

const regexVars = /const \[liveFriends, setLiveFriends\] = useState\(\[\]\);/;
const appendVars = `const [liveFriends, setLiveFriends] = useState([]);\n  const [signalLost, setSignalLost] = useState(false);\n  const lastUpdateTime = useRef(Date.now());`;
code = code.replace(regexVars, appendVars);

const regexSignalTimeout = /    const mockStartLat = 37.78825;/;
const insertSignalCheck = `    const mockStartLat = 37.78825;
      
    const heartbeat = setInterval(() => {
      if (Date.now() - lastUpdateTime.current > 10000) {
        setSignalLost(true);
      } else {
        setSignalLost(false);
      }
    }, 5000);\n`;
code = code.replace(regexSignalTimeout, insertSignalCheck);

const regexClearHeartbeat = /return \(\) => clearInterval\(interval\);/;
const insertClearHeartbeat = `return () => { clearInterval(interval); clearInterval(heartbeat); };`;
code = code.replace(regexClearHeartbeat, insertClearHeartbeat);

const exportRegex = /return \{\n    isRunning,\n    isPaused,/m;
const exportReplace = `return {\n    signalLost,\n    isRunning,\n    isPaused,`;
code = code.replace(exportRegex, exportReplace);

// add lastUpdateTime.current = Date.now() when generating mock location
const mockInsertRegex = /          return newLoc;\n        \}\);\n      \}\, 3000\);/m;
const mockInsertReplace = `          lastUpdateTime.current = Date.now();\n          return newLoc;\n        });\n      }, 3000);`;
code = code.replace(mockInsertRegex, mockInsertReplace);

fs.writeFileSync('hooks/useRunTracking.js', code);

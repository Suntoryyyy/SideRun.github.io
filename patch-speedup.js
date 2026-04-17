const fs = require('fs');
let runCode = fs.readFileSync('screens/RunScreen.js', 'utf8');

if (!runCode.includes("const myIdRef = useRef(\"Unknown\");")) {
  runCode = runCode.replace(/const cheerQueue = useRef\(\[\]\);/, 'const cheerQueue = useRef([]);\n  const myIdRef = useRef("Unknown");');
}

runCode = runCode.replace(
  /const myId = cu\.id \|\| cu\.phone; \/\/ Fallback to phone if no ID/,
  'const myId = cu.id || cu.phone || cu.username; \n        myIdRef.current = myId;'
);

const oldSendCheer = `    if (mode === "spectate" && spectateFriend) {
      let myId = "Unknown";
      try {
        const c = await AsyncStorage.getItem("currentUser");
        if (c) {
          const cu = JSON.parse(c);
          myId = cu.id || cu.phone || cu.username;
        }
      } catch (e) {}`;

const newSendCheer = `    if (mode === "spectate" && spectateFriend) {
      let myId = myIdRef.current;`;

runCode = runCode.replace(oldSendCheer, newSendCheer);

fs.writeFileSync('screens/RunScreen.js', runCode);

const fs = require('fs');
let code = fs.readFileSync('screens/RunScreen.js', 'utf8');

const oldEffect = `  useEffect(() => {
    let cheerSub;
    AsyncStorage.getItem("currentUser").then((c) => {
      if (c) {
        const cu = JSON.parse(c);
        const myId = cu.id || cu.phone || cu.username; 
        myIdRef.current = myId;

        cheerSub = supabase`;

const newEffect = `  useEffect(() => {
    let cheerSub;
    let isMounted = true;
    AsyncStorage.getItem("currentUser").then((c) => {
      if (!isMounted) return;
      if (c) {
        const cu = JSON.parse(c);
        const myId = cu.id || cu.phone || cu.username; 
        myIdRef.current = myId;

        cheerSub = supabase`;

code = code.replace(oldEffect, newEffect);

const oldCleanup = `    return () => {
      if (cheerSub) supabase.removeChannel(cheerSub);
    };`;

const newCleanup = `    return () => {
      isMounted = false;
      if (cheerSub) supabase.removeChannel(cheerSub);
    };`;

code = code.replace(oldCleanup, newCleanup);
fs.writeFileSync('screens/RunScreen.js', code);

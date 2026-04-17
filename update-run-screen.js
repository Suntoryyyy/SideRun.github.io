const fs = require('fs');
let code = fs.readFileSync('screens/RunScreen.js', 'utf8');

if (!code.includes("const user = useUserStore((s) => s.user);")) {
  code = code.replace(
    /const \[isPanelCollapsed, setIsPanelCollapsed\] = useState\(false\);/,
    `const user = useUserStore((s) => s.user);\n  const [isPanelCollapsed, setIsPanelCollapsed] = useState(false);`
  );
}

// 1. Remove AsyncStorage loadUser
const loadUserRegex = /  const loadUser = async \(\) => \{\n    try \{\n      const c = await AsyncStorage\.getItem\("currentUser"\);\n      if \(c\) \{\n        const currentUser = JSON\.parse\(c\);\n        if \(currentUser\.avatar\) setUserAvatar\(currentUser\.avatar\);\n\n        \/\/ Fetch latest from DB\n        if \(currentUser\.id\) \{\n          const \{ data \} = await supabase\n            \.from\("users"\)\n            \.select\("avatar"\)\n            \.eq\("id", currentUser\.id\)\n            \.single\(\);\n          if \(data && data\.avatar\) setUserAvatar\(data\.avatar\);\n        \}\n      \}\n    \} catch \(e\) \{\n      console\.log\(e\);\n    \}\n  \};\n\n  useEffect\(\(\) => \{\n    loadUser\(\);\n  \}, \[\]\);/g;

code = code.replace(loadUserRegex, '');

// Since userAvatar state was removed, map user.avatar
code = code.replace(/    loadUser\(\);\n  \}\, \[\]\);/, ''); // Catch any trailing
code = code.replace(
  /const \[userAvatar, setUserAvatar\] = useState\(null\);/,
  `const userAvatar = user?.avatar;`
);

// 2. Refactor useEffect for cheerSub
const effectRegex = /    let isMounted = true;\n    AsyncStorage\.getItem\("currentUser"\)\.then\(\(c\) => \{\n      if \(!isMounted\) return;\n      if \(c\) \{\n        const cu = JSON\.parse\(c\);\n        const myId = cu\.id \|\| cu\.phone \|\| cu\.username; \n        myIdRef\.current = myId;\n\n        cheerSub = supabase/;

const replaceEffect = `    let isMounted = true;\n    if (user && isMounted) {\n      const myId = user.id || user.phone || user.username;\n      myIdRef.current = myId;\n\n      cheerSub = supabase`;

code = code.replace(effectRegex, replaceEffect);

// Fix trailing `});` of the old promise
const effectTailRegex = /\) \/\/ from subscribe\(\)\n          \.subscribe\(\);\n      \}\n    \}\);\n\n    return \(\) => \{/g;
const replaceEffectTail = `) // from subscribe()\n          .subscribe();\n    }\n\n    return () => {`;
code = code.replace(effectTailRegex, replaceEffectTail);

fs.writeFileSync('screens/RunScreen.js', code);

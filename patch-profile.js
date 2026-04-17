const fs = require('fs');
let code = fs.readFileSync('screens/ProfileScreen.js', 'utf8');

const regex = /const \[currentUser, setCurrentUser\] = useState\(null\);/;
code = code.replace(regex, `const currentUser = useUserStore((s) => s.user);\n  const updateProfile = useUserStore((s) => s.updateProfile);`);

const effectRegex = /  useEffect\(\(\) => \{\n    const loadUser = async \(\) => \{\n      try \{\n        const c = await AsyncStorage\.getItem\("currentUser"\);\n        if \(c\) \{\n          const cu = JSON\.parse\(c\);\n          setCurrentUser\(cu\);\n          setUsername\(cu\.username \|\| cu\.name \|\| ""\);\n          setAvatar\(cu\.avatar \|\| "👤"\);\n          setAllowFriendsViewRecord\(cu\.allowFriendsViewRecord !== false\);\n        \}\n      \} catch \(e\) \{\n        console\.log\("Profile load error", e\);\n      \}\n    \};\n    loadUser\(\);\n  \}, \[\]\);/;

code = code.replace(effectRegex, `  useEffect(() => {
    if (currentUser) {
      setUsername(currentUser.username || currentUser.name || "");
      setAvatar(currentUser.avatar || "👤");
      setAllowFriendsViewRecord(currentUser.allowFriendsViewRecord !== false);
    }
  }, [currentUser]);`);

const saveRegex = /await AsyncStorage\.setItem\(\n\s*"currentUser",\n\s*JSON\.stringify\(updatedUser\)\n\s*\);/g;
code = code.replace(saveRegex, 'await updateProfile(updatedUser);');

fs.writeFileSync('screens/ProfileScreen.js', code);

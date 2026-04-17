const fs = require('fs');

let appCode = fs.readFileSync('App.js', 'utf8');

// Use the new store in App
if (appCode.includes('import useUserStore')) {
    console.log('useUserStore already imported in App.js');
} else {
    appCode = appCode.replace(
        "import * as Font from 'expo-font';",
        "import * as Font from 'expo-font';\nimport useUserStore from './store/useUserStore';"
    );
}

// Swap out local state for Zustand in App
if (appCode.includes('const [isLoggedIn')) {
    appCode = appCode.replace(
        /const \[isLoggedIn, setIsLoggedIn\] = useState\(false\);\n  const \[isLoading, setIsLoading\] = useState\(true\);/,
        `const { initialize, isLoggedIn, isLoading, logout } = useUserStore();`
    );
}

// Remove local `checkLoginStatus` logic
const checkRegex = /  const checkLoginStatus = async \(\) => \{[\s\S]*?\};\n/m;
appCode = appCode.replace(checkRegex, '');

// Update `prepareApp` to just call store prepare
appCode = appCode.replace(/await checkLoginStatus\(\);/, "await initialize();");

// Replace handleLogout logic with store logic
const logoutRegex = /  const handleLogout = async \(\) => \{[\s\S]*?\};\n/m;
appCode = appCode.replace(logoutRegex, `
  const handleLogoutWrapper = async () => {
    try {
      if (global.account) await global.account.deleteSession('current');
    } catch (e) {}
    await logout();
  };
`);

// Replace prop injections
appCode = appCode.replace(/setLoggedIn=\{setIsLoggedIn\}/g, '');
appCode = appCode.replace(/handleLogout=\{handleLogout\}/g, 'handleLogout={handleLogoutWrapper}');

fs.writeFileSync('App.js', appCode);
console.log('App patched successfully');

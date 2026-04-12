const fs = require('fs');
let code = fs.readFileSync('App.js', 'utf-8');

// Replace imports
code = code.replace(
  "import { account } from './services/appwrite';",
  "import { supabase } from './services/supabase';"
);

// Replace handleLogout
code = code.replace(
  "  const handleLogout = async () => {\n    try {\n      await account.deleteSession('current');\n    } catch (e) {}\n\n    await AsyncStorage.removeItem('currentUser');\n    setIsLoggedIn(false);\n  };",
  "  const handleLogout = async () => {\n    try {\n      await supabase.auth.signOut();\n    } catch (e) {}\n\n    await AsyncStorage.removeItem('currentUser');\n    setIsLoggedIn(false);\n  };"
);

fs.writeFileSync('App.js', code);

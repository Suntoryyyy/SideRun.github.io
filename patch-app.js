const fs = require('fs');
let code = fs.readFileSync('App.js', 'utf-8');

if (!code.includes("import ChatScreen from './screens/ChatScreen';")) {
  code = code.replace(
    "import FriendsScreen from './screens/FriendsScreen';",
    "import FriendsScreen from './screens/FriendsScreen';\nimport ChatScreen from './screens/ChatScreen';"
  );
}

if (!code.includes("<Stack.Screen name=\"Chat\"")) {
  code = code.replace(
    "<Stack.Screen name=\"Main\" component={MainDrawer} options={{ headerShown: false }} />",
    "<Stack.Screen name=\"Main\" component={MainDrawer} options={{ headerShown: false }} />\n          <Stack.Screen name=\"Chat\" component={ChatScreen} options={{ presentation: 'modal', headerShown: false }} />"
  );
}

fs.writeFileSync('App.js', code);

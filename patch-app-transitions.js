const fs = require('fs');
let code = fs.readFileSync('App.js', 'utf8');

if (!code.includes('TransitionPresets')) {
  code = code.replace(
    "import { createStackNavigator } from '@react-navigation/stack';",
    "import { createStackNavigator, TransitionPresets } from '@react-navigation/stack';"
  );
  code = code.replace(
    "<Stack.Navigator screenOptions={{ headerShown: false }}>",
    "<Stack.Navigator screenOptions={{ headerShown: false, ...TransitionPresets.SlideFromRightIOS }}>"
  );
  fs.writeFileSync('App.js', code);
  console.log('App transitions added.');
}

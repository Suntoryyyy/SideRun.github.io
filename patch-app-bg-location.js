const fs = require('fs');
let code = fs.readFileSync('App.js', 'utf8');

const imports = `import * as TaskManager from 'expo-task-manager';
import * as Location from 'expo-location';

const BACKGROUND_LOCATION_TASK = "BACKGROUND_LOCATION_TASK";

TaskManager.defineTask(BACKGROUND_LOCATION_TASK, ({ data: { locations }, error }) => {
  if (error) {
    console.error(error);
    return;
  }
  if (locations) {
    // In a real app, you would sync this to AsyncStorage or Zustand here
    // For now we just define the task so the OS keeps the app alive
    console.log("Background location heartbeat:", locations.length);
  }
});\n\n`;

code = code.replace("import { StatusBar } from 'expo-status-bar';", imports + "import { StatusBar } from 'expo-status-bar';");

fs.writeFileSync('App.js', code);

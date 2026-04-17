const fs = require('fs');
let code = fs.readFileSync('hooks/useRunTracking.js', 'utf8');

const regex = /import \* as Location from "expo-location";/;
code = code.replace(regex, `import * as Location from "expo-location";
import * as TaskManager from 'expo-task-manager';

const BACKGROUND_LOCATION_TASK = "BACKGROUND_LOCATION_TASK";`);

const watchRegex = /        watchId\.current = await Location\.watchPositionAsync\(\{\n          accuracy: Location\.Accuracy\.High,\n          timeInterval: 1000,\n          distanceInterval: 1,\n        \}, location => \{/;

const watchReplacement = `        
        try {
          await Location.startLocationUpdatesAsync(BACKGROUND_LOCATION_TASK, {
            accuracy: Location.Accuracy.BestForNavigation,
            timeInterval: 1000,
            distanceInterval: 1,
            foregroundService: {
              notificationTitle: "SideRun is tracking your run",
              notificationBody: "Keep going! We are tracking your distance.",
            },
          });
        } catch (e) {
          console.warn("Failed to start background tracking", e);
        }

        watchId.current = await Location.watchPositionAsync({
          accuracy: Location.Accuracy.High,
          timeInterval: 1000,
          distanceInterval: 1,
        }, location => {`;

code = code.replace(watchRegex, watchReplacement);

const stopRegex = /if \(watchId.current\) \{\n      watchId.current.remove\(\);\n      watchId.current = null;\n    \}/;
const stopReplace = `if (watchId.current) {
      watchId.current.remove();
      watchId.current = null;
    }
    Location.hasStartedLocationUpdatesAsync(BACKGROUND_LOCATION_TASK).then(started => {
      if (started) {
        Location.stopLocationUpdatesAsync(BACKGROUND_LOCATION_TASK).catch(e => console.log(e));
      }
    });`;

code = code.replace(stopRegex, stopReplace);

fs.writeFileSync('hooks/useRunTracking.js', code);

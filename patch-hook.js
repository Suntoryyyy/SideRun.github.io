const fs = require('fs');
let code = fs.readFileSync('hooks/useRunTracking.js', 'utf8');

// Injecting spectate logic into useRunTracking
const spectateInit = `
  useEffect(() => {
    if (mode === "spectate" && navigation && navigation.getState) {
      // Mock tracking a friend
      setIsRunning(true);
      const mockStartLat = 37.78825;
      const mockStartLng = -122.4324;
      setCurrentLocation({ latitude: mockStartLat, longitude: mockStartLng });
      setRegion({
        latitude: mockStartLat,
        longitude: mockStartLng,
        latitudeDelta: 0.025,
        longitudeDelta: 0.025,
      });
      setDurationInSeconds(1240); // 20 minutes in
      setRunData({
        distance: 4.5,
        calories: 320,
        coordinates: [{ latitude: mockStartLat, longitude: mockStartLng }],
      });
      
      const interval = setInterval(() => {
        setRunData(prev => {
          const lastLoc = prev.coordinates[prev.coordinates.length - 1] || { latitude: mockStartLat, longitude: mockStartLng };
          const newLoc = {
            latitude: lastLoc.latitude + 0.0001,
            longitude: lastLoc.longitude + 0.0001
          };
          setCurrentLocation(newLoc);
          return {
            ...prev,
            distance: prev.distance + 0.015,
            calories: prev.calories + 1,
            coordinates: [...prev.coordinates, newLoc]
          };
        });
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [mode]);
`;

code = code.replace(/  const watchId = useRef\(null\);\n  const lastLocation = useRef\(null\);/, "  const watchId = useRef(null);\n  const lastLocation = useRef(null);\n" + spectateInit);
// Prevent real GPS in spectate mode
code = code.replace(/  useEffect\(\(\) => \{\n    requestLocationPermission\(\);\n/g, '  useEffect(() => {\n    if (mode !== "spectate") requestLocationPermission();\n');

fs.writeFileSync('hooks/useRunTracking.js', code);

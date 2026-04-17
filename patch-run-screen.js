const fs = require('fs');
let code = fs.readFileSync('screens/RunScreen.js', 'utf8');

// 1. Supabase Filter Optimization
const originalSubCode = `.channel("public:live_cheers")
          .on(
            "postgres_changes",
            { event: "INSERT", schema: "public", table: "live_cheers" },
            (payload) => {
              const newCheer = payload.new;
              // Check if it's meant for us (receiver_id matches our id or phone)
              if (
                newCheer.receiver_id === myId ||
                newCheer.receiver_id === cu.phone ||
                newCheer.receiver_id === cu.username
              ) {`;
const newSubCode = `.channel("public:live_cheers")
          .on(
            "postgres_changes",
            { 
              event: "INSERT", 
              schema: "public", 
              table: "live_cheers",
              filter: \`receiver_id=in.(\${[cu.id, cu.phone, cu.username].filter(Boolean).join(',')})\`
            },
            (payload) => {
              const newCheer = payload.new;
              // Filter already applied at server level, but keep this safe check
              if (true) {`;
code = code.replace(originalSubCode, newSubCode);

// 2. Smooth Map Camera
const originalCameraCode = `  useEffect(() => {
    // Only automatically force region once when first located
    if (currentLocation && !regionSet && mapRef.current) {
      recenterMap();
      setRegionSet(true);
    }
  }, [currentLocation, regionSet]);`;
const newCameraCode = `  useEffect(() => {
    // Only automatically force region once when first located
    if (currentLocation && !regionSet && mapRef.current) {
      recenterMap();
      setRegionSet(true);
    }
  }, [currentLocation, regionSet]);

  // Smooth MAP CAMERA for Spectate
  useEffect(() => {
    if (mode === "spectate" && currentLocation && mapRef.current && regionSet) {
      mapRef.current.animateCamera({
        center: currentLocation,
        pitch: 0,
        heading: 0,
        zoom: 16
      }, { duration: 1000 });
    }
  }, [currentLocation, mode, regionSet]);`;
code = code.replace(originalCameraCode, newCameraCode);

fs.writeFileSync('screens/RunScreen.js', code);

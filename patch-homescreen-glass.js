const fs = require('fs');
let code = fs.readFileSync('screens/HomeScreen.js', 'utf-8');

// Imports
code = code.replace(
  "import { View, Text, StyleSheet, TouchableOpacity, TouchableWithoutFeedback, ScrollView, Dimensions, Image, Animated } from 'react-native';",
  "import { View, Text, StyleSheet, TouchableOpacity, TouchableWithoutFeedback, ScrollView, Dimensions, Image, Animated, Platform } from 'react-native';\nimport { BlurView } from 'expo-blur';\nimport * as Location from 'expo-location';\nimport MapStyle from './MapStyle.json';\n\nlet MapView, PROVIDER_GOOGLE;\nif (Platform.OS !== 'web') {\n  const Maps = require('react-native-maps');\n  MapView = Maps.default;\n  PROVIDER_GOOGLE = Maps.PROVIDER_GOOGLE;\n}"
);

// State for map
code = code.replace(
  "  const [avatar, setAvatar] = useState(''); // no default fallback here to prefer the greeting without it if missing",
  "  const [avatar, setAvatar] = useState('');\n  const [region, setRegion] = useState({ latitude: 37.7749, longitude: -122.4194, latitudeDelta: 0.05, longitudeDelta: 0.05 });\n\n  useEffect(() => {\n    (async () => {\n      let { status } = await Location.requestForegroundPermissionsAsync();\n      if (status !== 'granted') return;\n      let location = await Location.getCurrentPositionAsync({});\n      setRegion({\n        latitude: location.coords.latitude,\n        longitude: location.coords.longitude,\n        latitudeDelta: 0.05,\n        longitudeDelta: 0.05,\n      });\n    })();\n  }, []);"
);

// Map Implementation in container
const mapBlock = `    <View style={styles.container}>
      {Platform.OS === 'web' ? (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: -1 }}>
          <iframe
            width="100%"
            height="100%"
            frameBorder="0"
            scrolling="no"
            src={\`https://www.openstreetmap.org/export/embed.html?bbox=\${region.longitude - 0.025},\${region.latitude - 0.025},\${region.longitude + 0.025},\${region.latitude + 0.025}&layer=mapnik\`}
            style={{ border: 'none', filter: 'brightness(0.9) grayscale(0.5)' }}
          />
        </div>
      ) : (
        <MapView
          style={StyleSheet.absoluteFillObject}
          provider={PROVIDER_GOOGLE}
          region={region}
          customMapStyle={MapStyle}
          showsUserLocation={false}
          pitchEnabled={false}
          rotateEnabled={false}
          scrollEnabled={false}
          zoomEnabled={false}
        />
      )}
      <ScrollView`;

code = code.replace(
  "    <View style={styles.container}>\n      <ScrollView",
  mapBlock
);

// Convert cards to BlurViews
code = code.replace(
  /        <View style={styles.card}>/g,
  `        <BlurView intensity={Platform.OS === 'web' ? 50 : 80} tint="light" style={styles.card}>`
);
code = code.replace(
  /        <\/View>\n\n        {\/\* Live Weather Preview \*\/}/g,
  `        </BlurView>\n\n        {/* Live Weather Preview */}`
);

// Actually, let's just replace all <View style={styles.card}> with BlurView manually by patching styles and tags.
// I will rewrite this replacing script.

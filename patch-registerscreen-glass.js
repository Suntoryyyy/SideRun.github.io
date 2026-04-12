const fs = require('fs');
let code = fs.readFileSync('screens/RegisterScreen.js', 'utf-8');

// 1. Imports
code = code.replace(
  "import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator } from 'react-native';",
  `import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator } from 'react-native';
import { BlurView } from 'expo-blur';
import * as Location from 'expo-location';\nimport { useEffect, useState } from 'react';`
);

// Add missing React hooks if not present
if (!code.includes("import React, { useState }")) {
    if (code.includes("import React")) {
        // it might just be imported already
    }
}

// 2. State & Map component
code = code.replace(
  "  const [alertConfig, setAlertConfig] = useState({ visible: false, title: '', message: '', type: 'error' });",
  `  const [alertConfig, setAlertConfig] = useState({ visible: false, title: '', message: '', type: 'error' });
  const [region, setRegion] = useState({ latitude: 37.7749, longitude: -122.4194 });

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      let location = await Location.getCurrentPositionAsync({});
      setRegion({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
    })();
  }, []);`
);

// 3. Render structure with Glassmorphism
const mapBgLogin = `    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      {/* Background Map */}
      {Platform.OS === 'web' ? (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: -1 }}>
          <iframe
            width="100%"
            height="100%"
            frameBorder="0"
            scrolling="no"
            src={\`https://www.openstreetmap.org/export/embed.html?bbox=\${region.longitude - 0.05},\${region.latitude - 0.05},\${region.longitude + 0.05},\${region.latitude + 0.05}&layer=mapnik\`}
            style={{ border: 'none', filter: 'brightness(0.9) grayscale(0.8)' }}
          />
        </div>
      ) : (
        <View style={StyleSheet.absoluteFillObject} backgroundColor="#EAEAEA" />
      )}

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <BlurView intensity={85} tint="light" style={styles.glassCard}>`;

code = code.replace(
  "    <KeyboardAvoidingView \n      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}\n      style={styles.container}\n    >\n      <ScrollView contentContainerStyle={styles.scrollContent}>",
  mapBgLogin
);

// Close out the BlurView before CustomAlert
code = code.replace(
  "        </View>\n      </ScrollView>",
  "        </View>\n        </BlurView>\n      </ScrollView>"
);

// 4. Update Styles
code = code.replace(
  "  container: {\n    flex: 1,\n    backgroundColor: '#FFFFFF',\n  },",
  "  container: {\n    flex: 1,\n    backgroundColor: 'transparent',\n  },\n  glassCard: {\n    backgroundColor: 'rgba(255, 255, 255, 0.75)',\n    borderRadius: 30,\n    padding: 30,\n    overflow: 'hidden',\n    borderWidth: 1,\n    borderColor: 'rgba(255, 255, 255, 0.9)',\n    shadowColor: '#000',\n    shadowOffset: { width: 0, height: 10 },\n    shadowOpacity: 0.15,\n    shadowRadius: 20,\n    elevation: 5,\n  },"
);

// Make Inputs Glassy
code = code.replace(
  /  input: \{\n    backgroundColor: '#F4F5F7',/g,
  "  input: {\n    backgroundColor: 'rgba(255, 255, 255, 0.9)',\n    borderWidth: 1,\n    borderColor: 'rgba(255, 255, 255, 1)',"
);
code = code.replace(
  /  passwordContainer: \{\n    flexDirection: 'row',\n    alignItems: 'center',\n    backgroundColor: '#F4F5F7',/g,
  "  passwordContainer: {\n    flexDirection: 'row',\n    alignItems: 'center',\n    backgroundColor: 'rgba(255, 255, 255, 0.9)',\n    borderWidth: 1,\n    borderColor: 'rgba(255, 255, 255, 1)',"
);

fs.writeFileSync('screens/RegisterScreen.js', code);
console.log('RegisterScreen rewritten to Glassmorphism map successfully.');

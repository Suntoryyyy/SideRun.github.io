const fs = require('fs');

let code = fs.readFileSync('screens/HomeScreen.js', 'utf8');

if (!code.includes('import { Animated, TouchableWithoutFeedback }')) {
  code = code.replace(
    "import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions, Image } from 'react-native';",
    "import { View, Text, StyleSheet, TouchableOpacity, TouchableWithoutFeedback, ScrollView, Dimensions, Image, Animated } from 'react-native';"
  );
}

// Add the scale state
if (!code.includes('const startButtonScale = useRef')) {
  code = code.replace(
    /const \[username, setUsername\] = useState\('Runner'\);/,
    "const startButtonScale = useRef(new Animated.Value(1)).current;\n  const [username, setUsername] = useState('Runner');"
  );
}

// Add animation functions
if (!code.includes('handlePressIn')) {
  const animFuncs = `  const handlePressIn = () => {
    Animated.spring(startButtonScale, {
      toValue: 0.92,
      useNativeDriver: true,
      speed: 20,
      bounciness: 10
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(startButtonScale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 20,
      bounciness: 10
    }).start();
  };

  const getGreeting`;

  code = code.replace("  const getGreeting", animFuncs);
}

// Update the float button JSX to use Animated.View
const originalButton = `<TouchableOpacity
          style={styles.startButton}
          activeOpacity={0.8}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            navigation.navigate('Run');
          }}
        >
          <Text style={styles.startButtonText}>START</Text>
        </TouchableOpacity>`;

const newButton = `<TouchableWithoutFeedback
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            navigation.navigate('Run');
          }}
        >
          <Animated.View style={[styles.startButton, { transform: [{ scale: startButtonScale }] }]}>
            <Text style={styles.startButtonText}>START</Text>
          </Animated.View>
        </TouchableWithoutFeedback>`;

code = code.replace(originalButton, newButton);

fs.writeFileSync('screens/HomeScreen.js', code);
console.log('HomeScreen Start Button Animation Added');

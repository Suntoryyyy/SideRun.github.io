const fs = require('fs');

let code = fs.readFileSync('screens/LoginScreen.js', 'utf-8');

// 1. Add Clear Data Function
let clearFunc = `
  const handleClearData = async () => {
    Alert.alert(
      "Reset App",
      "This will clear all local users and data. Are you sure?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Wipe Data", 
          style: "destructive", 
          onPress: async () => {
            await AsyncStorage.clear();
            if (Platform.OS === 'web') {
              localStorage.clear();
              sessionStorage.clear();
            }
            showAlert("Success", "All app data has been cleared. You can now start fresh.", "success");
          }
        }
      ]
    );
  };
`;
code = code.replace(
  "  const handleLogin = async () => {",
  clearFunc + "\n  const handleLogin = async () => {"
);

// 2. Add Wipe Data Button & Redesign Header
const oldHeader = `        <View style={styles.header}>
          <Text style={styles.title}>WELCOME BACK</Text>
          <Text style={styles.subtitle}>
            Log in to <Text style={styles.brandText}>SideRun</Text> to track your progress
          </Text>
        </View>`;

const newHeader = `        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Ionicons name="footsteps" size={48} color="#24C789" />
            <Text style={styles.logoText}>SIDERUN</Text>
          </View>
          <Text style={styles.title}>Back to the Track.</Text>
          <Text style={styles.subtitle}>
            Sign in to continue your fitness journey and connect with friends.
          </Text>
        </View>`;
code = code.replace(oldHeader, newHeader);

// 3. Add Wipe Button in Footer
const oldFooter = `          <View style={styles.footer}>
            <Text style={styles.footerText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={styles.registerText}>Sign Up</Text>
            </TouchableOpacity>
          </View>`;

const newFooter = `          <View style={styles.footer}>
            <Text style={styles.footerText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={styles.registerText}>Sign Up</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.clearDataButton} onPress={handleClearData}>
            <Ionicons name="trash-outline" size={16} color="#FF3B30" />
            <Text style={styles.clearDataText}>Developer: Wipe Data</Text>
          </TouchableOpacity>`;
code = code.replace(oldFooter, newFooter);

// 4. Update Styles
code = code.replace(
  "  title: {\n    fontSize: 36,\n    fontWeight: '900', // Extra bold for a sporty feel\n    color: '#111111',\n    marginBottom: 12,\n    letterSpacing: -0.5,\n  },",
  "  logoContainer: {\n    flexDirection: 'row',\n    alignItems: 'center',\n    marginBottom: 20,\n  },\n  logoText: {\n    fontSize: 32,\n    fontWeight: '900',\n    color: '#24C789',\n    marginLeft: 8,\n    letterSpacing: 1,\n    fontStyle: 'italic',\n  },\n  title: {\n    fontSize: 42,\n    fontWeight: '900',\n    color: '#111',\n    marginBottom: 12,\n    letterSpacing: -1,\n    lineHeight: 48,\n  },"
);

code = code.replace(
  "  subtitle: {\n    fontSize: 16,\n    color: '#888888',\n    lineHeight: 24,\n  },",
  "  subtitle: {\n    fontSize: 18,\n    color: '#555',\n    lineHeight: 26,\n    fontWeight: '500',\n  },"
);

const footerStyles = `
  clearDataButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 40,
    padding: 10,
    opacity: 0.7,
  },
  clearDataText: {
    color: '#FF3B30',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
});`;
code = code.replace("});", footerStyles);

fs.writeFileSync('screens/LoginScreen.js', code);
console.log('LoginScreen updated');

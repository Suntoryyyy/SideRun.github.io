const fs = require('fs');
let code = fs.readFileSync('screens/LoginScreen.js', 'utf-8');

// 1. Add ActivityIndicator import
code = code.replace(
  "import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';",
  "import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator } from 'react-native';"
);

// 2. Add isLoading state
code = code.replace(
  "  const [rememberMe, setRememberMe] = useState(true); // Default to true",
  "  const [rememberMe, setRememberMe] = useState(true); // Default to true\n  const [isLoading, setIsLoading] = useState(false);"
);

// 3. Update handleLogin
const newHandleLogin = `  const handleLogin = async () => {
    const trimmedPhone = phone.trim();

    if (!trimmedPhone || !password) {
      Alert.alert('Error', 'Please enter your phone number and password');
      return;
    }

    setIsLoading(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 800)); // Show loading animation
      const usersData = await AsyncStorage.getItem('users');
      const users = usersData ? JSON.parse(usersData) : {};

      if (users[trimmedPhone]) {
        if (users[trimmedPhone].password === password) {
          const userInfo = JSON.stringify({ phone: trimmedPhone, username: users[trimmedPhone].username });
          if (rememberMe) {
            await AsyncStorage.setItem('rememberedPhone', trimmedPhone);
            await AsyncStorage.setItem('currentUser', userInfo);
          } else {
            await AsyncStorage.removeItem('rememberedPhone');
            if (Platform.OS === 'web') {
              sessionStorage.setItem('currentUser', userInfo);
            } else {
              await AsyncStorage.setItem('currentUser', userInfo);
            }
          }
          setLoggedIn(true);
        } else {
          Alert.alert('Login Failed', 'The password you entered is incorrect.');
          setIsLoading(false);
        }
      } else {
        Alert.alert('Login Failed', 'This phone number is not registered.');
        setIsLoading(false);
      }
    } catch (e) {
      Alert.alert('Error', 'An error occurred during login');
      setIsLoading(false);
    }
  };`;

code = code.replace(/  const handleLogin = async \(\) => \{[\s\S]*?  \};/, newHandleLogin);

// 4. Remove handleClearData
code = code.replace(/  const handleClearData = async \(\) => \{[\s\S]*?  \};\n\n/, "");

// 5. Add loading UI to Button
code = code.replace(
  /<TouchableOpacity style=\{styles\.loginButton\} onPress=\{handleLogin\}>\s*<Text style=\{styles\.loginButtonText\}>LOG IN<\/Text>\s*<\/TouchableOpacity>/,
  `<TouchableOpacity style={styles.loginButton} onPress={handleLogin} disabled={isLoading}>
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.loginButtonText}>LOG IN</Text>
            )}
          </TouchableOpacity>`
);

// 6. Remove devClearButton UI
code = code.replace(/          <TouchableOpacity style=\{styles\.devClearButton\} onPress=\{handleClearData\}>\s*<Text style=\{styles\.devClearText\}>Wipe All User Data \(Dev Tool\)<\/Text>\s*<\/TouchableOpacity>/, "");

// 7. Remove devClear styles
code = code.replace(/  devClearButton: \{[\s\S]*?  \},/, "");
code = code.replace(/  devClearText: \{[\s\S]*?  \},/, "");

fs.writeFileSync('screens/LoginScreen.js', code, 'utf-8');
console.log('LoginScreen patched.');

const fs = require('fs');
let code = fs.readFileSync('screens/RegisterScreen.js', 'utf-8');

// 1. Add ActivityIndicator import
code = code.replace(
  "import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';",
  "import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator } from 'react-native';"
);

// 2. Add isLoading state
code = code.replace(
  "  const [password, setPassword] = useState('');",
  "  const [password, setPassword] = useState('');\n  const [isLoading, setIsLoading] = useState(false);"
);

// 3. Update handleRegister
const newHandleRegister = `  const handleRegister = async () => {
    const trimmedPhone = phone.trim();
    const trimmedUsername = username.trim();

    if (!trimmedPhone || !trimmedUsername || !password) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }

    setIsLoading(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 800)); // Show loading animation
      const usersData = await AsyncStorage.getItem('users');
      const users = usersData ? JSON.parse(usersData) : {};

      const isUsernameTaken = Object.values(users).some(
        user => user.username.toLowerCase() === trimmedUsername.toLowerCase()
      );

      if (users[trimmedPhone]) {
        Alert.alert('Registration Failed', 'This phone number is already registered.');
        setIsLoading(false);
      } else if (isUsernameTaken) {
        Alert.alert('Registration Failed', 'This username is already taken. Please choose another one.');
        setIsLoading(false);
      } else {
        users[trimmedPhone] = { phone: trimmedPhone, username: trimmedUsername, password };
        await AsyncStorage.setItem('users', JSON.stringify(users));
        await AsyncStorage.setItem('currentUser', JSON.stringify({ phone: trimmedPhone, username: trimmedUsername }));
        Alert.alert('Success', 'Account created successfully!');
        setLoggedIn(true);
      }
    } catch (e) {
      Alert.alert('Error', 'An error occurred during registration');
      setIsLoading(false);
    }
  };`;

// Using regex to replace the function exactly
code = code.replace(/  const handleRegister = async \(\) => \{[\s\S]*?  \};/, newHandleRegister);

// 4. Update the Button rendering
code = code.replace(
  /<TouchableOpacity style=\{styles\.registerButton\} onPress=\{handleRegister\}>\s*<Text style=\{styles\.registerButtonText\}>SIGN UP<\/Text>\s*<\/TouchableOpacity>/,
  `<TouchableOpacity style={styles.registerButton} onPress={handleRegister} disabled={isLoading}>
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.registerButtonText}>SIGN UP</Text>
            )}
          </TouchableOpacity>`
);

fs.writeFileSync('screens/RegisterScreen.js', code, 'utf-8');
console.log('RegisterScreen patched.');

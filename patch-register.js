const fs = require('fs');
let code = fs.readFileSync('screens/RegisterScreen.js', 'utf8');

code = code.replace(
  "import { Ionicons } from '@expo/vector-icons';",
  "import { Ionicons } from '@expo/vector-icons';\nimport CustomAlert from '../components/CustomAlert';"
);

code = code.replace(
  "const [isLoading, setIsLoading] = useState(false);",
  "const [isLoading, setIsLoading] = useState(false);\n  const [alertConfig, setAlertConfig] = useState({ visible: false, title: '', message: '', type: 'error' });\n\n  const showAlert = (title, message, type = 'error') => {\n    setAlertConfig({ visible: true, title, message, type });\n  };"
);

code = code.replace(/Alert\.alert\(/g, "showAlert(");

// Need to conditionally set type to 'success' for the success alert!
code = code.replace(
  "showAlert('Success', 'Account created successfully!');",
  "showAlert('Success', 'Account created successfully!', 'success');"
);


code = code.replace(
  "</ScrollView>\n    </KeyboardAvoidingView>",
  "</ScrollView>\n      <CustomAlert\n        visible={alertConfig.visible}\n        title={alertConfig.title}\n        message={alertConfig.message}\n        type={alertConfig.type}\n        onClose={() => {\n          setAlertConfig({ ...alertConfig, visible: false });\n          if (alertConfig.type === 'success') setLoggedIn(true);\n        }}\n      />\n    </KeyboardAvoidingView>"
);

// Wait, I should remove `setLoggedIn(true)` entirely from after the `showAlert('Success'...)` since it gets called now in `onClose`
code = code.replace(
  "showAlert('Success', 'Account created successfully!', 'success');\n        setLoggedIn(true);",
  "showAlert('Success', 'Account created successfully!', 'success');"
);

fs.writeFileSync('screens/RegisterScreen.js', code);
console.log('RegisterScreen patched');

const fs = require('fs');
let code = fs.readFileSync('screens/LoginScreen.js', 'utf8');

code = code.replace(
  "import { Ionicons } from '@expo/vector-icons';",
  "import { Ionicons } from '@expo/vector-icons';\nimport CustomAlert from '../components/CustomAlert';"
);

code = code.replace(
  "const [isLoading, setIsLoading] = useState(false);",
  "const [isLoading, setIsLoading] = useState(false);\n  const [alertConfig, setAlertConfig] = useState({ visible: false, title: '', message: '', type: 'error' });\n\n  const showAlert = (title, message, type = 'error') => {\n    setAlertConfig({ visible: true, title, message, type });\n  };"
);

code = code.replace(/Alert\.alert\(/g, "showAlert(");

code = code.replace(
  "</ScrollView>\n    </KeyboardAvoidingView>",
  "</ScrollView>\n      <CustomAlert\n        visible={alertConfig.visible}\n        title={alertConfig.title}\n        message={alertConfig.message}\n        type={alertConfig.type}\n        onClose={() => setAlertConfig({ ...alertConfig, visible: false })}\n      />\n    </KeyboardAvoidingView>"
);

fs.writeFileSync('screens/LoginScreen.js', code);
console.log('LoginScreen patched');

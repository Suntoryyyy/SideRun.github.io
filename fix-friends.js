const fs = require('fs');

let code = fs.readFileSync('screens/FriendsScreen.js', 'utf8');

// Replace alerts
code = code.replace("import CustomAlert from '../components/CustomAlert';", "");
code = code.replace("import ActivityFeed from '../components/ActivityFeed';", "import ActivityFeed from '../components/ActivityFeed';\nimport CustomAlert from '../components/CustomAlert';");

// Add alertConfig state
if (!code.includes('const [alertConfig')) {
  code = code.replace("const slideAnim = React.useRef(new Animated.Value(300)).current;", "const slideAnim = React.useRef(new Animated.Value(300)).current;\n  const [alertConfig, setAlertConfig] = useState({ visible: false, title: '', message: '', type: 'error' });\n\n  const showAlert = (title, message, type = 'error') => setAlertConfig({ visible: true, title, message, type });");
}

// Replace Alert with CustomAlert
code = code.replace(/Alert\.alert\('Error',\s*'Please enter a friend name or phone number'\);/g, "showAlert('Error', 'Please enter a friend name or phone number', 'error');");
code = code.replace(/Alert\.alert\('Not Found',\s*'Could not find a user with that username or phone number\.'\);/g, "showAlert('Not Found', 'Could not find a user with that username or phone number.', 'error');");
code = code.replace(/Alert\.alert\('Private Profile',\s*'This user does not allow friend requests from strangers\.'\);/g, "showAlert('Private Profile', 'This user does not allow friend requests from strangers.', 'error');");
code = code.replace(/Alert\.alert\('Already Friends',\s*'You are already friends with this user\.'\);/g, "showAlert('Already Friends', 'You are already friends with this user.', 'info');");
code = code.replace(/Alert\.alert\('Success',\s*`\$\{friendName\} has been added as a friend!`\);/g, "showAlert('Success', `${friendName} has been added as a friend!`, 'success');");
code = code.replace(/Alert\.alert\('Error',\s*'Failed to add friend'\);/g, "showAlert('Error', 'Failed to add friend', 'error');");

// Fix db search logic
const oldSearch = `      const { data: foundUsers, error } = await supabase
        .from('users')
        .select('*')
        .or(\`phone.eq.\${searchKey},username.ilike.\${searchKey}\`);

      if (error) {
        console.error('Supabase search error:', error);
        Alert.alert('Error', 'Failed to search for user. Please try again later.');
        return;
      }`;
      
const newSearch = `      // Try exact phone first
      let { data: foundUsers, error } = await supabase
        .from('users')
        .select('*')
        .eq('phone', searchKey);

      // If no phone match, try username
      if (!foundUsers || foundUsers.length === 0) {
        const { data: nameUsers, error: nameErr } = await supabase
          .from('users')
          .select('*')
          .ilike('username', \`%\${searchKey}%\`);
        
        if (!nameErr && nameUsers) foundUsers = nameUsers;
      }

      if (error && !foundUsers) {
        console.error('Supabase search error:', error);
        showAlert('Error', 'Failed to search for user. Please try again later.', 'error');
        return;
      }`;

code = code.replace(oldSearch, newSearch);

// Inject BlurView and image background
code = code.replace("import { BlurView } from 'expo-blur';", "");
code = code.replace("import {", "import { BlurView } from 'expo-blur';\nimport {");

const oldReturn = `    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>`;
const newReturn = `    <View style={styles.container}>
      {/* Background Map - Same as Register for visual cohesion */}
      {Platform.OS === 'web' ? (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: -1 }}>
          <iframe
            width="100%"
            height="100%"
            frameBorder="0"
            scrolling="no"
            src={\`https://www.openstreetmap.org/export/embed.html?bbox=-122.46,37.72,-122.38,37.82&layer=mapnik\`}
            style={{ border: 'none', filter: 'brightness(0.9) grayscale(0.8)' }}
          />
        </div>
      ) : (
        <View style={StyleSheet.absoluteFillObject} backgroundColor="#EAEAEA" />
      )}

      <ScrollView contentContainerStyle={styles.scrollContent}>`;
code = code.replace(oldReturn, newReturn);

// Inject CustomAlert tag
if (code.includes('</View>\n  );\n}')) {
  code = code.replace('</View>\n  );\n}', '  <CustomAlert\n        visible={alertConfig.visible}\n        title={alertConfig.title}\n        message={alertConfig.message}\n        type={alertConfig.type}\n        onClose={() => setAlertConfig({...alertConfig, visible: false})}\n      />\n    </View>\n  );\n}');
}

fs.writeFileSync('screens/FriendsScreen.js', code);
console.log('Fixed FriendsScreen logic.');

const fs = require('fs');
let code = fs.readFileSync('screens/ProfileScreen.js', 'utf8');

code = code.replace(
  '<ScrollView contentContainerStyle={styles.scrollContent}>',
  '<ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">'
);

if (!code.includes('keyboardShouldPersistTaps')) {
  console.log("Failed to patch ScrollView");
} else {
  fs.writeFileSync('screens/ProfileScreen.js', code);
  console.log("Patched ScrollView");
}

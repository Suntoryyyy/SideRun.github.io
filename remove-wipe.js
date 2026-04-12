const fs = require('fs');

let code = fs.readFileSync('screens/LoginScreen.js', 'utf-8');

// Remove wipe data button
const oldFooterBtn = `          <TouchableOpacity style={styles.clearDataButton} onPress={handleClearData}>
            <Ionicons name="trash-outline" size={16} color="#FF3B30" />
            <Text style={styles.clearDataText}>Developer: Wipe Data</Text>
          </TouchableOpacity>`;
          
code = code.replace(oldFooterBtn, "");

// Removing the handleClearData function
code = code.replace(/  const handleClearData = async \(\) => \{\n(?:.|\n)*?  \};\n/m, "");

fs.writeFileSync('screens/LoginScreen.js', code);
console.log('LoginScreen updated');

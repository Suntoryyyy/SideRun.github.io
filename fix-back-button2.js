const fs = require('fs');
let code = fs.readFileSync('screens/RegisterScreen.js', 'utf-8');

code = code.replace(
  "  backButton: {\n    position: 'absolute',\n    top: -20,\n    left: -10,\n    zIndex: 10,\n    padding: 10,\n  },",
  "  backButton: {\n    marginBottom: 20,\n    alignSelf: 'flex-start',\n    padding: 8,\n    marginLeft: -8,\n  },"
);

code = code.replace(
  "  header: {\n    marginTop: 20,\n    marginBottom: 40,\n    position: 'relative',\n  },",
  "  header: {\n    marginBottom: 30,\n  },"
);

fs.writeFileSync('screens/RegisterScreen.js', code);

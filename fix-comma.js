const fs = require('fs');
let code = fs.readFileSync('styles/FriendsScreenStyles.js', 'utf-8');
code = code.replace("  },\n,\n\n  modalOverlay: {", "  },\n  modalOverlay: {");
fs.writeFileSync('styles/FriendsScreenStyles.js', code);

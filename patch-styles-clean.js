const fs = require('fs');
let ss = fs.readFileSync('styles/FriendsScreenStyles.js', 'utf8');

ss = ss.replace(/paddingTop: 60,/, 'paddingTop: 65,');
ss = ss.replace(/top: 60,/, 'top: 65,\n    width: 40,\n    height: 40,\n    justifyContent: "center",\n    alignItems: "center",');
ss = ss.replace(/fontSize: 28,/, 'fontSize: 22,\n    marginTop: 4,\n    maxWidth: "70%",\n    textAlign: "center",');

const emptyStateStyles = `
  emptyFeedState: {
    alignItems: 'center',
    marginTop: 60,
    padding: 20,
  },
  emptyFeedText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#888',
    marginTop: 16,
  },
`;

ss = ss.replace(/}\);\s*$/, '  ' + emptyStateStyles.trim() + '\n});\n');
fs.writeFileSync('styles/FriendsScreenStyles.js', ss);

const fs = require('fs');

// Update ChatScreen.js
let chatCode = fs.readFileSync('screens/ChatScreen.js', 'utf-8');
chatCode = chatCode.replace(/#007AFF/g, '#24C789');
chatCode = chatCode.replace(/iMessage/g, 'Message...');
chatCode = chatCode.replace(/backgroundColor: '#F9F9F9',/g, "backgroundColor: '#FFFFFF',");
fs.writeFileSync('screens/ChatScreen.js', chatCode);

// Update FriendsScreenStyles.js
let friendsStyles = fs.readFileSync('styles/FriendsScreenStyles.js', 'utf-8');
// look for chat btn
friendsStyles = friendsStyles.replace(/chatBtn: \{\n    flexDirection: 'row',\n    backgroundColor: '#007AFF',/g, "chatBtn: {\n    flexDirection: 'row',\n    backgroundColor: '#24C789',");
fs.writeFileSync('styles/FriendsScreenStyles.js', friendsStyles);

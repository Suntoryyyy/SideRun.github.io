const fs = require('fs');
let code = fs.readFileSync('screens/ProfileScreen.js', 'utf8');

const oldScrollWrap = `  avatarScrollWrap: {
    width: "100%",
    overflow: "hidden",
  },
  avatarOption: {`;

const newScrollWrap = `  avatarScrollWrap: {
    marginHorizontal: -20, // push out to card edges
  },
  avatarOption: {`;

const oldContentStyle = `  avatarSelectorContent: {
    paddingVertical: 10,
    paddingHorizontal: 5,
  },`;

const newContentStyle = `  avatarSelectorContent: {
    paddingVertical: 10,
    paddingHorizontal: 20, // align first item with normal padding
  },`;

if (code.includes(oldScrollWrap)) {
  code = code.replace(oldScrollWrap, newScrollWrap);
  code = code.replace(oldContentStyle, newContentStyle);
  fs.writeFileSync('screens/ProfileScreen.js', code);
  console.log('patched styling for avatar scroll');
} else {
  console.log('not found');
}

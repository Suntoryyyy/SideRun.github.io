const fs = require('fs');
const acorn = require('acorn');
try {
  acorn.parse(fs.readFileSync('components/RunScreenUI/RunMapMemo.js', 'utf8'), { sourceType: 'module', ecmaVersion: 2020 });
  console.log("Syntax is OK");
} catch(e) {
  console.log("Syntax ERROR:", e);
}

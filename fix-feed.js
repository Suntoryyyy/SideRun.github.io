const fs = require('fs');
let code = fs.readFileSync('components/ActivityFeed.js', 'utf8');
code = code.replace(/    <\/View>\n  \);\n}/g, '    )\n  );\n}');
code = code.replace(/    <\/View>\n  \)\n  \);\n}/g, '    )\n  );\n}');
code = code.replace(/      \}\)\)}\n    <\/View>\n  \);\n}/g, '      ))}\n    </View>\n  );\n}');
fs.writeFileSync('components/ActivityFeed.js', code);
console.log('saved');

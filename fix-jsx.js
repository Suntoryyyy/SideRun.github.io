const fs = require('fs');
let code = fs.readFileSync('screens/RunScreen.js', 'utf-8');

code = code.replace(
  "                ))}\n              </View>",
  "                ))}\n              </Animated.View>"
);

fs.writeFileSync('screens/RunScreen.js', code);

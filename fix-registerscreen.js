const fs = require('fs');
let code = fs.readFileSync('screens/RegisterScreen.js', 'utf-8');

// Fix imports
if (!code.includes("import * as Location")) {
  code = code.replace(
    "import React, { useState } from 'react';",
    "import React, { useState, useEffect } from 'react';\nimport { BlurView } from 'expo-blur';\nimport * as Location from 'expo-location';"
  );
}

fs.writeFileSync('screens/RegisterScreen.js', code);
console.log('Fixed imports in RegisterScreen.js');

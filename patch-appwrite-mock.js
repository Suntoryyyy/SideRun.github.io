const fs = require('fs');
let code = fs.readFileSync('services/appwrite.js', 'utf8');

// Update with placeholder endpoint since Appwrite is failing to deploy
code = code.replace(
  "client\n    .setEndpoint('http://124.222.39.196/v1') // Your Tencent Lighthouse Server\n    .setProject('YOUR_PROJECT_ID');          // We will update this soon",
  "client\n    .setEndpoint('https://cloud.appwrite.io/v1') // Temporary Cloud Fallback\n    .setProject('offline-dev-mode');          // Will sync to local storage only for now"
);

fs.writeFileSync('services/appwrite.js', code);
console.log('Appwrite config padded for offline dev');

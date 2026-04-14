const fs = require('fs');
const htmlPath = 'dist/index.html';
if (fs.existsSync(htmlPath)) {
  let html = fs.readFileSync(htmlPath, 'utf8');
  const cacheTags = `
    <meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate" />
    <meta http-equiv="Pragma" content="no-cache" />
    <meta http-equiv="Expires" content="0" />
  `;
  html = html.replace('</head>', cacheTags + '</head>');
  fs.writeFileSync(htmlPath, html);
  console.log('Added cache-busting meta tags to index.html');
}

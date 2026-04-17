const fs = require('fs');
let styles = fs.readFileSync('styles/RunScreenStyles.js', 'utf-8');

if (styles.includes("bottom: 0,")) {
  styles = styles.replace(
    "bottom: 0,",
    "bottom: -400,"
  );
  styles = styles.replace(
    "height: height * 0.75,",
    "height: height * 0.75 + 400,"
  );
  styles = styles.replace(
    "paddingBottom: 25,",
    "paddingBottom: 425,"
  );
  fs.writeFileSync('styles/RunScreenStyles.js', styles);
}


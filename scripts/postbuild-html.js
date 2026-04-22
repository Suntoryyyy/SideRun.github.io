/**
 * postbuild-html.js
 *
 * Post-processes `dist/index.html` after `expo export -p web` to:
 *
 *   1. Upgrade the viewport meta tag with `viewport-fit=cover`. On iOS, this
 *      is the ONLY way to make `env(safe-area-inset-*)` populate — both in
 *      the browser and in standalone PWA mode. Without it, the home
 *      indicator (34pt on iPhone 15 / 16 / 17) silently overlaps the tab
 *      bar. Injecting the tag via JS after page load does NOT work: iOS
 *      bakes the safe-area values in before the first JS tick.
 *
 *   2. Declare PWA capability (`apple-mobile-web-app-capable`,
 *      `mobile-web-app-capable`, `apple-mobile-web-app-status-bar-style`)
 *      so "Add to Home Screen" renders without browser chrome consistently
 *      across iOS and Android.
 *
 *   3. Drop Expo's default `body { overflow: hidden }` style which fights
 *      the RN-web flex layout on PWA standalone, and replace it with an
 *      `overflow-y: hidden; overscroll-behavior: none` rule that still
 *      prevents rubber-banding but doesn't clip the tab bar.
 *
 *   4. Keep the existing no-cache headers so PWA clients pick up new
 *      builds the next time they reopen the app.
 */
const fs = require('fs');
const path = require('path');

const DIST_DIR = path.resolve(__dirname, '..', 'dist');
const HTML_PATH = path.join(DIST_DIR, 'index.html');

function die(msg) {
  console.error(`postbuild-html: ${msg}`);
  process.exit(1);
}

if (!fs.existsSync(HTML_PATH)) {
  die(`expected ${HTML_PATH} to exist. Run \`expo export -p web\` first.`);
}

let html = fs.readFileSync(HTML_PATH, 'utf8');

// 1 ── viewport meta ─────────────────────────────────────────────────────
html = html.replace(
  /<meta\s+name=["']viewport["'][^>]*>/i,
  '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover, shrink-to-fit=no" />',
);

// 2 ── PWA meta tags & no-cache headers ──────────────────────────────────
const extraHead = `
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="default" />
    <meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate" />
    <meta http-equiv="Pragma" content="no-cache" />
    <meta http-equiv="Expires" content="0" />`;

html = html.replace('</head>', `${extraHead}\n  </head>`);

// 3 ── Relax Expo's body { overflow: hidden } ─────────────────────────
// We keep overflow hidden on the body so the page itself never scrolls
// (RN ScrollView does its own scrolling), but we ALSO disable iOS rubber-
// banding so the tab bar doesn't visually detach from the bottom.
// The actual safe-area handling is done in JS (useSafeAreaInsets) —
// adding it here as CSS would double-count against the tab bar's own
// paddingBottom.
html = html.replace(
  /body\s*\{\s*overflow:\s*hidden;\s*\}/,
  `body {
        overflow: hidden;
        overscroll-behavior: none;
        -webkit-overflow-scrolling: touch;
      }`,
);

// 4 ── Sentinel file for GitHub Pages (.nojekyll) ───────────────────────
fs.writeFileSync(path.join(DIST_DIR, '.nojekyll'), '');

fs.writeFileSync(HTML_PATH, html, 'utf8');

console.log('postbuild-html: wrote', HTML_PATH);

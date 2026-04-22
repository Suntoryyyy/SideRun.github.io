/**
 * fixWebViewport — on web, inject a one-time <style> tag that sets
 * html/body/#root to `100dvh` (dynamic viewport height).
 *
 * On iOS Safari, `100vh` equals the LAYOUT viewport (URL bar collapsed)
 * and the page body therefore extends below the visible area when the
 * URL bar is expanded. `100dvh` dynamically tracks the visible area,
 * so the app body never overflows past the URL bar.
 *
 * `dvh` is supported on iOS 15.4+ and all current evergreen browsers;
 * on older browsers the `100vh` fallback applies.
 */
import { Platform } from 'react-native';

export default function fixWebViewport() {
  if (Platform.OS !== 'web' || typeof document === 'undefined') return;
  if (document.getElementById('__siderun_viewport_fix__')) return;

  const style = document.createElement('style');
  style.id = '__siderun_viewport_fix__';
  style.textContent = `
    html, body { margin: 0; padding: 0; }
    html, body, #root {
      height: 100vh;
      height: 100dvh;
      overflow: hidden;
    }
    body {
      overscroll-behavior: none;
    }
  `;
  document.head.appendChild(style);
}

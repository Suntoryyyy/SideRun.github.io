/**
 * fixWebViewport — robust, cross-browser layout fix for mobile PWAs &
 * browsers. Applies three things exactly once per page load:
 *
 *   1. Injects `<meta name="viewport" content="...viewport-fit=cover">` if it
 *      isn't already there. Without `viewport-fit=cover`, iOS Safari (both
 *      browser and standalone PWA) does NOT populate `env(safe-area-inset-*)`
 *      values — `useSafeAreaInsets()` will return zeros even on a notched
 *      iPhone, which leaves the home indicator overlapping the tab bar.
 *
 *   2. Injects a tiny `<style>` block that sizes `html` and `body` to the
 *      DYNAMIC viewport height (`100dvh`) so the page body never extends
 *      below the visible area when iOS Safari's floating URL bar is shown.
 *      Uses `min-height` (not `height`) + no `overflow: hidden` so
 *      React Navigation can still lay out its children with its own flex
 *      rules and the PWA mode isn't hijacked.
 *
 *   3. Falls back to a JS-computed `--app-height` CSS variable on browsers
 *      without `dvh` support (iOS < 15.4, old Android WebView), updating
 *      it on `resize`, `orientationchange`, and `visualViewport.resize`.
 */
import { Platform } from 'react-native';

export default function fixWebViewport() {
  if (Platform.OS !== 'web' || typeof document === 'undefined') return;
  if (document.getElementById('__siderun_viewport_fix__')) return;

  // 1 ─── viewport-fit=cover ─────────────────────────────────────────────
  let meta = document.querySelector('meta[name="viewport"]');
  if (!meta) {
    meta = document.createElement('meta');
    meta.name = 'viewport';
    meta.content =
      'width=device-width, initial-scale=1, viewport-fit=cover';
    document.head.appendChild(meta);
  } else if (!/viewport-fit=cover/.test(meta.content)) {
    meta.content = meta.content.replace(/\s*$/, ', viewport-fit=cover');
  }

  // 2 ─── CSS layer ──────────────────────────────────────────────────────
  // Why `dvh` (dynamic viewport height)?
  //
  //   Previous iterations used `100svh` to guarantee the app stayed above
  //   iOS Safari's floating URL bar. That worked, but left a visible gap
  //   between the tab bar and the screen bottom whenever the URL bar was
  //   collapsed into its compact state — so the bar never truly sat at
  //   the bottom of the screen.
  //
  //   `100dvh` tracks the CURRENT visible viewport: it shrinks as the URL
  //   bar expands and grows as it collapses. Combined with the per-
  //   platform bottom-floor in `useWebBottomGuard`, labels always have
  //   enough breathing room regardless of URL-bar state.
  //
  //   Fallback chain: 100vh → JS-driven --app-height → 100dvh.
  const style = document.createElement('style');
  style.id = '__siderun_viewport_fix__';
  style.textContent = `
    html, body { margin: 0; padding: 0; }

    html, body, #root {
      height: 100vh;
      height: var(--app-height, 100vh);
      height: 100dvh;
    }

    /* Match the screen background so the strip beneath the floating
       tab-bar island reads as part of the app surface, not empty space. */
    html, body { background-color: #F7F8FA; }

    body {
      overscroll-behavior: none;
      -webkit-overflow-scrolling: touch;
      overflow: hidden;
    }
  `;
  document.head.appendChild(style);

  // 3 ─── JS fallback for older browsers ────────────────────────────────
  // Updates `--app-height` to the currently visible viewport height, which
  // is more reliable than `100vh` on mobile browsers that pre-date `dvh`.
  const setAppHeight = () => {
    const h =
      (window.visualViewport && window.visualViewport.height) ||
      window.innerHeight;
    document.documentElement.style.setProperty('--app-height', `${h}px`);
  };

  setAppHeight();
  window.addEventListener('resize', setAppHeight);
  window.addEventListener('orientationchange', setAppHeight);
  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', setAppHeight);
    // `scroll` fires when the Safari URL bar shows/hides on iOS.
    window.visualViewport.addEventListener('scroll', setAppHeight);
  }
}

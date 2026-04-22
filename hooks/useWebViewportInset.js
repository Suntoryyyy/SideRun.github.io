/**
 * useWebBottomGuard — returns the total number of pixels that must be
 * reserved below content on web, so absolute/fixed elements like the bottom
 * tab bar are never hidden by browser chrome or the iOS home indicator.
 *
 * It combines THREE signals and returns the maximum, because no single
 * signal is reliable across all devices/modes:
 *
 *   - `env(safe-area-inset-bottom)` from react-native-safe-area-context
 *     (works in PWA on notched iPhones, may be 0 in plain Safari)
 *
 *   - `innerHeight − visualViewport.height` — the live height of the
 *     floating browser chrome (Safari URL bar, Android Chrome bar).
 *     Non-zero only when the URL bar is visible.
 *
 *   - `display-mode: standalone` detection — when an iOS device runs
 *     the app as a PWA but `env()` still reports 0 (some iOS versions),
 *     apply a conservative home-indicator floor of 24pt.
 *
 * Callers should use `useSafeAreaInsets().bottom` AND this value, taking
 * the maximum of the two.
 */
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';

function isStandalone() {
  if (typeof window === 'undefined') return false;
  // iOS uses `navigator.standalone`, everyone else uses `display-mode`.
  return (
    window.navigator?.standalone === true ||
    (window.matchMedia &&
      window.matchMedia('(display-mode: standalone)').matches)
  );
}

function isIOS() {
  if (typeof navigator === 'undefined') return false;
  return /iP(hone|od|ad)/.test(navigator.platform || navigator.userAgent || '');
}

export default function useWebBottomGuard() {
  const [guard, setGuard] = useState(0);

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;

    const standalone = isStandalone();
    const ios = isIOS();

    const measure = () => {
      // Browser chrome (Safari URL bar or similar) — as reported by the
      // Visual Viewport API. iOS 26 Safari sometimes returns 0 here even
      // while the floating URL bar is visible, because the bar is treated
      // as a translucent overlay rather than layout-taking chrome.
      let chrome = 0;
      if (window.visualViewport) {
        chrome = Math.max(
          0,
          Math.round(window.innerHeight - window.visualViewport.height),
        );
      }

      // iOS PWA home-indicator floor. 34pt is the standard height used by
      // UIKit for the home indicator on iPhone X / 11 / 12 / 13 / 14 / 15
      // / 16 / 17. We apply this floor whenever we detect an iOS PWA in
      // standalone mode, as a defence against `env(safe-area-inset-bottom)`
      // being 0 — which happens on iOS versions that cache the initial
      // viewport meta, or when the PWA was installed before the app's
      // HTML shipped `viewport-fit=cover`.
      const pwaFloor = standalone && ios ? 34 : 0;

      // iOS Safari browser floor. The floating URL bar is ~50–60pt tall
      // and `visualViewport` doesn't always report this on iOS 26+. We
      // reserve a conservative 12pt even in the best case — in practice
      // the `100svh` CSS rule in fixWebViewport.js keeps the app above
      // the URL bar, so this is just a visual buffer for the labels.
      const safariFloor = ios && !standalone ? 12 : 0;

      // Universal visual buffer so labels never sit flush against the bottom.
      const visualBuffer = chrome > 0 ? 8 : 4;

      setGuard(
        Math.max(chrome + visualBuffer, pwaFloor, safariFloor),
      );
    };

    measure();

    window.addEventListener('resize', measure);
    window.addEventListener('orientationchange', measure);
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', measure);
      window.visualViewport.addEventListener('scroll', measure);
    }

    return () => {
      window.removeEventListener('resize', measure);
      window.removeEventListener('orientationchange', measure);
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', measure);
        window.visualViewport.removeEventListener('scroll', measure);
      }
    };
  }, []);

  return guard;
}

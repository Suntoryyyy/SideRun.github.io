/**
 * useWebViewportInset — web-only hook that reports the height of the
 * browser chrome sitting below the visible viewport.
 *
 * On iOS Safari, the floating URL bar at the bottom takes ~85 px when
 * expanded, but `env(safe-area-inset-bottom)` only reports the home-
 * indicator inset (~34 px) and misses the URL bar entirely. Without
 * accounting for this, absolute/fixed-positioned elements at the bottom
 * of the page (like our bottom tab bar) get clipped.
 *
 * We compute the chrome height as `window.innerHeight - visualViewport.height`
 * and listen for resize/scroll events on `visualViewport` so we update live
 * as the URL bar expands or collapses.
 */
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';

export default function useWebViewportInset() {
  const [chrome, setChrome] = useState(0);

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;

    const measure = () => {
      if (typeof window.visualViewport !== 'undefined' && window.visualViewport) {
        const diff = window.innerHeight - window.visualViewport.height;
        setChrome(Math.max(0, Math.round(diff)));
      }
    };

    measure();

    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', measure);
      window.visualViewport.addEventListener('scroll', measure);
    }
    window.addEventListener('resize', measure);
    window.addEventListener('orientationchange', measure);

    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', measure);
        window.visualViewport.removeEventListener('scroll', measure);
      }
      window.removeEventListener('resize', measure);
      window.removeEventListener('orientationchange', measure);
    };
  }, []);

  return chrome;
}

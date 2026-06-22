/**
 * useReducedMotion — tracks the OS "Reduce Motion" accessibility setting
 * (and `prefers-reduced-motion` on web via react-native-web).
 *
 * Every entrance/transition animation in the app should fall back to an
 * instant state when this returns true (PRODUCT.md accessibility requirement).
 */
import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

export default function useReducedMotion() {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    let mounted = true;

    if (AccessibilityInfo.isReduceMotionEnabled) {
      AccessibilityInfo.isReduceMotionEnabled()
        .then((v) => {
          if (mounted) setReduced(!!v);
        })
        .catch(() => {});
    }

    const sub = AccessibilityInfo.addEventListener
      ? AccessibilityInfo.addEventListener('reduceMotionChanged', (v) => setReduced(!!v))
      : null;

    return () => {
      mounted = false;
      if (sub && typeof sub.remove === 'function') sub.remove();
    };
  }, []);

  return reduced;
}

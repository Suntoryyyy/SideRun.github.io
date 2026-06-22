/**
 * FadeInView — a lightweight entrance animation wrapper.
 *
 * Fades + slides its children up on mount. Pass an increasing `delay` to
 * neighbouring items to get a staggered list reveal. Honors Reduce Motion:
 * when enabled it renders the final state instantly (no movement / fade).
 *
 * Uses the native driver, so it's cheap and won't jank lists.
 */
import React, { useEffect, useRef } from 'react';
import { Animated, Easing } from 'react-native';
import useReducedMotion from '../hooks/useReducedMotion';

export default function FadeInView({
  children,
  delay = 0,
  duration = 420,
  translateY = 12,
  style,
  ...rest
}) {
  const reduced = useReducedMotion();
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (reduced) {
      progress.setValue(1);
      return undefined;
    }
    progress.setValue(0);
    const anim = Animated.timing(progress, {
      toValue: 1,
      duration,
      delay,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });
    anim.start();
    return () => anim.stop();
  }, [reduced, delay, duration, progress]);

  const animatedStyle = {
    opacity: progress,
    transform: [
      {
        translateY: progress.interpolate({
          inputRange: [0, 1],
          outputRange: [translateY, 0],
        }),
      },
    ],
  };

  return (
    <Animated.View style={[style, animatedStyle]} {...rest}>
      {children}
    </Animated.View>
  );
}

import React, { useRef } from 'react';
import { Animated, Pressable, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

/**
 * BouncyButton
 * A drop-in replacement for TouchableOpacity that uses a subtle scale spring
 * animation and light haptics instead of changing opacity/color.
 * 
 * Props:
 * - scaleTo: The target scale when pressed (default: 0.96)
 * - haptic: The haptic feedback style ('light', 'medium', 'heavy', 'selection', or null to disable. default: 'light')
 * - bounceTension: Spring tension (default: 120)
 * - bounceFriction: Spring friction (default: 10)
 * - All other standard Pressable/TouchableOpacity props (onPress, style, hitSlop, disabled, etc.)
 */
export default function BouncyButton({
  children,
  style,
  onPress,
  onPressIn,
  onPressOut,
  onLongPress,
  disabled,
  scaleTo = 0.96,
  haptic = 'light',
  bounceTension = 120,
  bounceFriction = 10,
  ...props
}) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = (e) => {
    if (disabled) return;

    if (Platform.OS !== 'web' && haptic) {
      if (haptic === 'selection') {
        Haptics.selectionAsync();
      } else {
        const styleMap = {
          light: Haptics.ImpactFeedbackStyle.Light,
          medium: Haptics.ImpactFeedbackStyle.Medium,
          heavy: Haptics.ImpactFeedbackStyle.Heavy,
        };
        Haptics.impactAsync(styleMap[haptic] || Haptics.ImpactFeedbackStyle.Light);
      }
    }

    Animated.spring(scale, {
      toValue: scaleTo,
      tension: bounceTension,
      friction: bounceFriction,
      useNativeDriver: true,
    }).start();

    if (onPressIn) onPressIn(e);
  };

  const handlePressOut = (e) => {
    if (disabled) return;

    Animated.spring(scale, {
      toValue: 1,
      tension: bounceTension,
      friction: bounceFriction,
      useNativeDriver: true,
    }).start();

    if (onPressOut) onPressOut(e);
  };

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onLongPress={onLongPress}
      disabled={disabled}
      {...props}
    >
      {({ pressed }) => (
        <Animated.View style={[style, { transform: [{ scale }] }]}>
          {typeof children === 'function' ? children({ pressed }) : children}
        </Animated.View>
      )}
    </Pressable>
  );
}

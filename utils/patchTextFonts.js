import { Text, StyleSheet } from 'react-native';
import { FONT } from '../constants/typography';

/**
 * One-time global patch that makes every <Text> in the app read as Inter,
 * mapping fontWeight → the correct Inter variant (since React Native loads
 * each Inter weight as a separate font family).
 *
 * Texts that set their own fontFamily (e.g. Ionicons via nested Text) are
 * left untouched.
 */
const WEIGHT_TO_FAMILY = {
  '100': FONT.regular,
  '200': FONT.regular,
  '300': FONT.regular,
  '400': FONT.regular,
  normal: FONT.regular,
  '500': FONT.medium,
  '600': FONT.semibold,
  '700': FONT.bold,
  bold: FONT.bold,
  '800': FONT.extraBold,
  '900': FONT.black,
};

let patched = false;

export default function patchTextFonts() {
  if (patched) return;
  patched = true;

  const originalRender = Text.render;
  if (typeof originalRender !== 'function') return;

  Text.render = function patchedRender(...args) {
    const element = originalRender.apply(this, args);
    if (!element) return element;

    const flat = StyleSheet.flatten(element.props.style) || {};

    // Respect explicit fontFamily (icon fonts, custom overrides).
    if (flat.fontFamily) return element;

    const weight = flat.fontWeight != null ? String(flat.fontWeight) : 'normal';
    const family = WEIGHT_TO_FAMILY[weight] || FONT.regular;

    return {
      ...element,
      props: {
        ...element.props,
        style: [element.props.style, { fontFamily: family }],
      },
    };
  };
}

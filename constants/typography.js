/**
 * SideRun typography scale — inspired by Apple Fitness, Strava, Oura, Nike Run Club.
 *
 * Principles:
 *  - One type family (Inter) across the product. Weight is expressed through
 *    the font family variant, never through `fontWeight`, because RN's native
 *    weight resolution does not match custom font naming.
 *  - Display numbers use tabular-nums so metrics don't jitter as values change.
 *  - Labels / eyebrows are ALL CAPS with generous letter-spacing.
 *  - Titles have mild negative letter-spacing for that "editorial" tightness.
 */

export const FONT = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
  extraBold: 'Inter_800ExtraBold',
  black: 'Inter_900Black',
};

const tabular = { fontVariant: ['tabular-nums'] };

export const T = {
  // META / UPPERCASE
  eyebrow: {
    fontFamily: FONT.bold,
    fontSize: 11,
    letterSpacing: 1.5,
    color: '#9AA0A6',
    textTransform: 'uppercase',
  },
  label: {
    fontFamily: FONT.bold,
    fontSize: 10,
    letterSpacing: 1.2,
    color: '#9AA0A6',
    textTransform: 'uppercase',
  },

  // DISPLAY NUMBERS
  displayXL: {
    fontFamily: FONT.extraBold,
    fontSize: 64,
    letterSpacing: -3,
    lineHeight: 68,
    color: '#0B0F13',
    ...tabular,
  },
  displayL: {
    fontFamily: FONT.extraBold,
    fontSize: 56,
    letterSpacing: -2,
    color: '#0B0F13',
    ...tabular,
  },
  displayM: {
    fontFamily: FONT.extraBold,
    fontSize: 44,
    letterSpacing: -1.2,
    color: '#0B0F13',
    ...tabular,
  },

  // TITLES
  title1: {
    fontFamily: FONT.extraBold,
    fontSize: 32,
    letterSpacing: -1,
    lineHeight: 38,
    color: '#0B0F13',
  },
  title2: {
    fontFamily: FONT.extraBold,
    fontSize: 26,
    letterSpacing: -0.8,
    lineHeight: 32,
    color: '#0B0F13',
  },
  title3: {
    fontFamily: FONT.extraBold,
    fontSize: 20,
    letterSpacing: -0.4,
    color: '#0B0F13',
  },
  title4: {
    fontFamily: FONT.bold,
    fontSize: 17,
    letterSpacing: -0.2,
    color: '#0B0F13',
  },

  // NUMBERS IN STAT CELLS
  metricL: {
    fontFamily: FONT.extraBold,
    fontSize: 22,
    letterSpacing: -0.5,
    color: '#0B0F13',
    ...tabular,
  },
  metricM: {
    fontFamily: FONT.extraBold,
    fontSize: 18,
    letterSpacing: -0.3,
    color: '#0B0F13',
    ...tabular,
  },
  metricUnit: {
    fontFamily: FONT.semibold,
    fontSize: 12,
    color: '#6B6F76',
  },

  // BODY
  bodyL: {
    fontFamily: FONT.semibold,
    fontSize: 16,
    lineHeight: 23,
    color: '#0B0F13',
  },
  body: {
    fontFamily: FONT.medium,
    fontSize: 14,
    lineHeight: 21,
    color: '#0B0F13',
  },
  bodyMuted: {
    fontFamily: FONT.medium,
    fontSize: 14,
    lineHeight: 21,
    color: '#6B6F76',
  },
  caption: {
    fontFamily: FONT.medium,
    fontSize: 12,
    lineHeight: 17,
    color: '#6B6F76',
  },

  // BUTTONS / PILLS
  button: {
    fontFamily: FONT.extraBold,
    fontSize: 16,
    letterSpacing: 0.3,
    color: '#FFFFFF',
  },
  buttonSm: {
    fontFamily: FONT.bold,
    fontSize: 13,
    letterSpacing: 0.3,
  },
  pill: {
    fontFamily: FONT.bold,
    fontSize: 11,
    letterSpacing: 0.8,
  },
};

/** Helper to combine base style + local overrides and keep font-family consistent. */
export const type = (base, override = {}) => ({ ...base, ...override });

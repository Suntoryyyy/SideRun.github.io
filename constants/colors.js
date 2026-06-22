/**
 * colors — the single source of truth for SideRun's palette + radii.
 *
 * Screens currently hardcode near-duplicate hex values (two page greys, two
 * back-arrow blacks, five card radii, three greens). Migrate them to these
 * tokens over time so the app speaks "one consistent vocabulary" (PRODUCT.md).
 *
 * Semantic intent:
 *   dark        primary actions + primary text
 *   accent      "go / positive / progress" ONLY (resume, rings, success)
 *   alert       stop / destructive emphasis
 *   textMuted   secondary copy — meets WCAG AA (≥4.5:1) on white/canvas
 */
export const COLORS = {
  dark: '#0B0F13',
  accent: '#24C789',
  accentText: '#1EA574', // green text on light tints
  accentSoft: '#8AE676',
  accentTint: 'rgba(36,199,137,0.12)',
  alert: '#FF5A36',
  danger: '#FF3B30',

  canvas: '#F4F5F7',
  surface: '#FFFFFF',
  surfaceMuted: '#ECEFF2',

  text: '#0B0F13',
  textMuted: '#5B6470', // AA on white/canvas
  textSubtle: '#9AA0A6', // labels / eyebrows only (not body copy)

  border: '#ECEEF1',
  borderStrong: '#D8DCE2',
};

export const RADIUS = {
  sm: 16,
  md: 20,
  lg: 28,
  pill: 999,
};

export default COLORS;

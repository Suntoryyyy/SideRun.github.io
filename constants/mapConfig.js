/**
 * mapConfig — single source of truth for the live friend-marker behaviour on
 * the Run map (both web/Leaflet and native/react-native-maps).
 *
 * Information density scales with zoom. Thresholds live here so they can be
 * tuned in one place per the spec ("缩放阈值支持可配置").
 */

// Web (Leaflet) integer zoom levels.
//   < label            → marker only (macro view)
//   >= label           → marker + nickname label (mid view)
//   >= distance        → marker + nickname + distance-to-you (micro view)
export const MAP_ZOOM = {
  label: 14,
  distance: 16,
};

// Native (react-native-maps) latitudeDelta thresholds. Smaller delta = closer.
//   > label            → marker only
//   <= label           → marker + nickname label
//   <= distance        → marker + nickname + distance-to-you
export const NATIVE_REGION_DELTA = {
  label: 0.05,
  distance: 0.013,
};

// Avatar marker sizing (px / dp).
export const MARKER = {
  avatar: 30,
};

// Deterministic fallback badge palette for friends with no image avatar or a
// broken image. Each friend id maps to one stable colour.
export const BADGE_COLORS = [
  '#24C789', '#00C2FF', '#FB7185', '#F5A623',
  '#A78BFA', '#34D399', '#60A5FA', '#FBBF24',
];

export function badgeColor(id) {
  const s = String(id || '');
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return BADGE_COLORS[h % BADGE_COLORS.length];
}

// Avatar classification helpers shared by both platforms.
export const isImageAvatar = (a) =>
  typeof a === 'string' &&
  (a.startsWith('http') || a.startsWith('file:') || a.startsWith('data:'));

// An emoji avatar (the demo crew uses these) — short, no alphanumerics.
export const isEmojiAvatar = (a) =>
  typeof a === 'string' && a.length > 0 && a.length <= 4 && !/[a-z0-9]/i.test(a);

export const avatarInitial = (name) =>
  (name || '?').trim().charAt(0).toUpperCase() || '?';

// "120m" under 1 km, "1.24km" beyond. Input in metres.
export const formatMapDistance = (metres) => {
  if (metres == null || !isFinite(metres)) return '';
  return metres < 1000 ? `${Math.round(metres)}m` : `${(metres / 1000).toFixed(2)}km`;
};

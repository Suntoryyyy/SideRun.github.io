/**
 * Cheer combo tiers — rapid identical emoji taps merge into ×N combos.
 * Higher tiers earn stronger (but still restrained) celebration flourishes.
 */
export const COMBO_TIERS = {
  normal: { min: 1, label: null, scale: 1, ringColor: '#24C789', rings: 1 },
  warm: { min: 2, label: null, scale: 1.08, ringColor: '#24C789', rings: 1 },
  hot: { min: 5, label: 'On fire', scale: 1.22, ringColor: '#FFB347', rings: 2 },
  legendary: { min: 10, label: 'Legendary', scale: 1.38, ringColor: '#FFD166', rings: 3 },
};

export const getComboTier = (count = 1) => {
  if (count >= COMBO_TIERS.legendary.min) return { key: 'legendary', ...COMBO_TIERS.legendary };
  if (count >= COMBO_TIERS.hot.min) return { key: 'hot', ...COMBO_TIERS.hot };
  if (count >= COMBO_TIERS.warm.min) return { key: 'warm', ...COMBO_TIERS.warm };
  return { key: 'normal', ...COMBO_TIERS.normal };
};

/** Returns true when count just crossed into a new tier (5, 10, …). */
export const crossedComboTier = (prevCount, nextCount) => {
  const prev = getComboTier(prevCount).min;
  const next = getComboTier(nextCount).min;
  return next > prev;
};

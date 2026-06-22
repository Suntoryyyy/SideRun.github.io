/** Badge catalog + unlock evaluation (shared by Badges screen & post-run flow). */

export const BADGE_ICONS = {
  first_steps: { icon: 'footsteps-outline', color: '#24C789' },
  first_5k: { icon: 'walk-outline', color: '#24C789' },
  first_10k: { icon: 'flash-outline', color: '#FF5A36' },
  marathoner: { icon: 'medal-outline', color: '#F6C65D' },
  week_warrior: { icon: 'shield-checkmark-outline', color: '#0B0F13' },
  consistent_runner: { icon: 'calendar-outline', color: '#00C2FF' },
  early_bird: { icon: 'sunny-outline', color: '#F6C65D' },
  social_butterfly: { icon: 'people-outline', color: '#00C2FF' },
  speed_demon: { icon: 'flash-outline', color: '#FF5A36' },
  night_runner: { icon: 'moon-outline', color: '#3A5BD9' },
  weather_warrior: { icon: 'rainy-outline', color: '#00C2FF' },
  route_explorer: { icon: 'map-outline', color: '#24C789' },
};

export const BADGE_CATALOG = [
  {
    id: 'first_steps',
    name: 'First Steps',
    description: 'Complete your first run',
    category: 'Getting Started',
  },
  {
    id: 'first_5k',
    name: 'First 5K',
    description: 'Run your first 5 kilometers',
    category: 'Distance',
    progressOf: (s) => Math.min(s.totalDistance / 5, 1),
    unlockWhen: (s) => s.totalDistance >= 5,
  },
  {
    id: 'first_10k',
    name: 'First 10K',
    description: 'Run your first 10 kilometers',
    category: 'Distance',
    progressOf: (s) => Math.min(s.totalDistance / 10, 1),
    unlockWhen: (s) => s.totalDistance >= 10,
  },
  {
    id: 'marathoner',
    name: 'Marathoner',
    description: 'Complete a full marathon (42.2 km)',
    category: 'Distance',
    progressOf: (s) => Math.min(s.totalDistance / 42.2, 1),
    unlockWhen: (s) => s.totalDistance >= 42.2,
  },
  {
    id: 'week_warrior',
    name: 'Week Warrior',
    description: 'Run 20+ km in a week',
    category: 'Weekly',
    progressOf: (s) => Math.min(s.weeklyDistance / 20, 1),
    unlockWhen: (s) => s.weeklyDistance >= 20,
  },
  {
    id: 'consistent_runner',
    name: 'Consistent',
    description: 'Complete 5 runs in a week',
    category: 'Consistency',
    progressOf: (s) => Math.min(s.weeklyRuns / 5, 1),
    unlockWhen: (s) => s.weeklyRuns >= 5,
  },
  {
    id: 'early_bird',
    name: 'Early Bird',
    description: 'Run 5 times before 7 AM',
    category: 'Time',
    progressOf: (s) => Math.min(s.weeklyRuns / 5, 1),
    unlockWhen: (s) => s.weeklyRuns >= 3,
  },
  {
    id: 'social_butterfly',
    name: 'Social',
    description: 'Share 10 runs with friends',
    category: 'Social',
    progressOf: (s) => Math.min(s.totalRuns / 10, 1),
    unlockWhen: (s) => s.totalRuns >= 10,
  },
  {
    id: 'speed_demon',
    name: 'Speed Demon',
    description: 'Keep pace under 5 min/km',
    category: 'Speed',
    progressOf: () => 0.5,
    unlockWhen: (s) => s.totalRuns >= 5,
  },
  {
    id: 'night_runner',
    name: 'Night Runner',
    description: 'Complete 5 runs after sunset',
    category: 'Time',
    progressOf: (s) => Math.min(s.totalRuns / 5, 1),
    unlockWhen: (s) => s.totalRuns >= 3,
  },
];

export const getBadgeMeta = (id) => {
  const catalog = BADGE_CATALOG.find((b) => b.id === id);
  const icons = BADGE_ICONS[id] || { icon: 'ribbon-outline', color: '#24C789' };
  return catalog ? { ...catalog, ...icons } : { id, name: id, description: '', ...icons };
};

/** Returns badge ids newly unlocked given stats + current list. */
export const findNewBadgeUnlocks = (stats, currentBadges = []) => {
  return BADGE_CATALOG.filter(
    (b) => b.unlockWhen?.(stats) && !currentBadges.includes(b.id)
  ).map((b) => b.id);
};

/** Persist newly unlocked badges; returns the full updated list. */
export const applyBadgeUnlocks = async (supabase, userId, currentBadges, stats) => {
  const newIds = findNewBadgeUnlocks(stats, currentBadges);
  if (newIds.length === 0) return { updated: currentBadges, newIds: [] };

  const updated = [...currentBadges, ...newIds];
  if (userId) {
    await supabase.from('users').update({ unlocked_badges: updated }).eq('id', userId);
  }
  return { updated, newIds };
};

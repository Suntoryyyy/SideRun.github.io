/**
 * useMapFriends — the local virtual friend pool that drives the live markers on
 * the Run map. No backend: positions are derived from the user's own location
 * so the crew always appears around the runner regardless of where they start
 * (works for the Tokyo demo loop and for real GPS alike).
 *
 * Each friend carries everything the marker + mini info card need: identity,
 * live status, distance run, elapsed time, and a recent activity line.
 *
 * Only members of the current friend list are returned (here: the demo crew,
 * which is exactly what the Crew screen shows in demo mode), satisfying
 * "仅显示当前用户好友列表中的用户".
 */
import { useMemo, useRef } from 'react';
import { DEMO_FRIENDS } from './useDemoSocial';

// Per-friend static map metadata. Offsets are in degrees from the runner's
// anchor (~0.0015° ≈ 160 m), so the crew sits a short distance away.
const FRIEND_MAP_META = {
  'demo-maya': {
    dLat: 0.0019, dLng: 0.0022, status: 'running',
    distanceKm: 4.82, durationSec: 1654, lastMessage: 'Negative splits today 🔥',
  },
  'demo-daiki': {
    dLat: -0.0017, dLng: 0.0010, status: 'running',
    distanceKm: 2.31, durationSec: 902, lastMessage: 'Easy recovery jog 🌿',
  },
  'demo-lin': {
    dLat: 0.0007, dLng: -0.0024, status: 'finished',
    distanceKm: 7.05, durationSec: 2530, lastMessage: 'Done! New 10k PB 🎉',
  },
};

const DEFAULT_META = {
  dLat: 0.0015, dLng: 0.0015, status: 'running',
  distanceKm: 0, durationSec: 0, lastMessage: 'On a run',
};

// Tokyo Imperial Palace loop centre — used until a real location is known.
const FALLBACK_ANCHOR = { latitude: 35.6825, longitude: 139.7533 };

export default function useMapFriends(anchorLocation) {
  // Snapshot the first usable location so the crew doesn't slide around as the
  // runner moves; they keep their fixed relative positions for the session.
  const anchorRef = useRef(null);
  if (
    !anchorRef.current &&
    anchorLocation &&
    anchorLocation.latitude != null &&
    anchorLocation.longitude != null
  ) {
    anchorRef.current = {
      latitude: anchorLocation.latitude,
      longitude: anchorLocation.longitude,
    };
  }
  const anchor = anchorRef.current || FALLBACK_ANCHOR;

  return useMemo(
    () =>
      DEMO_FRIENDS.map((f) => {
        const meta = FRIEND_MAP_META[f.id] || DEFAULT_META;
        return {
          id: f.id,
          name: f.name,
          avatar: f.avatar,
          color: f.color,
          status: meta.status,
          distanceKm: meta.distanceKm,
          durationSec: meta.durationSec,
          lastMessage: meta.lastMessage,
          latitude: anchor.latitude + meta.dLat,
          longitude: anchor.longitude + meta.dLng,
        };
      }),
    [anchor.latitude, anchor.longitude]
  );
}

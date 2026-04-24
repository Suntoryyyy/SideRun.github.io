/**
 * useDemoSocial — fakes the social side of a live run for Demo Mode.
 *
 * Real product behaviour:
 *   • Friends in the Crew screen subscribe to your live run via Supabase
 *     presence + the `live_cheers` table.
 *   • Tapping an emoji writes to live_cheers; the receiver's RunScreen has
 *     a Realtime subscription that pushes the emoji onto a FloatingEmoji
 *     animation surface.
 *
 * Demo Mode has no real backend round-trip and no real friends, so this
 * module locally simulates BOTH directions:
 *   1. Inbound: ambient cheers from named "demo crew" while you are
 *      actively demo-running solo, so the receive-side animation is
 *      visible during a class showcase.
 *   2. Outbound: when you tap an emoji as a demo spectator, no network
 *      hop happens — we just animate it locally and surface a friendly
 *      "delivered" reply from the demo runner.
 *
 * The hook is intentionally side-effect free outside the timer it owns.
 * Importers wire callbacks; this file never touches global state.
 */
import { useEffect, useRef } from 'react';

// ── Cast: 3 fake crew members. Names + emoji avatars chosen to read well
// in a small bubble. Colour is used to tint the sender toast banner.
export const DEMO_FRIENDS = [
  { id: 'demo-maya',  name: 'Maya',  avatar: '🏃‍♀️', color: '#24C789', _isDemo: true, isOnline: true },
  { id: 'demo-daiki', name: 'Daiki', avatar: '🥷',   color: '#00C2FF', _isDemo: true, isOnline: true },
  { id: 'demo-lin',   name: 'Lin',   avatar: '🦊',   color: '#FB7185', _isDemo: true, isOnline: true },
];

// Pool of cheer emojis; matches the Spectator tray so the inbound feed
// looks like real outbound cheers from real users.
const CHEER_EMOJI_POOL = ['🔥', '🚀', '💪', '👏', '⚡️', '🙌', '💦', '🌟'];

// Reactions the demo runner sends back when YOU cheer them. Index roughly
// corresponds to emoji intent — matches when sensible, falls back to a
// generic line otherwise.
const REPLY_BY_EMOJI = {
  '🔥': 'Burning it up — thanks!',
  '🚀': 'Lift-off mode 🙌',
  '💪': 'You\'re carrying me!',
  '👏': 'Heard that 👋',
  '⚡️': 'Charged up!',
  '🙌': 'Right back at you 🙌',
  '💦': 'Drenched but smiling 😅',
  '🌟': 'Star moment, thanks!',
};
const REPLY_FALLBACK = ['Thanks for tuning in!', 'You\'re the best 🙏', 'Pushing harder now 💨'];

export function pickDemoReply(emoji) {
  if (REPLY_BY_EMOJI[emoji]) return REPLY_BY_EMOJI[emoji];
  return REPLY_FALLBACK[Math.floor(Math.random() * REPLY_FALLBACK.length)];
}

// Random integer in [min, max] inclusive.
const randInt = (min, max) => Math.floor(min + Math.random() * (max - min + 1));

/**
 * useDemoIncomingCheers
 *   Fires `onCheer({ id, emoji, sender })` every 9-14s while `active` is true.
 *   Used on RunScreen during a solo demo run so the user sees ambient
 *   reactions arriving as if real friends were watching.
 *
 *   First cheer arrives ~4-7s after activation so it doesn't overlap the
 *   GO press, then continues at random 9-14s intervals.
 */
export function useDemoIncomingCheers({ active, onCheer }) {
  const onCheerRef = useRef(onCheer);
  useEffect(() => { onCheerRef.current = onCheer; }, [onCheer]);

  useEffect(() => {
    if (!active) return undefined;

    let cancelled = false;
    let timeoutId = null;

    const fire = () => {
      if (cancelled) return;
      const sender = DEMO_FRIENDS[randInt(0, DEMO_FRIENDS.length - 1)];
      const emoji  = CHEER_EMOJI_POOL[randInt(0, CHEER_EMOJI_POOL.length - 1)];
      const cheerId = `demo-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      try { onCheerRef.current?.({ id: cheerId, emoji, sender }); } catch (_) {}
      schedule();
    };

    const schedule = () => {
      const wait = randInt(9000, 14000);
      timeoutId = setTimeout(fire, wait);
    };

    // Initial delay so the first cheer doesn't land on top of the GO tap.
    timeoutId = setTimeout(fire, randInt(4000, 7000));

    return () => {
      cancelled = true;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [active]);
}

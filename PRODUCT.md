# Product

## Register

product

## Users

Casual-to-regular runners who run outdoors and want their training to feel
social and motivating rather than solitary. They are typically on a phone (or
the web/PWA build) in one of three contexts:

- **Mid-run, in motion** — phone in hand or pocket, glancing for one number
  (distance, time, pace). Cognitive load is near zero; the UI must answer at a
  glance and never demand fine motor input.
- **Pre / post-run, focused** — setting up a run, reviewing splits, checking
  weather, earning badges. More attention available, but still task-driven.
- **Social moments** — cheering a friend live, browsing the feed/leaderboard,
  switching between demo accounts to show the experience off.

The job to be done: "track my run accurately, and make it feel shared and
rewarding so I keep coming back."

## Product Purpose

SideRun is a social running tracker. It records runs over GPS, shows live pace
and stats, and layers on the social mechanics that drive retention: a friends
feed and leaderboard, live cheers during a run, badges, and weather context.
It runs fully on-device (local auth + storage) so it can be demoed on any
device without a backend. Success looks like a runner finishing a run and
immediately wanting to share it — and a viewer trusting the interface the way
they'd trust a category-leading fitness app.

## Brand Personality

Energetic, sporty, youthful. The voice is upbeat and encouraging without being
loud or juvenile — a confident training partner, not a hype machine. Motion and
color carry the energy; copy stays short and human.

## Anti-references

- **Not gamey.** No arcade-style flourishes, over-the-top show-off motion,
  confetti-everywhere, or gratuitous effects competing with the run data.
  Delight is earned at specific moments (finishing a run, unlocking a badge),
  not sprayed across every screen.
- Not a cold corporate dashboard either — the data is human and motivating,
  not a spreadsheet.
- Not generic AI-template UI (purple gradients, nested cards, identical card
  grids, eyebrow kickers on every section).

## Design Principles

1. **Glanceable first.** The primary number for the current context is always
   instantly readable; everything else is secondary. In-motion screens demand
   the least possible interaction.
2. **One consistent vocabulary.** Same primary-action language (brand-dark
   buttons), same metric styling, same affordances on every screen. A control
   should never change meaning or color just because the screen changed.
3. **Energy through motion and color, restraint in layout.** Carry the sporty
   feel with purposeful motion and accent color, not with decoration or
   density. Quiet structure, lively moments.
4. **Earn delight at milestones.** Celebrate finishing, streaks, and badges —
   not routine taps.
5. **Demo-ready by default.** Every flow (including sign-in and account
   switching) must work offline and read clearly when shown to someone new.

## Accessibility & Inclusion

- Target WCAG AA: body text ≥ 4.5:1 contrast, large/bold text ≥ 3:1. No muted
  gray text on tinted near-white surfaces for primary content.
- Honor reduced-motion: every animation needs a crossfade/instant fallback
  under `prefers-reduced-motion`.
- Touch targets sized for in-motion use (≥ 44pt), since users interact while
  moving.

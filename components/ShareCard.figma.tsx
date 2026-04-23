// @ts-nocheck
import React from 'react'
import figma from '@figma/code-connect'
import ShareCard from './ShareCard'

/**
 * Code Connect binding for Figma `Share / Card` (Route Hero redesign)
 * Component set node: 15:2006 · file NYsE2fd7JVOe06is2upqUw
 *
 * Figma variants → RN code:
 *   Pill = PB        → isPB = true (highlight "NEW 5K PB" pill)
 *   Pill = Neutral   → isPB = false (generic summary)
 */
figma.connect(
  ShareCard,
  'https://www.figma.com/design/NYsE2fd7JVOe06is2upqUw/SideRun?node-id=15-2006',
  {
    props: {
      isPB: figma.enum('Pill', {
        PB: true,
        Neutral: false,
      }),
    },
    example: ({ isPB }) => (
      <ShareCard
        distanceKm={5.12}
        durationLabel="27:05"
        paceLabel="5:17"
        kcal={317}
        username="suntory"
        placeName="Morning run"
        coordinates={undefined}
        isPB={isPB}
      />
    ),
  },
)

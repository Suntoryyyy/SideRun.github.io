// @ts-nocheck
import React from 'react'
import figma from '@figma/code-connect'
import ShareCard from './ShareCard'

/**
 * Code Connect binding for Figma `Share / Card`
 * Component set node: 15:2006 · file NYsE2fd7JVOe06is2upqUw
 *
 * Figma variants → RN code:
 *   Pill = PB        → isPB = true (highlight "PB" pill)
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
        distanceKm={5.2}
        durationLabel="26:12"
        paceLabel="5:02"
        kcal={312}
        distProgress={1}
        paceProgress={0.82}
        durProgress={0.75}
        username="alexcarter"
        isPB={isPB}
      />
    ),
  },
)

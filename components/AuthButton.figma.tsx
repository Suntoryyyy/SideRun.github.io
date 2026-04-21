// @ts-nocheck
import React from 'react'
import figma from '@figma/code-connect'
import AuthButton from './AuthButton'

/**
 * Code Connect binding for Figma `Auth / CTA`
 * Component set node: 14:1961 · file NYsE2fd7JVOe06is2upqUw
 *
 * Figma variants → RN code:
 *   State = Default   → idle button
 *   State = Loading   → spinner, disabled
 *   State = Disabled  → opacity reduced, disabled
 */
figma.connect(
  AuthButton,
  'https://www.figma.com/design/NYsE2fd7JVOe06is2upqUw/SideRun?node-id=14-1961',
  {
    props: {
      label: figma.string('Label'),
      loading: figma.enum('State', {
        Loading: true,
        Default: false,
        Disabled: false,
      }),
      disabled: figma.enum('State', {
        Disabled: true,
        Default: false,
        Loading: false,
      }),
    },
    example: ({ label, loading, disabled }) => (
      <AuthButton
        label={label}
        loading={loading}
        disabled={disabled}
        onPress={() => {}}
      />
    ),
  },
)

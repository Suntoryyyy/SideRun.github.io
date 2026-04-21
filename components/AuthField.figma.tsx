// @ts-nocheck
import React from 'react'
import figma from '@figma/code-connect'
// Using relative path; resolved at publish time via figma.config.json importPaths.
import AuthField from './AuthField'

/**
 * Code Connect binding for Figma `Auth / Field`
 * Component set node: 14:1951 · file NYsE2fd7JVOe06is2upqUw
 *
 * Figma variants → RN code:
 *   State = Default  → no value, not focused
 *   State = Focus    → component shows autoFocus in example
 *   State = Filled   → value prop is set, renders filled style
 */
figma.connect(
  AuthField,
  'https://www.figma.com/design/NYsE2fd7JVOe06is2upqUw/SideRun?node-id=14-1951',
  {
    props: {
      label: figma.string('Label'),
      state: figma.enum('State', {
        Default: { autoFocus: false, value: '' },
        Focus: { autoFocus: true, value: '' },
        Filled: { autoFocus: false, value: 'Alex Carter' },
      }),
    },
    example: ({ label, state }) => (
      <AuthField
        icon="person-outline"
        label={label}
        value={state.value}
        autoFocus={state.autoFocus}
        onChangeText={() => {}}
      />
    ),
  },
)

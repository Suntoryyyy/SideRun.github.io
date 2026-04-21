# Figma Code Connect

This project wires three design-system components up to their Figma counterparts
via [Figma Code Connect](https://www.figma.com/code-connect-docs/). When a
designer opens the Figma file in Dev Mode and selects one of these components,
Figma will render the real React Native snippet from this repo instead of an
auto-generated guess.

## Mapped components

| Code                                  | Figma node          | Variants mapped            |
| ------------------------------------- | ------------------- | -------------------------- |
| `components/AuthField.js`             | `Auth / Field`  (`14:1951`) | `State=Default/Focus/Filled` + `Label` |
| `components/AuthButton.js`            | `Auth / CTA`    (`14:1961`) | `State=Default/Loading/Disabled` + `Label` |
| `components/ShareCard.js`             | `Share / Card`  (`15:2006`) | `Pill=PB/Neutral`          |

Each mapping lives next to its component as a `*.figma.tsx` file:

- `components/AuthField.figma.tsx`
- `components/AuthButton.figma.tsx`
- `components/ShareCard.figma.tsx`

## Figma file

This repo is wired to:

`https://www.figma.com/design/NYsE2fd7JVOe06is2upqUw/SideRun`

Your Dev Mode link (`…?node-id=14-1928&m=dev…`) is valid: it opens the same file.
The `node-id` in that URL only selects which frame Figma focuses on in the
canvas. **Code Connect** still needs each mapping’s own `node-id` in the
`figma.connect(...)` URL (e.g. `14-1951` for `Auth / Field`), which must match
the **component set** in the file—if you ever move or duplicate components,
update those URLs.

## Setup (one-time)

1. ~~Replace file key in `*.figma.tsx`~~ — already set to `NYsE2fd7JVOe06is2upqUw`.
2. Generate a
   [Figma personal access token](https://help.figma.com/hc/en-us/articles/8085703771159)
   with the `Code Connect: Write` scope and export it (name matches the CLI):
   ```bash
   export FIGMA_ACCESS_TOKEN=figd_…
   ```
3. Dry-run to confirm everything parses:
   ```bash
   npm run figma:connect:dry
   ```
4. Publish:
   ```bash
   npm run figma:connect
   ```

After publishing, open the file in Dev Mode → select an `Auth / Field`,
`Auth / CTA` or `Share / Card` instance → the right panel shows the React
Native snippet from this repo, with the enum-driven props filled in based on
which variant is selected.

## CI

This repo includes **`.github/workflows/figma-code-connect.yml`**. It runs on
`push` to `main` when Code Connect–related paths change, and on
`workflow_dispatch`.

**Repository secret:** `FIGMA_ACCESS_TOKEN` — Figma PAT with **Code Connect:
Write** scope. The workflow exports it as `FIGMA_ACCESS_TOKEN` and runs
`npm run figma:connect`. If the secret is missing, the job fails with a clear
error.

To publish manually from GitHub: **Actions → Publish Figma Code Connect → Run
workflow**.

Alternative secret name: e.g. store the token as `FIGMA_TOKEN`, then in the
workflow set `FIGMA_ACCESS_TOKEN: ${{ secrets.FIGMA_TOKEN }}` so the CLI still
sees `FIGMA_ACCESS_TOKEN`.

## Adding new components

1. Create or extract a reusable React Native component in `components/`.
2. Add a matching variant set in the Figma file (props on the Figma component
   should line up with props in code).
3. Drop a `ComponentName.figma.tsx` next to the component and call
   `figma.connect(Component, <figma-node-url>, { props, example })`.
4. Run `npm run figma:connect:dry` to validate, then `npm run figma:connect` to
   publish.

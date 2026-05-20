# Dashboard — Always Show Auxiliary Valve Panel — Design

**Date:** 2026-05-20
**Status:** Approved

## Problem

On the dashboard, the middle column conditionally renders either the
`AuxiliaryOutputPanel` (auxiliary valve controls: Valve 1 / Valve 2) or the
`DetectorPanel` (a "Safety Status" card), based on a `showAuxPanel` store flag:

```jsx
{showAuxPanel ? (
  <AuxiliaryOutputPanel ... onHide={() => setShowAuxPanel(false)} />
) : (
  <DetectorPanel isDark={darkMode} />
)}
```

`showAuxPanel` defaults to `false` and is never set to `true` anywhere in the
codebase, so the auxiliary valve panel is currently unreachable — the dashboard
always shows the Safety Status panel.

The desired behavior: the dashboard middle column should always show the
auxiliary valve panel, and the Safety Status panel should no longer appear
there.

## Goal

Make the dashboard middle column always render `AuxiliaryOutputPanel`, remove
the conditional and the now-dead `showAuxPanel` state, and remove the panel's
hide affordance (there would be no way to bring it back).

## Design

### 1. `renderer/pages/dashboard.tsx` — middle column (around lines 478-489)

Replace the conditional render:

```jsx
{showAuxPanel ? (
  <AuxiliaryOutputPanel
    isDark={darkMode}
    onValve1Toggle={setValve1}
    onValve2Toggle={setValve2}
    onHide={() => setShowAuxPanel(false)}
  />
) : (
  <DetectorPanel isDark={darkMode} />
)}
```

with an unconditional render:

```jsx
<AuxiliaryOutputPanel
  isDark={darkMode}
  onValve1Toggle={setValve1}
  onValve2Toggle={setValve2}
/>
```

The `onHide` prop is intentionally omitted. `AuxiliaryOutputPanel` renders its
hide button as `headerAction={onHide && (...)}`, so without `onHide` the hide
button does not render — the panel is permanently visible. `onHide` is typed
optional (`onHide?: () => void`), so omitting it is valid.

### 2. `renderer/pages/dashboard.tsx` — remove dead references

- Remove the import `import { DetectorPanel } from '../components/dashboard/DetectorPanel';`
  (line 10) — no longer used in this file.
- Remove `showAuxPanel,` and `setShowAuxPanel,` from the `useDashboardStore`
  destructuring block (lines 25-26) — no longer used in this file.

### 3. `renderer/store.ts` — remove dead `showAuxPanel` state

`showAuxPanel` / `setShowAuxPanel` are used only by the store itself and
`dashboard.tsx`. Once Section 2 removes the `dashboard.tsx` usage, they are
fully dead. Remove all three occurrences:

- Interface (lines 39-40):
  ```ts
    // Panel visibility
    showAuxPanel: boolean
    setShowAuxPanel: (show: boolean) => void
  ```
  Remove these two lines and the `// Panel visibility` comment.
- Initial state (line 171): `showAuxPanel: false,`
- Setter (line 231): `setShowAuxPanel: (show) => set({ showAuxPanel: show }),`

The store is persisted to `localStorage` under `dashboard-storage`. Removing
the field is safe: any stale `showAuxPanel` value in an existing persisted
blob is simply ignored by Zustand on rehydration.

## Out of Scope / Not Changed

- `renderer/components/dashboard/DetectorPanel.tsx` — the component file is NOT
  deleted. It is still imported by `dashboard-v2.tsx` and `dashboard-old.tsx`
  (inactive/legacy pages outside this change's scope).
- `renderer/components/dashboard/AuxiliaryOutputPanel.tsx` — unchanged. It is
  simply called without the `onHide` prop.

## Testing

Manual verification (`yarn dev`):
1. The dashboard middle column always shows the Auxiliary Valve panel
   (Valve 1 / Valve 2 controls).
2. The Safety Status panel no longer appears in the middle column.
3. The auxiliary panel has no hide button in its header.
4. Valve 1 / Valve 2 toggle controls still function (call `setValve1` /
   `setValve2`).

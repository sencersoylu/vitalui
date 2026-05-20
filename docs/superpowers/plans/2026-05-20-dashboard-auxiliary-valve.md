# Dashboard — Always Show Auxiliary Valve Panel Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the dashboard middle column always render the Auxiliary Valve panel instead of conditionally showing it or the Safety Status panel.

**Architecture:** Remove the `showAuxPanel` conditional in `dashboard.tsx` so `AuxiliaryOutputPanel` always renders (without the `onHide` prop, which suppresses its hide button), then remove the now-dead `showAuxPanel` state from the Zustand store.

**Tech Stack:** Next.js/React (renderer), Zustand (`renderer/store.ts`), TypeScript.

**Note on testing:** This repo has no automated test runner (`package.json` has only `dev`/`build` scripts). Verification is a TypeScript compile check (`tsc --noEmit`) plus a manual run, as agreed in the design spec.

**Reference spec:** `docs/superpowers/specs/2026-05-20-dashboard-auxiliary-valve-design.md`

**Task order matters:** Task 1 (remove `dashboard.tsx` usage of `showAuxPanel`) must come before Task 2 (remove `showAuxPanel` from the store). Doing Task 2 first would leave `dashboard.tsx` referencing store properties that no longer exist.

---

### Task 1: `dashboard.tsx` — always render the Auxiliary Valve panel

**Files:**
- Modify: `renderer/pages/dashboard.tsx`

Current relevant code:

The middle column render block at `renderer/pages/dashboard.tsx:477-489`:

```jsx
						{/* Middle Column */}
						<div className="col-span-1 md:col-span-2 lg:col-span-3 xl:col-span-4">
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
						</div>
```

The `DetectorPanel` import at `renderer/pages/dashboard.tsx:10`:

```ts
import { DetectorPanel } from '../components/dashboard/DetectorPanel';
```

The `useDashboardStore` destructuring includes these two lines at `renderer/pages/dashboard.tsx:25-26`:

```ts
		showAuxPanel,
		setShowAuxPanel,
```

- [ ] **Step 1: Replace the conditional render with an unconditional `AuxiliaryOutputPanel`**

In `renderer/pages/dashboard.tsx`, replace this block:

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

with:

```jsx
							<AuxiliaryOutputPanel
								isDark={darkMode}
								onValve1Toggle={setValve1}
								onValve2Toggle={setValve2}
							/>
```

The `onHide` prop is intentionally omitted. `AuxiliaryOutputPanel` renders its hide button as `headerAction={onHide && (...)}`, so without `onHide` the hide button does not render. `onHide` is typed `onHide?: () => void` (optional), so omitting it is valid.

- [ ] **Step 2: Remove the now-unused `DetectorPanel` import**

In `renderer/pages/dashboard.tsx`, delete line 10:

```ts
import { DetectorPanel } from '../components/dashboard/DetectorPanel';
```

- [ ] **Step 3: Remove the `showAuxPanel` / `setShowAuxPanel` store destructuring**

In `renderer/pages/dashboard.tsx`, inside the `useDashboardStore` destructuring block, delete these two lines:

```ts
		showAuxPanel,
		setShowAuxPanel,
```

- [ ] **Step 4: Confirm no references to the removed names remain in the file**

Run: `grep -n "showAuxPanel\|setShowAuxPanel\|DetectorPanel" renderer/pages/dashboard.tsx`
Expected: no output (no matches).

- [ ] **Step 5: Verify the renderer compiles**

Run: `npx tsc --noEmit -p renderer/tsconfig.json`
Expected: no errors. (Pre-existing unrelated warnings/errors are acceptable — there must be no NEW errors referencing `dashboard.tsx`, `showAuxPanel`, `setShowAuxPanel`, or `DetectorPanel`.)

- [ ] **Step 6: Commit**

```bash
git add renderer/pages/dashboard.tsx
git commit -m "feat: always show auxiliary valve panel on dashboard"
```

---

### Task 2: `renderer/store.ts` — remove the dead `showAuxPanel` state

**Files:**
- Modify: `renderer/store.ts`

After Task 1, `showAuxPanel` / `setShowAuxPanel` are no longer referenced anywhere except the store itself. Remove all three occurrences.

Current relevant code:

The interface block at `renderer/store.ts:38-40`:

```ts
  // Panel visibility
  showAuxPanel: boolean
  setShowAuxPanel: (show: boolean) => void
```

The initial-state line at `renderer/store.ts:171`:

```ts
      showAuxPanel: false,
```

The setter line at `renderer/store.ts:231`:

```ts
      setShowAuxPanel: (show) => set({ showAuxPanel: show }),
```

- [ ] **Step 1: Remove the interface declarations and their section comment**

In `renderer/store.ts`, delete these three lines (the comment plus the two type members):

```ts
  // Panel visibility
  showAuxPanel: boolean
  setShowAuxPanel: (show: boolean) => void
```

- [ ] **Step 2: Remove the initial-state entry**

In `renderer/store.ts`, delete this line:

```ts
      showAuxPanel: false,
```

- [ ] **Step 3: Remove the setter**

In `renderer/store.ts`, delete this line:

```ts
      setShowAuxPanel: (show) => set({ showAuxPanel: show }),
```

- [ ] **Step 4: Confirm no references remain anywhere in the renderer**

Run: `grep -rn "showAuxPanel\|setShowAuxPanel" renderer --include="*.ts" --include="*.tsx"`
Expected: no output (no matches). This confirms `dashboard-v2.tsx` and `dashboard-old.tsx` never used these names either, so removal is safe.

- [ ] **Step 5: Verify the renderer compiles**

Run: `npx tsc --noEmit -p renderer/tsconfig.json`
Expected: no errors. No NEW errors referencing `store.ts`, `showAuxPanel`, or `setShowAuxPanel`. (The Zustand store is persisted to `localStorage` under `dashboard-storage`; a stale `showAuxPanel` value in an existing persisted blob is simply ignored on rehydration — no migration needed.)

- [ ] **Step 6: Commit**

```bash
git add renderer/store.ts
git commit -m "refactor: remove dead showAuxPanel store state"
```

---

### Task 3: Manual verification

**Files:** none (verification only)

- [ ] **Step 1: Run the app and verify the dashboard**

Run: `yarn dev`

On the dashboard, confirm:
1. The middle column always shows the Auxiliary Valve panel (Valve 1 / Valve 2 controls).
2. The Safety Status panel no longer appears in the middle column.
3. The auxiliary panel header has no hide button.
4. The Valve 1 and Valve 2 toggle controls still respond (they call `setValve1` / `setValve2`).

Expected: all four hold true.

- [ ] **Step 2: No commit needed**

All implementation commits were made in Tasks 1-2. This task only verifies behavior. If Step 1 revealed a defect, return to the relevant task, fix it, and amend/add a commit there.

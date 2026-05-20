# Configurable Server IP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the backend server IP configurable through the existing `windows-config.json` file instead of being hardcoded across renderer pages.

**Architecture:** The Electron main process reads an optional `serverIp` field from `windows-config.json` (already loaded from `userData`), resolves it to a module-level value with a default fallback, and exposes it synchronously over IPC. The preload script bridges it to the renderer as `window.ipc.getServerIp()`. A shared renderer helper (`renderer/config.ts`) derives the socket URL and tech-calibration URL from that IP, with a safe fallback for SSR / `next dev` without Electron.

**Tech Stack:** Electron (main + preload), Next.js/React (renderer), socket.io-client, TypeScript.

**Note on testing:** This repo has no automated test runner (`package.json` has only `dev`/`build` scripts). Verification is by TypeScript compile checks per task and a manual run at the end, as agreed in the design spec.

**Reference spec:** `docs/superpowers/specs/2026-05-20-configurable-server-ip-design.md`

**IPC channel name (must match between Task 1 and Task 2):** `get-server-ip`

**Default IP (used as fallback in Task 1 and Task 3):** `192.168.77.100`

---

### Task 1: Main process — read `serverIp` and expose it over IPC

**Files:**
- Modify: `main/background.ts`

Current relevant code:
- The `WindowsConfig` interface is at `main/background.ts:108-110`:
  ```ts
  interface WindowsConfig {
  	windows: WindowConfig[];
  }
  ```
- An existing IPC handler is at `main/background.ts:225-227`:
  ```ts
  ipcMain.on('message', async (event, arg) => {
  	event.reply('message', `${arg} World!`);
  });
  ```
- `ipcMain` is already imported at `main/background.ts:3`. No new import needed.

- [ ] **Step 1: Add `serverIp` to the `WindowsConfig` interface**

In `main/background.ts`, replace the interface at lines 108-110:

```ts
interface WindowsConfig {
	windows: WindowConfig[];
}
```

with:

```ts
interface WindowsConfig {
	serverIp?: string;
	windows: WindowConfig[];
}
```

- [ ] **Step 2: Resolve the effective server IP into a module-level variable**

The config is loaded inside the `(async () => { ... })()` IIFE at `main/background.ts:129` with the line:

```ts
	const config = loadWindowsConfig();
```

`loadWindowsConfig()` returns `WindowsConfig | null`. `config` is only in scope inside the IIFE, but the IPC handler at the bottom of the file needs the value too. Add a module-level variable near the other top-level declarations (right after the `WindowsConfig` interface, around line 111):

```ts
let serverIp = '192.168.77.100';
```

Then, immediately after the `const config = loadWindowsConfig();` line (line 129), add:

```ts
	serverIp = config?.serverIp || serverIp;
```

This keeps the default `192.168.77.100` when the config file is missing, when `config` is `null`, or when the `serverIp` field is absent/empty. It covers both the multi-window startup path and the fallback (`home_dik`) path, because both run after this line.

- [ ] **Step 3: Add the synchronous IPC handler**

In `main/background.ts`, immediately after the existing `message` handler (after line 227), add:

```ts
ipcMain.on('get-server-ip', (event) => {
	event.returnValue = serverIp;
});
```

`event.returnValue` is what makes a handler respond to a synchronous `ipcRenderer.sendSync` call from the preload script (Task 2).

- [ ] **Step 4: Verify the main process compiles**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: no errors. (Pre-existing warnings unrelated to `main/background.ts`, if any, are acceptable — there must be no new errors referencing `serverIp`, `WindowsConfig`, or `get-server-ip`.)

- [ ] **Step 5: Commit**

```bash
git add main/background.ts
git commit -m "feat: read serverIp from windows-config.json and expose over IPC"
```

---

### Task 2: Preload — expose `getServerIp()` to the renderer

**Files:**
- Modify: `main/preload.ts`

Current full contents of `main/preload.ts`:

```ts
import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron'
process.on('uncaughtException', function (err) {
  console.log(err);
})

const handler = {
  send(channel: string, value: unknown) {
    ipcRenderer.send(channel, value)
  },
  on(channel: string, callback: (...args: unknown[]) => void) {
    const subscription = (_event: IpcRendererEvent, ...args: unknown[]) =>
      callback(...args)
    ipcRenderer.on(channel, subscription)

    return () => {
      ipcRenderer.removeListener(channel, subscription)
    }
  },
}

contextBridge.exposeInMainWorld('ipc', handler)

export type IpcHandler = typeof handler
```

- [ ] **Step 1: Add `getServerIp()` to the `handler` object**

In `main/preload.ts`, replace this block:

```ts
  on(channel: string, callback: (...args: unknown[]) => void) {
    const subscription = (_event: IpcRendererEvent, ...args: unknown[]) =>
      callback(...args)
    ipcRenderer.on(channel, subscription)

    return () => {
      ipcRenderer.removeListener(channel, subscription)
    }
  },
}
```

with:

```ts
  on(channel: string, callback: (...args: unknown[]) => void) {
    const subscription = (_event: IpcRendererEvent, ...args: unknown[]) =>
      callback(...args)
    ipcRenderer.on(channel, subscription)

    return () => {
      ipcRenderer.removeListener(channel, subscription)
    }
  },
  getServerIp(): string {
    return ipcRenderer.sendSync('get-server-ip')
  },
}
```

The channel string `'get-server-ip'` must exactly match the handler registered in Task 1, Step 3. `sendSync` blocks until the main process sets `event.returnValue`, returning the IP string directly.

- [ ] **Step 2: Verify the preload compiles**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: no errors referencing `main/preload.ts` or `getServerIp`.

- [ ] **Step 3: Commit**

```bash
git add main/preload.ts
git commit -m "feat: expose getServerIp over preload bridge"
```

---

### Task 3: Renderer — shared server config helper

**Files:**
- Create: `renderer/config.ts`

This helper is the single place renderer code derives URLs from the configured IP. It must be safe to call during Next.js SSR/build (`window` undefined) and when running `next dev` without Electron (`window.ipc` undefined) — in both cases it returns the default IP.

- [ ] **Step 1: Create `renderer/config.ts`**

Create the file `renderer/config.ts` with exactly this content:

```ts
// Server configuration helpers.
//
// The backend server IP is provided by the Electron main process, which reads
// it from `windows-config.json` (see main/background.ts). It is bridged to the
// renderer as `window.ipc.getServerIp()` by main/preload.ts.
//
// Falls back to DEFAULT_SERVER_IP when running outside Electron (Next.js
// SSR/build, or `next dev` without the Electron shell).

const DEFAULT_SERVER_IP = '192.168.77.100';

export function getServerIp(): string {
	try {
		if (typeof window === 'undefined') return DEFAULT_SERVER_IP;
		const ipc = (window as any).ipc;
		if (!ipc || typeof ipc.getServerIp !== 'function') return DEFAULT_SERVER_IP;
		const ip = ipc.getServerIp();
		return typeof ip === 'string' && ip.length > 0 ? ip : DEFAULT_SERVER_IP;
	} catch {
		return DEFAULT_SERVER_IP;
	}
}

// Socket.io server URL — e.g. http://192.168.77.100:4000
export function getSocketUrl(): string {
	return `http://${getServerIp()}:4000`;
}

// Tech-calibration JSON endpoint — e.g. http://192.168.77.100/json.php?i=tech
export function getTechUrl(): string {
	return `http://${getServerIp()}/json.php?i=tech`;
}
```

The `(window as any).ipc` cast is used because `window.ipc` is injected by the preload `contextBridge` and is not part of the renderer's typed surface; the repo's `tsconfig.json` has `strict: false`, so this is consistent with existing renderer code.

- [ ] **Step 2: Verify the renderer compiles**

Run: `npx tsc --noEmit -p renderer/tsconfig.json`
Expected: no errors referencing `renderer/config.ts`.

- [ ] **Step 3: Commit**

```bash
git add renderer/config.ts
git commit -m "feat: add renderer server config helper"
```

---

### Task 4: Update the 5 active pages to use `getSocketUrl()`

**Files:**
- Modify: `renderer/pages/dashboard.tsx`
- Modify: `renderer/pages/dashboard-v2.tsx`
- Modify: `renderer/pages/o2-analyzer.tsx`
- Modify: `renderer/pages/o2-analyzer-v2.tsx`
- Modify: `renderer/pages/sensors.tsx`

Each file imports `io` from `socket.io-client` near the top and calls `io('http://192.168.77.100:4000', { ... })` exactly once. The import line and the call site differ slightly per file; exact locations are listed in each step.

- [ ] **Step 1: Add the `getSocketUrl` import to each page**

In each of the 5 files, add this import immediately below the existing `socket.io-client` import line:

```ts
import { getSocketUrl } from '../config';
```

The existing `socket.io-client` import lines (add the new import directly after each):
- `renderer/pages/dashboard.tsx:3` — `import io from 'socket.io-client';`
- `renderer/pages/dashboard-v2.tsx:3` — `import io, { Socket } from 'socket.io-client';`
- `renderer/pages/o2-analyzer.tsx:4` — `import io from 'socket.io-client';`
- `renderer/pages/o2-analyzer-v2.tsx:4` — `import io from 'socket.io-client';`
- `renderer/pages/sensors.tsx:3` — `import io from 'socket.io-client';`

- [ ] **Step 2: Replace the hardcoded URL in each `io(...)` call**

In each of the 5 files, change the `io(...)` call so the first argument is `getSocketUrl()`. The line to change:
- `renderer/pages/dashboard.tsx:90`
- `renderer/pages/dashboard-v2.tsx:96`
- `renderer/pages/o2-analyzer.tsx:127`
- `renderer/pages/o2-analyzer-v2.tsx:189`
- `renderer/pages/sensors.tsx:46`

In every case, replace:

```ts
		const socket = io('http://192.168.77.100:4000', {
```

with:

```ts
		const socket = io(getSocketUrl(), {
```

(The replacement string is identical for all 5 files; only the surrounding line numbers differ. The rest of each `io(...)` options object is unchanged.)

- [ ] **Step 3: Confirm no hardcoded socket IP remains in the active pages**

Run: `grep -n "192.168.77.100:4000" renderer/pages/dashboard.tsx renderer/pages/dashboard-v2.tsx renderer/pages/o2-analyzer.tsx renderer/pages/o2-analyzer-v2.tsx renderer/pages/sensors.tsx`
Expected: no output (no matches).

- [ ] **Step 4: Verify the renderer compiles**

Run: `npx tsc --noEmit -p renderer/tsconfig.json`
Expected: no new errors referencing the 5 modified pages or `getSocketUrl`.

- [ ] **Step 5: Commit**

```bash
git add renderer/pages/dashboard.tsx renderer/pages/dashboard-v2.tsx renderer/pages/o2-analyzer.tsx renderer/pages/o2-analyzer-v2.tsx renderer/pages/sensors.tsx
git commit -m "feat: use configurable socket URL in active pages"
```

---

### Task 5: Update `useTechCalibration` to use `getTechUrl()`

**Files:**
- Modify: `renderer/hooks/useTechCalibration.ts`

Current relevant code — `renderer/hooks/useTechCalibration.ts:1` is the only import line:

```ts
import { useState, useEffect } from 'react';
```

and `renderer/hooks/useTechCalibration.ts:25` contains the hardcoded fetch:

```ts
		fetch('http://192.168.77.100/json.php?i=tech')
```

- [ ] **Step 1: Add the `getTechUrl` import**

In `renderer/hooks/useTechCalibration.ts`, replace line 1:

```ts
import { useState, useEffect } from 'react';
```

with:

```ts
import { useState, useEffect } from 'react';
import { getTechUrl } from '../config';
```

- [ ] **Step 2: Replace the hardcoded fetch URL**

In `renderer/hooks/useTechCalibration.ts`, replace:

```ts
		fetch('http://192.168.77.100/json.php?i=tech')
```

with:

```ts
		fetch(getTechUrl())
```

- [ ] **Step 3: Confirm no hardcoded tech IP remains in the hook**

Run: `grep -n "192.168.77.100" renderer/hooks/useTechCalibration.ts`
Expected: no output (no matches).

- [ ] **Step 4: Verify the renderer compiles**

Run: `npx tsc --noEmit -p renderer/tsconfig.json`
Expected: no new errors referencing `useTechCalibration.ts` or `getTechUrl`.

- [ ] **Step 5: Commit**

```bash
git add renderer/hooks/useTechCalibration.ts
git commit -m "feat: use configurable tech-calibration URL"
```

---

### Task 6: Manual end-to-end verification

**Files:** none (verification only)

- [ ] **Step 1: Verify fallback behavior (no `serverIp` in config)**

Run: `yarn dev`

With no `serverIp` field in `windows-config.json` (or no config file at all), open DevTools console on a dashboard window and confirm the socket attempts to connect to `http://192.168.77.100:4000` — i.e., behavior is unchanged from before this feature.

Expected: app starts, pages connect exactly as they did previously.

- [ ] **Step 2: Verify configured IP is used**

Locate the `windows-config.json` file in the Electron `userData` directory. In development this is the OS app-data path for the app with ` (development)` appended (see `main/background.ts:98`); on macOS, typically `~/Library/Application Support/<app> (development)/windows-config.json`.

Add a `serverIp` field, for example:

```json
{
  "serverIp": "192.168.1.50",
  "windows": [ ... ]
}
```

Restart the app (`yarn dev`). In the DevTools console / network panel, confirm the socket connection target is now `http://192.168.1.50:4000` and any tech-calibration fetch targets `http://192.168.1.50/json.php?i=tech`.

Expected: all 5 active pages and the tech-calibration hook use the configured IP.

- [ ] **Step 3: Restore the config**

Revert `windows-config.json` to its original contents (or remove the test `serverIp` field) so the local environment is back to its normal state.

- [ ] **Step 4: Final confirmation — no commit needed**

All implementation commits were made in Tasks 1–5. This task only verifies behavior; there is nothing to commit. If Steps 1–2 revealed a defect, return to the relevant task, fix it, and amend/add a commit there.

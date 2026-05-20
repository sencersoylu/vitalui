# Configurable Server IP — Design

**Date:** 2026-05-20
**Status:** Approved

## Problem

The backend server IP (`192.168.77.100`) is hardcoded in multiple renderer pages
and in one hook. Each chamber deployment may sit on a different network, so the IP
must be changeable without rebuilding the app.

Affected sites of the hardcoded IP:
- Socket connection `io('http://192.168.77.100:4000', ...)` — 5 active pages.
- Tech-calibration fetch `fetch('http://192.168.77.100/json.php?i=tech')` — 1 hook.

The REST API (`localhost:3001`) is local to the device and stays hardcoded.

## Goal

Make the server IP configurable through the **existing** `windows-config.json`
file (already read by `main/background.ts` from `userData`), keeping the change
consistent with the established config pattern.

## Design

### 1. Config file

Extend `windows-config.json` with an optional top-level `serverIp` field:

```json
{
  "serverIp": "192.168.77.100",
  "windows": [ ... ]
}
```

`serverIp` is optional. When missing (or the file does not exist), the app
defaults to `192.168.77.100`, so existing deployments keep working unchanged.

### 2. Main process — `main/background.ts`

- Add `serverIp?: string` to the `WindowsConfig` interface.
- After `loadWindowsConfig()` runs, resolve the effective IP into a module-level
  variable: `config?.serverIp ?? '192.168.77.100'`. This works in both the
  multi-window and fallback (`home_dik`) startup paths.
- Register a synchronous IPC handler:
  `ipcMain.on('get-server-ip', (e) => { e.returnValue = serverIp })`.

### 3. Preload — `main/preload.ts`

Add a `getServerIp()` method to the `handler` object exposed as `window.ipc`:

```ts
getServerIp(): string {
  return ipcRenderer.sendSync('get-server-ip')
}
```

Synchronous by design — pages call `io()` inside `useEffect` immediately, so a
sync getter avoids introducing async/loading state.

### 4. Renderer helper — `renderer/config.ts` (new file)

```
getServerIp(): string   — calls window.ipc.getServerIp(); on error / SSR /
                          missing window.ipc, falls back to '192.168.77.100'
getSocketUrl(): string  — `http://${getServerIp()}:4000`
getTechUrl(): string    — `http://${getServerIp()}/json.php?i=tech`
```

`getServerIp()` wraps the `window.ipc` call in try/catch and guards
`typeof window === 'undefined'` (Next.js SSR/build) and a missing `window.ipc`
(running `next dev` without the Electron preload). Any of these → default IP.

### 5. Files updated

Socket URL — replace `io('http://192.168.77.100:4000', ...)` with
`io(getSocketUrl(), ...)` in:
- `renderer/pages/dashboard.tsx`
- `renderer/pages/dashboard-v2.tsx`
- `renderer/pages/o2-analyzer.tsx`
- `renderer/pages/o2-analyzer-v2.tsx`
- `renderer/pages/sensors.tsx`

Tech URL — replace `fetch('http://192.168.77.100/json.php?i=tech')` with
`fetch(getTechUrl())` in:
- `renderer/hooks/useTechCalibration.ts`

### Not changed (backup / dead code)

`dashboard-old.tsx`, `o2-analyzer-backup.tsx`, `home_dik.tsx`,
`dashboardtr.tsx`, `home.tsx` — left as-is.

## Error handling

- Missing `windows-config.json` or missing `serverIp` → default `192.168.77.100`.
- `get-server-ip` IPC fails, or `window.ipc` unavailable → helper returns default.
- Invalid IP string is not validated; treated as the user's responsibility
  (same as the existing `windows-config.json` fields).

## Behavior note

The config is read once at app startup. Changing `serverIp` requires an
**app restart** to take effect — consistent with the window settings in the
same file. Live reconnection is out of scope.

## Testing

Manual verification:
1. Set a different `serverIp` in `windows-config.json` → confirm the 5 pages
   connect to the new IP and the tech-calibration fetch hits the new host.
2. Remove the `serverIp` field → confirm fallback to `192.168.77.100`.
3. Run `next dev` without Electron → confirm the helper falls back without
   throwing.

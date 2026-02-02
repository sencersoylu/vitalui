# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

This is a **Nextron-based Electron desktop application** for chamber control and O2 monitoring systems. It combines Electron for the desktop shell with Next.js/React for the UI, styled with Tailwind CSS and @radix-ui/themes.

## Development Commands

```bash
# Development mode
yarn dev          # Start nextron dev server with hot reload

# Production build
yarn build        # Build for production
yarn build:linux  # Build Linux AppImage specifically
```

**Development Note**: The app runs in fullscreen mode by default. Press `F11` or use DevTools (opened automatically in dev mode) to navigate.

## Architecture

### Project Structure

```
MY_APP/
├── main/                  # Electron main process (Node.js/TypeScript)
│   ├── background.ts      # Main process entry point
│   ├── preload.ts         # IPC bridge for secure renderer communication
│   └── helpers/
│       └── create-window.ts  # Window management utilities
├── renderer/              # Next.js renderer process (React/TypeScript)
│   ├── pages/             # Next.js pages (routing)
│   ├── components/        # React components
│   │   ├── ui/            # Base design system components
│   │   └── dashboard/     # Domain-specific feature panels
│   ├── hooks/             # Custom React hooks
│   ├── api/               # API layer (Axios + endpoints)
│   ├── store.ts           # Zustand global state
│   └── styles/            # Global styles & Tailwind config
└── app/                   # Built renderer output (generated)
```

### State Management (Zustand)

**Central Store**: `renderer/store.ts`

The app uses Zustand with localStorage persistence. Key state categories:
- **Theme**: `darkMode` (boolean)
- **Connection**: `connected` (boolean) - Socket.io connection status
- **Device Controls**: `lightStatus`, `fan1Status`, `fan2Status`, `valve1Status`, `valve2Status`, etc.
- **Modals**: `showCalibrationModal`, `showErrorModal`, `showSeatAlarmModal`, `showChillerModal`
- **Chiller**: `chillerRunning`, `chillerCurrentTemp`, `chillerSetTemp`
- **Alarms**: `activeSeatAlarm` object with seat number

All state updates flow through setter functions in the store. The store is persisted to localStorage under the key `dashboard-storage`.

### Real-time Communication (Socket.io)

**Server**: `192.168.77.100:4000`

The app uses Socket.io for real-time device control and data updates:

**Outbound commands**:
- `writeRegister` - Analog controls (0-255 range)
- `writeBit` - Binary states (0/1)

**Key register mappings**:
- `R01700` - Main light control
- `R01702` - Ante light control
- `R01704/R01706` - Fan controls
- `M0200-M0203` - Ventilation/air modes
- `M0400` - Modal close commands

**Inbound events**:
- `data` - General data updates
- `calibrationProgress` - Calibration workflow progress
- `seatAlarm` - Seat alarm notifications
- `chillerData` - Chiller temperature updates

### API Layer

**Base client**: `renderer/api/index.ts` - Axios instance with interceptors
**Base URL**: `http://localhost:3001/api` (dev and production)
**Timeout**: 10 seconds

Error handling is centralized with Turkish error messages via `handleApiError()`.

Modular API files:
- `chambers.ts` - Chamber CRUD and controls
- `alarms.ts` - Alarm management
- `analytics.ts` - Analytics and readings data
- `settings.ts` - App settings

### Custom Hooks Pattern

Custom hooks in `renderer/hooks/` encapsulate business logic:
- `useChambers.ts` - Multiple chamber management
- `useChamber.ts` - Single chamber operations
- `useCalibration.ts` - Calibration workflows
- `useAlarms.ts` - Alarm state management
- `useReadings.ts` - Reading data and history

### Electron IPC

**Preload Script**: `main/preload.ts`

IPC is exposed to renderer via `contextBridge` as `window.ipc`:
- `send(channel, value)` - Send messages to main process
- `on(channel, callback)` - Listen for messages, returns cleanup function

**Window Management**:
- Window state (position, size) is persisted via electron-store
- Auto-recovery on startup ensures window visibility
- Crash detection in `main/background.ts:34` auto-reloads renderer

### Design System

**Full documentation**: `renderer/DESIGN_SYSTEM.md`

**Foundations**:
- **Tailwind CSS** - Utility-first styling (class-based dark mode)
- **@radix-ui/themes** - Accessible component primitives
- **Custom components** - `renderer/components/ui/` (Button, Card, Modal, Slider)

**Color semantics**:
- Emerald - Success/safe states
- Amber/Orange - Warning/caution
- Rose/Red - Danger/error
- Cyan - Special actions (e.g., chiller)

**Dark mode**: Toggle `dark` class on `<html>` element. Components accept `isDark` prop.

**Typography**: Poppins font family via Google Fonts.

**Utilities**:
- `cn()` function in `renderer/components/utils.tsx` - Merges Tailwind classes with `clsx` + `tailwind-merge`

### TypeScript Configuration

**Important**: `strict: false` in `tsconfig.json` - Type checking is relaxed. Be cautious about type assumptions.

**Excluded from compilation**: `renderer/next.config.js`, `app/`, `dist/`

## Component Patterns

### Component Organization

**Base UI Components** (`renderer/components/ui/`):
- Reusable, presentational components
- Accept `isDark` prop for theme switching
- Use variants for different styles (e.g., Button variants)

**Dashboard Components** (`renderer/components/dashboard/`):
- Domain-specific panels that manage state
- Connect to Zustand store directly
- Emit callbacks for actions

### Prop Interface Consistency

All components should accept:
- `isDark?: boolean` - Theme awareness
- `className?: string` - For custom styling (use `cn()` to merge)

### Event Callback Pattern

Components emit callbacks rather than dispatching actions directly:
```tsx
<Panel onToggle={(state) => setDeviceState(state)} />
```

## Backend Integration

### REST API

The app expects a backend server running on `localhost:3001` with endpoints for:
- Chambers (controls, status)
- Alarms (create, acknowledge, history)
- Analytics (readings, charts)

### Socket.io Server

Real-time backend at `192.168.77.100:4000` handles:
- Device control commands
- Live data streaming
- Calibration progress updates
- Alarm notifications

## Build Configuration

### Electron Builder

**App ID**: `com.soylu.rsp`
**Linux Target**: AppImage
**Main Entry**: `app/background.js`

### Production Build

1. Run `yarn build` - Builds Next.js app to `app/` directory
2. Electron-builder packages the app
3. Output: Platform-specific executables in `dist/`

### Tailwind Content Paths

Tailwind scans:
- `renderer/pages/**/*.{js,ts,jsx,tsx}`
- `renderer/components/**/*.{js,ts,jsx,tsx}`

Restart dev server after adding new component files to ensure styles apply.

## Common Patterns

### Creating a New Dashboard Panel

1. Create component in `renderer/components/dashboard/`
2. Accept `isDark` prop
3. Connect to Zustand store for state
4. Emit callbacks for actions (don't dispatch directly)
5. Use Tailwind classes with `dark:` prefix
6. Use `cn()` for conditional classes

### Adding New API Endpoints

1. Create function in appropriate `renderer/api/*.ts` file
2. Use the shared `api` Axios instance
3. Export from `renderer/api/index.ts`
4. Handle errors with `handleApiError()` if needed

### Socket.io Event Integration

1. Emit events in component effects or callbacks
2. Listen for events in `useEffect` with socket reference from store
3. Clean up listeners in effect cleanup
4. Update Zustand state on incoming events

### Dark Mode Styling

Use the `dark:` prefix for all dark-specific styles:
```tsx
<div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
```

Common patterns:
- Light bg: `bg-white` → Dark bg: `bg-slate-900`
- Light text: `text-slate-900` → Dark text: `text-white`
- Light border: `border-slate-200` → Dark border: `border-slate-700`
- Light glass: `bg-white/80` → Dark glass: `bg-white/5`

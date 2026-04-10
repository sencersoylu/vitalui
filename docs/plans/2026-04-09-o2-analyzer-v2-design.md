# O2 Analyzer v2 — Modern Glassmorphism Dashboard

**Date:** 2026-04-09
**Target:** 1280x720px fixed resolution, RPi5 touchscreen

## Layout

- Header (60px): Hipertech logo left, O2 Monitor logo right, theme toggle center-right
- Content: 2 glassmorphism cards centered, ~480x480px each, 32px gap
- Footer (40px): Date/time right-aligned

## Background

- **Dark:** Radial gradient — center `#1a1a2e`, edges `#16213e` to `#0f3460`, slow 20s animated shift
- **Light:** Soft gradient — `#e8edf5` to `#f0f4ff`

## Glass Cards

### Dark Mode
- `background: rgba(255, 255, 255, 0.05)`
- `backdrop-filter: blur(20px)`
- `border: 1px solid rgba(255, 255, 255, 0.1)`
- `box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3)`

### Light Mode
- `background: rgba(255, 255, 255, 0.6)`
- `backdrop-filter: blur(20px)`
- `border: 1px solid rgba(255, 255, 255, 0.8)`
- `box-shadow: 0 8px 32px rgba(31, 38, 135, 0.15)`

### Card Content (top to bottom)
1. Title (Main/Ante) + Settings gear button
2. "O2 Level" label (small, muted)
3. O2 value (text-8xl, ~96px) + trend arrow — emerald gradient normal, red gradient alarm
4. Glass-inner panel: High Alarm value + Alarm Status badge
5. Last Calibration info with clock icon

### Trend Arrow
- Compare current value with 30s prior
- `>+0.2%` = up arrow (rose-400)
- `<-0.2%` = down arrow (emerald-400)
- Within threshold = right arrow (slate-400)
- Fade-in animation on direction change (0.3s)

## Alarm Feedback (all simultaneously)

### 1. Border Pulse
- `border: 2px solid rgba(239, 68, 68, 0.8)`
- Opacity oscillates 0.4 to 1.0, 1.5s infinite

### 2. Card Glow
- Dark: `box-shadow: 0 0 60px rgba(239, 68, 68, 0.3)`, intensity 0.15-0.35, 2s loop
- Light: `box-shadow: 0 0 40px rgba(239, 68, 68, 0.2)`

### 3. Top Banner
- 40px height, flush with card top (rounded-t)
- `bg-red-600` to `bg-red-500` flash, 1s loop
- Left: warning icon + "HIGH O2 ALARM" white bold
- Right: Mute button

### 4. Mute State
- Banner stays but flash stops, background becomes `bg-slate-600`
- Text changes to "ALARM MUTED" + remaining time
- Auto unmute after 5 minutes

### Normal Return
- All effects fade out with 0.5s transition

## Theme Toggle
- Sun/moon icon button in header
- Uses existing Zustand `darkMode` state
- `transition-all duration-500` for smooth switch

## Animations

| Element | Type | Duration |
|---------|------|----------|
| O2 value | Number transition | 0.5s ease |
| Trend arrow | Fade-in | 0.3s |
| Background gradient | Color shift | 20s loop |
| Alarm border | Opacity pulse | 1.5s loop |
| Alarm glow | Intensity pulse | 2s loop |
| Alarm banner | Color flash | 1s loop |
| Page load | Cards fade-up | 0.6s ease-out |
| Theme switch | All colors | 0.5s |

## Performance (RPi5)
- All animations CSS-only (no JS timers)
- `will-change` and `transform` for GPU acceleration
- `prefers-reduced-motion` media query support

## Preserved Functionality
- Socket.io connection to 192.168.77.100:4000
- PLC bit writing for alarms (M0407/M0408)
- Mute/unmute with 5min auto-unmute
- Calibration settings modal
- Chamber data from REST API
- Main/Ante chamber filtering

## Implementation
- New file: `renderer/pages/o2-analyzer-v2.tsx`
- New component: `renderer/components/O2AnalyzerCardV2.tsx`
- Existing page untouched

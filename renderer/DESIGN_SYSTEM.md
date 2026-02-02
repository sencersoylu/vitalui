# Design System Documentation

## Overview

This document describes the design system used across the dashboard application. The design system is built on top of Tailwind CSS and provides a consistent, modern UI with dark mode support and accessibility features.

## Design Tokens

### Color Palette

#### Primary Colors
- `blue-500` / `blue-600` - Primary actions and CTAs
- `indigo-500` / `indigo-600` - Secondary actions and info

#### Semantic Colors
- `emerald-500` / `emerald-600` - Success states
- `amber-500` / `amber-600` / `orange-500` / `orange-600` - Warning states
- `rose-500` / `rose-600` / `red-500` / `red-600` - Danger states
- `cyan-500` / `cyan-600` - Special actions (e.g., chiller control)

#### Neutral Colors
- `slate-900` / `slate-800` / `slate-700` - Dark mode backgrounds
- `slate-100` / `slate-200` - Light mode backgrounds
- `white` - Base backgrounds and text
- `gray-400` / `gray-500` / `gray-600` - Muted states

#### Special Colors
- `brand-blue`: `#4a90e2` - Custom brand accent color
- `brand-card-bg`: `rgba(37, 78, 126, 0.09)` - Semi-transparent card background

### Spacing Scale

The Tailwind default spacing scale is used:
- `0.5rem` (8px)
- `1rem` (16px)
- `1.5rem` (24px)
- `2rem` (32px)
- `3rem` (48px)

### Border Radius

- `rounded-xl` (12px) - Default for buttons and small cards
- `rounded-2xl` (16px) - Default for cards
- `rounded-3xl` (24px) - Large modals
- `rounded-4xl` (32px) - Extra large elements
- `rounded-full` (50%) - Circular elements

### Typography

#### Font Family
- Primary: `Poppins` (Google Fonts)
- Fallback: `sans-serif`

#### Font Weights
- `font-normal` (400)
- `font-medium` (500)
- `font-semibold` (600)
- `font-bold` (700)
- `font-black` (900)

#### Font Sizes
- `text-sm` (14px)
- `text-base` (16px)
- `text-lg` (18px)
- `text-xl` (20px)
- `text-2xl` (24px)
- `text-3xl` (30px)
- `text-4xl` (36px)
- `text-5xl` (48px)
- `text-6xl` (60px)
- `text-7xl` (72px)

### Shadows

- `shadow-lg` - Elevated elements (0 10px 15px -3px rgba(0, 0, 0, 0.1))
- `shadow-xl` - Highly elevated elements (0 20px 25px -5px rgba(0, 0, 0, 0.1))
- `shadow-2xl` - Cards and modals (0 25px 50px -12px rgba(0, 0, 0, 0.25))

Color-specific shadows:
- `shadow-blue-500/25` - Blue tint
- `shadow-emerald-500/25` - Green tint
- `shadow-amber-500/25` - Orange tint
- `shadow-rose-500/25` - Red tint

## Component Guidelines

### Button Component

```tsx
import { Button } from '../components/ui/Button';

<Button
  variant="success"
  size="lg"
  fullWidth
  leftIcon={<Icon />}
  onClick={handleClick}>
  Button Text
</Button>
```

**Variants:**
- `default` - Blue gradient (primary action)
- `success` - Green gradient (positive action)
- `warning` - Orange/amber gradient (caution action)
- `danger` - Red/rose gradient (destructive action)
- `info` - Blue/indigo gradient (information action)
- `muted` - Slate gradient (secondary action)

**Sizes:**
- `sm` - Height 40px, small padding
- `md` - Height 48px, medium padding (default)
- `lg` - Height 64px, large padding

### Card Component

```tsx
import { Card } from '../components/ui/Card';

<Card
  title="Card Title"
  isDark={darkMode}
  hoverable={true}
  isLoading={false}>
  <p>Card content</p>
</Card>
```

**Props:**
- `title` - Card heading (optional)
- `isDark` - Use dark or light theme styling
- `hoverable` - Add hover elevation and scale effects
- `isLoading` - Show skeleton loading state

### Modal Component

```tsx
import { Modal } from '../components/ui/Modal';

<Modal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="Modal Title"
  size="md"
  showCloseButton={true}
  closeOnBackdropClick={true}
  closeOnEscape={true}>
  <p>Modal content</p>
</Modal>
```

**Sizes:**
- `sm` - Max-width 448px
- `md` - Max-width 512px (default)
- `lg` - Max-width 672px
- `xl` - Max-width 896px

**Features:**
- Focus trap for accessibility
- Scroll lock on body
- Escape key handling
- Backdrop click handling

### Slider Component

```tsx
import { Slider } from '../components/ui/Slider';

<Slider
  label="Temperature"
  min={5}
  max={35}
  step={0.5}
  value={temperature}
  onChange={setTemperature}
  color="cyan"
  showLabels={true}
  leftLabel="5°C"
  centerLabel="20°C"
  rightLabel="35°C"
/>
```

**Colors:**
- `blue`
- `emerald`
- `amber`
- `rose`
- `indigo`
- `cyan`

## Dark Mode Implementation

### Approach
The application uses Tailwind's `dark:` modifier with class-based dark mode enabled in `tailwind.config.js`:

```javascript
darkMode: 'class',
```

### Theme Toggle
Toggle the `dark` class on the `<html>` or `<body>` element:

```tsx
<button onClick={() => setDarkMode(!darkMode)}>
  {darkMode ? <SunIcon /> : <MoonIcon />}
</button>
```

### Styling Components for Dark Mode

Use the `dark:` prefix for dark mode styles:

```tsx
<div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
  Content
</div>
```

**Patterns:**
- Light backgrounds: `bg-white` → Dark: `bg-slate-900`
- Light text: `text-slate-900` → Dark: `text-white`
- Light borders: `border-slate-200` → Dark: `border-slate-700`
- Glassmorphism light: `bg-white/80` → Dark: `bg-white/5`

## Accessibility Guidelines

### Keyboard Navigation
- All interactive elements must be focusable with `Tab`
- Use `focus-visible` for custom focus states
- Provide focus order that matches visual order

### ARIA Labels
```tsx
<button aria-label="Toggle dark mode">
  {darkMode ? 'Light' : 'Dark'}
</button>
```

### Focus States
Use `focus-visible` utility for consistent focus rings:

```tsx
<button className="focus-visible:ring-2 focus-visible:ring-blue-500">
  Button
</button>
```

### Screen Readers
- Use semantic HTML elements (`<button>`, `<input>`, etc.)
- Provide `aria-label` for icon-only buttons
- Use `aria-modal="true"` on modal containers
- Manage focus when modals open/close

### Reduced Motion
The design system respects `prefers-reduced-motion`:

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

## Animations

### Available Animations
- `animate-fade-in` - Fade from 0% to 100% opacity
- `animate-fade-out` - Fade from 100% to 0% opacity
- `animate-slide-up` - Slide up and fade in
- `animate-slide-down` - Slide down and fade in
- `animate-scale-in` - Scale from 0.95 to 1
- `animate-zoom-in` - Scale from 0.9 to 1
- `animate-pulse` - Pulse effect (3s duration)

### Micro-interactions
- Button press: `active:scale-[0.98]`
- Button hover: `hover:scale-[1.02]`
- Hover elevation: `hover:shadow-xl`
- Smooth transitions: `transition-all duration-200 ease-out`

## Utilities

### `cn()` Helper Function
Merge Tailwind classes intelligently using `clsx` and `tailwind-merge`:

```tsx
import { cn } from '../components/utils';

<div className={cn('base-class', isActive && 'active-class', className)}>
  Content
</div>
```

### Custom Utility Classes

#### Scrollbar
```tsx
<div className="scrollbar-thin overflow-auto">
  Scrollable content
</div>
```

#### Glassmorphism
```tsx
<div className="glass backdrop-blur-xl">
  Glass effect
</div>
```

#### Gradient Text
```tsx
<h1 className="gradient-text text-2xl font-bold">
  Gradient heading
</h1>
```

#### Hide Scrollbar
```tsx
<div className="scrollbar-hide overflow-auto">
  Hidden scrollbar
</div>
```

## Responsive Design

### Breakpoints
- `default` - Mobile first (0px and up)
- `md:` - Medium screens (768px and up)
- `lg:` - Large screens (1024px and up)
- `xl:` - Extra large screens (1280px and up)

### Grid System
The dashboard uses a 12-column grid:

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-12 gap-4 md:gap-6">
  {/* Columns adjust based on breakpoint */}
</div>
```

### Touch Targets
Minimum touch target size: 44x44px (larger for main actions)

```tsx
<button className="min-h-11 min-w-11">
  Touchable button
</button>
```

## Best Practices

### 1. Consistency
- Use shared components from `components/ui/`
- Apply design tokens consistently
- Maintain dark mode parity

### 2. Performance
- Use Tailwind's JIT compiler
- Avoid arbitrary values when scale values exist
- Minimize component re-renders

### 3. Accessibility First
- Keyboard navigation should work without a mouse
- All interactive elements must have proper labels
- Focus states must be visible
- Support screen readers

### 4. Mobile-First
- Design for small screens first
- Progressively enhance for larger screens
- Ensure touch targets are large enough

### 5. Visual Hierarchy
- Use larger fonts for important information
- Use color and size to indicate importance
- Group related elements
- Provide adequate whitespace

## Component Structure

```
renderer/
├── components/
│   ├── ui/
│   │   ├── Button.tsx         # Reusable button with variants
│   │   ├── Card.tsx           # Container component
│   │   ├── Modal.tsx          # Overlay dialogs
│   │   ├── Slider.tsx         # Range input with styling
│   │   └── utils.tsx         # Helper functions (cn)
│   ├── dashboard/
│   │   ├── Header.tsx         # Top navigation
│   │   ├── ChamberControlPanel.tsx
│   │   ├── AuxiliaryOutputPanel.tsx
│   │   ├── LightingPanel.tsx
│   │   ├── FanPanel.tsx
│   │   ├── ErrorModal.tsx     # Error alert dialog
│   │   └── SeatAlarmModal.tsx # Seat alarm dialog
│   ├── ChillerControlModal.tsx # Chiller settings
│   ├── CalibrationModal.tsx   # Calibration progress
│   └── O2AnalyzerCard.tsx    # O2 monitoring card
└── styles/
    └── globals.css            # Global styles and utilities
```

## Troubleshooting

### Tailwind Classes Not Applying
1. Check `tailwind.config.js` `content` paths
2. Ensure file extensions match (`.{js,ts,jsx,tsx}`)
3. Restart dev server after config changes

### Dark Mode Not Working
1. Verify `darkMode: 'class'` in config
2. Check if `dark` class is on `<html>` element
3. Ensure `dark:` prefixes are used correctly

### Focus States Missing
1. Add `focus-visible:` utility to interactive elements
2. Ensure no custom `outline: none` without replacement
3. Test keyboard navigation

### Build Issues
1. Clear `.next` cache: `rm -rf .next`
2. Reinstall dependencies: `rm -rf node_modules && npm install`
3. Check for class name conflicts

## Future Enhancements

Consider adding:
- Toast notification system for non-blocking alerts
- Skeleton loaders for async data
- Virtualization for long lists
- Internationalization (i18n) support
- Theming beyond dark/light (custom colors)
- Component storybook for visual testing

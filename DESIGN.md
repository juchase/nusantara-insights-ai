---
name: Obsidian Intelligence
colors:
  surface: '#0b1326'
  surface-dim: '#0b1326'
  surface-bright: '#31394d'
  surface-container-lowest: '#060e20'
  surface-container-low: '#131b2e'
  surface-container: '#171f33'
  surface-container-high: '#222a3d'
  surface-container-highest: '#2d3449'
  on-surface: '#dae2fd'
  on-surface-variant: '#d8c3ad'
  inverse-surface: '#dae2fd'
  inverse-on-surface: '#283044'
  outline: '#a08e7a'
  outline-variant: '#534434'
  surface-tint: '#ffb95f'
  primary: '#ffc174'
  on-primary: '#472a00'
  primary-container: '#f59e0b'
  on-primary-container: '#613b00'
  inverse-primary: '#855300'
  secondary: '#63dbb3'
  on-secondary: '#003829'
  secondary-container: '#1aa37f'
  on-secondary-container: '#003023'
  tertiary: '#ccc6ff'
  on-tertiary: '#2a1c84'
  tertiary-container: '#aea7ff'
  on-tertiary-container: '#3e3497'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#ffddb8'
  primary-fixed-dim: '#ffb95f'
  on-primary-fixed: '#2a1700'
  on-primary-fixed-variant: '#653e00'
  secondary-fixed: '#81f8ce'
  secondary-fixed-dim: '#63dbb3'
  on-secondary-fixed: '#002117'
  on-secondary-fixed-variant: '#00513d'
  tertiary-fixed: '#e4dfff'
  tertiary-fixed-dim: '#c5c0ff'
  on-tertiary-fixed: '#140067'
  on-tertiary-fixed-variant: '#41379b'
  background: '#0b1326'
  on-background: '#dae2fd'
  surface-variant: '#2d3449'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 36px
    fontWeight: '800'
    lineHeight: 44px
    letterSpacing: -0.02em
  stat-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
    letterSpacing: -0.01em
  body-base:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 22px
    letterSpacing: '0'
  body-medium:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 22px
    letterSpacing: '0'
  body-bold:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 22px
    letterSpacing: '0'
  label-caps:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '700'
    lineHeight: 16px
    letterSpacing: 0.08em
  label-small:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '400'
    lineHeight: 16px
    letterSpacing: '0'
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  gutter: 16px
  margin-mobile: 12px
  margin-desktop: 32px
  sidebar-width: 250px
  topbar-height: 64px
---

## Brand & Style

The design system embodies a high-performance, executive-level atmosphere tailored for the Indonesian enterprise AI ecosystem. It is defined by a **"Frosted Obsidian Control Panel"** aesthetic, blending elements of **Minimalism** and **Glassmorphism** to create a sophisticated, data-rich environment.

The personality is authoritative, precise, and futuristic. It prioritizes continuous readability over long analytic sessions by utilizing a deep-space background that eliminates eye strain while allowing vibrant data accents to pop. The UI should evoke a sense of deep structural logic and limitless data horizons, moving away from high-glare interfaces toward a layered, tactile workspace where information is presented on floating, semi-transparent glass plates.

## Colors

The palette is engineered for high contrast in a dark environment. 

- **Primary (Nusantara Gold):** Reserved strictly for CTAs, active states, and focus indicators.
- **Secondary (Emerald Green):** Signals growth, health, and positive metrics.
- **Tertiary (System Indigo):** Represents AI insights and automated processes.
- **Surface Strategy:** Backgrounds use `#0f172a`. Floating containers use `#1e293b` with 80% opacity and a backdrop blur.
- **Borders:** Use ultra-thin `1px` borders of `rgba(255, 255, 255, 0.06)` to define glass edges without adding visual bulk.

## Typography

This system relies on **Inter** for its clinical precision and readability at small sizes. 

- **Weights:** Use `500` (Medium) for standard interactive text to ensure sufficient contrast against dark backgrounds. 
- **Tracking:** Headlines and large stats use negative letter-spacing (`-0.01em` to `-0.02em`) for a compact, technical look. 
- **Labels:** Use `label-caps` for sidebar headers and table headers to create clear structural differentiation through high-contrast tracking and uppercase styling.
- **Mobile scaling:** For screens below 768px, `display-lg` should scale down to `28px` to maintain layout integrity.

## Layout & Spacing

The layout is structured on a **12-column fluid grid** with a maximum content width of `1440px`. 

- **Sidebar:** A sticky left sidebar locked at `250px`. It collapses to `64px` on icon-only view.
- **Topbar:** A fixed `64px` header with `0.75` opacity and backdrop-blur to allow content to scroll underneath seamlessly.
- **Grid Rhythm:** Follows a strict `4px` baseline. Components use `24px` to `32px` internal padding to maintain an executive sense of space.
- **Adaptation:** On mobile, margins reduce to `12px` and columns reflow to a single stack. Widgets use `grid-cols-1 md:grid-cols-2 lg:grid-cols-3` logic.

## Elevation & Depth

Visual hierarchy is achieved through **Tonal Layering** and **Glassmorphism** rather than traditional drop shadows.

1.  **Level 0 (Base):** The `#0f172a` canvas.
2.  **Level 1 (Containers):** Semi-transparent glass (`#1e293b` @ 80%) with a `12px` backdrop blur. This level uses a microscopic `rgba(255, 255, 255, 0.06)` outline.
3.  **Level 2 (Popovers/Modals):** Increased opacity or a solid fill of `#1e293b` with a subtle ambient glow: `box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15)`.

Interactive elements should appear to "lift" on hover through slight background lightening or the addition of a `0.5px` upward translation.

## Shapes

The shape language is modern and approachable but maintains structural integrity.

- **Standard Roundedness:** Uses `0.5rem` (8px) for small UI elements.
- **Large Containers:** High-level statistical cards and dashboard panels use a more organic `24px` radius to soften the technical data.
- **Action Elements:** Buttons and input fields use a consistent `10px` radius for a distinct, custom feel that differentiates from standard framework defaults.

## Components

### Buttons
- **Primary:** Solid `#F59E0B` with white text. Hover state: `#D97706`.
- **Outline:** Transparent with a `1px` glass border. Hover: `rgba(255, 255, 255, 0.04)` overlay.
- **Behavior:** `36px` height for standard buttons. Use `active:translate-y-px` for tactile feedback.

### Cards & Stats
- **Glass Card:** Background `#1e293b` (80% opacity), 12px blur, `1px` border. 
- **Stat Value:** `stat-lg` typography in `#f8fafc`. Use a small pulsing green dot or pill for "Live" or "Positive" status.

### Input Fields
- **Default:** Dark slate background with `10px` radius. Border: `rgba(255, 255, 255, 0.06)`.
- **Focus:** Border transitions to `#F59E0B` with a subtle outer glow.

### Sidebar Navigation
- **Active State:** Text becomes `#F59E0B`. Add a background tint of `rgba(245, 158, 11, 0.1)` with an 8px radius.
- **Indicator:** A 3px vertical bar on the left edge of the active item in Gold.

### Data Visualization
- **Line Charts:** Actual data in solid `#F59E0B`. Forecasted data in dashed `#009B77`.
- **Progress Bars:** Multi-stage tracks. Fills change color based on value: Critical (<45%) is red, Warning (45-69%) is gold, Healthy (>70%) is emerald.

### Chips & Badges
- **Status Pills:** Background opacity at 15%, text at 100%. (e.g., Success: `bg-[#009B77]/15 text-[#009B77]`).
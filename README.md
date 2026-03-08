# SPIN LAUNCH

One-scroll flight measurement game built with Vite + React + TypeScript.

## Phase status

- Phase 1: complete (core game loop, wheel measurement, local best)
- Phase 2: in progress (parallax, touch flick, share, sound, ad bridge)

## Local development

```bash
npm install
npm run dev
```

## Build

```bash
npm run lint
npm run build
```

## AdSense setup (optional)

1. Copy `.env.example` to `.env`.
2. Set:
   - `VITE_ADSENSE_CLIENT`
   - `VITE_ADSENSE_INTERSTITIAL_SLOT`
3. Run app. Interstitial ad screen will render a live AdSense slot.

Without these values, a safe placeholder panel is shown.

## Cloudflare Pages deploy

- Framework preset: `Vite`
- Build command: `npm run build`
- Build output directory: `dist`
- Environment variables:
  - `VITE_ADSENSE_CLIENT` (optional)
  - `VITE_ADSENSE_INTERSTITIAL_SLOT` (optional)

## Implemented highlights

- Single-input wheel/touch measurement with trusted-event filtering
- Dynamic wheel bundling window for wheel vs trackpad-like patterns
- rAF flight simulation with direct HUD text updates
- Result share with generated image file (Web Share Level 2) and clipboard fallback
- Environment profile capture + editable fields persisted to localStorage

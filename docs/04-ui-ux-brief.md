# 04 — UI/UX Brief: Arnav Jain Tennis Academy Platform

## Design System: pucho-frontend (minimal SaaS)

Per pucho-frontend skill — Pucho violet accent (#7C4DFF), soft, rounded 12-16px, Inter font family.

**No overrides.** The existing frontend already implements the full Pucho design system:
- Brand color: `#7C4DFF` (purple)
- Typography: Inter (body) + Space Grotesk (display)
- Border radius: 8-24px scale
- Shadows: card, hover, soft, focus, dropdown, modal
- Z-index: 0-500 scale

## Canonical Login: pucho-frontend §6 (verbatim)

Already implemented in `src/components/pages/Login.jsx`:
- Glassmorphism card (`rgba(255,255,255,0.75)` + `backdrop-filter: blur(24px)`)
- Dot grid background with ambient orbs
- "AJ" monogram brand header
- Pre-filled demo credentials
- Quick-role login pills (Admin/Coach/Parent)
- Responsive: `h-dvh overflow-y-auto md:overflow-hidden`

## Branding Badge: pucho-frontend §7 (verbatim)

Already implemented in `src/App.jsx`:
```jsx
<div className="fixed bottom-0 right-0 z-[50] ...">
  <span>Powered By</span>
  <img src="pucho logo url" className="h-3.5" />
</div>
```
Includes `safe-area-inset-bottom` for notched devices.

## Responsiveness & Accessibility
- Mobile (<768px): CardListView, drawer nav, FilterBar bottom sheet
- Tablet (768-1024px): Collapsed sidebar (64px)
- Desktop (1024px+): Full sidebar (240px), DataGrid
- `prefers-reduced-motion`: All animations set to 0.01ms
- Keyboard navigation: Dropdown (Arrow keys, Enter, Escape, Tab), Sidebar (Escape to close)
# UI Component Gaps — ATA Tennis Academy

> **Status:** Step 0 audit. Documents UI primitives that are genuinely missing
> from the existing component library and need to be created. Every item here
> must be styled by copying its nearest sibling — never invent a new look.

---

## Missing Components

### 1. Date Picker
**Need:** Attendance back-dating, schedule navigation, package validity dates.
**Nearest sibling:** `Input.jsx` (label-above, rounded-2xl, border-line, focus ring).
**Plan:** Wrap native `<input type="date">` with the same label + container styling.
CSS normalization for calendar indicator already in `index.css`.
**Fallback:** Native `<input type="date">` with `fieldBase` class.

### 2. Time Picker (24h)
**Need:** Check-in/check-out times on attendance, batch start/end times.
**Nearest sibling:** `Input.jsx`.
**Plan:** Native `<input type="time">` with `fieldBase` class. CSS already in `index.css`.
**Fallback:** Native `<input type="time">`.

### 3. Print Stylesheet
**Need:** Printable roster (Step 4 enhancement E2).
**Nearest sibling:** N/A — new pattern.
**Plan:** `@media print` block in `index.css` hiding sidebar, header, Pucho badge.
**Fallback:** Browser default print.

### 4. PWA Manifest
**Need:** Installable icon on coach's phone home screen (Step 7.5, Enhancement E10).
**Nearest sibling:** N/A — new pattern.
**Plan:** `public/manifest.json` + `<link rel="manifest">` in `index.html`.
**Fallback:** None.

### 5. Tab Bar
**Need:** MWF / TTS / Sat-Sun schedule tabs (Step 2.2).
**Nearest sibling:** The existing nav pill pattern in `Sidebar.jsx` (rounded-2xl, brand-50 bg for active).
**Plan:** Inline component with pill-style buttons, `active: bg-brand-50 text-brand-600`.
**Fallback:** Simple button group with conditional styling.

### 6. Progress Bar (with label)
**Need:** Capacity meter on batch detail, package validity bar.
**Nearest sibling:** The existing progress bar pattern in `Batches.jsx` (h-2, bg-canvas-soft, rounded-full).
**Plan:** Extract as a reusable `<ProgressBar value={pct} label="X/Y" />` component.
**Fallback:** Inline divs with width percentage.

### 7. Child Selector
**Need:** Multi-child parent support (Step 1.4, Enhancement E3).
**Nearest sibling:** The pill-style entity toggle that was removed from Header.
**Plan:** Pill tabs showing child names, active state = brand pill.
**Fallback:** Native `<select>` with children names.

### 8. Confirm Dialog
**Need:** Confirm-before-submit on coach mobile (Step 5).
**Nearest sibling:** `Modal.jsx` (same backdrop, title, buttons).
**Plan:** Thin wrapper around Modal with "Are you sure?" + description + Confirm/Cancel buttons.
**Fallback:** `window.confirm()`.

---

## Open Questions (from UI_INVENTORY.md, still unresolved)

1. Head Coach role: distinct from Admin or same?
2. Support coach payroll attribution: who gets paid for support-coach sessions?
3. skill-band (ballLevel) → PROGRAM crosswalk: confirm with Arnav at demo.

4. **Coach dutyType vs. private-slot assignment:** Coaches have a `dutyType` field (Morning Only / Evening Only / Full Time / Part Time). Should a coach be blocked from being assigned to a private session outside their duty window? The source sheet shows informal scheduling today — no hard enforcement. Flag this for Arnav: if enforce, add a validation rule in `db.createPrivateSession()` that checks `coach.dutyType` against the slot time. Currently, no such validation exists.

5. **"Blue" ball color:** Client mentioned "Blue" as a possible ball color; source spreadsheet only shows Yellow/Green/Orange/Red in active use. Blue is NOT enabled in the UI as a selectable option until confirmed. Confirm with Arnav whether Blue is a new tier being introduced before enabling it as a selectable option.

---

*Last updated: Category + Ball Color restructuring — Aug 2026.*
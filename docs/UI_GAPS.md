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

6. **Exemption attendance counting toward personal percentage:** Whether exemption attendance counts toward the visiting player's own monthly attendance percentage — currently defaults to NOT counting toward personal percentage. The blueprint's wording ("sessions attended over sessions scheduled for that player's own services") suggests it may not count. Confirm with client.

7. **Batch versioning (effectiveFrom):** When an admin edits a batch (capacity, coach, time), the change currently applies immediately with no historical snapshot. Past attendance/slot-analysis records may reflect the new configuration. A lightweight versioning approach (e.g., an `effectiveFrom` field per batch-config change) would prevent retroactive corruption. Not built speculatively — flag for Phase 2.

8. **"Partially Paid" payment status:** The client questioned this themselves mid-message ("no one usually pays partially... either paid in full or pending in full"). Get an explicit yes/no on keeping "Partially Paid" before this ships. The field exists in the payment status dropdown but is flagged as unconfirmed — do not silently decide either way.

9. **Payment Mode visibility for The Club:** The client's own MoM leaves The Club's payment handling as an open question ("payments are processed directly by the club rather than the academy"). Payment Mode (Cash, UPI, Bank Transfer, Card, Payment Link) is currently always visible. This is the same unresolved question from the Aug 2026 MoM — not a new open item. Log this dependency clearly.

10. **Private session enrollment in the repeatable-block form:** Private/one-on-one enrollments are BLOCKED in the new repeatable-block Add Student form. The per-session rate structure (name, per-session rate, coach) from the blueprint's Enrolment Types table is not yet built. When a user selects a Private category, the form shows a message: "Private coaching enrollment coming in a later phase — use the existing Private Log for now." This avoids the wrong form (duration-based) being shown for Private sessions. Flag for Phase 2/3.

11. **Report auto-dispatch (scheduled cron):** The Verify-then-Send workflow on the Slot Analysis screen currently uses a manual "Send Now" action (opens mailto: client). Real scheduled auto-dispatch (cron-based, unattended send) needs the backend phase — this is a local-first limitation. Flag for Phase 2/3 backend.

12. **Seed GST migration (unconfirmed):** All 101 seed packages were migrated with GST fields as a tax-inclusive placeholder (`baseAmount = amount / 1.18`, `taxAmount = amount - baseAmount`). These figures are a non-destructive technical default — NOT confirmed by the client. Do not present these historical GST-split figures in the monthly Revenue Report (UC-8/WF-8.3) as final until Arnav confirms the tax treatment. Pending client answer.

13. **Legacy `src/data/` entity references:** Files in `src/data/admin/` (studentsData.js, scheduleData.js, paymentsData.js, etc.) contain 164 references to `business_entity: the-club` / `tots-tennis`. These files are not mounted by current App.jsx routes (they're Supabase-era data files). If any of these pages are reactivated, the entity field must be migrated to `membershipType` + `entity: 'The Club' | 'TOTS Tennis'` format. No action needed now — just documentation.

14. **Native `<input type="date">` format constraint:** Native HTML date inputs display as YYYY-MM-DD (browser spec). All rendered date outputs use DD-MM-YY via `formatDateDDMMYY()`. The input/display format mismatch is a known browser limitation — not a code defect. Consider a custom date-picker component in a future phase if the format mismatch becomes a client concern.

---

*Last updated: Phase 1-3 Audit Fixes — Sep 2026.*
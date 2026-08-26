# ATA — Tennis Academy Management
## Front-End Prototype Brief for the AI Coding Agent

**Client:** Arnav Jain (Academy) · **Vendor:** Pucho.ai
**Scope:** Working UI on mock data. **No backend, no database, no API.**
**Persistence:** `localStorage` only.
**Source of truth for behaviour:** MoM 24-Aug-2026 + `Basic Program Details for ATA.xlsx`

---

## 0. What this phase is, and is not

**Is:** every screen, every interaction, every calculation — running end-to-end on
seeded dummy data that persists in the browser. Arnav can click through it, mark
attendance, watch a payment-blocked student grey out, generate the slot analysis, and
see numbers he recognises from his own spreadsheet.

**Is not:** Google Sheets integration, an API layer, a database, authentication,
deployment infrastructure, or multi-device sync. All of that is deliberately deferred.

**Why it still matters that the logic is right:** the calculations in this prototype are
the product. If the slot analysis is wrong on mock data, it will be wrong on real data.
Section 4 is not decoration.

---

## 1. HARD CONSTRAINT — do not design UI

**A React UI already exists. You are not the designer.**

1. Do **not** create new visual language: no new colour tokens, typography, spacing
   scales, icon sets, or component libraries.
2. Do **not** add a UI framework (no MUI / Chakra / Ant / shadcn) unless it is already
   in `package.json`.
3. **First task, before any feature work:** inventory the existing codebase and write
   `docs/UI_INVENTORY.md` listing every reusable component with its props signature —
   tables, cards, modals, inputs, selects, date pickers, toggles, badges, tabs, toasts,
   empty states, layout shells.
4. Build every screen by **composing what already exists**. If a primitive is genuinely
   missing, copy the styling of its nearest sibling and log it in `docs/UI_GAPS.md`.
   Never invent a new look.
5. Your pull requests should be dominated by `src/mocks/`, `src/hooks/`,
   `src/features/*/logic/` — with thin `.jsx` files wiring existing components to that
   logic.

---

## 2. Architecture

```
React components  ──>  hooks (useBatches, useRoster, …)  ──>  db (localDb.js)  ──>  localStorage
     existing UI          new, thin                          the ONLY storage-aware module
```

**Three rules:**

1. **`localDb.js` is the only file that touches `localStorage`.** No component, no hook,
   no utility reads or writes storage directly. Ever.
2. **Every `db.*` method is `async`** even though localStorage is synchronous. It fakes a
   ~120 ms delay so loading and error states are real and get built now rather than
   retrofitted. When the real backend lands, `localDb.js` is replaced by an HTTP client
   with identical method signatures and **nothing else in the app changes**.
3. **Never mutate seed data directly.** All writes go through `db`, which clones,
   mutates, persists, writes an audit entry, and notifies subscribers.

`db.subscribe(fn)` fires after every write — wire it into a top-level context so open
screens refresh without manual invalidation.

---

## 3. What is already built for you

Four files ship with this brief. Drop them into `src/mocks/`. Do not rewrite them —
extend them.

| File | What it is |
|---|---|
| `seed.core.json` | 5 courts · 10 coaches · 10 users · **88 students** · 22 batches · 103 enrollments · 101 packages · 3 drift flags |
| `seed.history.json` | **1,237** attendance records · 270 coach-attendance records · 257 private sessions (last 30 days) |
| `seedData.js` | Merges the two into a single `SEED` export |
| `rules.js` | **The business logic.** Slot analysis, program precedence, payment eligibility, payroll, uncovered-slot detection. Pure functions, fully tested. |
| `localDb.js` | The localStorage repository — full CRUD, audit log, subscriptions, quota handling, export/import |

**The seed is not invented.** Student names, coach names, salaries, courts, batch times
and programs come from the client's live workbook. Fees, phone numbers, attendance
history and private-session logs are synthesised. Most importantly:

> **The seed reconciles exactly to Arnav's own Slot Analysis sheet:
> 130 slots · 88 booked · 42 open · 67.69% occupancy** — and every one of the ten
> per-programme scopes matches too. When he opens the reports screen he will see his
> own numbers. That is the moment the demo lands.

The seed also deliberately contains **10 packages in a blocked state** (payment pending,
expired, sessions exhausted) so the gating UI has something real to render, and **1
student with an ambiguous programme assignment** (Vivaan Mehra, ADV + JDP) so the
conflict warning is visible.

---

## 4. Business rules — these are the product

### 4.1 Capacity follows the student

**JDP and HPP have no batches of their own.** Those students sit inside Advanced,
Intermediate or Green batches. A seat occupied by a JDP-billed student **is a JDP slot**,
not an Advanced slot. Empty seats stay with the batch's own programme.

Worked from the client's real data:

```
MWF Advanced batches:   20 seats total
  held by JDP students:  5
  held by HPP students:  4
  ────────────────────────
  Advanced capacity:    11   ← exactly what Arnav's sheet records
  Advanced booked:       7
  Advanced open:         4
```

This is also **why JDP and HPP always show 0 open slots** — their capacity is defined by
how many students are enrolled, so capacity and booked are always equal.

Implemented in `rules.js → computeSlotAnalysis()`. Do not reimplement it.

**The roster UI still shows the student in their physical batch** — this rule governs
*counting*, not *seating*. Show a programme badge (JDP / HPP / ADV …) beside each name,
the way Arnav's colour coding does today.

### 4.2 Academy totals exclude Fitness and Private Coaching

```
academy_total = Σ { ADV, INT, ADULT, GREEN, ORANGE, RED, JDP, HPP, WEEKEND }
```

Fitness (18 slots, 15 booked, 83.33%) is reported **separately**. Private coaching never
enters occupancy at all. Verified against the source sheet — 50 + 48 + 32 = 130.

### 4.3 Programme precedence

When a student holds several active enrollments, lowest rank wins:

`HPP (1) > JDP (2) > ADV (3) > INT (4) > ADULT (5) > GREEN (6) > ORANGE (7) > RED (8)`

`rules.js → findAmbiguousStudents()` returns every student counted more than once, with
the resolved programme. **Surface this list on the reports screen** — it is how Arnav
finds data-entry mistakes he currently cannot see.

### 4.4 Attendance is gated on payment

```
paymentStatus = PENDING                      -> BLOCKED  "Payment pending"
today > validTo + extensionDays              -> BLOCKED  "Expired 18 Aug"
sessionsUsed >= purchased + makeupCredit     -> BLOCKED  "Sessions used (36/36)"
paymentStatus = PARTIAL                      -> markable, with warning
otherwise                                    -> markable "12 sessions left"
```

**Render:** the student row greys out, the attendance control disables, a tooltip states
the reason. **The student stays visible** — never hide them. The moment payment is
recorded the row reactivates without a reload.

**Admin override:** an extension requires a mandatory reason (`db.extendPackage` throws
`REASON_REQUIRED` without one) and writes an audit entry naming the admin. Coaches can
never override.

Implemented in `rules.js → getEligibility()`.

### 4.5 Session duration follows the batch, not the student

Beginner 60 min · Intermediate 90 · Advanced 120. In Arnav's words: *"even if you're a
beginner, you'll pay for 90 minutes in these batches."*

### 4.6 Coach rules

- **Dual entry.** Everything a coach can do, an admin can do on their behalf. The coaches
  are not tech-confident — the system must degrade gracefully. Every record carries
  `source` (`COACH_APP` / `ADMIN`) and `markedByRole` so Arnav can see who entered what.
- **Verify before it counts as money.** Private sessions and overtime land as
  `PENDING_VERIFICATION`. Batch attendance does not need approval.
- **Uncovered-slot alert.** A coach who has not checked in 15 minutes before an assigned
  batch raises an admin warning: *"Court 5, 5:30pm Orange Ball — no coach signed in."*
  Implemented in `rules.js → findUncoveredSlots()`.
- **Payroll:** `base + (verified privates × rate1on1) + (OT hrs × rateOT) − pro-rata
  unpaid leave`. One paid holiday a month for tennis coaches; the Fitness Team and Ops
  Head get none — handled by `paidHolidaysPerMonth = 0`, never by special-casing names.

### 4.7 Private coaching

Replaces coaches keeping notes on their phone and WhatsApping a photo at month end.
Coach sees their day → taps **Completed** after each session → admin verifies → month-end
per-coach totals. Volume swings between 50 and 300 sessions a month, so paginate.

---

## 5. Screens to build

Each screen composes existing components. The logic column is where your work goes.

| # | Screen | Data calls | Logic to get right |
|---|---|---|---|
| S1 | **Dashboard** | `getBootstrap`, `getDailySummary`, `getUncoveredSlots`, `getSlotAnalysis` | Today's attendance count, uncovered-slot alerts, occupancy headline |
| S2 | **Schedule grid** | `listBatches({dayPattern})` | MWF / TTS / Sat-Sun tabs; court × time layout; capacity vs filled; semi-batch pairing; the Court 3 → Court 4 move at 17:00 |
| S3 | **Batch detail** | `getBatch` | Roster with programme badges, coach assignment, capacity meter |
| S4 | **Students** | `listStudents`, `getStudent` | Search, guest flag, enrollment + package history |
| S5 | **Enrollment & package** | `upsertEnrollment`, `upsertPackage`, `extendPackage` | Billing-programme selector, ambiguity warning, extension modal with mandatory reason |
| S6 | **Attendance marking** | `getRoster`, `markAttendance` | Payment gating (4.4), bulk present/absent, back-dating with reason |
| S7 | **Coach — Today** (mobile) | `getCoachDay`, `coachCheckIn/Out`, `applyLeave`, `logOvertime` | Large tap targets, one-handed, confirm-before-submit |
| S8 | **Coach — Private log** (mobile) | `listPrivateSessions`, `completePrivateSession`, `createPrivateSession` | One-tap complete; ad-hoc session entry |
| S9 | **Private verification queue** | `listPrivateSessions({status})`, `verifyPrivateSessions` | Bulk verify; per-coach month totals |
| S10 | **Slot analysis report** | `getSlotAnalysis` | Mirror the layout of Arnav's existing sheet; export PDF/Excel; **show ambiguous students and drift flags** |
| S11 | **Payroll** | `getPayroll` | Per-coach breakdown with the deduction shown explicitly |
| S12 | **Dev tools** | `reset`, `exportJson`, `importJson` | Reset demo data, export/import state — invaluable during a live demo |

**S7 and S8 are mobile-first.** Assume a coach on an older Android phone, one-handed,
possibly on poor signal, with low digital literacy: no nested menus, no jargon, confirm
before every submit.

---

## 6. Build order

| Step | Scope | Gate |
|---|---|---|
| 0 | UI inventory · drop in the four mock files · wire `db` context + `subscribe` | `UI_INVENTORY.md` reviewed |
| 1 | S1 Dashboard + app shell | Renders live seed numbers |
| 2 | S2 Schedule grid + S3 Batch detail | All three day patterns correct; semi-batches paired |
| 3 | S4 Students + S5 Enrollment/packages | Ambiguity warning appears for Vivaan Mehra |
| 4 | S6 Attendance + gating | The 10 blocked packages render greyed with correct reasons |
| 5 | S7 + S8 Coach mobile | Check-in → mark → complete works on a 360px viewport |
| 6 | S9 Verification queue + S11 Payroll | Jagdish's payroll matches section 7 |
| 7 | S10 Slot analysis + exports + S12 Dev tools | **Reports 130 / 88 / 67.69%** |

Steps 2 and 3 can run in parallel after step 1. Do not start step 4 before step 3 —
gating depends on the package model.

---

## 7. Acceptance tests

Run these against the untouched seed. They already pass against `rules.js`; your job is
to not break them and to surface them correctly in the UI.

1. `getSlotAnalysis()` returns academy **total 130, booked 88, open 42, occupancy 67.69%**.
2. Per-scope: ADV 11/7 · INT 7/1 · ADULT 5/0 · GREEN 24/15 · ORANGE 12/9 · RED 24/24 ·
   JDP 11/11 · HPP 4/4 · WEEKEND 32/17 · FITNESS 18/15.
3. Fitness and Private Coaching contribute **zero** to the 130.
4. JDP and HPP both report **0 open slots**.
5. Kaisha Mehta appears on the Court 2 Advanced roster **and** counts under JDP,
   contributing 0 to the ADV booked figure.
6. Vivaan Mehra is flagged as ambiguous (ADV + JDP), resolving to **JDP**.
7. Exactly **10 packages** are blocked, across `PAYMENT_PENDING`, `EXPIRED` and
   `EXHAUSTED`. Each renders greyed with its own reason text.
8. `markAttendance` on a blocked student throws `NOT_MARKABLE` unless an
   `overrideReason` is supplied.
9. `extendPackage` without a reason throws `REASON_REQUIRED`.
10. Marking the same student twice for the same batch and date does **not** create a
    duplicate row.
11. Recording payment re-enables the row without a page reload.
12. Payroll for Jagdish with 15 verified privates, 6 OT hours and 2 leave days =
    `32000 + 12000 + 1500 − 1067 = **44,433**`.
13. Reloading the browser preserves every change; `db.reset()` restores the seed.

---

## 8. Drift flags — the demo's best moment

While reconciling the workbook, three places were found where Arnav's manual counts
disagree with his own rosters. They are pre-loaded in `seed.core.json` as `driftFlags`:

| Scope | Recorded | Actually on roster | |
|---|---|---|---|
| JDP · MWF | 5 | 6 (per the meeting transcript) | one-cell drift |
| Weekend 3:30pm | 10 booked | 9 names present | one-name drift |
| Intermediate · TTS | 1 booked | 3 INT-tagged names | tagging drift |

**Render these on the slot analysis screen** as a "Needs review" panel. This is the
single most persuasive thing in the demo: it shows the software catching what three
years of careful manual work could not. Do not hide it, and do not silently "correct" it.

---

## 9. Non-functional

- **localStorage budget** is ~5 MB. The seed is ~450 KB, leaving comfortable headroom.
  `localDb.js` already handles `QuotaExceededError` by trimming the oldest attendance.
- **Mobile-first** for S7/S8, desktop-first for admin — same component library.
- **Role-based visibility** from `SEED.users`: a coach sees only their own day, their own
  private sessions, their own payroll. Never student payment amounts.
- **Timezone** Asia/Kolkata; dates stored as `YYYY-MM-DD`.
- **Every write is audited** — `db` maintains a rolling 500-entry audit log. Expose it in
  S12; it is how Arnav answers "who changed this?"
- **Peak season starts 2 September.** Speed of delivery matters more than polish.

---

## 10. Do not decide these alone — ask

1. Fee amounts per programme. The seed uses **placeholder** figures; none appear in the
   shared sheet.
2. Make-up session policy: expiry window, cap per package, transferability.
3. Do guests count toward club occupancy reporting, or are they excluded?
4. How many days back can a coach amend attendance before it locks?
5. Overtime approval: auto-approve under N hours, or always manual?
6. What happens to a roster when a student changes programme mid-month — pro-rata or
   next cycle?

---

## 11. Paste this into the agent session

> You are building the ATA Tennis Academy Management prototype. Read
> `ATA_Frontend_Build_Brief.md` completely before writing code.
>
> **Constraints:**
> 1. A React UI already exists. You will NOT design new UI. Inventory the existing
>    components first (`docs/UI_INVENTORY.md`) and compose everything from them.
> 2. No backend, no database, no API. Data lives in `localStorage`, reached only through
>    `src/mocks/localDb.js`. No other file touches storage.
> 3. `src/mocks/rules.js` and the seed files are provided and already tested. Use them.
>    Do not reimplement the calculations — especially `computeSlotAnalysis`.
> 4. Keep every `db.*` method async. This layer gets swapped for a real API later and
>    nothing above it should have to change.
> 5. The hardest rule is 4.1 — capacity follows the student. JDP/HPP students occupy
>    seats inside other batches, and those seats belong to JDP/HPP. It is already
>    implemented; make sure the UI presents it correctly.
> 6. Work the build order in section 6. After each step, run the section 7 acceptance
>    tests and report results.
> 7. If you hit anything in section 10, stop and ask. Do not invent a policy.


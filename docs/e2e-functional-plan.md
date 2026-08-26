# Arnav Jain Tennis Academy Platform — End-to-End Functional Plan

**Client:** Arnav Jain (The Club & TOTS Tennis)
**Prepared by:** Pucho.ai Solution Architecture
**Scope:** Frontend (built) + Automation/Workflow Layer (to build)
**Status:** Frontend UI complete (mock data) → Ready for backend/workflow integration

---

## 1. Executive Summary

The platform unifies two coaching businesses — **The Club** (~100 advanced/intermediate students, Andheri) and **TOTS Tennis** (~800 toddlers/young talents) — under a single web app with three roles: **Admin**, **Coach**, **Parent**. It replaces manual WhatsApp/Excel/Spin App operations across 5 core use cases: Lead Management, Student/Batch/Parent Management, Scheduling & Attendance, Renewals & Reminders, and Financial Reconciliation.

The **frontend dashboard is fully built** (React 19 + Vite + Tailwind, RBAC, all 26 pages, mock data). What remains is wiring the automation workflows that power the live behavior behind that UI — replacing the mock `triggerWorkflow()` stub with real integrations.

**Current build focus:** Student onboarding, Scheduling & Attendance, Renewals & Reminders, and Payments/Reconciliation (9 workflows). **Lead & Inquiry Management (UC-1) is set aside for now** and covered separately in Section 5b for later phasing.

---

## 2. Current State — Frontend (Completed)

| Layer | Status | Details |
|---|---|---|
| Tech stack | ✅ Done | React 19.2, Vite, Tailwind CSS v4, TanStack Table, Recharts, Framer Motion |
| RBAC | ✅ Done | Admin / Coach / Parent, permission-matrix based, route + component-level gating |
| Navigation & Layout | ✅ Done | Sidebar, Header, PageHeader, responsive breakpoints (mobile/tablet/desktop/ultrawide) |
| Business entity isolation | ✅ Done | The Club / TOTS Tennis filter, global admin toggle |
| Core UI system | ✅ Done | Card, StatCard, Button, Input, Dropdown, Modal, StatusPill, Badge, EmptyState, Skeleton |
| Data components | ✅ Done | DataGrid (paginated, sortable), CardListView, AdaptiveTable, FilterBar, RowActionsMenu, ResponsiveChart |
| Pages | ✅ Done | 12 Admin, 6 Coach, 6 Parent, Login, Unauthorized (26 total) |
| Data layer | ✅ Mock only | Static JS files, no live API/DB — this is what the workflow layer replaces |
| Login/Auth | ✅ Mock | localStorage-based, 3 preset accounts, no real backend auth |

**What's NOT done:** Real integrations (Meta/Instagram, Gmail API / transactional email, Stripe/CC Avenue, Excel parsing engine, email/SMS delivery, cron scheduling, real auth/DB). This plan covers exactly that.

---

## 3. Roles & Access (Reference)

| Role | Responsibilities | Financial Visibility |
|---|---|---|
| **Super Admin / Head Coach (Arnav)** | System config, AI reply oversight, batch/schedule creation, edge-case handling, reports | Full — reconciliation, revenue splits, payroll, gateway data |
| **Coach** | Mark attendance, deliver 1-on-1s, log leave/holidays | None — own class tallies only |
| **Parent** | View child's schedule, remaining sessions, alerts | Own payment status, renewal dates, direct payment link only |

---

## 4. Functional Modules (Use Case → Page Mapping)

> **Note:** UC-1 (Lead & Inquiry Management) is set aside for now — see Section 5b. Active build scope below is UC-2 through UC-5.

### UC-2: Student, Batch & Parent Management
- **Pages:** `admin/Students.jsx`, `admin/Parents.jsx`, `admin/Batches.jsx`
- **Function:** Create student profile (photo/Aadhar) on enrollment → map to batch by skill/fee → send admission email → parent gets view-only portal access → certificate email on course completion

### UC-3: Class Scheduling & Attendance Automation
- **Pages:** `admin/Schedule.jsx`, `admin/Attendance.jsx`, `coach/Schedule.jsx`, `coach/Attendance.jsx`, `coach/OneOnOne.jsx`, `coach/Leave.jsx`
- **Function:** Daily email confirmation for 1-on-1s → coach marks attendance → tally against prepaid balance → 45-day expiry rule (35-day warning, 45-day auto-expire) → coach leave/payroll tracking

### UC-4: Renewals & Automated Reminders
- **Pages:** `admin/Renewals.jsx`, `parent/Package.jsx`
- **Function:** Detect expiring billing cycle (4-week/monthly/quarterly) → drip reminders (6 days prior, then 7th/14th/21st/28th) → auto-stop and renew on payment reconciliation

### UC-5: Financial Reconciliation & Invoicing
- **Pages:** `admin/Payments.jsx`, `admin/Reconciliation.jsx`, `admin/Reports.jsx`, `parent/Payments.jsx`
- **Function:** Direct Stripe/CC Avenue capture for TOTS Tennis → Excel upload + match for The Club → discrepancy detection → monthly invoice generation (Group vs 1-on-1 revenue split) + occupancy report

---

## 5. Automation Workflow Layer (9 Active Workflows)

> Replaces the mock `triggerWorkflow(action, payload)` stub in `src/utils/api.js`. Each workflow below is trigger-typed (webhook / cron / manual) and chained where dependencies exist. **Scope: Student Onboarding, Scheduling & Attendance, Renewals, and Payments/Reconciliation.** Lead-related workflows are deferred — see Section 5b.

| # | Workflow | Trigger Type | Trigger | Steps | Integrations | Frontend Consumer |
|---|---|---|---|---|---|---|
| **WF-D** | Student Onboarding | Manual (UI) | Admin creates/enrolls student directly | Create profile → attach docs → assign batch → send Thank-You email | Doc storage, Email | `Students.jsx` detail modal |
| **WF-E** | Course Completion & Certification | Manual/Cron | Admin manually marks package/student complete | Generate certificate PDF → send Congratulations email | PDF gen, Email | Email Timeline |
> **Assumption (pending client confirmation):** Course completion is triggered manually by Admin (not automatic via session count or fixed duration), since the blueprint does not define an automatic completion condition. This can be reworked if the client prefers a different trigger.
| **WF-F** | Daily 1-on-1 Confirmation | Cron (daily) + Webhook (reply) | Today's 1-on-1 sessions exist | Send email confirmation with Confirm/Cancel buttons → capture click → update status | Gmail API | `Schedule.jsx`, Attendance stat |

> **Client sign-off note for WF-F:** This workflow was originally designed around WhatsApp's high open-rate/fast-reply behavior to solve coach idle-time. Switching to email trades some confirmation speed for lower integration complexity — recommend validating response times with the client during Phase 1 rollout before assuming parity.

| **WF-G** | Package Validity & Expiry Engine | Cron (daily) | Days-used check per active package | Day 35: warning alert. Day 45: auto-expire + notify admin | Email | `PackageValidityBar` |
| **WF-H** | Renewal Drip Campaign | Cron (daily) | Billing cycle nearing expiry | 6-day-prior reminder → 7/14/21/28-day drip if unpaid → auto-stop on payment | Email/SMS | `Renewals.jsx` timeline |
| **WF-I** | Direct Payment Capture (TOTS Tennis) | Webhook | Stripe/CC Avenue payment success | Match to student → mark reconciled → stop WF-H → reset WF-G clock | Stripe API, CC Avenue API | `Payments.jsx` |
| **WF-J** | Club Excel Reconciliation | Manual (UI) | Admin uploads Excel | Parse rows → match expected vs reported → flag mismatch/new → preview | Excel parser (SheetJS) | `Reconciliation.jsx` |
| **WF-K** | Invoice & Occupancy Report Generation | Cron (month-end) + Manual | Month-end / "Generate" click | Calculate Group vs 1-on-1 split → generate invoice PDF → compute occupancy % | PDF generator | `Reports.jsx` |
| **WF-L** | Coach Payroll &amp; Leave Rollup | Cron (monthly) + on leave approval | Scheduled/leave event | Entity-specific: The Club (session-based, half_day/full_day, approval-gated) + TOTS Tennis (hourly, hours_logged x hourly_rate) | Internal calc | `Coaches.jsx`, `MyStats.jsx` |
| **WF-M** | Absence Alert Engine | Cron (every 30 min) | No attendance marked after configurable delay (default 2h, admin-settable) | Identify missed sessions → resolve parent emails → send absence notification via Gmail | Gmail API | `Attendance.jsx` manual-entry section |

### Workflow Chaining Map
```
WF-D → WF-E
WF-I → stops WF-H, resets WF-G
WF-J → same reconciliation effect as WF-I (manual entries)
WF-M → independent post-session reactive alert (distinct from WF-F pre-session confirmation)
```

---

## 5b. Deferred: Lead & Inquiry Management (UC-1)

> Set aside for now per current build priorities. Revisit once WF-D through WF-L are live.

| # | Workflow | Trigger Type | Trigger | Steps | Integrations | Frontend Consumer |
|---|---|---|---|---|---|---|
| **WF-A** | Lead Capture + AI Auto-Response | Webhook | Inbound Instagram/Meta DM | Parse → classify (FAQ vs edge-case) → auto-reply from template/KB | Meta Graph API, LLM classifier | `Leads.jsx` DM modal |
| **WF-B** | Escalation Routing | Chained (from WF-A) | Low AI confidence / edge case | Push to Admin Manual Queue → notify | Notification service | Leads "Manual Queue" stat |
| **WF-C** | Trial → Enrollment Pipeline | Manual (UI) | Admin marks trial booked/enrolled | Update `funnel_stage` → trigger WF-D on enrollment | State machine | Leads funnel kanban |

When reactivated, WF-C should re-chain into WF-D (Student Onboarding) as its trigger, replacing the manual-UI trigger above.

---

## 6. System Architecture Recommendations

| Principle | Detail |
|---|---|
| **Single event-driven engine** | One workflow dispatcher handling 3 trigger types (webhook / cron / manual-UI), not 12 standalone scripts |
| **Unified notification layer** | One `sendNotification({channel, template, recipient})` abstraction used by WF-D, E, F, G, H — not separate Email/SMS logic per workflow |
| **State machines over status flags** | Package lifecycle (`active → warning → expired`) modeled explicitly to prevent invalid state combinations. (Lead funnel state machine deferred with UC-1 — see Section 5b.) |
| **Idempotency & signature verification** | All webhook-driven workflows (WF-F reply, WF-I) verify signatures (Gmail webhook/Stripe) and use idempotency keys to survive retries |
| **Staggered cron scheduling** | WF-F, WF-G, WF-H, WF-K, WF-L run at offset times to avoid Gmail API rate limits |

---

## 7. Data Model Additions Needed (Backend)

| Entity | Key Fields | Notes |
|---|---|---|
| Lead *(deferred)* | `social_handle`, `inquiry_status`, `funnel_stage`, `business_entity` | Powers WF-A, B, C — build when UC-1 is reactivated |
| Student | `business_entity`, `batch_type`, `billing_cycle`, `package_validity_date` | Powers WF-D, G, H |
| Class/Attendance | `coach_id`, `package_validity_date`, `confirmation_status`, `cancellation_type` | Powers WF-F, G |
| Payment Reconciliation | `expected_amount`, `club_reported_amount`, `reconciliation_status`, `gateway_source` | Powers WF-I, J |
| Coach | `attendance_log`, `leave_balance`, `payroll_sessions` | Powers WF-L |

---

## 8. Phased Rollout Plan

| Phase | Scope | Workflows | Notes |
|---|---|---|---|
| **Phase 0 (Done)** | Frontend dashboard, mock data, RBAC | — | Already built per `CONTEXT.md` |
| **Phase 1: Student & Scheduling Foundation** | Real auth/DB, student onboarding, email confirmations, expiry engine, payroll rollup (entity-specific), absence alert engine, course completion & certification | WF-D, WF-F, WF-G, WF-L, WF-M, WF-E | **The Club's data and workflows validated first; TOTS Tennis follows once Club flows confirmed** |
| **Phase 2: Financial Automation** | Payments, reminders, reconciliation, invoicing | WF-H, WF-I, WF-J, WF-K | Highest complexity (webhooks + reconciliation) — build second |
| **Phase 3: Lead Management (Deferred)** | Lead capture + AI reply, escalation, trial pipeline | WF-A, WF-B, WF-C | Revisit once Phases 1–2 are live; see Section 5b |

---

## 9. Integrations Checklist

- [ ] Meta Graph API / Instagram Messaging API (lead capture — *deferred with UC-1*)
- [ ] Gmail API (confirmations, reminders, drip campaigns)
- [ ] Stripe API (TOTS Tennis direct payments)
- [ ] CC Avenue API (The Club payments, if applicable)
- [ ] Excel parser (SheetJS or equivalent) for The Club's manual reports
- [ ] Email delivery provider (transactional — admission, certificate, renewal emails)
- [ ] SMS provider (fallback/alternate channel for reminders)
- [ ] PDF generator (certificates, invoices)
- [ ] Cron/scheduler service (daily and monthly jobs)
- [ ] Real authentication + database (replacing localStorage mock auth)

---

## 10. Open Questions (Carried from Client Discovery)

1. Exact column/schema mapping of The Club's Excel export for automated ingestion (WF-J)
2. Will coaches get direct login credentials, or continue WhatsApp-based reporting to Admin?
3. Is a dedicated sending domain/Gmail account ready for the platform, with SPF/DKIM/DMARC configured for deliverability?
4. **Sport-specific performance KPI reports (hand-eye coordination, etc.)** — logged as backlog for a future phase, per Aug 2026 MoM. No build action now.
5. **How will the system handle payment tracking and billing for The Club?** Club payments are processed directly by the club rather than the academy (raised in Aug 2026 MoM). WF-J remains a working assumption until this is resolved.

## 11. Explicit Out of Scope

- Native iOS/Android app (web-only, URL-based, confirmed)
- Changes to The Club's internal software/Excel export format (client must accept their standard format)
- Commercial licensing/subscription pricing (handled separately in commercial agreement)

---

## 12. Success Criteria

| Metric | Target |
|---|---|
| Manual follow-ups eliminated | 1-on-1 confirmations, renewal reminders fully automated |
| Reconciliation time reduced | Excel upload + match replaces manual cross-checking |
| Package expiry leakage | 45-day rule enforced automatically, zero manual tracking |
| Revenue-share invoicing | Auto-generated monthly, no manual calculation |

---

*This document consolidates the client discovery blueprint, the completed frontend implementation (`CONTEXT.md`), and the optimized workflow automation architecture (10 active workflows: WF-D through WF-M, 3 deferred with UC-1) into a single build reference.*

---

## 13. Client Meeting Updates (Aug 2026)

**Date:** August 2026 | **Source:** MoM - Project Progress and Next Steps

### 13.1 Rename: TOTS Tennis
- Global rename from "Todd's Tennis" to "TOTS Tennis" (all-caps brand acronym).
- Applied to: `business_entity` enum values, frontend nav/toggle labels, mock data files, Login.jsx copy, dashboard filters, docs, PDF service, migrations, and workflow JSON defaults.
- The entity slug `tots-tennis` is used consistently across all data references.

### 13.2 Re-scope: WF-L Coach Payroll (Two Entity-Specific Paths)
**Rationale:** MoM confirmed different compensation models — The Club does session-based payroll with morning/evening distinction, TOTS Tennis uses hourly billing.
- **The Club path:** Added `session_period` (half_day/full_day) to schedule/attendance/coach_attendance records. Added `approval_status` (pending/approved) to coach_attendance requiring head coach or admin sign-off before Club payroll finalization. Payroll computed as `monthly_salary - (leave_days × daily_rate)`. No auto-finalize without approval.
- **TOTS Tennis path:** Added `hours_logged` and `hourly_rate` fields to coach records. Payroll computed as `hours_logged × hourly_rate`. No approval gate.
- Frontend: `admin/Coaches.jsx` shows payroll method column; `coach/MyStats.jsx` shows payroll summary card with entity-specific calculation.

### 13.3 New Workflow: WF-M Absence Alert Engine
**Rationale:** MoM requested automated attendance reminders configured to notify parents if a student is absent after a customizable timeframe.
- **Trigger:** External cron (recommended every 30 min) via webhook.
- **Configurable delay:** Reads from `platform_settings.absence_alert_delay_hours` (default 2 hours, admin-settable).
- **Logic:** Queries schedule for sessions in `[now - delay, now - 1h buffer]` with no matching attendance record → resolves parent email via `student_parents` → sends Gmail absence notification.
- **Distinct from WF-F:** WF-F is pre-session confirmation (proactive); WF-M is post-session absence detection (reactive). They do not share logic or merge.
- **New schema:** `platform_settings` table (key/value pairs for admin-configurable settings).

### 13.4 Manual Attendance Fail-safes
**Rationale:** MoM flagged risk that coaches from simple backgrounds may not reliably mark attendance; also confirmed need for trial student and out-of-schedule batch support.
- **Admin-proxy entry:** Added "Mark on Behalf" button on `admin/Attendance.jsx` — admin can mark attendance for any student on behalf of any coach. Entry records `marked_by = 'admin'`.
- **Trial student support:** Attendance for students with `status = 'trial'` skips package tally/decrement logic. Trial students show "(Trial)" tag in the entry dropdown.
- **Out-of-schedule batch:** Added "Quick Log" button — admin can log attendance for a student in any batch, not just their assigned one. Attendance table allows `batch_id` FK to any batch.

### 13.5 Phase 1 Rollout Priority
- The Club's data and workflows now serve as the primary validation path for Phase 1 development and testing.
- TOTS Tennis workflows are validated after The Club's flows are confirmed working.
- This does not change which workflows are in Phase 1 (WF-D, F, G, L, M, E), only the validation and testing order with real client data.

### 13.6 Deferred / Flagged for Pending Client Input
- **WF-J (Club payment tracking):** On hold until client answers the open question from MoM — "How will the system handle payment tracking and billing for The Club, given that payments are processed directly by the club rather than the academy?" Current Excel-reconciliation logic is kept as a working assumption only (pending-input comment added to WF-J JSON).
- **Sport-specific performance KPI reports:** Logged as Section 10 Open Question #4 — backlog item for a future phase. No build action now.
- **Trial-class inquiry form (TOTS Tennis, transitioning off Spin App):** Deferred with UC-1 (Lead Management). Logged in Section 5b.
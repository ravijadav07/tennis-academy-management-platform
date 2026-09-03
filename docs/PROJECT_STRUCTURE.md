# Project Structure — Tennis Academy Management

> Standard folder structure rules for this project.
> Every new file must follow the conventions below.
> Deviations require a reason documented in the commit.

---

## Directory Rules

```
tennis-academy/
├── public/                  # Static assets served at /
│   ├── favicon.png          #   Browser tab icon
│   └── manifest.json        #   PWA manifest (optional)
│
├── src/
│   ├── assets/              # Imported assets (images, icons, brand)
│   │   ├── brand/           #   Brand logos, favicons
│   │   ├── icons/           #   Pucho skill icons
│   │   └── mascot_*.png     #   Login page mascot images
│   │
│   ├── components/          # Reusable UI components
│   │   ├── base/            #   Primitive/base components (buttons, dropdowns)
│   │   │   ├── buttons/     #     Button variants
│   │   │   └── dropdown/    #     Dropdown variants
│   │   ├── ui/              #   Design-system UI primitives
│   │   │   ├── Button.jsx
│   │   │   ├── Card.jsx
│   │   │   ├── CapacityIndicator.jsx
│   │   │   ├── Dropdown.jsx
│   │   │   ├── EligibilityStatusPill.jsx
│   │   │   ├── EmptyState.jsx
│   │   │   ├── ErrorBoundary.jsx
│   │   │   ├── Input.jsx
│   │   │   ├── Modal.jsx
│   │   │   ├── Skeleton.jsx
│   │   │   ├── StatCard.jsx
│   │   │   ├── StatusPill.jsx
│   │   │   ├── Badge.jsx
│   │   │   └── TimePicker12h.jsx
│   │   ├── data/            #   Data display components (tables, charts, filters)
│   │   │   ├── AdaptiveTable.jsx
│   │   │   ├── CardListView.jsx
│   │   │   ├── DataGrid.jsx
│   │   │   ├── FilterBar.jsx
│   │   │   ├── ResponsiveChart.jsx
│   │   │   └── RowActionsMenu.jsx
│   │   ├── layout/          #   Layout shell components
│   │   │   ├── BottomNav.jsx
│   │   │   ├── DashboardLayout.jsx
│   │   │   ├── GlobalSearch.jsx
│   │   │   ├── Header.jsx
│   │   │   ├── LocalStorageBanner.jsx
│   │   │   ├── PageHeader.jsx
│   │   │   └── Sidebar.jsx
│   │   ├── rbac/            #   Role-Based Access Control
│   │   │   └── CanAccess.jsx
│   │   └── pages/           #   Page-level components (one file per route)
│   │       ├── admin/       #     Admin role pages
│   │       │   ├── Attendance.jsx
│   │       │   ├── Batches.jsx
│   │       │   ├── BatchDetail.jsx
│   │       │   ├── Coaches.jsx
│   │       │   ├── CourtMaster.jsx
│   │       │   ├── Dashboard.jsx
│   │       │   ├── DevTools.jsx
│   │       │   ├── Parents.jsx
│   │       │   ├── Payments.jsx
│   │       │   ├── Payroll.jsx
│   │       │   ├── Reconciliation.jsx
│   │       │   ├── Renewals.jsx
│   │       │   ├── Reports.jsx
│   │       │   ├── RevenueReport.jsx
│   │       │   ├── Schedule.jsx
│   │       │   ├── Students.jsx
│   │       │   └── Verification.jsx
│   │       ├── coach/       #     Coach role pages
│   │       │   ├── Attendance.jsx
│   │       │   ├── CoachToday.jsx
│   │       │   ├── Dashboard.jsx
│   │       │   ├── Leave.jsx
│   │       │   ├── MyStats.jsx
│   │       │   └── PrivateLog.jsx
│   │       ├── parent/      #     Parent role pages
│   │       │   ├── Attendance.jsx
│   │       │   ├── Dashboard.jsx
│   │       │   ├── Package.jsx
│   │       │   ├── Payments.jsx
│   │       │   ├── Progress.jsx
│   │       │   └── Schedule.jsx
│   │       ├── Login.jsx    #     Public login page
│   │       └── Unauthorized.jsx  #   403 page
│   │
│   ├── config/              # Application configuration
│   │   ├── nav.js           #   Navigation definitions per role
│   │   └── roles.js         #   RBAC roles and permissions matrix
│   │
│   ├── context/             # React context providers
│   │   ├── AuthContext.jsx  #   Authentication state (PIN-based, 4 roles)
│   │   └── DbContext.jsx    #   localStorage database context (subscribe/tick pattern)
│   │
│   ├── data/                # Mock/seed data files (Phase 1 — localStorage)
│   │   ├── admin/           #   Admin module mock data
│   │   ├── coach/           #   Coach module mock data
│   │   └── parent/          #   Parent module mock data
│   │
│   ├── hooks/               # Custom React hooks
│   │   ├── useAttendance.js
│   │   ├── useCoach.js
│   │   ├── useDashboard.js
│   │   ├── useDebounce.js
│   │   ├── useMediaQuery.js
│   │   ├── useSchedule.js
│   │   └── useStudents.js
│   │
│   ├── mocks/               # Local-first data layer (Phase 1)
│   │   ├── localDb.js       #   localStorage CRUD repository (async, audit, subscribe)
│   │   ├── rules.js         #   Business logic — computeSlotAnalysis, getEligibility, etc.
│   │   ├── seedData.js      #   Seed data loader
│   │   ├── seed.core.json   #   Core seed data (88 students, 22 batches, 101 packages)
│   │   └── seed.history.json #  Historical seed data (attendance, coach attendance, private sessions)
│   │
│   ├── utils/               # Utility functions
│   │   ├── api.js           #   Webhook proxy (triggerWorkflow)
│   │   ├── cn.js            #   clsx + tailwind-merge helper
│   │   ├── formatters.js    #   Date/time/currency formatting
│   │   ├── notificationEngine.js # Email notification composer (mailto: URLs)
│   │   ├── settings.js      #   Configurable app settings (GST rate, currency, locale)
│   │   └── supabase.js      #   Supabase client
│   │
│   ├── App.jsx              # Root app component (router, routes, Pucho badge)
│   ├── main.jsx             # Entry point (StrictMode, DbProvider, render)
│   └── index.css            # Global styles, design tokens, print stylesheet
│
├── workflows/               # Pucho AI Studio workflow JSONs (13 workflows)
│   ├── WF-D_student_onboarding.json
│   ├── WF-E_course_completion.json
│   ├── WF-F_daily_1on1_confirmation.json
│   ├── WF-G_package_validity.json
│   ├── WF-H_renewal_drip.json
│   ├── WF-I_direct_payment_capture.json
│   ├── WF-J_club_excel_reconciliation.json
│   ├── WF-K_invoice_occupancy_report.json
│   ├── WF-L_coach_payroll_leave.json
│   ├── WF-M Absence Alert Engine.json
│   ├── WF-O_payment_reminder_email.json
│   ├── WF-P_slot_report_email.json
│   └── UC-4_renewal_reminder_engine.json
│
├── migrations/              # Supabase SQL migration files
│   ├── 001_schema.sql
│   └── 002_seed.sql
│
├── docs/                    # Project documentation
│   ├── 01-prd.md            #   Product Requirements Document
│   ├── 02-trd.md            #   Technical Requirements Document
│   ├── 03-app-flow.md       #   Application Flow Document
│   ├── 04-ui-ux-brief.md    #   UI/UX Design Brief
│   ├── 05-backend-schema.md #   Backend Schema Document
│   ├── 06-plan.md           #   Implementation Plan
│   ├── e2e-functional-plan.md
│   ├── UI_INVENTORY.md      #   UI component catalog
│   ├── UI_GAPS.md           #   Known gaps and open questions
│   └── PROJECT_STRUCTURE.md #   This file
│
├── .env                     # Environment variables (git-ignored, NEVER commit)
├── .env.example             # Environment variables template (committed, safe to share)
├── .gitignore               # Git ignore rules
├── index.html               # Vite HTML entry point
├── package.json             # Dependencies and scripts
├── vite.config.js           # Vite configuration
├── CONTEXT.md               # Project context and architecture overview
└── README.md                # Project README
```

---

## File Naming Conventions

| Rule | Example |
|------|---------|
| **Pages:** PascalCase, one file per route | `Students.jsx`, `Attendance.jsx` |
| **Components:** PascalCase, named export | `CapacityIndicator.jsx`, `StatusPill.jsx` |
| **Hooks:** camelCase, `use` prefix | `useDashboard.js`, `useStudents.js` |
| **Utilities:** camelCase | `formatters.js`, `notificationEngine.js` |
| **Config:** camelCase | `nav.js`, `roles.js` |
| **Context:** PascalCase | `AuthContext.jsx`, `DbContext.jsx` |
| **Workflows:** `WF-{letter}_{description}.json` | `WF-M Absence Alert Engine.json` |
| **Migrations:** `{number}_{description}.sql` | `001_schema.sql` |

---

## Import Path Rules

| Import Type | Pattern | Example |
|------------|---------|---------|
| **UI components** | `../../ui/Component` | `import Card from '../../ui/Card'` |
| **Context** | `../../../context/Context` | `import { useDb } from '../../../context/DbContext'` |
| **Hooks** | `../../../hooks/hookName` | `import { useDashboard } from '../../../hooks/useDashboard'` |
| **Mocks** | `../../../mocks/module` | `import { computeSlotAnalysis } from '../../../mocks/rules'` |
| **Utils** | `../../../utils/utility` | `import { formatTime12h } from '../../../utils/formatters'` |
| **Config** | `../../../config/file` | `import { PERMISSIONS } from '../../../config/roles'` |

---

## Environment Variables

All configuration lives in `.env` (git-ignored) with a `.env.example` template committed.

### Naming Convention
- Frontend-exposed variables: `VITE_` prefix (required by Vite)
- Secrets (webhook URLs, API keys): `VITE_` prefix (acceptable for demo/local-first phase)
- Backend-only secrets: no `VITE_` prefix (Supabase Edge Function env vars)

### Available Variables
| Variable | Purpose |
|----------|---------|
| `VITE_PUCHO_WF_SLOT_REPORT` | WF-P webhook URL |
| `VITE_PUCHO_WF_ABSENCE_ALERT` | WF-M webhook URL |
| `VITE_PUCHO_WF_PAYMENT_REMINDER` | WF-O webhook URL |
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon key |
| `VITE_APP_NAME` | Application display name |
| `VITE_APP_URL` | Application base URL |
| `VITE_GST_RATE` | GST tax rate (decimal, e.g., 0.18) |

---

## Git Rules

- `.env` is in `.gitignore` — NEVER commit real credentials
- `.env.example` IS committed — template with placeholder values
- `node_modules/` is in `.gitignore`
- `dist/` is in `.gitignore`
- `tennis-academy-master-audit.txt` is in `.gitignore`
- `nul` is in `.gitignore`

---

*Last updated: September 2026*
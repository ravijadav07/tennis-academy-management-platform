# 03 — App Flow: Arnav Jain Tennis Academy Platform

## Pages List (26 total)

### Public
| Page | Route | Purpose |
|------|-------|---------|
| Login | `/login` | Email/password auth, demo credentials |
| Unauthorized | `/unauthorized` | Access denied |

### Admin (12)
| Page | Route | Purpose |
|------|-------|---------|
| Dashboard | `/admin` | KPIs, charts, advanced player roster |
| Students | `/admin/students` | Student CRUD, detail modal |
| Parents | `/admin/parents` | Parent profiles, comm history |
| Coaches | `/admin/coaches` | Coach roster, payroll |
| Batches | `/admin/batches` | Batch management, occupancy |
| Schedule | `/admin/schedule` | Full schedule view |
| Attendance | `/admin/attendance` | Student + coach attendance |
| Renewals | `/admin/renewals` | Package renewal tracking, drip timeline |
| Payments | `/admin/payments` | Payment history, gateway filter |
| Reconciliation | `/admin/reconciliation` | Excel upload + match |
| Reports | `/admin/reports` | Invoice generation, occupancy |

### Coach (6)
| Page | Route | Purpose |
|------|-------|---------|
| Dashboard | `/coach` | Today's classes, my students |
| My Schedule | `/coach/schedule` | Weekly schedule |
| Attendance | `/coach/attendance` | Mark attendance |
| 1-on-1 Sessions | `/coach/one-on-one` | Confirmations, reschedule |
| Leave | `/coach/leave` | Apply/view leave |
| My Stats | `/coach/stats` | Performance metrics |

### Parent (6)
| Page | Route | Purpose |
|------|-------|---------|
| Dashboard | `/parent` | Child overview, coach info |
| Schedule | `/parent/schedule` | Weekly schedule |
| Attendance | `/parent/attendance` | Attendance history |
| Package | `/parent/package` | Package validity, payments |
| Progress | `/parent/progress` | Skills, achievements |
| Payments | `/parent/payments` | Payment history |

## Navigation
- Left sidebar (240px/64px collapsed) per pucho-frontend
- Header title = active menu label (longest-match resolution)
- Mobile: hamburger overlay drawer

## Auth Flow
1. Unauthenticated → `/login`
2. Login → role-based redirect (`/admin`, `/coach`, `/parent`)
3. Invalid role → `/unauthorized`
4. Session persisted in localStorage (mock) → Supabase Auth (real)

## Core Journeys

### Journey 1: Enroll a new student (Admin)
1. Admin → Students page → "Add Student" button
2. Fill form: name, age, level, batch, coach, entity, package
3. Submit → triggers WF-D (Student Onboarding)
4. WF-D: creates DB records → sends email welcome to parent
5. Parent receives link to login → views child dashboard

### Journey 2: Daily 1-on-1 confirmation (Coach)
1. WF-F runs at 7 AM daily → finds today's 1-on-1 sessions
2. Sends email to parent: "Arjun's 1-on-1 at 6:30 PM today. Confirm?"
3. Parent replies "Yes" / "No" → webhook received
4. WF-F updates schedule confirmation status
5. Coach sees status updated on 1-on-1 Sessions page

### Journey 3: Renewal payment (Parent)
1. WF-G detects package nearing expiry (Day 35 warning)
2. WF-H starts drip: email reminder at D-6, D-3, D-1
3. Parent clicks payment link → Stripe checkout
4. Stripe webhook → WF-I captures payment
5. WF-I stops WF-H drip, resets WF-G expiry clock
6. Parent sees updated package on Dashboard

## Workflow Wiring (UI → Pucho Webhook)

| UI Action | Pucho Workflow | Trigger |
|-----------|---------------|---------|
| Admin: Add Student form submit | WF-D | Webhook POST |
| Admin: "Upload Excel" on Reconciliation | WF-J | Webhook POST |
| Stripe: payment_intent.succeeded | WF-I | Stripe webhook |
| Email: Confirm/Cancel button click | WF-F | Gmail webhook |
| Cron: daily 7 AM | WF-F | Schedule |
| Cron: daily midnight | WF-G | Schedule |
| Cron: daily 9 AM | WF-H | Schedule |
| Cron: monthly 1st | WF-K, WF-L | Schedule |

## Empty / Error / Loading States
- Empty: EmptyState component with icon + message + action
- Error: Sonner toast with error message
- Loading: Skeleton components (SkeletonCard, SkeletonTable, SkeletonRow)

## Redirects
- `/` → `/login`
- Invalid role access → `/unauthorized`
- Not authenticated → `/login`
# 02 — TRD: Arnav Jain Tennis Academy Platform

## Stack (Pucho Default — no overrides)

```
Frontend:    React 19 + Vite + Tailwind CSS v4 (per pucho-frontend)
Backend/DB:  Supabase (Postgres, Auth, RLS, Edge Functions, Storage)
Automation:  Pucho AI Studio workflows via Edge-Function proxy
Hosting:     Vercel (frontend) + Supabase (backend)
```

## Integrations

| Integration | Purpose | Tier |
|-------------|---------|------|
| Gmail API / transactional email | 1-on-1 confirmations, renewal reminders, welcome messages, certificates | Production |
| Stripe API | TOTS Tennis direct payment capture | Production |
| CC Avenue API | The Club payment gateway | Production |
| Gmail/Email SMTP | Transactional emails (admission, certificates, invoices) | Production |
| Supabase Storage | Student photos, documents, generated PDFs | Production |
| Meta Graph API | Lead capture from Instagram | Deferred (Phase 3) |

## Tenancy: Single (multi-entity via `entity` column)

Two business entities exist within one tenant: `the-club` and `tots-tennis`. Filtered at the application layer. No `client_id` multi-tenancy needed.

## Env Vars

```
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
VITE_PUCHO_PROXY_URL
```

Server-side only (Supabase secrets):
```
PUCHO_WEBHOOK_URL_WF_D
PUCHO_WEBHOOK_URL_WF_E
PUCHO_WEBHOOK_URL_WF_F
PUCHO_WEBHOOK_URL_WF_G
PUCHO_WEBHOOK_URL_WF_H
PUCHO_WEBHOOK_URL_WF_I
PUCHO_WEBHOOK_URL_WF_J
PUCHO_WEBHOOK_URL_WF_K
PUCHO_WEBHOOK_URL_WF_L
SUPABASE_SERVICE_ROLE_KEY
STRIPE_SECRET_KEY
GMAIL_CLIENT_ID
GMAIL_CLIENT_SECRET
```

## Key Libraries

Per pucho-frontend §9: React 19, TanStack Table 8, Recharts, Framer Motion, Lucide React, Sonner, Tailwind Merge, date-fns, clsx

## Constraints
- Web-only (no native apps)
- Gmail API rate limits require staggered cron scheduling
- The Club's Excel format is fixed — no changes to source format

## Pucho Skills Applied
- pucho-automation-architect (workflows)
- pucho-frontend (UI/dashboards)
- pucho-secure-build (auth, RLS, secrets, hardening)
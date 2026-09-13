---
name: pucho-secure-build
description: >
  Injects secure-by-default requirements into every code-generating Pucho deliverable so vibe-coded apps ship without the common AI-generated security holes. Use this skill WHENEVER producing a GLM5 agentic build prompt, a React/Vite dashboard, a marketing website build spec, a client demo app, or any frontend/backend application code. It is NOT for workflow JSON (use pucho-automation-architect) or .docx blueprints (use pucho-blueprint-doc). Triggers on: "build prompt", "GLM5 prompt", "dashboard", "build a site", "web app", "demo app", "React component with backend", "make it production-ready", or any request that results in shippable application code. Locked to the Pucho stack: GLM5 IDE output, Supabase (Postgres + RLS + Auth), React/Vite frontend, and Pucho AI Studio webhooks. Always apply this skill alongside pucho-dashboard-template and build-prompt generation — do not ship app code without it.
---

# Pucho Secure Build

> **Intake first.** For a new project or significant requirement, run `creation-guideline` first — it scopes, documents (TRD/Backend Schema), and routes here with the confirmed schema + stack as source of truth. For a self-contained hardening pass on existing code, proceed directly.

Every app produced from a Pucho build prompt is **secure by default** — the security requirements below are written INTO the GLM5 build spec so the app is born secure, not audited afterward. AI build tools optimize for "it runs," never "it's safe." This skill closes that gap before the code exists.

> **How to use:** when generating a GLM5 build prompt (or dashboard/site code), append the relevant security block from this file directly into the spec. Scope the block by deliverable type (see the table) — never dump all ten controls into a single throwaway demo. The blocks are pre-written for the Pucho stack; emit them as-is.

---

## STACK (fixed — do not generalize)
- **Build target:** GLM5 IDE-ready agentic build prompt
- **Frontend:** React + Vite
- **Backend / DB / Auth:** Supabase (Postgres, Row-Level Security, Supabase Auth)
- **Automation layer:** Pucho AI Studio workflows called via webhook
- **LLM:** routed through Pucho AI Studio (never a raw provider key in the app)
- **Hosting:** Vercel / Netlify (headers via `vercel.json` / `netlify.toml`)

Any prompt this skill emits names these explicitly so GLM5 doesn't substitute Express/Firebase/NextAuth.

---

## SCOPE BY DELIVERABLE TYPE
Inject only the rows marked ✓. This keeps demo prompts lean and full-build prompts complete.

| Control | Full app build | Client dashboard | Marketing site | Single demo artifact |
|---|---|---|---|---|
| 1. Secrets in env (+ Pucho webhook/keys) | ✓ | ✓ | ✓ | ✓ (note only) |
| 2. Rate limiting | ✓ | ✓ | — | — |
| 3. Input validation (Zod + parameterized) | ✓ | ✓ | ✓ (forms) | — |
| 4. Row-Level Security / ownership | ✓ | ✓ | — | — |
| 5. Auth hardening | ✓ | ✓ | — | — |
| 6. CORS whitelist | ✓ | ✓ | — | — |
| 7. HTTP security headers | ✓ | ✓ | ✓ | — |
| 8. File upload safety | ✓ (if uploads) | ✓ (if uploads) | — | — |
| 9. No error leakage + logging | ✓ | ✓ | ✓ | — |
| 10. LLM/webhook security | ✓ | ✓ | — | ✓ (note only) |
| 11. Pucho-native (webhook/tenant/budget) | ✓ | ✓ | — | ✓ (note only) |

**Demo artifacts** (single-file React/HTML in Claude artifacts): artifacts can't use `localStorage`/`sessionStorage` and have no real backend, so most controls are N/A. Emit only the one-line note from §1, §10, §11 reminding that the *production* version must move webhook calls server-side. Never put a live Pucho webhook URL or AI Studio key in an artifact.

---

## THE TOP 4 (blocking — every full build & dashboard prompt gets these verbatim)

### 1 — Secrets & Pucho keys server-side only
```
SECURITY — SECRETS: Store every secret in a .env file, never in client code. Add .env to .gitignore and ship a .env.example with empty values. In this Vite app, ONLY variables prefixed VITE_ may reach the browser, and none of those may be a secret — no Supabase service_role key, no Pucho AI Studio API key, no Pucho webhook signing secret in any VITE_ var. The Supabase anon key is the only key allowed client-side (it is RLS-gated). All Pucho AI Studio webhook calls and any service_role operations run from a Supabase Edge Function, never from the React app. Ensure no secret value is ever returned in an API/Edge Function response.
```

### 2 — Rate limiting
```
SECURITY — RATE LIMITING: Rate-limit every Supabase Edge Function. Auth actions (login, register, password reset): 5 req / 15 min per IP. General data routes: 60 req / min per IP. Pucho webhook-proxy / LLM routes: 10 req / min per authenticated user. File uploads: 5 req / min per IP. Return HTTP 429 with a Retry-After header when exceeded. Implement with an in-memory or Supabase-table counter keyed by IP/user inside the Edge Function.
```

### 3 — Input validation
```
SECURITY — INPUT VALIDATION: Validate every input server-side in each Edge Function with Zod — type, length, allowed characters, required fields, enum values. Never interpolate user input into SQL; use the Supabase client query builder / parameterized RPC only. Return 400 on invalid input and log the attempt. For uploads, validate MIME type, extension, and size server-side. Client-side validation is UX only and never the security boundary.
```

### 4 — Row-Level Security & ownership
```
SECURITY — RLS & OWNERSHIP: Enable Supabase Row-Level Security on every table holding user or client data. Write policies so a user reads/writes ONLY rows they own (auth.uid() = owner_id) — being logged in is not enough. On multi-client dashboards, scope every policy by tenant/client_id so Client A can never see Client B's data. Add explicit role checks on admin routes. Any cross-owner access attempt returns 403.
```

---

## SECONDARY (5–10 — full builds; dashboards get 5,7,9,10)

### 5 — Auth hardening
```
SECURITY — AUTH: Use Supabase Auth (do not hand-roll). Passwords hashed by Supabase (bcrypt/argon2) — never store plaintext. Access tokens expire in 15–60 min; refresh tokens live in httpOnly cookies, never localStorage. JWT secret ≥32 chars from env. Enable account lockout / exponential backoff after repeated failed logins.
```

### 6 — CORS
```
SECURITY — CORS: No wildcard (*) in production. Whitelist the exact frontend origin from an env var (e.g. APP_ORIGIN=https://app.client.com) in every Edge Function. Allow only the HTTP methods each route needs. Set credentials only where required.
```

### 7 — Security headers (Vercel/Netlify)
```
SECURITY — HEADERS: Set via vercel.json (or netlify.toml) headers config: Content-Security-Policy restricting script/style sources (allow only self + Supabase + the Pucho webhook host), X-Frame-Options: DENY, X-Content-Type-Options: nosniff, Strict-Transport-Security, Referrer-Policy: strict-origin-when-cross-origin. Remove X-Powered-By.
```

### 8 — File uploads (only if the app uploads)
```
SECURITY — UPLOADS: Validate type by MIME + extension server-side. Limits: 5MB images, 25MB documents. Store in a Supabase Storage bucket (never the web root). Rename every file to a UUID — never keep the original filename. Set the bucket private with RLS-gated signed-URL access; never serve with executable permissions.
```

### 9 — No error leakage
```
SECURITY — ERRORS: Never return raw stack traces, Postgres errors, or exception messages to the client — respond with a generic message and the right status (4xx client / 5xx server). Log full context server-side (timestamp, route, user id, sanitized input) to Sentry. Surface a request id to the user for support without exposing internals.
```

### 10 — LLM & webhook security
```
SECURITY — LLM/WEBHOOK: All Pucho AI Studio webhook and LLM calls go through a Supabase Edge Function — never from the browser, so the webhook URL and any signing secret stay server-side. Sanitize user input before it reaches the workflow/LLM (prompt-injection guard). Enforce a per-user / per-session token or call budget and log usage so abuse is caught early. Validate and sanitize any workflow/LLM output before rendering it (treat it as untrusted HTML).
```

---

## 11 — PUCHO-NATIVE CONTROLS (always, on every build & dashboard)
The risks unique to webhook-connected Pucho apps — these are the ones generic guides miss and the ones most likely to actually bite a Pucho deliverable.

```
SECURITY — PUCHO LAYER:
1. Webhook URL secrecy: the Pucho AI Studio webhook URL is a credential. Keep it in a server-side env var read only by the Edge Function proxy. Never embed it in React, in a VITE_ var, in a demo artifact, or in committed config.
2. Webhook auth: if the workflow's catch_webhook has an auth header/token, store and send it server-side only.
3. Tenant isolation: when one dashboard serves multiple clients, every webhook call and every Supabase query carries the authenticated client_id; RLS enforces it at the DB and the Edge Function re-checks it. Never trust a client_id sent from the browser without verifying it against the session.
4. Token/credit budget: cap Pucho workflow invocations per user/session (the AI Studio credit bill is real) and log each call with user id + timestamp.
5. Output trust: data returned from a Pucho workflow (especially askLlm/askTally output) is untrusted — validate shape and escape before render.
```

---

## INTEGRATION
- **With `pucho-dashboard-template`:** after generating the dashboard, append §1–5, 7, 9, 10, 11 to the build prompt. The dashboard's webhook action buttons MUST call a Supabase Edge Function proxy, not the Pucho URL directly — this skill overrides any direct-call pattern.
- **With GLM5 build-prompt generation:** add a `## SECURITY REQUIREMENTS (non-negotiable)` section to the prompt, populated from the scope table for that deliverable type, before the final output.
- **With demo artifacts:** emit only the one-line server-side reminder; do not bloat the demo.

---

## PRE-SHIP CHECKLIST (mirror into the build prompt's acceptance criteria)
- [ ] `.env` git-ignored; `.env.example` present; no secret in any `VITE_` var
- [ ] Pucho webhook URL + AI Studio key live only in an Edge Function, never client-side
- [ ] RLS on every user/client table; ownership + tenant (client_id) enforced; cross-owner = 403
- [ ] Zod validation + parameterized queries on every Edge Function; 400 + log on invalid
- [ ] Rate limits active (auth 5/15min, data 60/min, webhook 10/min, upload 5/min) → 429
- [ ] Supabase Auth; refresh tokens in httpOnly cookies; lockout on repeated failures
- [ ] CORS = explicit origin from env; no wildcard in prod
- [ ] Security headers set in vercel.json/netlify.toml; X-Powered-By removed
- [ ] Uploads (if any): server MIME/size check, UUID rename, private bucket
- [ ] Generic error responses; full context to Sentry; correct 4xx/5xx
- [ ] Per-user Pucho call budget + usage logging; workflow output escaped before render
- [ ] Debug off, HTTPS enforced, Supabase project not publicly exposed

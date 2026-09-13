---
name: creation-guideline
description: >
  THE FIRST skill to run on ANY new Pucho project, idea, requirement, or feature request — before any workflow JSON, dashboard, or app code is produced. It classifies how complete the input is, asks targeted questions to fill the gaps, drafts the six project documents (PRD, TRD, App Flow, UI/UX Brief, Backend Schema, Implementation Plan) adapted to the Pucho stack, gets confirmation, then routes the build to the right downstream skill. Use this whenever a request begins a new build or adds a significant new requirement/idea: "build me…", "I want an app/automation that…", "here's the client requirement…", "new feature: …", "can you create a system for…". Routes to: pucho-automation-architect (workflows), pucho-frontend (UI/dashboards), pucho-secure-build (schema/auth/hardening), pucho-blueprint-doc (client deliverable). Do NOT skip this gate and jump straight to building — undocumented builds hallucinate. For tiny, fully-specified one-off changes it compresses to a single confirmation.
---

# Creation Guideline — Pucho Project Intake & Orchestration

Every new project, idea, or significant requirement enters here first. The job: turn whatever the client gave (a one-line idea → a full spec) into a confirmed set of source-of-truth documents, then route the build. Documented builds are SOTA; undocumented builds guess. **Never build on assumptions — if a fact is missing, ask, then write it down.**

> Default behaviour: **ask targeted questions first, then draft.** Do not auto-invent unknowns. Draft a document section only after its blanks are answered or the client says "you decide."

---

## STEP 1 — CLASSIFY THE INPUT (pick the tier, set the depth)

Read the request and place it on the maturity ladder. The tier decides how much to author before building.

| Tier | What the client gave | Action |
|---|---|---|
| **A — Idea only** | "I want an app/automation for X", no detail | Ask the full question battery (§2), draft ALL 6 docs, confirm, build |
| **B — Requirement given** | Goals/features, unstructured | **Create the PRD first**, ask gaps, derive TRD → Flow → Schema → Plan, confirm, build |
| **C — Use cases partial** | Some use cases, gaps remain | Ask only gap questions, draft only the MISSING docs, confirm, build |
| **D — Use cases complete** | Use cases properly/fully specified | Plan and **act** — build directly; author only thin stubs for any gap; light confirm |

Mapping to the rule you set: *no project description* → Tier A (plan & create all). *Requirement given* → Tier B (create PRD). *Use cases not given* → generate them inside PRD/App Flow. *Use cases properly given* → Tier D (plan & act). State the detected tier in one line before proceeding ("This looks like Tier B — I'll draft a PRD from your requirement and confirm the stack before building.").

Also detect the **project archetype** (drives which docs matter and where it routes):
- **Workflow-only** (automation, no UI) → docs 1,2,5,6; route to `pucho-automation-architect`
- **App/dashboard** (UI over data) → all 6; route to `pucho-frontend` + `pucho-secure-build`
- **Full system** (workflows + UI) → all 6; build workflows first, then UI (see §6 ordering)
- **Client deliverable** (blueprint/demo, not production) → docs 1,3,4; route to `pucho-blueprint-doc`

---

## STEP 2 — ASK FIRST (targeted question batteries, only for blanks)

Ask in rounds, only what's unknown. Skip anything the input already answers. One round per theme; numbered questions; never more than a tight batch at a time. (For workflow-heavy projects, the deep workflow questioning is owned by `pucho-automation-architect`'s discovery protocol — don't duplicate it here; cover the product-level questions and let that skill handle node-level detail during the workflow phase.)

**Product (→ PRD):** Who is the user (role, company type, MSME segment)? What painful task does this replace today? What are the must-have vs nice-to-have features? What is explicitly out of scope for v1? What does success look like (a number)?

**Technical (→ TRD):** Anything that deviates from the fixed Pucho stack (React/Vite · Supabase · Pucho workflows · Vercel)? Which third-party systems must it touch (Tally/Miracle/other ERP, WhatsApp, Gmail, Sheets, payment)? Multi-tenant (many clients) or single-tenant? Any free-tier / cost / on-prem constraint?

**Flow (→ App Flow):** What pages/screens exist? Where does a new user land? What's the auth sequence? The 2–3 most important journeys end-to-end? Which Pucho workflows fire from which screens?

**Design (→ UI/UX):** Defer to `pucho-frontend`'s minimal system unless the client wants something different — only ask: any brand override, dark-mode need, or reference app beyond the Pucho default?

**Data (→ Backend Schema):** Is data owned fresh (new Postgres) or wrapped from Tally/Miracle/Pucho workflow output? What entities/tables? Who may see what (roles, tenant isolation)? Any sensitive fields? File/media storage?

**Build (→ Implementation Plan):** Any hard deadline or phase priority? What must work first to demo?

If the client answers "you decide" to any blank, choose the Pucho-default and note the assumption in the doc.

---

## STEP 3 — DRAFT THE 6 DOCUMENTS (Pucho-adapted)

Author the docs the tier requires, in order. Keep them tight and concrete — these are the build's source of truth, not prose essays. Templates:

### 01 — PRD (Product Requirements)
```
App/System Name · Tagline
Problem (the pain + who feels it; MSME segment)
Target User (2–3 sentences)
Core Features — Must Have (one per line)
Nice to Have (v2)
Out of Scope (explicit)
User Stories — As a [role], I want [action] so that [outcome]
Success Metrics (numeric)
```

### 02 — TRD (Technical Requirements) — *stack is mostly fixed; record only what varies*
```
Frontend: React + Vite + Tailwind (per pucho-frontend)           [override only if stated]
Backend/DB/Auth: Supabase (Postgres, RLS, Auth, Edge Functions)  [override only if stated]
Automation: Pucho AI Studio workflows via Edge-Function proxy
Hosting: Vercel (frontend) + Supabase (backend)
Integrations: <Tally/Miracle/WhatsApp/Gmail/Sheets/payment — name, purpose, tier>
Tenancy: single | multi (client_id)
Key libraries: per pucho-frontend §9
Env vars: list names only (secrets server-side per pucho-secure-build)
Constraints: <cost/mobile/on-prem/etc.>
Which Pucho skills apply: automation-architect | frontend | secure-build | blueprint-doc
```

### 03 — App Flow — *add workflows-first wiring*
```
Pages list (with one-line purpose)
Navigation (left sidebar per pucho-frontend; header title = active menu label)
First screen (logged-out vs logged-in)
Auth flow (signup → onboarding → dashboard)
Core journeys 1–3 (step by step)
Workflow wiring: which screen/button calls which Pucho workflow (via proxy)
Empty / error / loading states
Redirects
```

### 04 — UI/UX Brief — *reference, don't re-specify*
```
Design system: pucho-frontend (minimal SaaS — Pucho violet accent, soft, rounded 12–16px, Inter)
Canonical login: pucho-frontend §6 (verbatim)   ·   Branding badge: §7 (verbatim)
Overrides (if any): <brand / dark-mode / reference app>
Responsiveness & accessibility: per pucho-frontend
```

### 05 — Backend Schema — *default to the WRAPPER case*
```
Mode: WRAPPER (Tally/Miracle/Pucho-workflow data + thin Supabase tenant/auth layer)  [default]
      | GREENFIELD (fresh Postgres)  [only if stated]
Tables: <name → columns/types, PK, FKs>  (wrapper: usually just users, clients, sessions, cache/logs)
Source of record: <Tally company / Miracle / Pucho workflow JSON output>
Relationships
Auth: Supabase Auth (JWT, email/OAuth)
RLS: users read/write own rows; multi-tenant scoped by client_id  (per pucho-secure-build §8)
Roles & permissions
Sensitive fields (encrypted / stored externally e.g. Stripe)
File storage (Supabase Storage, RLS-gated)
Webhooks/triggers (Pucho workflow endpoints — held server-side)
```

### 06 — Implementation Plan — *Pucho phase order*
```
Phase 1 Setup: Vite repo, structure, deps, env vars, Supabase project
Phase 2 Workflows: build/import Pucho workflows (via pucho-automation-architect), test, COLLECT webhook URLs
Phase 3 Backend: Supabase tables + RLS + Edge Function proxy holding webhook URLs (pucho-secure-build)
Phase 4 Auth: signup/login/logout, protected routes, tenant scoping
Phase 5 Core features (in dependency order; UI calls workflows via proxy)
Phase 6 UI polish: responsive, loading/empty/error states, login (verbatim), branding badge
Phase 7 Harden: full pucho-secure-build checklist
Phase 8 Deploy: prod env, domains, headers
Each phase: explicit DONE criterion.
```

---

## STEP 4 — CONFIRM (the gate)

Present a one-screen summary: detected tier + archetype, the must-have feature list, the stack/integrations, the page+workflow map, and the phase plan with its first milestone. Ask for a yes (or edits). **Do not start building until confirmed** — except Tier D, where a light "proceeding unless you object" is enough. List any "you decide" assumptions explicitly so they can be corrected cheaply now rather than after code exists.

---

## STEP 5 — ROUTE TO BUILD

On confirmation, hand the relevant docs to the build skill(s) as source of truth:
- **Workflows** → `pucho-automation-architect` (PRD + Schema + Plan; its discovery protocol covers node-level detail)
- **UI / dashboards** → `pucho-frontend` (App Flow + UI/UX Brief; header-title rule, login, badge)
- **Schema / auth / hardening** → `pucho-secure-build` (Backend Schema + TRD; two-tier proxy, RLS, secrets)
- **Client blueprint / demo** → `pucho-blueprint-doc` (PRD + App Flow + UI/UX)
Paste the confirmed docs into the build context and instruct: "These are the source of truth — build against them, don't re-derive."

---

## STEP 6 — PUCHO BUILD ORDERING (why workflows come first)
For full systems, the UI cannot be wired until the workflows exist and expose webhook URLs. Sequence is non-negotiable: **build & import Pucho workflows → collect their webhook URLs → stand up the Supabase Edge Function proxy holding those URLs → build the UI calling the proxy → harden.** Building the dashboard before the workflows exist produces buttons wired to nothing. (This is the orchestration sequence the old creation-guideline carried and that the rest of the ecosystem assumes.)

---

## STEP 0 — NEW REQUIREMENT MID-PROJECT
Any new idea/feature raised during a project re-enters at Step 1: classify it, ask its gaps, slot it into the existing PRD (Must/Nice) and Implementation Plan as a new phase, confirm, then build. Never bolt a feature on without updating the docs — drift is how systems rot.

---

## CHECKLIST
- [ ] Tier (A/B/C/D) and archetype detected and stated
- [ ] Only genuine blanks were asked; input-provided facts not re-asked
- [ ] Required docs drafted (per tier), Pucho-adapted, concrete not verbose
- [ ] TRD records only stack deviations; UI/UX references pucho-frontend, not re-specified
- [ ] Schema defaults to wrapper mode unless greenfield stated; RLS + tenant scoping noted
- [ ] Implementation Plan follows Pucho order (workflows → proxy → UI → harden) with done-criteria
- [ ] Confirmation obtained before build (light for Tier D); "you decide" assumptions listed
- [ ] Routed to the correct build skill(s) with docs as source of truth
- [ ] Mid-project new requirements re-entered at Step 1 and folded into the docs

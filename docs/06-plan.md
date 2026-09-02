# 06 — Implementation Plan: Arnav Jain Tennis Academy Platform

## Phase 1: Database & Auth Setup
- [ ] Run `migrations/001_schema.sql` on Supabase SQL Editor
- [ ] Run `migrations/002_seed.sql` for test data
- [ ] Set up Supabase Auth with email/password
- [ ] Create 3 test users (admin, coach, parent) with correct role metadata
- [ ] Configure Supabase Storage bucket `academy-assets`
- **DONE when:** 16 tables created, seed data imported, 3 users can log in

## Phase 2: Workflows (pucho-automation-architect)
- [ ] Generate WF-D (Student Onboarding) JSON
- [ ] Generate WF-F (Daily 1-on-1 Confirmation) JSON
- [ ] Generate WF-G (Package Expiry Engine) JSON
- [ ] Generate WF-L (Coach Payroll & Leave Rollup) JSON
- [ ] Generate WF-H (Renewal Drip Campaign) JSON
- [ ] Generate WF-I (Direct Payment Capture) JSON
- [ ] Generate WF-J (Club Excel Reconciliation) JSON
- [ ] Generate WF-K (Invoice & Occupancy Reports) JSON
- [ ] Generate WF-E (Course Completion) JSON
- [ ] Import all 9 workflows into Pucho AI Studio
- [ ] Test each workflow with sample data
- [ ] **COLLECT webhook URLs** from all 9 workflows
- **DONE when:** All 9 workflows imported, tested, webhook URLs collected

## Phase 3: Backend Proxy (pucho-secure-build)
- [ ] Create Supabase Edge Function `pucho-proxy`
- [ ] Store all 9 Pucho webhook URLs as Supabase secrets
- [ ] Implement auth verification (Supabase session JWT)
- [ ] Implement rate limiting (10/min per user)
- [ ] Implement Zod input validation
- [ ] Implement per-user call budget tracking
- **DONE when:** Proxy deployed, all 9 workflows callable via proxy

## Phase 4: Auth Migration
- [ ] Replace mock AuthContext with Supabase Auth
- [ ] Migrate `CanAccess` to use Supabase JWT role metadata
- [ ] Update `triggerWorkflow()` to use real Supabase session
- [ ] Test login/logout flow with all 3 roles
- **DONE when:** Real auth working, mock auth removed

## Phase 5: UI Wiring
- [ ] Wire Students page → WF-D (create student)
- [ ] Wire Reconciliation page → WF-J (upload Excel)
- [ ] Wire Reports page → WF-K (generate reports)
- [ ] Wire Coach Attendance → WF-F (status updates)
- [ ] Wire Parent Package → WF-G/H (expiry/renewal data)
- [ ] Wire Payments page → WF-I (Stripe capture)
- [ ] Remove "MOCK DATA" badges from all pages
- [ ] Replace mock data imports with `triggerWorkflow()` calls
- **DONE when:** All 21 pages read from live Supabase data

## Phase 6: Security Hardening (pucho-secure-build)
- [ ] Verify RLS policies on all 16 tables
- [ ] Verify CSP headers in Vercel
- [ ] Verify no secrets in client bundle
- [ ] Verify rate limiting on all Edge Functions
- [ ] Verify error messages don't leak internals
- [ ] Verify Supabase Auth session timeout (15-60 min)
- **DONE when:** Full pucho-secure-build checklist passed

## Phase 7: Deploy
- [ ] Deploy frontend to Vercel (production)
- [ ] Set production env vars
- [ ] Verify all 9 workflows running in production
- [ ] Smoke test: create student → schedule → confirm → attend → pay → renew
- **DONE when:** Production URL live, full E2E test passes
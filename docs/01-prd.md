# 01 — PRD: Arnav Jain Tennis Academy Platform

**App/System Name:** Arnav Jain Tennis Academy (The Club & TOTS Tennis)
**Tagline:** Coach. Train. Excel. — One platform for two academies.

## Problem
Arnav Jain runs two coaching businesses under different brands (The Club: ~100 advanced/intermediate students, TOTS Tennis: ~800 toddlers/young talents). Operations are manual: WhatsApp for confirmations/reminders, Excel for reconciliation, Spin App for scheduling. No unified view, no automation, no parent portal.

## Target User
- **Admin (Arnav):** Full system control, reconciliation, payroll, AI oversight
- **Coaches (10):** Mark attendance, manage 1-on-1 sessions, log leave
- **Parents (15+):** View child's schedule, attendance, payments, package validity

## Core Features — Must Have

| # | Feature | Use Case |
|---|---------|----------|
| 1 | Student onboarding with batch assignment | UC-2 |
| 2 | Daily email 1-on-1 confirmations | UC-3 |
| 3 | Package expiry tracking (35-day warning, 45-day auto-expire) | UC-4 |
| 4 | Renewal drip campaign (6-day prior, 7/14/21/28-day follow-up) | UC-4 |
| 5 | Direct payment capture (Stripe/CC Avenue) | UC-5 |
| 6 | Excel reconciliation for The Club payments | UC-5 |
| 7 | Monthly invoice generation (Group vs 1-on-1 revenue split) | UC-5 |
| 8 | Coach payroll & leave rollup | UC-3 |
| 9 | Course completion certificate generation | UC-2 |
| 10 | RBAC dashboard (Admin/Coach/Parent) | All |

## Nice to Have (v2)
- Lead capture from Instagram/Meta DMs with AI auto-response
- Escalation routing for edge-case inquiries
- Trial → enrollment pipeline automation

## Out of Scope
- Native iOS/Android apps
- Changes to The Club's Excel export format
- Commercial licensing/subscription pricing
- Lead management (UC-1) — deferred to Phase 3

## User Stories
- As an Admin, I want to enroll a student and have them automatically assigned to a batch so that I don't need to manually coordinate with coaches
- As a Coach, I want 1-on-1 confirmations sent automatically via email so that I spend time coaching, not messaging
- As a Parent, I want to see my child's package expiry date and payment status so that I never miss a renewal
- As an Admin, I want mismatched payments flagged automatically when I upload The Club's Excel so that I catch discrepancies immediately
- As an Admin, I want monthly invoices generated with the correct 70/30 revenue split so that payroll is accurate

## Success Metrics
| Metric | Target |
|--------|--------|
| Manual follow-ups eliminated | 100% of 1-on-1 confirmations and renewal reminders automated |
| Reconciliation time | Excel upload + match replaces manual cross-checking (< 5 min) |
| Package expiry leakage | Zero manual tracking needed |
| Revenue-share invoicing | Auto-generated monthly |
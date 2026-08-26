-- ============================================================================
-- Arnav Jain Tennis Academy -- Enum Fixes Migration 007
-- Supabase Postgres Migration
-- Run via: Supabase SQL Editor
-- Fixes: Adds missing enum values required by active workflows
-- ============================================================================

-- 1. Add 'd_minus_10' to reminder_stage (used by WF-G expiring warning)
ALTER TYPE reminder_stage ADD VALUE IF NOT EXISTS 'd_minus_10';

-- 2. Add 'dormant' to reminder_stage (used by WF-G dormancy tracking)
ALTER TYPE reminder_stage ADD VALUE IF NOT EXISTS 'dormant';

-- 3. Add 'payment_confirmation' to comm_type (used by WF-I payment capture)
ALTER TYPE comm_type ADD VALUE IF NOT EXISTS 'payment_confirmation';

-- 4. Add 'payroll' to comm_type (used by WF-L payroll rollup)
ALTER TYPE comm_type ADD VALUE IF NOT EXISTS 'payroll';

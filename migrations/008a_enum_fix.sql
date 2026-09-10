-- ============================================================================
-- Arnav Jain Tennis Academy — Gap-Fill Migration 008a (ENUM FIXES ONLY)
-- Supabase Postgres Migration
-- Run via: Supabase SQL Editor
--
-- Purpose: Fix enum values and create missing enum types.
--          This MUST run BEFORE 008b_gap_fill.sql because PostgreSQL
--          requires a newly-added enum value to be committed before it
--          can be used in column definitions.
--
-- Generated: 2026-09-10
-- ============================================================================


-- ============================================================================
-- 1a. Fix entity_type typo: 'todds-tennis' → 'tots-tennis'
-- ============================================================================

UPDATE coaches
SET entity = 'tots-tennis'
WHERE entity::text = 'todds-tennis';

UPDATE batches
SET entity = 'tots-tennis'
WHERE entity::text = 'todds-tennis';

UPDATE students
SET entity = 'tots-tennis'
WHERE entity::text = 'todds-tennis';

UPDATE parents
SET entity = 'tots-tennis'
WHERE entity::text = 'todds-tennis';

UPDATE schedule
SET entity = 'tots-tennis'
WHERE entity::text = 'todds-tennis';

UPDATE payments
SET entity = 'tots-tennis'
WHERE entity::text = 'todds-tennis';

UPDATE reconciliation
SET entity = 'tots-tennis'
WHERE entity::text = 'todds-tennis';

-- NOTE: PostgreSQL does not support removing enum values.
-- The 'todds-tennis' value remains in the enum but is unused.


-- ============================================================================
-- 1b. Add missing comm_type values
-- ============================================================================

ALTER TYPE comm_type ADD VALUE IF NOT EXISTS 'payment_reminder';
ALTER TYPE comm_type ADD VALUE IF NOT EXISTS 'slot_report';


-- ============================================================================
-- 1c. Create duty_type enum for coaches
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type
    WHERE typname = 'duty_type'
  ) THEN
    CREATE TYPE duty_type AS ENUM (
      'FULL_TIME',
      'EVENING_ONLY',
      'MORNING_ONLY',
      'PART_TIME'
    );
  END IF;
END $$;


-- ============================================================================
-- DONE: Run 008b_gap_fill.sql next
-- ============================================================================
-- ============================================================================
-- Arnav Jain Tennis Academy — Gap-Fill Migration 008b (COLUMNS + TABLES + RLS + INDEXES)
-- Supabase Postgres Migration
-- Run via: Supabase SQL Editor
--
-- Purpose: Close all gaps between Supabase DB, migration files (001-007),
--          frontend seed data, and backend schema doc.
--          This MUST run AFTER 008a_enum_fix.sql (enum values must exist first).
--
-- Generated: 2026-09-10
-- ============================================================================


-- ============================================================================
-- SECTION 2: COACHES — Add missing columns
-- ============================================================================

-- 2a. From migration 001 ALTER TABLE (may not have been applied to Supabase)
ALTER TABLE coaches
ADD COLUMN IF NOT EXISTS hours_logged INTEGER DEFAULT 0;

ALTER TABLE coaches
ADD COLUMN IF NOT EXISTS hourly_rate INTEGER DEFAULT 0;


-- 2b. From frontend seed.core.json (payroll-related fields)
ALTER TABLE coaches
ADD COLUMN IF NOT EXISTS designation TEXT;

ALTER TABLE coaches
ADD COLUMN IF NOT EXISTS duty_type duty_type;

ALTER TABLE coaches
ADD COLUMN IF NOT EXISTS base_salary INTEGER DEFAULT 0;

ALTER TABLE coaches
ADD COLUMN IF NOT EXISTS rate_1on1_per_hour INTEGER DEFAULT 0;

ALTER TABLE coaches
ADD COLUMN IF NOT EXISTS rate_overtime_per_hour INTEGER DEFAULT 0;

ALTER TABLE coaches
ADD COLUMN IF NOT EXISTS paid_holidays_per_month INTEGER DEFAULT 0;


-- ============================================================================
-- SECTION 3: ATTENDANCE — Add missing columns from 001 ALTER (not applied)
-- ============================================================================

-- session_period is TEXT (not an enum) to match actual Supabase schema
ALTER TABLE attendance
ADD COLUMN IF NOT EXISTS session_period TEXT;

-- marked_by is TEXT with default 'coach'
ALTER TABLE attendance
ADD COLUMN IF NOT EXISTS marked_by TEXT DEFAULT 'coach';


-- ============================================================================
-- SECTION 4: COACH_ATTENDANCE — Add missing columns from 001 ALTER
-- ============================================================================

-- session_period is TEXT (not an enum)
ALTER TABLE coach_attendance
ADD COLUMN IF NOT EXISTS session_period TEXT;

-- approval_status is TEXT (not an enum) with default 'pending'
ALTER TABLE coach_attendance
ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'pending';


-- ============================================================================
-- SECTION 5: RECONCILIATION — Add difference column (nullable integer)
-- ============================================================================

-- NOTE: difference is a regular nullable INTEGER, NOT GENERATED STORED.
-- It should be computed by the application layer, not at the database level.
ALTER TABLE reconciliation
ADD COLUMN IF NOT EXISTS difference INTEGER;


-- ============================================================================
-- SECTION 6: BATCHES — Sync columns from Supabase (not in any migration)
-- ============================================================================

ALTER TABLE batches
ADD COLUMN IF NOT EXISTS program TEXT;

ALTER TABLE batches
ADD COLUMN IF NOT EXISTS day_pattern TEXT;

ALTER TABLE batches
ADD COLUMN IF NOT EXISTS court_id TEXT;

ALTER TABLE batches
ADD COLUMN IF NOT EXISTS ball_level TEXT;

ALTER TABLE batches
ADD COLUMN IF NOT EXISTS primary_coach_id UUID
REFERENCES coaches(id)
ON DELETE SET NULL;

ALTER TABLE batches
ADD COLUMN IF NOT EXISTS support_coach_id UUID
REFERENCES coaches(id)
ON DELETE SET NULL;

ALTER TABLE batches
ADD COLUMN IF NOT EXISTS start_time TIME;

ALTER TABLE batches
ADD COLUMN IF NOT EXISTS end_time TIME;

ALTER TABLE batches
ADD COLUMN IF NOT EXISTS is_semi_batch BOOLEAN DEFAULT FALSE;

ALTER TABLE batches
ADD COLUMN IF NOT EXISTS semi_batch_group TEXT;

ALTER TABLE batches
ADD COLUMN IF NOT EXISTS court_change_at TEXT;

ALTER TABLE batches
ADD COLUMN IF NOT EXISTS court_change_to TEXT;


-- ============================================================================
-- SECTION 7: STUDENTS — Sync columns from Supabase (not in any migration)
-- ============================================================================

ALTER TABLE students
ADD COLUMN IF NOT EXISTS guardian_name TEXT;

ALTER TABLE students
ADD COLUMN IF NOT EXISTS guardian_phone TEXT;

ALTER TABLE students
ADD COLUMN IF NOT EXISTS guardian_email TEXT;

ALTER TABLE students
ADD COLUMN IF NOT EXISTS guardian_relationship TEXT;

ALTER TABLE students
ADD COLUMN IF NOT EXISTS alternate_phone TEXT;

ALTER TABLE students
ADD COLUMN IF NOT EXISTS membership_type TEXT;

ALTER TABLE students
ADD COLUMN IF NOT EXISTS remarks TEXT;


-- ============================================================================
-- SECTION 8: PACKAGES — Sync 20+ columns from Supabase
-- ============================================================================

ALTER TABLE packages
ADD COLUMN IF NOT EXISTS program TEXT;

ALTER TABLE packages
ADD COLUMN IF NOT EXISTS amount_received INTEGER;

ALTER TABLE packages
ADD COLUMN IF NOT EXISTS balance_amount INTEGER;

ALTER TABLE packages
ADD COLUMN IF NOT EXISTS payment_url TEXT;

ALTER TABLE packages
ADD COLUMN IF NOT EXISTS payment_mode TEXT;

ALTER TABLE packages
ADD COLUMN IF NOT EXISTS payment_date DATE;

ALTER TABLE packages
ADD COLUMN IF NOT EXISTS transaction_ref TEXT;

ALTER TABLE packages
ADD COLUMN IF NOT EXISTS next_payment_due DATE;

ALTER TABLE packages
ADD COLUMN IF NOT EXISTS base_amount INTEGER;

ALTER TABLE packages
ADD COLUMN IF NOT EXISTS tax_amount INTEGER;

ALTER TABLE packages
ADD COLUMN IF NOT EXISTS gst_rate NUMERIC;

ALTER TABLE packages
ADD COLUMN IF NOT EXISTS tax_inclusive BOOLEAN DEFAULT FALSE;

ALTER TABLE packages
ADD COLUMN IF NOT EXISTS package_duration TEXT;

ALTER TABLE packages
ADD COLUMN IF NOT EXISTS discount INTEGER DEFAULT 0;

ALTER TABLE packages
ADD COLUMN IF NOT EXISTS discount_reason TEXT;

ALTER TABLE packages
ADD COLUMN IF NOT EXISTS sessions_used INTEGER DEFAULT 0;

ALTER TABLE packages
ADD COLUMN IF NOT EXISTS sessions_purchased INTEGER DEFAULT 0;

ALTER TABLE packages
ADD COLUMN IF NOT EXISTS makeup_credit INTEGER DEFAULT 0;

ALTER TABLE packages
ADD COLUMN IF NOT EXISTS extension_days INTEGER DEFAULT 0;

ALTER TABLE packages
ADD COLUMN IF NOT EXISTS valid_to DATE;


-- ============================================================================
-- SECTION 9: SCHEDULE — Sync student_name column from Supabase
-- ============================================================================

ALTER TABLE schedule
ADD COLUMN IF NOT EXISTS student_name TEXT;


-- ============================================================================
-- SECTION 10: ENROLLMENTS — Add end_date column
-- ============================================================================

ALTER TABLE enrollments
ADD COLUMN IF NOT EXISTS end_date DATE;


-- ============================================================================
-- SECTION 11: NEW TABLE — courts
-- ============================================================================

CREATE TABLE IF NOT EXISTS courts (
    id          TEXT PRIMARY KEY,
    name        TEXT NOT NULL,
    entity      entity_type,
    status      TEXT DEFAULT 'active',
    created_at  TIMESTAMPTZ DEFAULT now(),
    updated_at  TIMESTAMPTZ DEFAULT now()
);


-- RLS for courts
ALTER TABLE courts ENABLE ROW LEVEL SECURITY;


-- Admin full access
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE policyname = 'admin_full_access'
      AND tablename = 'courts'
  ) THEN
    CREATE POLICY "admin_full_access"
    ON courts
    FOR ALL
    USING (
      auth.jwt() -> 'user_metadata' ->> 'role' = 'admin'
    );
  END IF;
END $$;


-- Public read
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE policyname = 'public_read_courts'
      AND tablename = 'courts'
  ) THEN
    CREATE POLICY "public_read_courts"
    ON courts
    FOR SELECT
    USING (true);
  END IF;
END $$;


-- Seed courts data
INSERT INTO courts (id, name, entity) VALUES
    ('court_2', 'Court 2', 'the-club'),
    ('court_3', 'Court 3', 'the-club'),
    ('court_4', 'Court 4', 'the-club'),
    ('court_5', 'Court 5', 'the-club'),
    ('court_6', 'Court 6', 'the-club')
ON CONFLICT (id) DO NOTHING;


-- ============================================================================
-- SECTION 12: RLS for enrollments and report_verifications
-- ============================================================================

-- Enable RLS on enrollments if not already enabled
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;


-- Enrollment policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE policyname = 'admin_full_access'
      AND tablename = 'enrollments'
  ) THEN
    CREATE POLICY "admin_full_access"
    ON enrollments
    FOR ALL
    USING (
      auth.jwt() -> 'user_metadata' ->> 'role' = 'admin'
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE policyname = 'public_read_enrollments'
      AND tablename = 'enrollments'
  ) THEN
    CREATE POLICY "public_read_enrollments"
    ON enrollments
    FOR SELECT
    USING (true);
  END IF;
END $$;


-- Enable RLS on report_verifications if table exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'report_verifications') THEN
    ALTER TABLE report_verifications ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;


-- Report verification policies
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'report_verifications') THEN
    IF NOT EXISTS (
      SELECT 1
      FROM pg_policies
      WHERE policyname = 'admin_full_access'
        AND tablename = 'report_verifications'
    ) THEN
      CREATE POLICY "admin_full_access"
      ON report_verifications
      FOR ALL
      USING (
        auth.jwt() -> 'user_metadata' ->> 'role' = 'admin'
      );
    END IF;

    IF NOT EXISTS (
      SELECT 1
      FROM pg_policies
      WHERE policyname = 'public_read_report_verifications'
        AND tablename = 'report_verifications'
    ) THEN
      CREATE POLICY "public_read_report_verifications"
      ON report_verifications
      FOR SELECT
      USING (true);
    END IF;
  END IF;
END $$;


-- ============================================================================
-- SECTION 13: INDEXES — Add indexes for new columns
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_coaches_entity
ON coaches(entity);

CREATE INDEX IF NOT EXISTS idx_coaches_duty_type
ON coaches(duty_type);

CREATE INDEX IF NOT EXISTS idx_batches_entity
ON batches(entity);

CREATE INDEX IF NOT EXISTS idx_batches_court_id
ON batches(court_id);

CREATE INDEX IF NOT EXISTS idx_batches_program
ON batches(program);

CREATE INDEX IF NOT EXISTS idx_batches_primary_coach_id
ON batches(primary_coach_id);

CREATE INDEX IF NOT EXISTS idx_batches_support_coach_id
ON batches(support_coach_id);

CREATE INDEX IF NOT EXISTS idx_enrollments_student_id
ON enrollments(student_id);

CREATE INDEX IF NOT EXISTS idx_enrollments_batch_id
ON enrollments(batch_id);

CREATE INDEX IF NOT EXISTS idx_enrollments_status
ON enrollments(status);

CREATE INDEX IF NOT EXISTS idx_packages_program
ON packages(program);

CREATE INDEX IF NOT EXISTS idx_packages_valid_to
ON packages(valid_to);

CREATE INDEX IF NOT EXISTS idx_packages_payment_mode
ON packages(payment_mode);

CREATE INDEX IF NOT EXISTS idx_attendance_session_period
ON attendance(session_period);

CREATE INDEX IF NOT EXISTS idx_coach_attendance_session_period
ON coach_attendance(session_period);

CREATE INDEX IF NOT EXISTS idx_courts_entity
ON courts(entity);


-- ============================================================================
-- DONE: Run master_check_v2.sql to verify
-- ============================================================================
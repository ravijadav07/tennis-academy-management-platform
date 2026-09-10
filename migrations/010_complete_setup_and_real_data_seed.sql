-- ============================================================================
-- Arnav Jain Tennis Academy — COMPLETE MASTER SETUP & REAL CLIENT SEED
-- Migration 010: Combines 006 (Certificates), 008a (Enums), 008b (Gap-Fill), 
--                Table Creations, and Real Client Data Seed
-- Run this SINGLE SCRIPT in your Supabase SQL Editor!
-- Generated: 2026-09-10T14:59:39.472Z
-- ============================================================================

-- ============================================================================
-- PART 1: ENSURE ALL MISSING TABLES EXIST (ENROLLMENTS, CERTIFICATES, REPORT_VERIFICATIONS)
-- ============================================================================

-- 1a. enrollments table
CREATE TABLE IF NOT EXISTS enrollments (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id      uuid REFERENCES students(id) ON DELETE CASCADE,
    batch_id        uuid REFERENCES batches(id) ON DELETE CASCADE,
    status          text DEFAULT 'active',
    billing_program text,
    enrolled_from   timestamptz DEFAULT now(),
    enrolled_to     date,
    end_date        date,
    created_at      timestamptz DEFAULT now(),
    updated_at      timestamptz DEFAULT now()
);

-- 1b. report_verifications table
CREATE TABLE IF NOT EXISTS report_verifications (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    report_type     text NOT NULL,
    period_month    text NOT NULL,
    status          text DEFAULT 'pending',
    verified_by     text,
    verified_at     timestamptz,
    notes           text,
    created_at      timestamptz DEFAULT now(),
    updated_at      timestamptz DEFAULT now()
);

-- 1b. certificates table
CREATE TABLE IF NOT EXISTS certificates (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id      uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    package_id      uuid NOT NULL REFERENCES packages(id) ON DELETE CASCADE,
    file_path       text NOT NULL,
    generated_at    timestamptz DEFAULT now(),
    created_at      timestamptz DEFAULT now(),
    updated_at      timestamptz DEFAULT now(),
    UNIQUE (student_id, package_id)
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_certificates_updated_at'
  ) THEN
    CREATE TRIGGER trg_certificates_updated_at BEFORE UPDATE ON certificates
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_certificates_student_id ON certificates(student_id);
CREATE INDEX IF NOT EXISTS idx_certificates_package_id ON certificates(package_id);

ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'public_read_certificates' AND tablename = 'certificates') THEN
    CREATE POLICY "public_read_certificates" ON certificates FOR SELECT USING (true);
  END IF;
END $$;

-- ============================================================================
-- PART 2: 008a — ENUM FIXES & DUTY_TYPE
-- ============================================================================
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

-- ============================================================================
-- PART 3: 008b — GAP-FILL (COLUMNS, COURTS TABLE, POLICIES)
-- ============================================================================
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

-- ============================================================================
-- PART 4: REAL CLIENT DATA SEED (SAFE TRUNCATE & INSERT)
-- ============================================================================

-- Disable triggers temporarily during reset
SET session_replication_role = 'replica';

-- Dynamic Safe Truncate for existing public tables
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN (
    SELECT tablename 
    FROM pg_tables 
    WHERE schemaname = 'public' 
      AND tablename IN (
        'reminders', 'reconciliation', 'payments', 'coach_attendance', 
        'attendance', 'schedule', 'packages', 'enrollments', 'student_parents', 
        'students', 'parents', 'batches', 'coaches', 'courts', 'certificates'
      )
  ) LOOP
    EXECUTE 'TRUNCATE TABLE public.' || quote_ident(r.tablename) || ' RESTART IDENTITY CASCADE;';
  END LOOP;
END $$;

SET session_replication_role = 'origin';

-- ----------------------------------------------------------------------------
-- COURTS
-- ----------------------------------------------------------------------------
INSERT INTO courts (id, name, entity, status) VALUES
('court_2', 'Court 2', 'the-club'::entity_type, 'active'),
('court_3', 'Court 3', 'the-club'::entity_type, 'active'),
('court_4', 'Court 4', 'the-club'::entity_type, 'active'),
('court_5', 'Court 5', 'the-club'::entity_type, 'active'),
('court_6', 'Court 6', 'the-club'::entity_type, 'active');

-- ----------------------------------------------------------------------------
-- COACHES
-- ----------------------------------------------------------------------------
INSERT INTO coaches (
  id, name, designation, duty_type, base_salary, 
  rate_1on1_per_hour, rate_overtime_per_hour, paid_holidays_per_month, 
  phone, status, entity
) VALUES
('914754be-b79f-49fa-ae88-b58aa92f45ab', 'Santosh', 'Senior Tennis Coach', 'FULL_TIME'::duty_type, 25000, 800, 250, 1, '+91 9916610202', 'active'::coach_status, 'the-club'::entity_type),
('7c25b62d-e407-4b59-a3f4-2219648276ea', 'Anil', 'Senior Tennis Coach', 'EVENING_ONLY'::duty_type, 30000, 800, 0, 1, '+91 9926526344', 'active'::coach_status, 'the-club'::entity_type),
('d454187b-f9e7-4354-a81c-1c6a9326ba42', 'Jagdish', 'Senior Tennis Coach', 'FULL_TIME'::duty_type, 32000, 800, 250, 1, '+91 9951199456', 'active'::coach_status, 'the-club'::entity_type),
('00e7a723-d95f-44c1-ad08-3acfad99f892', 'Sunil', 'Junior Tennis Coach', 'MORNING_ONLY'::duty_type, 15000, 650, 250, 1, '+91 9953121048', 'active'::coach_status, 'the-club'::entity_type),
('77c79e55-c804-4327-ae24-41203bf670fb', 'Karan', 'Junior Tennis Coach', 'MORNING_ONLY'::duty_type, 22000, 650, 250, 1, '+91 9934540535', 'active'::coach_status, 'the-club'::entity_type),
('0c92d8fe-030e-43dc-a067-356f8bca8573', 'Karim', 'Senior Tennis Coach', 'MORNING_ONLY'::duty_type, 30000, 0, 0, 1, '+91 9988176300', 'active'::coach_status, 'the-club'::entity_type),
('25194099-ebb5-4236-aaac-8f16208bca11', 'Vinod D', 'Junior Tennis Coach', 'EVENING_ONLY'::duty_type, 18000, 650, 250, 1, '+91 9926479525', 'active'::coach_status, 'the-club'::entity_type),
('534116a3-b9a0-4b0e-a93b-98843988f9a8', 'Nanu', 'Senior Tennis Coach', 'FULL_TIME'::duty_type, 42000, 800, 0, 1, '+91 9946760124', 'active'::coach_status, 'the-club'::entity_type),
('1718317d-b8cb-426e-a145-3bfeb8f1e220', 'Team One Aim', 'Fitness Team', 'FULL_TIME'::duty_type, 30000, 0, 0, 0, '+91 9980719970', 'active'::coach_status, 'the-club'::entity_type),
('e0bf56a4-0b17-41ee-ae2f-f9055ad05ef1', 'Parth Kalke', 'Head of Sports Operations', 'PART_TIME'::duty_type, 5000, 0, 0, 0, '+91 9980058209', 'active'::coach_status, 'the-club'::entity_type);

-- ----------------------------------------------------------------------------
-- BATCHES
-- ----------------------------------------------------------------------------
INSERT INTO batches (
  id, name, day_pattern, court_id, start_time, end_time, 
  program, ball_level, capacity, primary_coach_id, support_coach_id, 
  is_semi_batch, semi_batch_group, court_change_at, court_change_to, 
  status, entity, level
) VALUES
('9381e9fb-ebdd-4919-a3f5-3b86bc231da1', 'Court 2 - Advance Yellow Ball - 3:30 to 5:30pm', 'MWF', 'court_2', '15:30', '17:30', 'ADV', 'Yellow', 4, 'd454187b-f9e7-4354-a81c-1c6a9326ba42', NULL, FALSE, NULL, NULL, NULL, 'active'::batch_status, 'the-club'::entity_type, 'beginner'::student_level),
('413f8ac4-4aa1-4980-aeed-5f770afbfcfb', 'Court 3 - Advance Yellow Ball - 4:00 to 6:00pm', 'MWF', 'court_3', '16:00', '18:00', 'ADV', 'Yellow', 4, '534116a3-b9a0-4b0e-a93b-98843988f9a8', '914754be-b79f-49fa-ae88-b58aa92f45ab', FALSE, NULL, '17:00', 'court_4', 'active'::batch_status, 'the-club'::entity_type, 'beginner'::student_level),
('df07ef36-8b1f-495e-ade5-3bc13d3591c2', 'Court 4 - Advance Yellow Ball - 4:00 to 6:00pm', 'MWF', 'court_4', '16:00', '18:00', 'ADV', 'Yellow', 4, '914754be-b79f-49fa-ae88-b58aa92f45ab', NULL, FALSE, NULL, NULL, NULL, 'active'::batch_status, 'the-club'::entity_type, 'beginner'::student_level),
('e666edab-ac22-4c83-a442-3b611f5c6704', 'Court 5 - Advance Yellow Ball - 3:30 to 5:30pm', 'MWF', 'court_5', '15:30', '17:30', 'ADV', 'Yellow', 4, '7c25b62d-e407-4b59-a3f4-2219648276ea', NULL, FALSE, NULL, NULL, NULL, 'active'::batch_status, 'the-club'::entity_type, 'beginner'::student_level),
('f229aec5-daa1-415e-ad8e-2c70dd273ba8', 'Court 6 - Advance Green Ball - 3:30 to 5:30pm', 'MWF', 'court_6', '15:30', '17:30', 'ADV', 'Green', 4, '25194099-ebb5-4236-aaac-8f16208bca11', '914754be-b79f-49fa-ae88-b58aa92f45ab', FALSE, NULL, NULL, NULL, 'active'::batch_status, 'the-club'::entity_type, 'beginner'::student_level),
('657313bf-a9e0-4699-acb9-a373772b6f83', 'Court 5 - Orange Ball - 5:30 to 6:15pm', 'MWF', 'court_5', '17:30', '18:15', 'ORANGE', 'Orange', 12, '77c79e55-c804-4327-ae24-41203bf670fb', NULL, FALSE, NULL, NULL, NULL, 'active'::batch_status, 'the-club'::entity_type, 'beginner'::student_level),
('4ad6e6a4-5546-429b-a85e-5f10bba5c751', 'Court 6 - Red Ball - 5:30 to 6:15pm', 'MWF', 'court_6', '17:30', '18:15', 'RED', 'Red', 12, '00e7a723-d95f-44c1-ad08-3acfad99f892', '0c92d8fe-030e-43dc-a067-356f8bca8573', TRUE, NULL, NULL, NULL, 'active'::batch_status, 'the-club'::entity_type, 'beginner'::student_level),
('128446b0-6245-47af-a525-e095b3aad567', 'Court 3 - Green Ball - 6:15 to 7:15pm', 'MWF', 'court_3', '18:15', '19:15', 'GREEN', 'Green', 6, '0c92d8fe-030e-43dc-a067-356f8bca8573', NULL, FALSE, NULL, NULL, NULL, 'active'::batch_status, 'the-club'::entity_type, 'beginner'::student_level),
('b9efc568-1ce0-4c42-af2f-f8d3427cda18', 'Court 6 - Fitness - 18:15 to 19:00', 'MWF', 'court_6', '18:15', '19:00', 'FITNESS', '', 6, '1718317d-b8cb-426e-a145-3bfeb8f1e220', NULL, FALSE, NULL, NULL, NULL, 'active'::batch_status, 'the-club'::entity_type, 'beginner'::student_level),
('b26db574-2453-4389-ac40-513477e48145', 'Court 6 - Fitness - 19:00 to 19:45', 'MWF', 'court_6', '19:00', '19:45', 'FITNESS', '', 6, '1718317d-b8cb-426e-a145-3bfeb8f1e220', NULL, FALSE, NULL, NULL, NULL, 'active'::batch_status, 'the-club'::entity_type, 'beginner'::student_level),
('a31d6772-c360-4687-a529-df3093554f1c', 'Court 3 - Intermediate Yellow Ball - 4:30 to 6:00pm', 'TTS', 'court_3', '16:30', '18:00', 'INT', 'Yellow', 4, 'd454187b-f9e7-4354-a81c-1c6a9326ba42', NULL, FALSE, NULL, NULL, NULL, 'active'::batch_status, 'the-club'::entity_type, 'beginner'::student_level),
('84184cd0-8ae8-4004-a6d2-5dc72bdd6220', 'Court 4 - Intermediate Yellow Ball - 5:00 to 6:00pm', 'TTS', 'court_4', '17:00', '18:00', 'INT', 'Yellow', 4, '534116a3-b9a0-4b0e-a93b-98843988f9a8', NULL, FALSE, NULL, NULL, NULL, 'active'::batch_status, 'the-club'::entity_type, 'beginner'::student_level),
('bf4f767e-0372-4341-ac26-ee6e054f9806', 'Court 4 - Intermediate Yellow Ball - 3:30 to 5:00pm', 'TTS', 'court_4', '15:30', '17:00', 'INT', 'Yellow', 5, '7c25b62d-e407-4b59-a3f4-2219648276ea', '25194099-ebb5-4236-aaac-8f16208bca11', FALSE, NULL, NULL, NULL, 'active'::batch_status, 'the-club'::entity_type, 'beginner'::student_level),
('58c6e3d1-ecb8-4777-a72f-47ec3823c504', 'Court 5 - Beginner Green Ball - 5:00 to 6:00pm', 'TTS', 'court_5', '17:00', '18:00', 'GREEN', 'Green', 12, '77c79e55-c804-4327-ae24-41203bf670fb', NULL, FALSE, NULL, NULL, NULL, 'active'::batch_status, 'the-club'::entity_type, 'beginner'::student_level),
('d42a61be-3638-4332-ac24-17211a0c30f5', 'Court 6 - Intermediate Green Ball - 4:00 to 5:00pm', 'TTS', 'court_6', '16:00', '17:00', 'GREEN', 'Green', 6, '0c92d8fe-030e-43dc-a067-356f8bca8573', NULL, FALSE, NULL, NULL, NULL, 'active'::batch_status, 'the-club'::entity_type, 'beginner'::student_level),
('aa5a18ba-cb24-4e0e-ada4-d0ea4f8e6c20', 'Court 6 - Red Ball - 5:00 to 5:45pm', 'TTS', 'court_6', '17:00', '17:45', 'RED', 'Red', 12, '00e7a723-d95f-44c1-ad08-3acfad99f892', NULL, FALSE, NULL, NULL, NULL, 'active'::batch_status, 'the-club'::entity_type, 'beginner'::student_level),
('588b1211-823a-4fca-a18d-f19f874d0a9c', 'Court 4 - Adults - 6:30 to 7:30am', 'TTS', 'court_4', '06:30', '07:30', 'ADULT', 'Yellow', 5, '534116a3-b9a0-4b0e-a93b-98843988f9a8', NULL, FALSE, NULL, NULL, NULL, 'active'::batch_status, 'the-club'::entity_type, 'beginner'::student_level),
('a8bfb51b-2daf-4b28-a17b-d245fe0ff413', 'Court 6 - Fitness - 17:45 to 18:45', 'TTS', 'court_6', '17:45', '18:45', 'FITNESS', '', 6, '1718317d-b8cb-426e-a145-3bfeb8f1e220', NULL, FALSE, NULL, NULL, NULL, 'active'::batch_status, 'the-club'::entity_type, 'beginner'::student_level),
('57a96784-39e9-4798-a7c7-b6db0ab93aae', 'Court 5 - Weekend U8 - 2:30 to 3:30pm', 'SAT_SUN', 'court_5', '14:30', '15:30', 'WEEKEND', 'Red', 10, '00e7a723-d95f-44c1-ad08-3acfad99f892', NULL, TRUE, 'wk_230', NULL, NULL, 'active'::batch_status, 'the-club'::entity_type, 'beginner'::student_level),
('5052b2db-8172-4680-a458-572fc4c6154a', 'Court 6 - Weekend 8+ - 2:30 to 3:30pm', 'SAT_SUN', 'court_6', '14:30', '15:30', 'WEEKEND', 'Orange', 6, '77c79e55-c804-4327-ae24-41203bf670fb', NULL, TRUE, 'wk_230', NULL, NULL, 'active'::batch_status, 'the-club'::entity_type, 'beginner'::student_level),
('e0e71f79-633d-44a1-a3c2-9ee0750faa7d', 'Court 5 - Weekend U8 - 3:30 to 4:30pm', 'SAT_SUN', 'court_5', '15:30', '16:30', 'WEEKEND', 'Red', 10, '00e7a723-d95f-44c1-ad08-3acfad99f892', NULL, TRUE, 'wk_330', NULL, NULL, 'active'::batch_status, 'the-club'::entity_type, 'beginner'::student_level),
('42114944-6f5d-42f9-a73f-5285b50c6ed7', 'Court 6 - Weekend 8+ - 3:30 to 4:30pm', 'SAT_SUN', 'court_6', '15:30', '16:30', 'WEEKEND', 'Orange', 6, '77c79e55-c804-4327-ae24-41203bf670fb', NULL, TRUE, 'wk_330', NULL, NULL, 'active'::batch_status, 'the-club'::entity_type, 'beginner'::student_level);

-- ----------------------------------------------------------------------------
-- PARENTS
-- ----------------------------------------------------------------------------
INSERT INTO parents (id, name, phone, email, entity, account_status) VALUES
('fa007b68-a7c6-4cf8-a7ac-115710661a58', 'Khanna Family', '+91 9870717355', NULL, 'the-club'::entity_type, 'active'::account_status),
('962bc851-45ff-4843-a13a-92ccaed8d75d', 'Saini Family', '+91 9872498494', NULL, 'the-club'::entity_type, 'active'::account_status),
('6f635cb8-7da9-4bdb-ad49-2263b0a0d134', 'Chandra Family', '+91 9878161301', NULL, 'the-club'::entity_type, 'active'::account_status),
('a3ad3250-c3be-451b-aef3-24fb4b70ba85', 'Heble Family', '+91 9835488219', NULL, 'the-club'::entity_type, 'active'::account_status),
('0da149bc-81ab-4dc1-afec-51643ee7580c', 'Sanghvi Family', '+91 9878707214', NULL, 'the-club'::entity_type, 'active'::account_status),
('628ddfd5-24e0-4959-ab09-ef81eac5730f', 'Singhal Family', '+91 9894541427', NULL, 'the-club'::entity_type, 'active'::account_status),
('a30e056b-f68c-4e46-ae90-782eb65a0225', 'Karla Family', '+91 9834987809', NULL, 'the-club'::entity_type, 'active'::account_status),
('71a78c44-cfdc-4f2f-aec2-f0ff8f47922e', 'Khanna Family', '+91 9869940718', NULL, 'the-club'::entity_type, 'active'::account_status),
('b7ac639b-e549-4c3e-afdc-9c505e983fd9', 'Sanghvi Family', '+91 9829031420', NULL, 'the-club'::entity_type, 'active'::account_status),
('2b366124-bbbc-4162-a9f4-db51f9b95972', 'Sukhani Family', '+91 9882302218', NULL, 'the-club'::entity_type, 'active'::account_status),
('ff0b05e0-6916-4523-a010-6dcb426b1751', 'Kapadia Family', '+91 9895154811', NULL, 'the-club'::entity_type, 'active'::account_status),
('feb970a2-469b-455f-af9e-7ae0522ac615', 'Parekh Family', '+91 9889918134', NULL, 'the-club'::entity_type, 'active'::account_status),
('1c4ff32d-0ac9-400d-a35a-c6abcf00952b', 'Kalra Family', '+91 9870799941', NULL, 'the-club'::entity_type, 'active'::account_status),
('be5f6103-e655-4764-ac4e-94329823b972', 'Kewalramani Family', '+91 9892619427', NULL, 'the-club'::entity_type, 'active'::account_status),
('a3f5e14a-d962-45ee-a229-bda0fd6acbb9', 'Atal Family', '+91 9831138499', NULL, 'the-club'::entity_type, 'active'::account_status),
('2d27f348-40b4-49e5-a2e1-102ef4d27ca3', 'Yalla Family', '+91 9812013364', NULL, 'the-club'::entity_type, 'active'::account_status),
('a42ca2b0-3dde-4c56-a2fc-e5000e7f010a', 'Modawalla Family', '+91 9880918133', NULL, 'the-club'::entity_type, 'active'::account_status),
('c36fc466-9ef2-4f94-ab16-620dc6f6ed51', 'Jhaveri Family', '+91 9817992814', NULL, 'the-club'::entity_type, 'active'::account_status),
('6d64b437-d7f9-4634-ac72-ec31cddd2ee4', 'Chauhan Family', '+91 9835529320', NULL, 'the-club'::entity_type, 'active'::account_status),
('b379cbcd-5a4a-4950-a51e-a6acd9acd66c', 'Yalla Family', '+91 9890479377', NULL, 'the-club'::entity_type, 'active'::account_status),
('84881a17-da68-4918-a24e-86ade6d5ede3', 'Jhaveri Family', '+91 9872268229', NULL, 'the-club'::entity_type, 'active'::account_status),
('247e49cb-cfa1-47b3-af90-5104e73b3a70', 'Dodhia Family', '+91 9869127085', NULL, 'the-club'::entity_type, 'active'::account_status),
('d09b3fd4-d902-47f6-a2dc-59a86394b180', 'Kapadia Family', '+91 9836215591', NULL, 'the-club'::entity_type, 'active'::account_status),
('3e8b5654-0dca-4280-a30a-3464a4141db0', 'Rajani Family', '+91 9841359386', NULL, 'the-club'::entity_type, 'active'::account_status),
('07b6737e-a6ef-41fc-a314-35ae28f15d02', 'Dutt Family', '+91 9849480355', NULL, 'the-club'::entity_type, 'active'::account_status),
('09284fd4-64b6-4dc5-ad91-37365d2baadc', 'Sanghvi Family', '+91 9810616565', NULL, 'the-club'::entity_type, 'active'::account_status),
('ef399f53-202a-4b6a-aeb0-e40d8f3909ef', 'Khandelwal Family', '+91 9821406998', NULL, 'the-club'::entity_type, 'active'::account_status),
('c41b756e-72db-4ca7-aa71-81562da1a55f', 'Arya Family', '+91 9897885988', NULL, 'the-club'::entity_type, 'active'::account_status),
('bf9a05c7-3fa9-46b4-ae28-7d998d9d05c1', 'Choudhary Family', '+91 9864596917', NULL, 'the-club'::entity_type, 'active'::account_status),
('c288a1d3-99f1-4ade-a03c-6a2698ea0472', 'Moorthy Family', '+91 9821167381', NULL, 'the-club'::entity_type, 'active'::account_status),
('2db752c4-edb8-4dcc-a00e-1fc3d0acf5cb', 'Shah Family', '+91 9844090597', NULL, 'the-club'::entity_type, 'active'::account_status),
('82c73bb6-2378-4dfe-a1fe-f7b7dfaaffeb', 'Mehta Family', '+91 9840825235', NULL, 'the-club'::entity_type, 'active'::account_status),
('ee74e129-7a4f-4081-a106-bce42932a9ed', 'Mehta Family', '+91 9848794285', NULL, 'the-club'::entity_type, 'active'::account_status),
('4473217f-4639-4811-a321-5f4e7bd76608', 'Rathod Family', '+91 9819425238', NULL, 'the-club'::entity_type, 'active'::account_status),
('69491667-9787-4297-ad42-241f35b35e41', 'Vasant Family', '+91 9824485705', NULL, 'the-club'::entity_type, 'active'::account_status),
('4afb1190-8146-4f91-a901-02caf2af9685', 'Rathod Family', '+91 9824469087', NULL, 'the-club'::entity_type, 'active'::account_status),
('47b9a2d7-601f-44e1-a74e-6226b23f5dea', 'Shah Family', '+91 9861876968', NULL, 'the-club'::entity_type, 'active'::account_status),
('02b1aa96-8717-42ba-a8a0-79c570973f97', 'Barot Family', '+91 9812267000', NULL, 'the-club'::entity_type, 'active'::account_status),
('b188b72a-4a83-4d1d-aaea-3ea65493e26c', 'Salot Family', '+91 9810073140', NULL, 'the-club'::entity_type, 'active'::account_status),
('4ffb560f-7725-4149-ab0a-4db05bdc8308', 'Sheth Family', '+91 9838147794', NULL, 'the-club'::entity_type, 'active'::account_status),
('ba7927c7-f571-416a-a7c1-af5fb5e2b6a3', 'Karnik Family', '+91 9873080624', NULL, 'the-club'::entity_type, 'active'::account_status),
('d0c14d16-2952-492c-ab67-b715bb027ddb', 'Mukhi Family', '+91 9863341398', NULL, 'the-club'::entity_type, 'active'::account_status),
('87078780-df80-4391-afb6-2154c5784cdb', 'Bhatija Family', '+91 9819803040', NULL, 'the-club'::entity_type, 'active'::account_status),
('5bbbc587-70c5-4572-a7c5-f45738c2495b', 'Mehta Family', '+91 9894484008', NULL, 'the-club'::entity_type, 'active'::account_status),
('dab7fb3a-143c-499b-ac07-8fd8b4b7d36d', 'Mehra Family', '+91 9846208666', NULL, 'the-club'::entity_type, 'active'::account_status),
('dc2cbab3-6d9c-4aac-a2de-395409495984', 'Ganeriwal Family', '+91 9821696296', NULL, 'the-club'::entity_type, 'active'::account_status),
('f8963bc3-7212-44f9-a2e7-3ba1caea8c24', 'Chouhan Family', '+91 9854638887', NULL, 'the-club'::entity_type, 'active'::account_status),
('8a6c5af9-2562-4804-a506-fd94d26a5949', 'Ludhani Family', '+91 9865036102', NULL, 'the-club'::entity_type, 'active'::account_status),
('727d6464-1833-447f-a6d3-b88af2473db0', 'Vajifdar Family', '+91 9825836575', NULL, 'the-club'::entity_type, 'active'::account_status),
('b21c89bd-c115-4d1f-a26b-7c9da2dac5f8', 'Mehta Family', '+91 9843069630', NULL, 'the-club'::entity_type, 'active'::account_status),
('c6fc446d-ebb8-451b-a958-9520db622c7e', 'Chopra Family', '+91 9823562206', NULL, 'the-club'::entity_type, 'active'::account_status),
('8a1b68a2-0160-4459-ab48-9eec541f4627', 'Jain Family', '+91 9818038756', NULL, 'the-club'::entity_type, 'active'::account_status),
('26d7c200-ca2c-45a8-a5dd-352d276d66e7', 'Shah Family', '+91 9875340316', NULL, 'the-club'::entity_type, 'active'::account_status),
('9f1c3678-6d47-46f6-aa69-271d72da96c5', 'Katyal Family', '+91 9885067323', NULL, 'the-club'::entity_type, 'active'::account_status),
('d04d66bc-6a24-410d-ad50-2521a1fe30ed', 'Desai Family', '+91 9870052350', NULL, 'the-club'::entity_type, 'active'::account_status),
('e55736e1-478b-46da-a153-47fe043d5d18', 'Golcha Family', '+91 9835593228', NULL, 'the-club'::entity_type, 'active'::account_status),
('09ee2f3a-8b14-431f-aafe-a9a832789c22', 'Pabari Family', '+91 9827578104', NULL, 'the-club'::entity_type, 'active'::account_status),
('23319189-92d0-42e6-a68c-8d761aea6303', 'Vivek Family', '+91 9896397981', NULL, 'the-club'::entity_type, 'active'::account_status),
('b1823e82-6869-441c-ac27-4f3f163f294d', 'Desai Family', '+91 9825637437', NULL, 'the-club'::entity_type, 'active'::account_status),
('046ecf7b-61c3-4a65-a310-9102f7ce1ff9', 'Desai Family', '+91 9866472862', NULL, 'the-club'::entity_type, 'active'::account_status),
('87735847-b0f3-45d7-a310-e80e637cb008', 'Mehta Family', '+91 9810063204', NULL, 'the-club'::entity_type, 'active'::account_status),
('8503f9c2-5952-4303-a84a-4c5654221371', 'Kanakia Family', '+91 9889556300', NULL, 'the-club'::entity_type, 'active'::account_status),
('caf2f350-1768-4991-a69d-696fe5544c03', 'Iyer Family', '+91 9812634789', NULL, 'the-club'::entity_type, 'active'::account_status),
('9f26f847-6529-4aee-af29-dfd61de3571c', 'Koshcheeva Family', '+91 9835139968', NULL, 'the-club'::entity_type, 'active'::account_status),
('e1e8595c-fee4-42ad-a30f-492ceca25889', 'Merchant Family', '+91 9890801554', NULL, 'the-club'::entity_type, 'active'::account_status),
('f5d84c93-727e-4183-a77a-10ca025e4b3d', 'Shah Family', '+91 9887438238', NULL, 'the-club'::entity_type, 'active'::account_status),
('727f59bd-ad42-4e97-acc8-1c8eeb572247', 'Saini Family', '+91 9815651615', NULL, 'the-club'::entity_type, 'active'::account_status),
('9cd4fb16-1164-4a9c-a470-8a96bf09b560', 'Sekhani Family', '+91 9838621040', NULL, 'the-club'::entity_type, 'active'::account_status),
('0c6a9bd3-baf5-4114-a242-9bb091c7e7bf', 'Kothari Family', '+91 9844665427', NULL, 'the-club'::entity_type, 'active'::account_status),
('baa59cac-a77b-4255-adc1-abb7c076c973', 'Ruia Family', '+91 9891917530', NULL, 'the-club'::entity_type, 'active'::account_status),
('dd6f6b9f-8ea1-4363-a791-2b5397a3b761', 'Chauhan Family', '+91 9849772036', NULL, 'the-club'::entity_type, 'active'::account_status),
('0f242bea-2bd3-4746-a186-4900ed355c2a', 'Poddar Family', '+91 9819851387', NULL, 'the-club'::entity_type, 'active'::account_status),
('18ff716e-2436-4dd5-a3ff-20dc840b4182', 'Dsouza Family', '+91 9822095322', NULL, 'the-club'::entity_type, 'active'::account_status),
('49873ce1-3943-462a-a850-7f78da8b8cfa', 'Dsouza Family', '+91 9888213340', NULL, 'the-club'::entity_type, 'active'::account_status),
('18686e4c-455e-4f4e-a236-dda8621b8e5a', 'Chandanani Family', '+91 9842616642', NULL, 'the-club'::entity_type, 'active'::account_status),
('932c10d4-513a-4e6f-a973-8cedb4602cb3', 'Gupte Family', '+91 9890702951', NULL, 'the-club'::entity_type, 'active'::account_status),
('133783a3-e6d5-4e91-aac8-e87faad7473a', 'Manik Family', '+91 9859889272', NULL, 'the-club'::entity_type, 'active'::account_status),
('2102907f-d31b-43bd-a5bc-f1730c2cce41', 'Katari Family', '+91 9870828562', NULL, 'the-club'::entity_type, 'active'::account_status),
('0870879b-f6d3-4ced-a2cd-a1867c84f062', 'Shah Family', '+91 9888822215', NULL, 'the-club'::entity_type, 'active'::account_status),
('7888f64d-00cb-4b4e-a3d7-a2f5cf664efa', 'Vasant Family', '+91 9887117647', NULL, 'the-club'::entity_type, 'active'::account_status),
('bb6ffabb-b5b7-40f2-a1c4-3eddf8baa291', 'Mehra Family', '+91 9861821066', NULL, 'the-club'::entity_type, 'active'::account_status),
('9e483bed-3980-426c-a02b-eebcb14e3d2f', 'Oza Family', '+91 9894187382', NULL, 'the-club'::entity_type, 'active'::account_status),
('ee0f6b3f-d43c-4d74-a9c9-1322e364c9ee', 'Arora Family', '+91 9851716384', NULL, 'the-club'::entity_type, 'active'::account_status),
('c54ce603-f315-4766-a141-c3c7dd2f246e', 'Bajaj Family', '+91 9891932517', NULL, 'the-club'::entity_type, 'active'::account_status),
('2f9aa9fd-9657-4f56-a0ee-7ef09e42f296', 'Sachdeva Family', '+91 9835474614', NULL, 'the-club'::entity_type, 'active'::account_status),
('277737ad-a9a2-4e87-ac7e-4b06c0499374', 'Guzman Family', '+91 9894419900', NULL, 'the-club'::entity_type, 'active'::account_status),
('6e8c01be-3a57-4bc3-a2dd-5f964027c619', 'Winston Family', '+91 9836385835', NULL, 'the-club'::entity_type, 'active'::account_status),
('91d463d3-6997-4c0a-a291-ff5418c208cd', 'Vora Family', '+91 9862104655', NULL, 'the-club'::entity_type, 'active'::account_status);

-- ----------------------------------------------------------------------------
-- STUDENTS & STUDENT_PARENTS
-- ----------------------------------------------------------------------------
INSERT INTO students (
  id, name, age, age_group, level, entity, status, join_date, 
  guardian_name, guardian_phone, guardian_email, membership_type
) VALUES
('5193d5cb-3142-44f0-a74e-329f3b8c839a', 'Aadvik Khanna', 6, NULL, 'beginner'::student_level, 'the-club'::entity_type, 'active'::student_status, '2024-12-19'::date, 'Khanna Family', '+91 9870717355', NULL, 'Member'),
('c9093c98-f96e-47f7-af0e-f7abff60bc8c', 'Aalya Saini', 13, NULL, 'beginner'::student_level, 'the-club'::entity_type, 'active'::student_status, '2025-04-09'::date, 'Saini Family', '+91 9872498494', NULL, 'Member'),
('ec6ef04b-edc5-44c3-a70b-e857a83ee880', 'Aarav Chandra', 8, NULL, 'beginner'::student_level, 'the-club'::entity_type, 'active'::student_status, '2024-11-21'::date, 'Chandra Family', '+91 9878161301', NULL, 'Member'),
('a6c7fc98-e91c-4b24-a37c-eb83d951fc19', 'Aarav Heble', 15, NULL, 'beginner'::student_level, 'the-club'::entity_type, 'active'::student_status, '2026-01-07'::date, 'Heble Family', '+91 9835488219', NULL, 'Member'),
('9720fe32-7924-4cbe-a58a-de451cab1e09', 'Aarav Sanghvi', 10, NULL, 'beginner'::student_level, 'the-club'::entity_type, 'active'::student_status, '2025-03-15'::date, 'Sanghvi Family', '+91 9878707214', NULL, 'Member'),
('1e725840-1b60-454c-a76b-cb1c911e0acb', 'Aarohi Singhal', 17, NULL, 'beginner'::student_level, 'the-club'::entity_type, 'active'::student_status, '2024-10-25'::date, 'Singhal Family', '+91 9894541427', NULL, 'Member'),
('ff750bbe-a244-4eb7-a0e5-1d7978f8e2f5', 'Aarshiv Karla', 12, NULL, 'beginner'::student_level, 'the-club'::entity_type, 'active'::student_status, '2026-04-10'::date, 'Karla Family', '+91 9834987809', NULL, 'Member'),
('fcd61cfa-c3c0-44c5-afb8-86f7ec31a84a', 'Aarush Khanna', 7, NULL, 'beginner'::student_level, 'the-club'::entity_type, 'active'::student_status, '2025-09-08'::date, 'Khanna Family', '+91 9869940718', NULL, 'Member'),
('34ab8595-f6cc-4335-af1a-02f5d8149098', 'Aarush Sanghvi', 14, NULL, 'beginner'::student_level, 'the-club'::entity_type, 'active'::student_status, '2026-04-14'::date, 'Sanghvi Family', '+91 9829031420', NULL, 'Member'),
('576b7944-1c8e-4aea-a21a-f5fb8c6bfe1f', 'Abir Sukhani', 9, NULL, 'beginner'::student_level, 'the-club'::entity_type, 'active'::student_status, '2024-04-07'::date, 'Sukhani Family', '+91 9882302218', NULL, 'Guest'),
('412aaf7f-0409-4eeb-a183-f4bb9eadd936', 'Aditya Kapadia', 16, NULL, 'beginner'::student_level, 'the-club'::entity_type, 'active'::student_status, '2026-06-03'::date, 'Kapadia Family', '+91 9895154811', NULL, 'Member'),
('18acab55-2ba0-40be-a731-7ed22ada36b1', 'Advait Parekh', 11, NULL, 'beginner'::student_level, 'the-club'::entity_type, 'active'::student_status, '2025-06-05'::date, 'Parekh Family', '+91 9889918134', NULL, 'Guest'),
('5a0f0f21-3bca-40fb-a611-fba6d843d404', 'Agastya Kalra', 6, NULL, 'beginner'::student_level, 'the-club'::entity_type, 'active'::student_status, '2024-09-14'::date, 'Kalra Family', '+91 9870799941', NULL, 'Member'),
('dbdb35ea-3201-4bec-a048-b1417c218c98', 'Ahaan Kewalramani', 13, NULL, 'beginner'::student_level, 'the-club'::entity_type, 'active'::student_status, '2024-09-18'::date, 'Kewalramani Family', '+91 9892619427', NULL, 'Member'),
('1ea9a06f-8ace-4580-a0f3-6aee162a8e40', 'Aksania Atal', 8, NULL, 'beginner'::student_level, 'the-club'::entity_type, 'active'::student_status, '2024-10-15'::date, 'Atal Family', '+91 9831138499', NULL, 'Member'),
('8ea8c39a-798e-49fc-a40b-c8bc379bbdc9', 'Alina Yalla', 15, NULL, 'beginner'::student_level, 'the-club'::entity_type, 'active'::student_status, '2024-03-16'::date, 'Yalla Family', '+91 9812013364', NULL, 'Member'),
('035b5ebe-d0a3-4183-acf6-a1dabb3cd9b9', 'Alyssa Modawalla', 10, NULL, 'beginner'::student_level, 'the-club'::entity_type, 'active'::student_status, '2026-05-12'::date, 'Modawalla Family', '+91 9880918133', NULL, 'Member'),
('a37cbb0e-9c9a-40d2-a977-2f8e7d09c717', 'Alyza Jhaveri', 17, NULL, 'beginner'::student_level, 'the-club'::entity_type, 'active'::student_status, '2026-06-09'::date, 'Jhaveri Family', '+91 9817992814', NULL, 'Member'),
('d619fc64-7032-4ea1-a6bf-24301ff1f328', 'Amaira Chauhan', 12, NULL, 'beginner'::student_level, 'the-club'::entity_type, 'active'::student_status, '2025-11-10'::date, 'Chauhan Family', '+91 9835529320', NULL, 'Member'),
('1b517753-a570-45f6-ac8c-c96cf1dcad59', 'Amara Yalla', 7, NULL, 'beginner'::student_level, 'the-club'::entity_type, 'active'::student_status, '2026-06-15'::date, 'Yalla Family', '+91 9890479377', NULL, 'Member'),
('d44bee9b-f985-4cf1-a8b7-c813df7b01e5', 'Anaiza Jhaveri', 14, NULL, 'beginner'::student_level, 'the-club'::entity_type, 'active'::student_status, '2025-08-15'::date, 'Jhaveri Family', '+91 9872268229', NULL, 'Member'),
('247c0ceb-fd98-4da4-a9f4-c1526b5879f9', 'Ananya Dodhia', 9, NULL, 'beginner'::student_level, 'the-club'::entity_type, 'active'::student_status, '2024-11-17'::date, 'Dodhia Family', '+91 9869127085', NULL, 'Member'),
('c5388f69-64a8-4ef3-a3a4-70c2099e028b', 'Ananya Kapadia', 16, NULL, 'beginner'::student_level, 'the-club'::entity_type, 'active'::student_status, '2025-01-30'::date, 'Kapadia Family', '+91 9836215591', NULL, 'Member'),
('1f741029-c147-42e8-a0d7-8a5eb380a6e1', 'Ananya Rajani', 11, NULL, 'beginner'::student_level, 'the-club'::entity_type, 'active'::student_status, '2024-09-28'::date, 'Rajani Family', '+91 9841359386', NULL, 'Member'),
('2881abf7-330d-444d-a5f1-8bfc8fe509b5', 'Arhaan Dutt', 6, NULL, 'beginner'::student_level, 'the-club'::entity_type, 'active'::student_status, '2025-02-19'::date, 'Dutt Family', '+91 9849480355', NULL, 'Member'),
('3b676538-ab4a-4271-aaee-164bb70736d8', 'Arhaan Sanghvi', 13, NULL, 'beginner'::student_level, 'the-club'::entity_type, 'active'::student_status, '2024-09-05'::date, 'Sanghvi Family', '+91 9810616565', NULL, 'Member'),
('620ab48f-0259-4be2-a503-d5c6ee60085e', 'Ariaan Khandelwal', 8, NULL, 'beginner'::student_level, 'the-club'::entity_type, 'active'::student_status, '2025-04-03'::date, 'Khandelwal Family', '+91 9821406998', NULL, 'Member'),
('1eb10c8d-6772-4d20-a624-90c3a8119f05', 'Arjun Arya', 15, NULL, 'beginner'::student_level, 'the-club'::entity_type, 'active'::student_status, '2025-10-04'::date, 'Arya Family', '+91 9897885988', NULL, 'Member'),
('ad62edd5-19b0-4532-ad2a-4d5eab439738', 'Arjun Choudhary', 10, NULL, 'beginner'::student_level, 'the-club'::entity_type, 'active'::student_status, '2024-12-28'::date, 'Choudhary Family', '+91 9864596917', NULL, 'Member'),
('e78facd1-00d4-41a5-a6aa-bb97bca5265a', 'Arjun Moorthy', 17, NULL, 'beginner'::student_level, 'the-club'::entity_type, 'active'::student_status, '2024-07-21'::date, 'Moorthy Family', '+91 9821167381', NULL, 'Member'),
('6b65cd8a-1b2d-41ce-a6c9-67958f176064', 'Arjun Shah', 12, NULL, 'beginner'::student_level, 'the-club'::entity_type, 'active'::student_status, '2025-08-27'::date, 'Shah Family', '+91 9844090597', NULL, 'Member'),
('9c088efb-8ac4-4797-a8ba-91f95aa10858', 'Aroush Mehta', 7, NULL, 'beginner'::student_level, 'the-club'::entity_type, 'active'::student_status, '2025-02-05'::date, 'Mehta Family', '+91 9840825235', NULL, 'Member'),
('20a15a20-355b-4c5d-a158-4e69f924494f', 'Arya Mehta', 14, NULL, 'beginner'::student_level, 'the-club'::entity_type, 'active'::student_status, '2026-06-15'::date, 'Mehta Family', '+91 9848794285', NULL, 'Member'),
('17d31d4b-e883-40fe-aa86-24d8fd566b0c', 'Aryaveer Rathod', 9, NULL, 'beginner'::student_level, 'the-club'::entity_type, 'active'::student_status, '2024-12-16'::date, 'Rathod Family', '+91 9819425238', NULL, 'Member'),
('fa79a99b-f590-4464-adaf-26d4374e7e23', 'Aveer Vasant', 16, NULL, 'beginner'::student_level, 'the-club'::entity_type, 'active'::student_status, '2025-05-31'::date, 'Vasant Family', '+91 9824485705', NULL, 'Member'),
('96097083-f85f-400c-a805-b408840ccb39', 'Aveera Rathod', 11, NULL, 'beginner'::student_level, 'the-club'::entity_type, 'active'::student_status, '2025-09-21'::date, 'Rathod Family', '+91 9824469087', NULL, 'Member'),
('ebc74af4-c853-44c5-a800-eac6377704e7', 'Avish Shah', 6, NULL, 'beginner'::student_level, 'the-club'::entity_type, 'active'::student_status, '2026-05-08'::date, 'Shah Family', '+91 9861876968', NULL, 'Member'),
('6ed0152b-a710-45b0-af39-242133b17981', 'Avyaan Barot', 13, NULL, 'beginner'::student_level, 'the-club'::entity_type, 'active'::student_status, '2024-08-13'::date, 'Barot Family', '+91 9812267000', NULL, 'Member'),
('06997d89-17f9-49a7-a93c-7bca974336d5', 'Ayaan Salot', 8, NULL, 'beginner'::student_level, 'the-club'::entity_type, 'active'::student_status, '2025-12-09'::date, 'Salot Family', '+91 9810073140', NULL, 'Member'),
('e2778cfd-0411-4a94-a15f-44bdbf7308bc', 'Ayaan Sheth', 15, NULL, 'beginner'::student_level, 'the-club'::entity_type, 'active'::student_status, '2026-05-23'::date, 'Sheth Family', '+91 9838147794', NULL, 'Member'),
('c14d8512-95af-46d4-a6e2-952b72d05b1d', 'Dev Karnik', 10, NULL, 'beginner'::student_level, 'the-club'::entity_type, 'active'::student_status, '2025-06-26'::date, 'Karnik Family', '+91 9873080624', NULL, 'Member'),
('64c4cb01-477f-449d-abb2-5a886233b532', 'Dhven Mukhi', 17, NULL, 'beginner'::student_level, 'the-club'::entity_type, 'active'::student_status, '2025-05-12'::date, 'Mukhi Family', '+91 9863341398', NULL, 'Member'),
('a5e41761-312a-4f92-abff-eaf285781df5', 'Divyansh Bhatija', 12, NULL, 'beginner'::student_level, 'the-club'::entity_type, 'active'::student_status, '2024-12-13'::date, 'Bhatija Family', '+91 9819803040', NULL, 'Member'),
('0184e692-d6ed-4941-a2d9-cde940c0c809', 'Hrivaan Mehta', 7, NULL, 'beginner'::student_level, 'the-club'::entity_type, 'active'::student_status, '2025-12-24'::date, 'Mehta Family', '+91 9894484008', NULL, 'Member'),
('0b8323af-b465-4e2b-af70-792b5b1820f0', 'Inez Mehra', 14, NULL, 'beginner'::student_level, 'the-club'::entity_type, 'active'::student_status, '2025-08-05'::date, 'Mehra Family', '+91 9846208666', NULL, 'Member'),
('697b5d61-3532-49dd-a152-32a90e55d1a1', 'Ivana Ganeriwal', 9, NULL, 'beginner'::student_level, 'the-club'::entity_type, 'active'::student_status, '2025-08-31'::date, 'Ganeriwal Family', '+91 9821696296', NULL, 'Member'),
('98376d5d-f8f6-442a-a910-0ad439db08c1', 'Ivanka Chouhan', 16, NULL, 'beginner'::student_level, 'the-club'::entity_type, 'active'::student_status, '2026-06-30'::date, 'Chouhan Family', '+91 9854638887', NULL, 'Member'),
('d131bd6a-7005-4697-a991-67e11df3c451', 'Kabir Ludhani', 11, NULL, 'beginner'::student_level, 'the-club'::entity_type, 'active'::student_status, '2024-05-30'::date, 'Ludhani Family', '+91 9865036102', NULL, 'Guest'),
('5b5e01b1-28f5-48c4-a65c-724dc8150eda', 'Kaira Vajifdar', 6, NULL, 'beginner'::student_level, 'the-club'::entity_type, 'active'::student_status, '2026-02-28'::date, 'Vajifdar Family', '+91 9825836575', NULL, 'Member'),
('d69ffa9a-cba8-4e34-a592-8435d9cb6357', 'Kaisha Mehta', 13, NULL, 'beginner'::student_level, 'the-club'::entity_type, 'active'::student_status, '2024-07-22'::date, 'Mehta Family', '+91 9843069630', NULL, 'Member'),
('87245bbe-a468-4a1e-add8-8e292b8845cf', 'Kavir Chopra', 8, NULL, 'beginner'::student_level, 'the-club'::entity_type, 'active'::student_status, '2026-07-04'::date, 'Chopra Family', '+91 9823562206', NULL, 'Member'),
('51e301ca-b634-429d-abd5-3fdf1a1cd6ea', 'Kianna Jain', 15, NULL, 'beginner'::student_level, 'the-club'::entity_type, 'active'::student_status, '2025-03-26'::date, 'Jain Family', '+91 9818038756', NULL, 'Member'),
('f3197285-6cde-4e6a-abd1-be8ad021d2c6', 'Kiara Shah', 10, NULL, 'beginner'::student_level, 'the-club'::entity_type, 'active'::student_status, '2026-01-15'::date, 'Shah Family', '+91 9875340316', NULL, 'Member'),
('cdfbbd0d-1e36-40ae-a327-6847a847fd1b', 'Kimaya Katyal', 17, NULL, 'beginner'::student_level, 'the-club'::entity_type, 'active'::student_status, '2026-01-04'::date, 'Katyal Family', '+91 9885067323', NULL, 'Member'),
('1d498b52-ad27-43a6-a0a3-eb1e8870dd9f', 'Krisha Desai', 12, NULL, 'beginner'::student_level, 'the-club'::entity_type, 'active'::student_status, '2025-02-09'::date, 'Desai Family', '+91 9870052350', NULL, 'Member'),
('3426b026-756c-4585-ade9-04343861aa60', 'Kyra Golcha', 7, NULL, 'beginner'::student_level, 'the-club'::entity_type, 'active'::student_status, '2024-06-26'::date, 'Golcha Family', '+91 9835593228', NULL, 'Guest'),
('7755fae3-5199-493d-a9ad-264bea982ae8', 'Maahi Pabari', 14, NULL, 'beginner'::student_level, 'the-club'::entity_type, 'active'::student_status, '2025-05-12'::date, 'Pabari Family', '+91 9827578104', NULL, 'Member'),
('59a7c4cc-eca6-4adc-ad45-5a70f30cd9b5', 'Meera Vivek', 9, NULL, 'beginner'::student_level, 'the-club'::entity_type, 'active'::student_status, '2025-06-18'::date, 'Vivek Family', '+91 9896397981', NULL, 'Member'),
('2f184785-51f7-4fb5-ad05-a0d53742e83d', 'Naavya Desai', 16, NULL, 'beginner'::student_level, 'the-club'::entity_type, 'active'::student_status, '2025-06-06'::date, 'Desai Family', '+91 9825637437', NULL, 'Member'),
('bfb04fa6-a3f7-4e4d-a6c4-09f0ba81443e', 'Nihira Desai', 11, NULL, 'beginner'::student_level, 'the-club'::entity_type, 'active'::student_status, '2025-12-10'::date, 'Desai Family', '+91 9866472862', NULL, 'Member'),
('4cb22407-0462-428a-ae52-851bd4cd76e2', 'Parth Mehta', 6, NULL, 'beginner'::student_level, 'the-club'::entity_type, 'active'::student_status, '2025-10-12'::date, 'Mehta Family', '+91 9810063204', NULL, 'Member'),
('0608b0f2-9475-4ead-a1ba-74f129da115c', 'Prabhit Kanakia', 13, NULL, 'beginner'::student_level, 'the-club'::entity_type, 'active'::student_status, '2025-09-07'::date, 'Kanakia Family', '+91 9889556300', NULL, 'Member'),
('03fad9dd-d51f-47c3-ae22-27be61e82a15', 'Prashi Iyer', 8, NULL, 'beginner'::student_level, 'the-club'::entity_type, 'active'::student_status, '2025-12-12'::date, 'Iyer Family', '+91 9812634789', NULL, 'Guest'),
('045bd30f-2c33-4ed2-addc-aabd8fa39be1', 'Rada Saran Koshcheeva', 15, NULL, 'beginner'::student_level, 'the-club'::entity_type, 'active'::student_status, '2025-06-07'::date, 'Koshcheeva Family', '+91 9835139968', NULL, 'Member'),
('91b19e7b-edd4-4f60-a4a4-5cf9b7aa9a67', 'Rehaan Merchant', 10, NULL, 'beginner'::student_level, 'the-club'::entity_type, 'active'::student_status, '2024-09-26'::date, 'Merchant Family', '+91 9890801554', NULL, 'Member'),
('de374c76-bb4e-4dbc-a8eb-e04ddc92656a', 'Riddhima Shah', 17, NULL, 'beginner'::student_level, 'the-club'::entity_type, 'active'::student_status, '2026-04-04'::date, 'Shah Family', '+91 9887438238', NULL, 'Member'),
('98a57d62-7fbc-4083-a771-6598588d942f', 'Sasha Saini', 12, NULL, 'beginner'::student_level, 'the-club'::entity_type, 'active'::student_status, '2026-02-16'::date, 'Saini Family', '+91 9815651615', NULL, 'Member'),
('c0c38a46-c681-428d-a101-0da68b3664d3', 'Shauraya Sekhani', 7, NULL, 'beginner'::student_level, 'the-club'::entity_type, 'active'::student_status, '2025-04-19'::date, 'Sekhani Family', '+91 9838621040', NULL, 'Member'),
('1cc90355-217f-4508-aefe-f24288419044', 'Shaurya Kothari', 14, NULL, 'beginner'::student_level, 'the-club'::entity_type, 'active'::student_status, '2026-07-06'::date, 'Kothari Family', '+91 9844665427', NULL, 'Member'),
('338fb59c-6113-4647-ac33-89586c2392f9', 'Shivaay Ruia', 9, NULL, 'beginner'::student_level, 'the-club'::entity_type, 'active'::student_status, '2025-08-13'::date, 'Ruia Family', '+91 9891917530', NULL, 'Guest'),
('fecf5068-a85a-42f5-af59-25340fb528d0', 'Shivan Chauhan', 16, NULL, 'beginner'::student_level, 'the-club'::entity_type, 'active'::student_status, '2025-06-15'::date, 'Chauhan Family', '+91 9849772036', NULL, 'Member'),
('c2e41c65-bde4-4554-a56f-53178e7126b3', 'Shivya Poddar', 11, NULL, 'beginner'::student_level, 'the-club'::entity_type, 'active'::student_status, '2026-04-30'::date, 'Poddar Family', '+91 9819851387', NULL, 'Member'),
('ecf7ac26-eda7-4f1a-ab4b-3abe6aff3d3d', 'Siddhanth Dsouza', 6, NULL, 'beginner'::student_level, 'the-club'::entity_type, 'active'::student_status, '2025-12-14'::date, 'Dsouza Family', '+91 9822095322', NULL, 'Member'),
('6c4b9dbe-8ce5-4933-a1a3-d1653b8b85b2', 'Siddharth Dsouza', 13, NULL, 'beginner'::student_level, 'the-club'::entity_type, 'active'::student_status, '2024-10-02'::date, 'Dsouza Family', '+91 9888213340', NULL, 'Member'),
('9001e041-4381-4844-aafd-2f85cdf9c4e0', 'Sohana Chandanani', 8, NULL, 'beginner'::student_level, 'the-club'::entity_type, 'active'::student_status, '2026-06-30'::date, 'Chandanani Family', '+91 9842616642', NULL, 'Member'),
('9007d16e-eb84-4f25-a881-062ac37b4253', 'Tanuj Gupte', 15, NULL, 'beginner'::student_level, 'the-club'::entity_type, 'active'::student_status, '2025-07-03'::date, 'Gupte Family', '+91 9890702951', NULL, 'Guest'),
('1f2f3235-c3f7-4d48-a295-e59c06903cc5', 'Thiyaan Manik', 10, NULL, 'beginner'::student_level, 'the-club'::entity_type, 'active'::student_status, '2024-10-16'::date, 'Manik Family', '+91 9859889272', NULL, 'Member'),
('9fb338e1-79b2-4200-a4b2-b1cff414f583', 'Vansh Katari', 17, NULL, 'beginner'::student_level, 'the-club'::entity_type, 'active'::student_status, '2026-03-07'::date, 'Katari Family', '+91 9870828562', NULL, 'Guest'),
('3e7bc5a3-9ee8-4410-a725-ac0dcb30b6f1', 'Viana Shah', 12, NULL, 'beginner'::student_level, 'the-club'::entity_type, 'active'::student_status, '2025-03-07'::date, 'Shah Family', '+91 9888822215', NULL, 'Member'),
('e74c612e-908b-4a28-a7ac-dfc87c0b12fb', 'Vihaan Vasant', 7, NULL, 'beginner'::student_level, 'the-club'::entity_type, 'active'::student_status, '2026-02-27'::date, 'Vasant Family', '+91 9887117647', NULL, 'Member'),
('7d3301fe-da77-4f82-a5ad-66332ba2ac95', 'Vivaan Mehra', 14, NULL, 'beginner'::student_level, 'the-club'::entity_type, 'active'::student_status, '2026-01-09'::date, 'Mehra Family', '+91 9861821066', NULL, 'Member'),
('b19df532-ab8b-4341-a78f-16bf4c77988e', 'Vivaan Oza', 9, NULL, 'beginner'::student_level, 'the-club'::entity_type, 'active'::student_status, '2026-02-08'::date, 'Oza Family', '+91 9894187382', NULL, 'Member'),
('8a8c1b47-07bf-4b2c-a583-b8220367d1d1', 'Vrahad Arora', 16, NULL, 'beginner'::student_level, 'the-club'::entity_type, 'active'::student_status, '2025-11-24'::date, 'Arora Family', '+91 9851716384', NULL, 'Member'),
('6aa37c16-3531-41f6-ad3f-d8ce5cc8f9cf', 'Yuvaan Bajaj', 11, NULL, 'beginner'::student_level, 'the-club'::entity_type, 'active'::student_status, '2025-11-02'::date, 'Bajaj Family', '+91 9891932517', NULL, 'Guest'),
('281f9909-db60-4a75-a1bd-b1c8e518e215', 'Zahaan Sachdeva', 6, NULL, 'beginner'::student_level, 'the-club'::entity_type, 'active'::student_status, '2026-02-03'::date, 'Sachdeva Family', '+91 9835474614', NULL, 'Member'),
('c9259488-6d2d-4726-ab76-2a5c16786005', 'Zain Guzman', 13, NULL, 'beginner'::student_level, 'the-club'::entity_type, 'active'::student_status, '2024-12-25'::date, 'Guzman Family', '+91 9894419900', NULL, 'Member'),
('33a5578b-d57b-4431-acff-b8f0c33420bf', 'Zayn Winston', 8, NULL, 'beginner'::student_level, 'the-club'::entity_type, 'active'::student_status, '2024-08-11'::date, 'Winston Family', '+91 9836385835', NULL, 'Member'),
('98641bb3-544a-4261-a207-bd2b3a409a07', 'Ziana Vora', 15, NULL, 'beginner'::student_level, 'the-club'::entity_type, 'active'::student_status, '2025-03-08'::date, 'Vora Family', '+91 9862104655', NULL, 'Member');

INSERT INTO student_parents (student_id, parent_id) VALUES
('5193d5cb-3142-44f0-a74e-329f3b8c839a', 'fa007b68-a7c6-4cf8-a7ac-115710661a58'),
('c9093c98-f96e-47f7-af0e-f7abff60bc8c', '962bc851-45ff-4843-a13a-92ccaed8d75d'),
('ec6ef04b-edc5-44c3-a70b-e857a83ee880', '6f635cb8-7da9-4bdb-ad49-2263b0a0d134'),
('a6c7fc98-e91c-4b24-a37c-eb83d951fc19', 'a3ad3250-c3be-451b-aef3-24fb4b70ba85'),
('9720fe32-7924-4cbe-a58a-de451cab1e09', '0da149bc-81ab-4dc1-afec-51643ee7580c'),
('1e725840-1b60-454c-a76b-cb1c911e0acb', '628ddfd5-24e0-4959-ab09-ef81eac5730f'),
('ff750bbe-a244-4eb7-a0e5-1d7978f8e2f5', 'a30e056b-f68c-4e46-ae90-782eb65a0225'),
('fcd61cfa-c3c0-44c5-afb8-86f7ec31a84a', '71a78c44-cfdc-4f2f-aec2-f0ff8f47922e'),
('34ab8595-f6cc-4335-af1a-02f5d8149098', 'b7ac639b-e549-4c3e-afdc-9c505e983fd9'),
('576b7944-1c8e-4aea-a21a-f5fb8c6bfe1f', '2b366124-bbbc-4162-a9f4-db51f9b95972'),
('412aaf7f-0409-4eeb-a183-f4bb9eadd936', 'ff0b05e0-6916-4523-a010-6dcb426b1751'),
('18acab55-2ba0-40be-a731-7ed22ada36b1', 'feb970a2-469b-455f-af9e-7ae0522ac615'),
('5a0f0f21-3bca-40fb-a611-fba6d843d404', '1c4ff32d-0ac9-400d-a35a-c6abcf00952b'),
('dbdb35ea-3201-4bec-a048-b1417c218c98', 'be5f6103-e655-4764-ac4e-94329823b972'),
('1ea9a06f-8ace-4580-a0f3-6aee162a8e40', 'a3f5e14a-d962-45ee-a229-bda0fd6acbb9'),
('8ea8c39a-798e-49fc-a40b-c8bc379bbdc9', '2d27f348-40b4-49e5-a2e1-102ef4d27ca3'),
('035b5ebe-d0a3-4183-acf6-a1dabb3cd9b9', 'a42ca2b0-3dde-4c56-a2fc-e5000e7f010a'),
('a37cbb0e-9c9a-40d2-a977-2f8e7d09c717', 'c36fc466-9ef2-4f94-ab16-620dc6f6ed51'),
('d619fc64-7032-4ea1-a6bf-24301ff1f328', '6d64b437-d7f9-4634-ac72-ec31cddd2ee4'),
('1b517753-a570-45f6-ac8c-c96cf1dcad59', 'b379cbcd-5a4a-4950-a51e-a6acd9acd66c'),
('d44bee9b-f985-4cf1-a8b7-c813df7b01e5', '84881a17-da68-4918-a24e-86ade6d5ede3'),
('247c0ceb-fd98-4da4-a9f4-c1526b5879f9', '247e49cb-cfa1-47b3-af90-5104e73b3a70'),
('c5388f69-64a8-4ef3-a3a4-70c2099e028b', 'd09b3fd4-d902-47f6-a2dc-59a86394b180'),
('1f741029-c147-42e8-a0d7-8a5eb380a6e1', '3e8b5654-0dca-4280-a30a-3464a4141db0'),
('2881abf7-330d-444d-a5f1-8bfc8fe509b5', '07b6737e-a6ef-41fc-a314-35ae28f15d02'),
('3b676538-ab4a-4271-aaee-164bb70736d8', '09284fd4-64b6-4dc5-ad91-37365d2baadc'),
('620ab48f-0259-4be2-a503-d5c6ee60085e', 'ef399f53-202a-4b6a-aeb0-e40d8f3909ef'),
('1eb10c8d-6772-4d20-a624-90c3a8119f05', 'c41b756e-72db-4ca7-aa71-81562da1a55f'),
('ad62edd5-19b0-4532-ad2a-4d5eab439738', 'bf9a05c7-3fa9-46b4-ae28-7d998d9d05c1'),
('e78facd1-00d4-41a5-a6aa-bb97bca5265a', 'c288a1d3-99f1-4ade-a03c-6a2698ea0472'),
('6b65cd8a-1b2d-41ce-a6c9-67958f176064', '2db752c4-edb8-4dcc-a00e-1fc3d0acf5cb'),
('9c088efb-8ac4-4797-a8ba-91f95aa10858', '82c73bb6-2378-4dfe-a1fe-f7b7dfaaffeb'),
('20a15a20-355b-4c5d-a158-4e69f924494f', 'ee74e129-7a4f-4081-a106-bce42932a9ed'),
('17d31d4b-e883-40fe-aa86-24d8fd566b0c', '4473217f-4639-4811-a321-5f4e7bd76608'),
('fa79a99b-f590-4464-adaf-26d4374e7e23', '69491667-9787-4297-ad42-241f35b35e41'),
('96097083-f85f-400c-a805-b408840ccb39', '4afb1190-8146-4f91-a901-02caf2af9685'),
('ebc74af4-c853-44c5-a800-eac6377704e7', '47b9a2d7-601f-44e1-a74e-6226b23f5dea'),
('6ed0152b-a710-45b0-af39-242133b17981', '02b1aa96-8717-42ba-a8a0-79c570973f97'),
('06997d89-17f9-49a7-a93c-7bca974336d5', 'b188b72a-4a83-4d1d-aaea-3ea65493e26c'),
('e2778cfd-0411-4a94-a15f-44bdbf7308bc', '4ffb560f-7725-4149-ab0a-4db05bdc8308'),
('c14d8512-95af-46d4-a6e2-952b72d05b1d', 'ba7927c7-f571-416a-a7c1-af5fb5e2b6a3'),
('64c4cb01-477f-449d-abb2-5a886233b532', 'd0c14d16-2952-492c-ab67-b715bb027ddb'),
('a5e41761-312a-4f92-abff-eaf285781df5', '87078780-df80-4391-afb6-2154c5784cdb'),
('0184e692-d6ed-4941-a2d9-cde940c0c809', '5bbbc587-70c5-4572-a7c5-f45738c2495b'),
('0b8323af-b465-4e2b-af70-792b5b1820f0', 'dab7fb3a-143c-499b-ac07-8fd8b4b7d36d'),
('697b5d61-3532-49dd-a152-32a90e55d1a1', 'dc2cbab3-6d9c-4aac-a2de-395409495984'),
('98376d5d-f8f6-442a-a910-0ad439db08c1', 'f8963bc3-7212-44f9-a2e7-3ba1caea8c24'),
('d131bd6a-7005-4697-a991-67e11df3c451', '8a6c5af9-2562-4804-a506-fd94d26a5949'),
('5b5e01b1-28f5-48c4-a65c-724dc8150eda', '727d6464-1833-447f-a6d3-b88af2473db0'),
('d69ffa9a-cba8-4e34-a592-8435d9cb6357', 'b21c89bd-c115-4d1f-a26b-7c9da2dac5f8'),
('87245bbe-a468-4a1e-add8-8e292b8845cf', 'c6fc446d-ebb8-451b-a958-9520db622c7e'),
('51e301ca-b634-429d-abd5-3fdf1a1cd6ea', '8a1b68a2-0160-4459-ab48-9eec541f4627'),
('f3197285-6cde-4e6a-abd1-be8ad021d2c6', '26d7c200-ca2c-45a8-a5dd-352d276d66e7'),
('cdfbbd0d-1e36-40ae-a327-6847a847fd1b', '9f1c3678-6d47-46f6-aa69-271d72da96c5'),
('1d498b52-ad27-43a6-a0a3-eb1e8870dd9f', 'd04d66bc-6a24-410d-ad50-2521a1fe30ed'),
('3426b026-756c-4585-ade9-04343861aa60', 'e55736e1-478b-46da-a153-47fe043d5d18'),
('7755fae3-5199-493d-a9ad-264bea982ae8', '09ee2f3a-8b14-431f-aafe-a9a832789c22'),
('59a7c4cc-eca6-4adc-ad45-5a70f30cd9b5', '23319189-92d0-42e6-a68c-8d761aea6303'),
('2f184785-51f7-4fb5-ad05-a0d53742e83d', 'b1823e82-6869-441c-ac27-4f3f163f294d'),
('bfb04fa6-a3f7-4e4d-a6c4-09f0ba81443e', '046ecf7b-61c3-4a65-a310-9102f7ce1ff9'),
('4cb22407-0462-428a-ae52-851bd4cd76e2', '87735847-b0f3-45d7-a310-e80e637cb008'),
('0608b0f2-9475-4ead-a1ba-74f129da115c', '8503f9c2-5952-4303-a84a-4c5654221371'),
('03fad9dd-d51f-47c3-ae22-27be61e82a15', 'caf2f350-1768-4991-a69d-696fe5544c03'),
('045bd30f-2c33-4ed2-addc-aabd8fa39be1', '9f26f847-6529-4aee-af29-dfd61de3571c'),
('91b19e7b-edd4-4f60-a4a4-5cf9b7aa9a67', 'e1e8595c-fee4-42ad-a30f-492ceca25889'),
('de374c76-bb4e-4dbc-a8eb-e04ddc92656a', 'f5d84c93-727e-4183-a77a-10ca025e4b3d'),
('98a57d62-7fbc-4083-a771-6598588d942f', '727f59bd-ad42-4e97-acc8-1c8eeb572247'),
('c0c38a46-c681-428d-a101-0da68b3664d3', '9cd4fb16-1164-4a9c-a470-8a96bf09b560'),
('1cc90355-217f-4508-aefe-f24288419044', '0c6a9bd3-baf5-4114-a242-9bb091c7e7bf'),
('338fb59c-6113-4647-ac33-89586c2392f9', 'baa59cac-a77b-4255-adc1-abb7c076c973'),
('fecf5068-a85a-42f5-af59-25340fb528d0', 'dd6f6b9f-8ea1-4363-a791-2b5397a3b761'),
('c2e41c65-bde4-4554-a56f-53178e7126b3', '0f242bea-2bd3-4746-a186-4900ed355c2a'),
('ecf7ac26-eda7-4f1a-ab4b-3abe6aff3d3d', '18ff716e-2436-4dd5-a3ff-20dc840b4182'),
('6c4b9dbe-8ce5-4933-a1a3-d1653b8b85b2', '49873ce1-3943-462a-a850-7f78da8b8cfa'),
('9001e041-4381-4844-aafd-2f85cdf9c4e0', '18686e4c-455e-4f4e-a236-dda8621b8e5a'),
('9007d16e-eb84-4f25-a881-062ac37b4253', '932c10d4-513a-4e6f-a973-8cedb4602cb3'),
('1f2f3235-c3f7-4d48-a295-e59c06903cc5', '133783a3-e6d5-4e91-aac8-e87faad7473a'),
('9fb338e1-79b2-4200-a4b2-b1cff414f583', '2102907f-d31b-43bd-a5bc-f1730c2cce41'),
('3e7bc5a3-9ee8-4410-a725-ac0dcb30b6f1', '0870879b-f6d3-4ced-a2cd-a1867c84f062'),
('e74c612e-908b-4a28-a7ac-dfc87c0b12fb', '7888f64d-00cb-4b4e-a3d7-a2f5cf664efa'),
('7d3301fe-da77-4f82-a5ad-66332ba2ac95', 'bb6ffabb-b5b7-40f2-a1c4-3eddf8baa291'),
('b19df532-ab8b-4341-a78f-16bf4c77988e', '9e483bed-3980-426c-a02b-eebcb14e3d2f'),
('8a8c1b47-07bf-4b2c-a583-b8220367d1d1', 'ee0f6b3f-d43c-4d74-a9c9-1322e364c9ee'),
('6aa37c16-3531-41f6-ad3f-d8ce5cc8f9cf', 'c54ce603-f315-4766-a141-c3c7dd2f246e'),
('281f9909-db60-4a75-a1bd-b1c8e518e215', '2f9aa9fd-9657-4f56-a0ee-7ef09e42f296'),
('c9259488-6d2d-4726-ab76-2a5c16786005', '277737ad-a9a2-4e87-ac7e-4b06c0499374'),
('33a5578b-d57b-4431-acff-b8f0c33420bf', '6e8c01be-3a57-4bc3-a2dd-5f964027c619'),
('98641bb3-544a-4261-a207-bd2b3a409a07', '91d463d3-6997-4c0a-a291-ff5418c208cd');

-- ----------------------------------------------------------------------------
-- ENROLLMENTS
-- ----------------------------------------------------------------------------
INSERT INTO enrollments (id, student_id, batch_id, status, created_at, end_date) VALUES
('d6cccdd2-33c6-4e76-a4b6-c9f99b1043a1', 'd69ffa9a-cba8-4e34-a592-8435d9cb6357', '9381e9fb-ebdd-4919-a3f5-3b86bc231da1', 'active', '2026-06-01'::timestamptz, NULL::date),
('02e439be-9918-46e6-a4eb-656f39c43ab3', '2881abf7-330d-444d-a5f1-8bfc8fe509b5', '9381e9fb-ebdd-4919-a3f5-3b86bc231da1', 'active', '2026-06-01'::timestamptz, NULL::date),
('660d66e4-bea4-4094-a750-083339f6834c', '6c4b9dbe-8ce5-4933-a1a3-d1653b8b85b2', '9381e9fb-ebdd-4919-a3f5-3b86bc231da1', 'active', '2026-06-01'::timestamptz, NULL::date),
('5fe9bfec-1e7d-440b-a39d-b53581efdf8e', '0184e692-d6ed-4941-a2d9-cde940c0c809', '9381e9fb-ebdd-4919-a3f5-3b86bc231da1', 'active', '2026-06-01'::timestamptz, NULL::date),
('7beea440-3c61-46b6-abf6-3f7b7f1bac4b', 'fcd61cfa-c3c0-44c5-afb8-86f7ec31a84a', '413f8ac4-4aa1-4980-aeed-5f770afbfcfb', 'active', '2026-06-01'::timestamptz, NULL::date),
('bcb1b6f6-2bf3-4a91-af8a-009f07c2c29d', '5193d5cb-3142-44f0-a74e-329f3b8c839a', '413f8ac4-4aa1-4980-aeed-5f770afbfcfb', 'active', '2026-06-01'::timestamptz, NULL::date),
('c702e255-7f64-47ab-a4e2-32438f3d579c', '1f2f3235-c3f7-4d48-a295-e59c06903cc5', '413f8ac4-4aa1-4980-aeed-5f770afbfcfb', 'active', '2026-06-01'::timestamptz, NULL::date),
('d3127fa4-aca3-4685-a5e2-ec1869af0f5a', 'e78facd1-00d4-41a5-a6aa-bb97bca5265a', '413f8ac4-4aa1-4980-aeed-5f770afbfcfb', 'active', '2026-06-01'::timestamptz, NULL::date),
('2bcfd1ef-ce22-4c43-ae84-a42555aaf96e', '576b7944-1c8e-4aea-a21a-f5fb8c6bfe1f', 'df07ef36-8b1f-495e-ade5-3bc13d3591c2', 'active', '2026-06-01'::timestamptz, NULL::date),
('a63cea91-2a60-4b06-acf0-e23e3fabbb87', '6aa37c16-3531-41f6-ad3f-d8ce5cc8f9cf', 'df07ef36-8b1f-495e-ade5-3bc13d3591c2', 'active', '2026-06-01'::timestamptz, NULL::date),
('b2d6525a-0fcb-4fa7-ae1c-794616e724b9', 'd131bd6a-7005-4697-a991-67e11df3c451', 'e666edab-ac22-4c83-a442-3b611f5c6704', 'active', '2026-06-01'::timestamptz, NULL::date),
('32bddd02-319f-4252-acf6-ffd8dff859fd', '06997d89-17f9-49a7-a93c-7bca974336d5', 'e666edab-ac22-4c83-a442-3b611f5c6704', 'active', '2026-06-01'::timestamptz, NULL::date),
('a9456078-b1ce-47e9-a756-9fab82dbc148', '7d3301fe-da77-4f82-a5ad-66332ba2ac95', 'e666edab-ac22-4c83-a442-3b611f5c6704', 'active', '2026-06-01'::timestamptz, NULL::date),
('1c853445-5ec3-4137-a42c-b446be95fae7', 'c14d8512-95af-46d4-a6e2-952b72d05b1d', 'e666edab-ac22-4c83-a442-3b611f5c6704', 'active', '2026-06-01'::timestamptz, NULL::date),
('1b194542-f1a5-462c-a213-0933d5867526', '1eb10c8d-6772-4d20-a624-90c3a8119f05', 'f229aec5-daa1-415e-ad8e-2c70dd273ba8', 'active', '2026-06-01'::timestamptz, NULL::date),
('a6e8a79f-9a22-458d-a07c-35be714ea08a', 'ec6ef04b-edc5-44c3-a70b-e857a83ee880', 'f229aec5-daa1-415e-ad8e-2c70dd273ba8', 'active', '2026-06-01'::timestamptz, NULL::date),
('33c94c8b-b2ea-40a1-a7f1-b54c57d7bc47', 'c9093c98-f96e-47f7-af0e-f7abff60bc8c', '657313bf-a9e0-4699-acb9-a373772b6f83', 'active', '2026-06-01'::timestamptz, NULL::date),
('e6e0ac49-b5fe-4a79-a40c-ab885b99602f', '8ea8c39a-798e-49fc-a40b-c8bc379bbdc9', '657313bf-a9e0-4699-acb9-a373772b6f83', 'active', '2026-06-01'::timestamptz, NULL::date),
('d27bda11-898e-4198-a6ea-0964aed5756b', '34ab8595-f6cc-4335-af1a-02f5d8149098', '657313bf-a9e0-4699-acb9-a373772b6f83', 'active', '2026-06-01'::timestamptz, NULL::date),
('f34d8796-15c7-4344-ae0a-f76276094317', '59a7c4cc-eca6-4adc-ad45-5a70f30cd9b5', '657313bf-a9e0-4699-acb9-a373772b6f83', 'active', '2026-06-01'::timestamptz, NULL::date),
('c8a30665-bb55-4e23-a2b1-6ead918a0d19', '1d498b52-ad27-43a6-a0a3-eb1e8870dd9f', '657313bf-a9e0-4699-acb9-a373772b6f83', 'active', '2026-06-01'::timestamptz, NULL::date),
('53933fc9-2401-43d5-aaf8-31edb23efb07', 'ff750bbe-a244-4eb7-a0e5-1d7978f8e2f5', '657313bf-a9e0-4699-acb9-a373772b6f83', 'active', '2026-06-01'::timestamptz, NULL::date),
('da28391b-d255-48a1-a0dc-c69348bedffa', '9c088efb-8ac4-4797-a8ba-91f95aa10858', '657313bf-a9e0-4699-acb9-a373772b6f83', 'active', '2026-06-01'::timestamptz, NULL::date),
('137188a5-08d0-4221-ab43-10e5c5ffee33', '98376d5d-f8f6-442a-a910-0ad439db08c1', '657313bf-a9e0-4699-acb9-a373772b6f83', 'active', '2026-06-01'::timestamptz, NULL::date),
('0389ba49-dba7-4c45-a4e0-2e6ee2558506', '9720fe32-7924-4cbe-a58a-de451cab1e09', '657313bf-a9e0-4699-acb9-a373772b6f83', 'active', '2026-06-01'::timestamptz, NULL::date),
('4635bc00-768a-48d8-a51b-6fe8fdec1c02', '1cc90355-217f-4508-aefe-f24288419044', '4ad6e6a4-5546-429b-a85e-5f10bba5c751', 'active', '2026-06-01'::timestamptz, NULL::date),
('b685d57d-7f16-4108-af76-c2459edd90af', 'a6c7fc98-e91c-4b24-a37c-eb83d951fc19', '4ad6e6a4-5546-429b-a85e-5f10bba5c751', 'active', '2026-06-01'::timestamptz, NULL::date),
('2a5a0398-3478-4ff3-aed7-6b58b03fe7ce', 'fa79a99b-f590-4464-adaf-26d4374e7e23', '4ad6e6a4-5546-429b-a85e-5f10bba5c751', 'active', '2026-06-01'::timestamptz, NULL::date),
('acf33a79-bb27-4217-a67c-e9d2c592a020', '035b5ebe-d0a3-4183-acf6-a1dabb3cd9b9', '4ad6e6a4-5546-429b-a85e-5f10bba5c751', 'active', '2026-06-01'::timestamptz, NULL::date),
('71ff5b89-1842-4133-aa51-45b9cc2936c1', '96097083-f85f-400c-a805-b408840ccb39', '4ad6e6a4-5546-429b-a85e-5f10bba5c751', 'active', '2026-06-01'::timestamptz, NULL::date),
('c261d217-202b-416a-a7bb-05bbf04d6acf', 'a37cbb0e-9c9a-40d2-a977-2f8e7d09c717', '4ad6e6a4-5546-429b-a85e-5f10bba5c751', 'active', '2026-06-01'::timestamptz, NULL::date),
('5237b363-3e7e-463c-ac2d-c28d9eefb337', '17d31d4b-e883-40fe-aa86-24d8fd566b0c', '4ad6e6a4-5546-429b-a85e-5f10bba5c751', 'active', '2026-06-01'::timestamptz, NULL::date),
('1319dfc1-bc1b-4de4-a9c6-71095a145b55', '247c0ceb-fd98-4da4-a9f4-c1526b5879f9', '4ad6e6a4-5546-429b-a85e-5f10bba5c751', 'active', '2026-06-01'::timestamptz, NULL::date),
('ed57b2bb-be18-455d-a602-7980c858f10c', 'a5e41761-312a-4f92-abff-eaf285781df5', '4ad6e6a4-5546-429b-a85e-5f10bba5c751', 'active', '2026-06-01'::timestamptz, NULL::date),
('724a4a21-857d-47ef-a352-575d17e71614', '20a15a20-355b-4c5d-a158-4e69f924494f', '4ad6e6a4-5546-429b-a85e-5f10bba5c751', 'active', '2026-06-01'::timestamptz, NULL::date),
('6b466e50-42b2-4be2-ac7f-261e830d4585', '5a0f0f21-3bca-40fb-a611-fba6d843d404', '4ad6e6a4-5546-429b-a85e-5f10bba5c751', 'active', '2026-06-01'::timestamptz, NULL::date),
('08514fed-24b8-4eb1-af65-aeaff5582a85', 'f3197285-6cde-4e6a-abd1-be8ad021d2c6', '4ad6e6a4-5546-429b-a85e-5f10bba5c751', 'active', '2026-06-01'::timestamptz, NULL::date),
('37d556b2-e012-452a-a983-9eb4a0209b4e', 'c9259488-6d2d-4726-ab76-2a5c16786005', '128446b0-6245-47af-a525-e095b3aad567', 'active', '2026-06-01'::timestamptz, NULL::date),
('49a34a5d-29a1-4e3a-ab53-7f273c3a7bd7', '6ed0152b-a710-45b0-af39-242133b17981', '128446b0-6245-47af-a525-e095b3aad567', 'active', '2026-06-01'::timestamptz, NULL::date),
('56089932-24fc-4870-abea-c75a84e246d7', '0184e692-d6ed-4941-a2d9-cde940c0c809', 'b9efc568-1ce0-4c42-af2f-f8d3427cda18', 'active', '2026-06-01'::timestamptz, NULL::date),
('088fcc43-a9ae-48b2-aa59-a2cef1c14d73', '1eb10c8d-6772-4d20-a624-90c3a8119f05', 'b9efc568-1ce0-4c42-af2f-f8d3427cda18', 'active', '2026-06-01'::timestamptz, NULL::date),
('fe52c2a9-8cbf-43dd-aecf-df1541ef0737', 'c14d8512-95af-46d4-a6e2-952b72d05b1d', 'b9efc568-1ce0-4c42-af2f-f8d3427cda18', 'active', '2026-06-01'::timestamptz, NULL::date),
('eaabc2ed-ed1c-48db-adfd-19f851f58229', '281f9909-db60-4a75-a1bd-b1c8e518e215', 'b9efc568-1ce0-4c42-af2f-f8d3427cda18', 'active', '2026-06-01'::timestamptz, NULL::date),
('67150d50-dbb7-44ba-a025-fb014b429ddf', 'de374c76-bb4e-4dbc-a8eb-e04ddc92656a', 'b9efc568-1ce0-4c42-af2f-f8d3427cda18', 'active', '2026-06-01'::timestamptz, NULL::date),
('d11c608b-69bd-4697-a7f6-5f585e05b4cd', '06997d89-17f9-49a7-a93c-7bca974336d5', 'b9efc568-1ce0-4c42-af2f-f8d3427cda18', 'active', '2026-06-01'::timestamptz, NULL::date),
('caf894db-7a97-452b-a80c-7948379e0d0f', 'ecf7ac26-eda7-4f1a-ab4b-3abe6aff3d3d', 'b26db574-2453-4389-ac40-513477e48145', 'active', '2026-06-01'::timestamptz, NULL::date),
('dda408b5-f117-4241-a299-bca1f5f17bb3', 'fcd61cfa-c3c0-44c5-afb8-86f7ec31a84a', 'b26db574-2453-4389-ac40-513477e48145', 'active', '2026-06-01'::timestamptz, NULL::date),
('1400f58d-16e6-4420-aa24-0505eb6a177c', '5193d5cb-3142-44f0-a74e-329f3b8c839a', 'b26db574-2453-4389-ac40-513477e48145', 'active', '2026-06-01'::timestamptz, NULL::date),
('202a5af7-d674-49ee-abf3-176f2efe622e', 'd69ffa9a-cba8-4e34-a592-8435d9cb6357', 'b26db574-2453-4389-ac40-513477e48145', 'active', '2026-06-01'::timestamptz, NULL::date),
('c5edb9ce-1876-4b53-aafe-8ba4931826e8', '2881abf7-330d-444d-a5f1-8bfc8fe509b5', 'b26db574-2453-4389-ac40-513477e48145', 'active', '2026-06-01'::timestamptz, NULL::date),
('b5c29602-2ab8-4655-a81a-2732316f1bf0', 'cdfbbd0d-1e36-40ae-a327-6847a847fd1b', 'b26db574-2453-4389-ac40-513477e48145', 'active', '2026-06-01'::timestamptz, NULL::date),
('584e2cd8-e449-4a43-abe0-70c9d41f1b35', '1e725840-1b60-454c-a76b-cb1c911e0acb', 'a31d6772-c360-4687-a529-df3093554f1c', 'active', '2026-06-01'::timestamptz, NULL::date),
('268602fa-13c6-4c88-a6a2-4e9b42d0a49b', 'd619fc64-7032-4ea1-a6bf-24301ff1f328', '84184cd0-8ae8-4004-a6d2-5dc72bdd6220', 'active', '2026-06-01'::timestamptz, NULL::date),
('1a622466-bf89-4f02-a457-a15c4b7cc53e', 'ad62edd5-19b0-4532-ad2a-4d5eab439738', '84184cd0-8ae8-4004-a6d2-5dc72bdd6220', 'active', '2026-06-01'::timestamptz, NULL::date),
('4206ce7a-b18f-429f-a8d8-3847b1857b1d', '0184e692-d6ed-4941-a2d9-cde940c0c809', 'bf4f767e-0372-4341-ac26-ee6e054f9806', 'active', '2026-06-01'::timestamptz, NULL::date),
('b602916b-2e1f-48a9-aad8-b63aa81dc406', '6c4b9dbe-8ce5-4933-a1a3-d1653b8b85b2', 'bf4f767e-0372-4341-ac26-ee6e054f9806', 'active', '2026-06-01'::timestamptz, NULL::date),
('2ce3f5e0-2d30-4337-a9fc-ffaa99c12bfa', '7d3301fe-da77-4f82-a5ad-66332ba2ac95', 'bf4f767e-0372-4341-ac26-ee6e054f9806', 'active', '2026-06-01'::timestamptz, NULL::date),
('bc1f4511-8706-477d-a7b7-aa5b3d3825f2', 'cdfbbd0d-1e36-40ae-a327-6847a847fd1b', 'bf4f767e-0372-4341-ac26-ee6e054f9806', 'active', '2026-06-01'::timestamptz, NULL::date),
('cb1f6338-12cc-4d45-acc0-8cf3c005723f', '0b8323af-b465-4e2b-af70-792b5b1820f0', '58c6e3d1-ecb8-4777-a72f-47ec3823c504', 'active', '2026-06-01'::timestamptz, NULL::date),
('0daa0425-76f3-4254-a336-7322b7b1137c', '8a8c1b47-07bf-4b2c-a583-b8220367d1d1', '58c6e3d1-ecb8-4777-a72f-47ec3823c504', 'active', '2026-06-01'::timestamptz, NULL::date),
('5319a855-0d58-4f53-ac61-07adade1ca0a', '1ea9a06f-8ace-4580-a0f3-6aee162a8e40', '58c6e3d1-ecb8-4777-a72f-47ec3823c504', 'active', '2026-06-01'::timestamptz, NULL::date),
('927fbed9-6922-4f20-acfb-b3525433f108', '6b65cd8a-1b2d-41ce-a6c9-67958f176064', '58c6e3d1-ecb8-4777-a72f-47ec3823c504', 'active', '2026-06-01'::timestamptz, NULL::date),
('0fcc516c-58a3-403b-a746-beeee5a3ca80', 'c2e41c65-bde4-4554-a56f-53178e7126b3', '58c6e3d1-ecb8-4777-a72f-47ec3823c504', 'active', '2026-06-01'::timestamptz, NULL::date),
('0e5ef3af-beba-4fcd-ac27-dc2b4efba32a', 'e2778cfd-0411-4a94-a15f-44bdbf7308bc', '58c6e3d1-ecb8-4777-a72f-47ec3823c504', 'active', '2026-06-01'::timestamptz, NULL::date),
('4f0f33fb-fc6b-4ee5-a4e8-4f605036ecbc', '3b676538-ab4a-4271-aaee-164bb70736d8', '58c6e3d1-ecb8-4777-a72f-47ec3823c504', 'active', '2026-06-01'::timestamptz, NULL::date),
('e028b752-fb5a-4615-aaba-a7221abca3a4', '1f741029-c147-42e8-a0d7-8a5eb380a6e1', '58c6e3d1-ecb8-4777-a72f-47ec3823c504', 'active', '2026-06-01'::timestamptz, NULL::date),
('72624984-e4fb-4da7-ad73-aaea71c1352b', 'b19df532-ab8b-4341-a78f-16bf4c77988e', '58c6e3d1-ecb8-4777-a72f-47ec3823c504', 'active', '2026-06-01'::timestamptz, NULL::date),
('b0bae9ef-8db9-4db5-aa54-c8cc8bd92891', 'e74c612e-908b-4a28-a7ac-dfc87c0b12fb', '58c6e3d1-ecb8-4777-a72f-47ec3823c504', 'active', '2026-06-01'::timestamptz, NULL::date),
('51528712-4c35-4a8e-a702-0b1a0fe5caa8', '1b517753-a570-45f6-ac8c-c96cf1dcad59', 'd42a61be-3638-4332-ac24-17211a0c30f5', 'active', '2026-06-01'::timestamptz, NULL::date),
('8bbe8c8b-548c-4b12-aa47-ea04f60c072a', 'dbdb35ea-3201-4bec-a048-b1417c218c98', 'd42a61be-3638-4332-ac24-17211a0c30f5', 'active', '2026-06-01'::timestamptz, NULL::date),
('d0c84232-ae6b-46f1-aff8-c1608853c121', '3e7bc5a3-9ee8-4410-a725-ac0dcb30b6f1', 'd42a61be-3638-4332-ac24-17211a0c30f5', 'active', '2026-06-01'::timestamptz, NULL::date),
('8a2bda9e-f8ec-4de1-a00b-dfd872e1d792', '697b5d61-3532-49dd-a152-32a90e55d1a1', 'aa5a18ba-cb24-4e0e-ada4-d0ea4f8e6c20', 'active', '2026-06-01'::timestamptz, NULL::date),
('adf27404-18a2-4193-ade8-445ed239bd7e', '87245bbe-a468-4a1e-add8-8e292b8845cf', 'aa5a18ba-cb24-4e0e-ada4-d0ea4f8e6c20', 'active', '2026-06-01'::timestamptz, NULL::date),
('7ff06c6c-b88b-42e4-aac7-0c8227d12a4a', '620ab48f-0259-4be2-a503-d5c6ee60085e', 'aa5a18ba-cb24-4e0e-ada4-d0ea4f8e6c20', 'active', '2026-06-01'::timestamptz, NULL::date),
('99152901-98d2-41a0-a2d0-83818215c0b9', '51e301ca-b634-429d-abd5-3fdf1a1cd6ea', 'aa5a18ba-cb24-4e0e-ada4-d0ea4f8e6c20', 'active', '2026-06-01'::timestamptz, NULL::date),
('e0e7f4eb-ead6-4799-a130-b551462b9334', '33a5578b-d57b-4431-acff-b8f0c33420bf', 'aa5a18ba-cb24-4e0e-ada4-d0ea4f8e6c20', 'active', '2026-06-01'::timestamptz, NULL::date),
('ce356dc7-f4aa-4597-aefb-26326a40e44f', '4cb22407-0462-428a-ae52-851bd4cd76e2', 'aa5a18ba-cb24-4e0e-ada4-d0ea4f8e6c20', 'active', '2026-06-01'::timestamptz, NULL::date),
('b73518ad-0b4e-44e4-a36b-105953fb6b55', 'ebc74af4-c853-44c5-a800-eac6377704e7', 'aa5a18ba-cb24-4e0e-ada4-d0ea4f8e6c20', 'active', '2026-06-01'::timestamptz, NULL::date),
('6ce21165-8d3b-4569-a18a-294aef08bba9', 'd44bee9b-f985-4cf1-a8b7-c813df7b01e5', 'aa5a18ba-cb24-4e0e-ada4-d0ea4f8e6c20', 'active', '2026-06-01'::timestamptz, NULL::date),
('3b398777-49cd-483f-a518-16d0c3c33fe2', 'c0c38a46-c681-428d-a101-0da68b3664d3', 'aa5a18ba-cb24-4e0e-ada4-d0ea4f8e6c20', 'active', '2026-06-01'::timestamptz, NULL::date),
('569c0e57-3e6f-4451-a4a4-753cc14654d6', 'bfb04fa6-a3f7-4e4d-a6c4-09f0ba81443e', 'aa5a18ba-cb24-4e0e-ada4-d0ea4f8e6c20', 'active', '2026-06-01'::timestamptz, NULL::date),
('b951951d-4c67-4fb9-aef8-0113170426f3', '5b5e01b1-28f5-48c4-a65c-724dc8150eda', 'aa5a18ba-cb24-4e0e-ada4-d0ea4f8e6c20', 'active', '2026-06-01'::timestamptz, NULL::date),
('e07b676c-82cd-4630-a3da-4857757dd1d0', '9001e041-4381-4844-aafd-2f85cdf9c4e0', 'aa5a18ba-cb24-4e0e-ada4-d0ea4f8e6c20', 'active', '2026-06-01'::timestamptz, NULL::date),
('31cf1b37-5d08-4e83-a04f-e4e76e4f85dd', '1b517753-a570-45f6-ac8c-c96cf1dcad59', 'a8bfb51b-2daf-4b28-a17b-d245fe0ff413', 'active', '2026-06-01'::timestamptz, NULL::date),
('087a9b1b-ec7e-4f43-aec9-36c093782c7a', '3e7bc5a3-9ee8-4410-a725-ac0dcb30b6f1', 'a8bfb51b-2daf-4b28-a17b-d245fe0ff413', 'active', '2026-06-01'::timestamptz, NULL::date),
('75f716cc-9504-4df2-af21-94abceff4a19', '1e725840-1b60-454c-a76b-cb1c911e0acb', 'a8bfb51b-2daf-4b28-a17b-d245fe0ff413', 'active', '2026-06-01'::timestamptz, NULL::date),
('78d4ca5d-a29b-4ab7-ac9b-f3ca3933ba9d', '03fad9dd-d51f-47c3-ae22-27be61e82a15', '57a96784-39e9-4798-a7c7-b6db0ab93aae', 'active', '2026-06-01'::timestamptz, NULL::date),
('cbdce3d0-8a51-4d9e-af5a-c12b1e859ec2', '9007d16e-eb84-4f25-a881-062ac37b4253', '57a96784-39e9-4798-a7c7-b6db0ab93aae', 'active', '2026-06-01'::timestamptz, NULL::date),
('e9d33024-7ba9-4e43-a9b4-450fc6df7eb1', '338fb59c-6113-4647-ac33-89586c2392f9', '57a96784-39e9-4798-a7c7-b6db0ab93aae', 'active', '2026-06-01'::timestamptz, NULL::date),
('7301e703-fefc-446d-a701-32dafe595706', '9fb338e1-79b2-4200-a4b2-b1cff414f583', '57a96784-39e9-4798-a7c7-b6db0ab93aae', 'active', '2026-06-01'::timestamptz, NULL::date),
('e5c751d8-202e-48b8-a1d0-97fcb27cf320', '0608b0f2-9475-4ead-a1ba-74f129da115c', '57a96784-39e9-4798-a7c7-b6db0ab93aae', 'active', '2026-06-01'::timestamptz, NULL::date),
('7a537ee3-bdb2-4223-aab2-ec45f10e41d6', '98641bb3-544a-4261-a207-bd2b3a409a07', '5052b2db-8172-4680-a458-572fc4c6154a', 'active', '2026-06-01'::timestamptz, NULL::date),
('4980d9cb-569c-47d6-aaf7-7870fa355019', '2f184785-51f7-4fb5-ad05-a0d53742e83d', '5052b2db-8172-4680-a458-572fc4c6154a', 'active', '2026-06-01'::timestamptz, NULL::date),
('fc49b19b-c969-4824-a0e8-d9a931aaa11a', '98a57d62-7fbc-4083-a771-6598588d942f', 'e0e71f79-633d-44a1-a3c2-9ee0750faa7d', 'active', '2026-06-01'::timestamptz, NULL::date),
('dc7dbf2a-e5f2-439b-adcf-f86f2f96ee0a', 'fecf5068-a85a-42f5-af59-25340fb528d0', 'e0e71f79-633d-44a1-a3c2-9ee0750faa7d', 'active', '2026-06-01'::timestamptz, NULL::date),
('7064d6bd-b809-4dec-a02a-869e928b5840', '18acab55-2ba0-40be-a731-7ed22ada36b1', 'e0e71f79-633d-44a1-a3c2-9ee0750faa7d', 'active', '2026-06-01'::timestamptz, NULL::date),
('19185dd9-051f-4036-a86a-635cf0dc454f', '045bd30f-2c33-4ed2-addc-aabd8fa39be1', 'e0e71f79-633d-44a1-a3c2-9ee0750faa7d', 'active', '2026-06-01'::timestamptz, NULL::date),
('44618185-59c7-4db3-a51a-767315fdbff2', '7755fae3-5199-493d-a9ad-264bea982ae8', 'e0e71f79-633d-44a1-a3c2-9ee0750faa7d', 'active', '2026-06-01'::timestamptz, NULL::date),
('052cde80-21b5-492f-a9d3-1f85e57c2a35', '64c4cb01-477f-449d-abb2-5a886233b532', 'e0e71f79-633d-44a1-a3c2-9ee0750faa7d', 'active', '2026-06-01'::timestamptz, NULL::date),
('70869442-d808-43ae-ae36-4a80e30fbd80', '3426b026-756c-4585-ade9-04343861aa60', '42114944-6f5d-42f9-a73f-5285b50c6ed7', 'active', '2026-06-01'::timestamptz, NULL::date),
('fb987170-327b-484c-a09f-9315a01fe794', '412aaf7f-0409-4eeb-a183-f4bb9eadd936', '42114944-6f5d-42f9-a73f-5285b50c6ed7', 'active', '2026-06-01'::timestamptz, NULL::date),
('09695992-e088-4ade-a559-c8344426afe3', 'c5388f69-64a8-4ef3-a3a4-70c2099e028b', '42114944-6f5d-42f9-a73f-5285b50c6ed7', 'active', '2026-06-01'::timestamptz, NULL::date),
('d35b2902-c7b1-419d-aa6c-abe063ceaebd', '91b19e7b-edd4-4f60-a4a4-5cf9b7aa9a67', '42114944-6f5d-42f9-a73f-5285b50c6ed7', 'active', '2026-06-01'::timestamptz, NULL::date);

-- ----------------------------------------------------------------------------
-- PACKAGES
-- ----------------------------------------------------------------------------
INSERT INTO packages (
  id, student_id, plan_type, amount, start_date, expiry_date, status, 
  payment_status, program, amount_received, balance_amount, payment_mode, 
  payment_date, base_amount, tax_amount, gst_rate, sessions_used, 
  sessions_purchased, makeup_credit, extension_days, valid_to
) VALUES
('24ac53bf-4f48-49a6-a19a-7e43c3fd8fe5', 'd69ffa9a-cba8-4e34-a592-8435d9cb6357', 'Monthly'::package_plan, 14000, '2026-06-25'::date, '2026-10-26'::date, 'active'::package_status, 'paid'::payment_status, 'JDP', 14000, 0, 'cash', '2026-06-25'::date, 11864, 2136, 0.18, 5, 36, 0, 0, '2026-10-26'::date),
('2cf12d5e-ab8b-480f-a90e-71c4d967123a', '2881abf7-330d-444d-a5f1-8bfc8fe509b5', 'Monthly'::package_plan, 18000, '2026-06-25'::date, '2026-11-07'::date, 'active'::package_status, 'paid'::payment_status, 'HPP', 18000, 0, 'cash', '2026-06-25'::date, 15254, 2746, 0.18, 12, 36, 0, 0, '2026-11-07'::date),
('f566d81a-60e1-432f-a6c5-4229a75fa577', '6c4b9dbe-8ce5-4933-a1a3-d1653b8b85b2', 'Monthly'::package_plan, 14000, '2026-06-25'::date, '2026-10-23'::date, 'active'::package_status, 'paid'::payment_status, 'JDP', 14000, 0, 'cash', '2026-06-25'::date, 11864, 2136, 0.18, 12, 36, 2, 0, '2026-10-23'::date),
('d6aeea46-5201-4496-ab7e-bc283294bd64', '0184e692-d6ed-4941-a2d9-cde940c0c809', 'Monthly'::package_plan, 14000, '2026-06-25'::date, '2026-11-04'::date, 'active'::package_status, 'paid'::payment_status, 'JDP', 14000, 0, 'cash', '2026-06-25'::date, 11864, 2136, 0.18, 13, 36, 4, 0, '2026-11-04'::date),
('f2b804b5-d3ee-42c8-a205-7698c830942b', 'fcd61cfa-c3c0-44c5-afb8-86f7ec31a84a', 'Monthly'::package_plan, 18000, '2026-06-25'::date, '2026-09-11'::date, 'active'::package_status, 'paid'::payment_status, 'HPP', 18000, 0, 'cash', '2026-06-25'::date, 15254, 2746, 0.18, 8, 36, 0, 0, '2026-09-11'::date),
('be1f6bf4-80b1-4abb-af9b-5c00f581d24f', '5193d5cb-3142-44f0-a74e-329f3b8c839a', 'Monthly'::package_plan, 18000, '2026-06-25'::date, '2026-09-12'::date, 'active'::package_status, 'paid'::payment_status, 'HPP', 18000, 0, 'cash', '2026-06-25'::date, 15254, 2746, 0.18, 12, 36, 0, 0, '2026-09-12'::date),
('e11dacb0-d06c-45c4-a5fb-982606872900', '1f2f3235-c3f7-4d48-a295-e59c06903cc5', 'Monthly'::package_plan, 18000, '2026-06-25'::date, '2026-09-29'::date, 'active'::package_status, 'paid'::payment_status, 'HPP', 18000, 0, 'cash', '2026-06-25'::date, 15254, 2746, 0.18, 27, 36, 0, 0, '2026-09-29'::date),
('22d5df44-7f56-46fc-abc3-93bb14680f10', 'e78facd1-00d4-41a5-a6aa-bb97bca5265a', 'Monthly'::package_plan, 9000, '2026-06-25'::date, '2026-10-25'::date, 'active'::package_status, 'paid'::payment_status, 'ADV', 9000, 0, 'cash', '2026-06-25'::date, 7627, 1373, 0.18, 18, 36, 0, 0, '2026-10-25'::date),
('e6bae4ce-8f3a-4b85-afe8-52b60a62ba60', '576b7944-1c8e-4aea-a21a-f5fb8c6bfe1f', 'Monthly'::package_plan, 9000, '2026-06-25'::date, '2026-09-25'::date, 'active'::package_status, 'paid'::payment_status, 'ADV', 9000, 0, 'cash', '2026-06-25'::date, 7627, 1373, 0.18, 13, 36, 0, 0, '2026-09-25'::date),
('84813c22-06d5-4c5f-ac43-5b1d86e18ca6', '6aa37c16-3531-41f6-ad3f-d8ce5cc8f9cf', 'Monthly'::package_plan, 9000, '2026-06-25'::date, '2026-09-19'::date, 'active'::package_status, 'paid'::payment_status, 'ADV', 9000, 0, 'cash', '2026-06-25'::date, 7627, 1373, 0.18, 6, 36, 0, 0, '2026-09-19'::date),
('63f09a17-56aa-4521-a262-e73ed791f3a3', 'd131bd6a-7005-4697-a991-67e11df3c451', 'Monthly'::package_plan, 9000, '2026-06-25'::date, '2026-10-30'::date, 'active'::package_status, 'paid'::payment_status, 'ADV', 9000, 0, 'cash', '2026-06-25'::date, 7627, 1373, 0.18, 14, 36, 4, 0, '2026-10-30'::date),
('8ccbb913-8ff7-4cf4-a441-718e421c802e', '06997d89-17f9-49a7-a93c-7bca974336d5', 'Monthly'::package_plan, 9000, '2026-06-25'::date, '2026-09-20'::date, 'active'::package_status, 'paid'::payment_status, 'ADV', 9000, 0, 'cash', '2026-06-25'::date, 7627, 1373, 0.18, 22, 36, 0, 0, '2026-09-20'::date),
('5a0f5a05-be94-4d13-ab77-d9c4746ea61d', '7d3301fe-da77-4f82-a5ad-66332ba2ac95', 'Monthly'::package_plan, 9000, '2026-06-25'::date, '2026-11-02'::date, 'active'::package_status, 'paid'::payment_status, 'ADV', 9000, 0, 'cash', '2026-06-25'::date, 7627, 1373, 0.18, 15, 36, 0, 0, '2026-11-02'::date),
('85d49c03-c433-48e0-a605-45137c953bb0', 'c14d8512-95af-46d4-a6e2-952b72d05b1d', 'Monthly'::package_plan, 14000, '2026-06-25'::date, '2026-09-05'::date, 'active'::package_status, 'paid'::payment_status, 'JDP', 14000, 0, 'cash', '2026-06-25'::date, 11864, 2136, 0.18, 23, 36, 0, 0, '2026-09-05'::date),
('6100aebb-d084-494d-a5ad-3da717207d10', '1eb10c8d-6772-4d20-a624-90c3a8119f05', 'Monthly'::package_plan, 14000, '2026-06-25'::date, '2026-10-12'::date, 'active'::package_status, 'paid'::payment_status, 'JDP', 14000, 0, 'cash', '2026-06-25'::date, 11864, 2136, 0.18, 14, 36, 0, 0, '2026-10-12'::date),
('6cef4156-1763-4208-aa0d-f6023b71c0b5', 'ec6ef04b-edc5-44c3-a70b-e857a83ee880', 'Monthly'::package_plan, 9000, '2026-06-25'::date, '2026-09-12'::date, 'active'::package_status, 'paid'::payment_status, 'ADV', 9000, 0, 'cash', '2026-06-25'::date, 7627, 1373, 0.18, 18, 36, 4, 0, '2026-09-12'::date),
('bfb625af-e641-49bd-a080-131c0442f643', 'c9093c98-f96e-47f7-af0e-f7abff60bc8c', 'Monthly'::package_plan, 5500, '2026-06-25'::date, '2026-09-13'::date, 'active'::package_status, 'pending'::payment_status, 'ORANGE', 0, 5500, 'cash', NULL::date, 4661, 839, 0.18, 8, 36, 0, 0, '2026-09-13'::date),
('ad80d6c4-4df0-4a0e-ac21-0ca5e82c91fc', '8ea8c39a-798e-49fc-a40b-c8bc379bbdc9', 'Monthly'::package_plan, 5500, '2026-06-25'::date, '2026-09-19'::date, 'active'::package_status, 'paid'::payment_status, 'ORANGE', 5500, 0, 'cash', '2026-06-25'::date, 4661, 839, 0.18, 29, 36, 0, 0, '2026-09-19'::date),
('1b02e14b-218b-4c37-a896-41d504a16629', '34ab8595-f6cc-4335-af1a-02f5d8149098', 'Monthly'::package_plan, 5500, '2026-06-25'::date, '2026-11-02'::date, 'active'::package_status, 'paid'::payment_status, 'ORANGE', 5500, 0, 'cash', '2026-06-25'::date, 4661, 839, 0.18, 6, 36, 2, 0, '2026-11-02'::date),
('02c3e664-6c82-4087-aba2-9417f2e7891e', '59a7c4cc-eca6-4adc-ad45-5a70f30cd9b5', 'Monthly'::package_plan, 5500, '2026-06-25'::date, '2026-09-06'::date, 'active'::package_status, 'paid'::payment_status, 'ORANGE', 5500, 0, 'cash', '2026-06-25'::date, 4661, 839, 0.18, 19, 36, 4, 0, '2026-09-06'::date),
('94e476c6-b04c-4c5b-a2cb-f992a537b7f7', '1d498b52-ad27-43a6-a0a3-eb1e8870dd9f', 'Monthly'::package_plan, 5500, '2026-06-25'::date, '2026-10-21'::date, 'active'::package_status, 'paid'::payment_status, 'ORANGE', 5500, 0, 'cash', '2026-06-25'::date, 4661, 839, 0.18, 16, 36, 4, 0, '2026-10-21'::date),
('2d6b8fa5-d4e2-475a-ac4f-e9d5289ac04b', 'ff750bbe-a244-4eb7-a0e5-1d7978f8e2f5', 'Monthly'::package_plan, 5500, '2026-06-25'::date, '2026-09-12'::date, 'active'::package_status, 'paid'::payment_status, 'ORANGE', 5500, 0, 'cash', '2026-06-25'::date, 4661, 839, 0.18, 6, 36, 0, 0, '2026-09-12'::date),
('83cd9a3d-436e-48d4-aa33-928ccb8df2b4', '9c088efb-8ac4-4797-a8ba-91f95aa10858', 'Monthly'::package_plan, 5500, '2026-06-25'::date, '2026-08-18'::date, 'active'::package_status, 'paid'::payment_status, 'ORANGE', 5500, 0, 'cash', '2026-06-25'::date, 4661, 839, 0.18, 36, 36, 0, 0, '2026-08-18'::date),
('0e0ea8f8-8c77-4ce0-aa1f-1b803f9b98f3', '98376d5d-f8f6-442a-a910-0ad439db08c1', 'Monthly'::package_plan, 5500, '2026-06-25'::date, '2026-10-15'::date, 'active'::package_status, 'paid'::payment_status, 'ORANGE', 5500, 0, 'cash', '2026-06-25'::date, 4661, 839, 0.18, 16, 36, 4, 0, '2026-10-15'::date),
('0e6a842c-8170-4e12-a4e6-7c56a7c87e22', '9720fe32-7924-4cbe-a58a-de451cab1e09', 'Monthly'::package_plan, 5500, '2026-06-25'::date, '2026-11-01'::date, 'active'::package_status, 'paid'::payment_status, 'ORANGE', 5500, 0, 'cash', '2026-06-25'::date, 4661, 839, 0.18, 30, 36, 4, 0, '2026-11-01'::date),
('53753651-28a5-4e89-a5e4-9952d9f0f06c', '1cc90355-217f-4508-aefe-f24288419044', 'Monthly'::package_plan, 5000, '2026-06-25'::date, '2026-11-07'::date, 'active'::package_status, 'paid'::payment_status, 'RED', 5000, 0, 'cash', '2026-06-25'::date, 4237, 763, 0.18, 4, 36, 0, 0, '2026-11-07'::date),
('0730e9ad-06c2-4505-a004-71c73f5b2f9e', 'a6c7fc98-e91c-4b24-a37c-eb83d951fc19', 'Monthly'::package_plan, 5000, '2026-06-25'::date, '2026-11-03'::date, 'active'::package_status, 'paid'::payment_status, 'RED', 5000, 0, 'cash', '2026-06-25'::date, 4237, 763, 0.18, 4, 36, 0, 0, '2026-11-03'::date),
('757c9385-dc32-4c55-afc7-a1edea0a7494', 'fa79a99b-f590-4464-adaf-26d4374e7e23', 'Monthly'::package_plan, 5000, '2026-06-25'::date, '2026-09-17'::date, 'active'::package_status, 'paid'::payment_status, 'RED', 5000, 0, 'cash', '2026-06-25'::date, 4237, 763, 0.18, 19, 36, 4, 0, '2026-09-17'::date),
('fd364cd6-8165-4417-a261-c59f8b2282d5', '035b5ebe-d0a3-4183-acf6-a1dabb3cd9b9', 'Monthly'::package_plan, 5000, '2026-06-25'::date, '2026-09-23'::date, 'active'::package_status, 'paid'::payment_status, 'RED', 5000, 0, 'cash', '2026-06-25'::date, 4237, 763, 0.18, 36, 36, 2, 0, '2026-09-23'::date),
('8740ebb8-9e74-44db-a1de-d831ad00c336', '96097083-f85f-400c-a805-b408840ccb39', 'Monthly'::package_plan, 5000, '2026-06-25'::date, '2026-09-04'::date, 'active'::package_status, 'paid'::payment_status, 'RED', 5000, 0, 'cash', '2026-06-25'::date, 4237, 763, 0.18, 15, 36, 0, 0, '2026-09-04'::date),
('c96adfad-7157-4314-a3ea-3f1850b3fe09', 'a37cbb0e-9c9a-40d2-a977-2f8e7d09c717', 'Monthly'::package_plan, 5000, '2026-06-25'::date, '2026-09-18'::date, 'active'::package_status, 'pending'::payment_status, 'RED', 5000, 0, 'cash', '2026-06-25'::date, 4237, 763, 0.18, 11, 36, 4, 0, '2026-09-18'::date),
('d88adfbb-b663-4cc7-aa09-86cfee4ec5b7', '17d31d4b-e883-40fe-aa86-24d8fd566b0c', 'Monthly'::package_plan, 5000, '2026-06-25'::date, '2026-09-24'::date, 'active'::package_status, 'paid'::payment_status, 'RED', 5000, 0, 'cash', '2026-06-25'::date, 4237, 763, 0.18, 28, 36, 0, 0, '2026-09-24'::date),
('63677a4f-fe04-4832-af09-8dcf9229976a', '247c0ceb-fd98-4da4-a9f4-c1526b5879f9', 'Monthly'::package_plan, 5000, '2026-06-25'::date, '2026-10-29'::date, 'active'::package_status, 'paid'::payment_status, 'RED', 5000, 0, 'cash', '2026-06-25'::date, 4237, 763, 0.18, 19, 36, 0, 0, '2026-10-29'::date),
('8f4e4989-0188-43aa-ae10-476767744a17', 'a5e41761-312a-4f92-abff-eaf285781df5', 'Monthly'::package_plan, 5000, '2026-06-25'::date, '2026-09-13'::date, 'active'::package_status, 'pending'::payment_status, 'RED', 0, 5000, 'cash', NULL::date, 4237, 763, 0.18, 8, 36, 0, 0, '2026-09-13'::date),
('971defd7-af7d-45e9-a2d7-ea2ba3b41fcb', '20a15a20-355b-4c5d-a158-4e69f924494f', 'Monthly'::package_plan, 5000, '2026-06-25'::date, '2026-10-28'::date, 'active'::package_status, 'paid'::payment_status, 'RED', 5000, 0, 'cash', '2026-06-25'::date, 4237, 763, 0.18, 29, 36, 0, 0, '2026-10-28'::date),
('aca1b9c7-8a89-47db-a95b-58607288118c', '5a0f0f21-3bca-40fb-a611-fba6d843d404', 'Monthly'::package_plan, 5000, '2026-06-25'::date, '2026-10-22'::date, 'active'::package_status, 'paid'::payment_status, 'RED', 5000, 0, 'cash', '2026-06-25'::date, 4237, 763, 0.18, 11, 36, 4, 0, '2026-10-22'::date),
('a94f1faf-b59d-4cd8-a26c-2159ecad3abb', 'f3197285-6cde-4e6a-abd1-be8ad021d2c6', 'Monthly'::package_plan, 5000, '2026-06-25'::date, '2026-09-29'::date, 'active'::package_status, 'paid'::payment_status, 'RED', 5000, 0, 'cash', '2026-06-25'::date, 4237, 763, 0.18, 8, 36, 0, 0, '2026-09-29'::date),
('e4755abc-ec4f-4891-a7b8-b6dd87a46f35', 'c9259488-6d2d-4726-ab76-2a5c16786005', 'Monthly'::package_plan, 6500, '2026-06-25'::date, '2026-09-08'::date, 'active'::package_status, 'paid'::payment_status, 'GREEN', 6500, 0, 'cash', '2026-06-25'::date, 5508, 992, 0.18, 26, 36, 0, 0, '2026-09-08'::date),
('175c0c68-df37-4ebe-ae61-6fd3f4b75fad', '6ed0152b-a710-45b0-af39-242133b17981', 'Monthly'::package_plan, 6500, '2026-06-25'::date, '2026-10-08'::date, 'active'::package_status, 'paid'::payment_status, 'GREEN', 6500, 0, 'cash', '2026-06-25'::date, 5508, 992, 0.18, 30, 36, 0, 0, '2026-10-08'::date),
('7ff8a7f1-0044-4c41-ad67-efc4b31237f7', '0184e692-d6ed-4941-a2d9-cde940c0c809', 'Monthly'::package_plan, 3000, '2026-06-25'::date, '2026-11-02'::date, 'active'::package_status, 'paid'::payment_status, 'FITNESS', 3000, 0, 'cash', '2026-06-25'::date, 2542, 458, 0.18, 12, 36, 0, 0, '2026-11-02'::date),
('a0b9edee-b037-4050-aa71-b1527673f485', '1eb10c8d-6772-4d20-a624-90c3a8119f05', 'Monthly'::package_plan, 3000, '2026-06-25'::date, '2026-10-21'::date, 'active'::package_status, 'paid'::payment_status, 'FITNESS', 3000, 0, 'cash', '2026-06-25'::date, 2542, 458, 0.18, 24, 36, 4, 0, '2026-10-21'::date),
('0fa476bc-73ea-4389-af7f-92f84b7e2589', 'c14d8512-95af-46d4-a6e2-952b72d05b1d', 'Monthly'::package_plan, 3000, '2026-06-25'::date, '2026-10-13'::date, 'active'::package_status, 'paid'::payment_status, 'FITNESS', 3000, 0, 'cash', '2026-06-25'::date, 2542, 458, 0.18, 26, 36, 4, 0, '2026-10-13'::date),
('54bb6e09-c34b-4731-ad82-b731ed821adc', '281f9909-db60-4a75-a1bd-b1c8e518e215', 'Monthly'::package_plan, 3000, '2026-06-25'::date, '2026-09-12'::date, 'active'::package_status, 'paid'::payment_status, 'FITNESS', 3000, 0, 'cash', '2026-06-25'::date, 2542, 458, 0.18, 30, 36, 0, 0, '2026-09-12'::date),
('593d53cc-9f79-4b39-a62c-d3366cceefbd', 'de374c76-bb4e-4dbc-a8eb-e04ddc92656a', 'Monthly'::package_plan, 3000, '2026-06-25'::date, '2026-09-08'::date, 'active'::package_status, 'paid'::payment_status, 'FITNESS', 3000, 0, 'cash', '2026-06-25'::date, 2542, 458, 0.18, 25, 36, 0, 0, '2026-09-08'::date),
('f2330fd4-ab69-48a1-a02a-9e8f4a5ab653', '06997d89-17f9-49a7-a93c-7bca974336d5', 'Monthly'::package_plan, 3000, '2026-06-25'::date, '2026-10-12'::date, 'active'::package_status, 'paid'::payment_status, 'FITNESS', 3000, 0, 'cash', '2026-06-25'::date, 2542, 458, 0.18, 24, 36, 4, 0, '2026-10-12'::date),
('939e5ee3-a51b-4952-a299-4d8c8920adf7', 'ecf7ac26-eda7-4f1a-ab4b-3abe6aff3d3d', 'Monthly'::package_plan, 3000, '2026-06-25'::date, '2026-08-18'::date, 'active'::package_status, 'paid'::payment_status, 'FITNESS', 3000, 0, 'cash', '2026-06-25'::date, 2542, 458, 0.18, 36, 36, 0, 0, '2026-08-18'::date),
('bd57550d-7abe-4202-aab1-665c238ff134', 'fcd61cfa-c3c0-44c5-afb8-86f7ec31a84a', 'Monthly'::package_plan, 3000, '2026-06-25'::date, '2026-09-27'::date, 'active'::package_status, 'paid'::payment_status, 'FITNESS', 3000, 0, 'cash', '2026-06-25'::date, 2542, 458, 0.18, 4, 36, 0, 0, '2026-09-27'::date),
('e2d3974d-090a-44cb-a7c4-982d24461456', '5193d5cb-3142-44f0-a74e-329f3b8c839a', 'Monthly'::package_plan, 3000, '2026-06-25'::date, '2026-09-21'::date, 'active'::package_status, 'paid'::payment_status, 'FITNESS', 3000, 0, 'cash', '2026-06-25'::date, 2542, 458, 0.18, 29, 36, 0, 0, '2026-09-21'::date),
('801778b4-259e-47ce-a767-fe0524ccf34c', 'd69ffa9a-cba8-4e34-a592-8435d9cb6357', 'Monthly'::package_plan, 3000, '2026-06-25'::date, '2026-09-17'::date, 'active'::package_status, 'paid'::payment_status, 'FITNESS', 3000, 0, 'cash', '2026-06-25'::date, 2542, 458, 0.18, 18, 36, 0, 0, '2026-09-17'::date),
('fcbf729f-7d9e-49b3-a8ce-2e35fc85fe8c', '2881abf7-330d-444d-a5f1-8bfc8fe509b5', 'Monthly'::package_plan, 3000, '2026-06-25'::date, '2026-10-20'::date, 'active'::package_status, 'paid'::payment_status, 'FITNESS', 3000, 0, 'cash', '2026-06-25'::date, 2542, 458, 0.18, 6, 36, 0, 0, '2026-10-20'::date),
('1b911535-7d2d-4091-aee9-2c3edd840fbb', 'cdfbbd0d-1e36-40ae-a327-6847a847fd1b', 'Monthly'::package_plan, 3000, '2026-06-25'::date, '2026-09-13'::date, 'active'::package_status, 'pending'::payment_status, 'FITNESS', 0, 3000, 'cash', NULL::date, 2542, 458, 0.18, 8, 36, 2, 0, '2026-09-13'::date),
('e22e9331-999a-461a-a0f3-47f0418a982d', '1e725840-1b60-454c-a76b-cb1c911e0acb', 'Monthly'::package_plan, 7500, '2026-06-25'::date, '2026-09-04'::date, 'active'::package_status, 'paid'::payment_status, 'INT', 7500, 0, 'cash', '2026-06-25'::date, 6356, 1144, 0.18, 28, 36, 2, 0, '2026-09-04'::date),
('6ac5e6bb-8b39-47d4-a596-3e1d28c52afe', 'd619fc64-7032-4ea1-a6bf-24301ff1f328', 'Monthly'::package_plan, 14000, '2026-06-25'::date, '2026-09-07'::date, 'active'::package_status, 'paid'::payment_status, 'JDP', 14000, 0, 'cash', '2026-06-25'::date, 11864, 2136, 0.18, 9, 36, 0, 0, '2026-09-07'::date),
('f814cf21-ba65-40ae-a52d-b15515e8311a', 'ad62edd5-19b0-4532-ad2a-4d5eab439738', 'Monthly'::package_plan, 14000, '2026-06-25'::date, '2026-10-17'::date, 'active'::package_status, 'paid'::payment_status, 'JDP', 14000, 0, 'cash', '2026-06-25'::date, 11864, 2136, 0.18, 21, 36, 4, 0, '2026-10-17'::date),
('f44cce15-7fd3-4ce5-a609-1a186802af3f', '7d3301fe-da77-4f82-a5ad-66332ba2ac95', 'Monthly'::package_plan, 14000, '2026-06-25'::date, '2026-09-23'::date, 'active'::package_status, 'paid'::payment_status, 'JDP', 14000, 0, 'cash', '2026-06-25'::date, 11864, 2136, 0.18, 16, 36, 0, 0, '2026-09-23'::date),
('3e71bd08-7d04-4d01-ae17-325f7fb67e9e', 'cdfbbd0d-1e36-40ae-a327-6847a847fd1b', 'Monthly'::package_plan, 14000, '2026-06-25'::date, '2026-10-22'::date, 'active'::package_status, 'paid'::payment_status, 'JDP', 14000, 0, 'cash', '2026-06-25'::date, 11864, 2136, 0.18, 8, 36, 2, 0, '2026-10-22'::date),
('1b4752c0-45fe-4ef8-a1e4-070ceea25b07', '0b8323af-b465-4e2b-af70-792b5b1820f0', 'Monthly'::package_plan, 6500, '2026-06-25'::date, '2026-09-03'::date, 'active'::package_status, 'paid'::payment_status, 'GREEN', 6500, 0, 'cash', '2026-06-25'::date, 5508, 992, 0.18, 16, 36, 4, 0, '2026-09-03'::date),
('93848ceb-f3cf-4ec9-a357-100bba5ffd9b', '8a8c1b47-07bf-4b2c-a583-b8220367d1d1', 'Monthly'::package_plan, 6500, '2026-06-25'::date, '2026-09-23'::date, 'active'::package_status, 'paid'::payment_status, 'GREEN', 6500, 0, 'cash', '2026-06-25'::date, 5508, 992, 0.18, 36, 36, 4, 0, '2026-09-23'::date),
('e131efbf-fbe1-4c66-a42d-967fcb26392e', '1ea9a06f-8ace-4580-a0f3-6aee162a8e40', 'Monthly'::package_plan, 6500, '2026-06-25'::date, '2026-10-16'::date, 'active'::package_status, 'paid'::payment_status, 'GREEN', 6500, 0, 'cash', '2026-06-25'::date, 5508, 992, 0.18, 18, 36, 0, 0, '2026-10-16'::date),
('9c47b447-4a84-417a-ae3e-577e1aa802d1', '6b65cd8a-1b2d-41ce-a6c9-67958f176064', 'Monthly'::package_plan, 6500, '2026-06-25'::date, '2026-09-29'::date, 'active'::package_status, 'paid'::payment_status, 'GREEN', 6500, 0, 'cash', '2026-06-25'::date, 5508, 992, 0.18, 7, 36, 0, 0, '2026-09-29'::date),
('5426f99b-09b1-4e47-a1b7-e33b08e1bc47', 'c2e41c65-bde4-4554-a56f-53178e7126b3', 'Monthly'::package_plan, 6500, '2026-06-25'::date, '2026-10-22'::date, 'active'::package_status, 'paid'::payment_status, 'GREEN', 6500, 0, 'cash', '2026-06-25'::date, 5508, 992, 0.18, 6, 36, 0, 0, '2026-10-22'::date),
('b07d3e64-4d30-41d4-a979-703b34f65774', 'e2778cfd-0411-4a94-a15f-44bdbf7308bc', 'Monthly'::package_plan, 6500, '2026-06-25'::date, '2026-09-18'::date, 'active'::package_status, 'pending'::payment_status, 'GREEN', 6500, 0, 'cash', '2026-06-25'::date, 5508, 992, 0.18, 11, 36, 0, 0, '2026-09-18'::date),
('98356b94-17a4-422d-a4d5-44a43fee2522', '3b676538-ab4a-4271-aaee-164bb70736d8', 'Monthly'::package_plan, 6500, '2026-06-25'::date, '2026-09-05'::date, 'active'::package_status, 'paid'::payment_status, 'GREEN', 6500, 0, 'cash', '2026-06-25'::date, 5508, 992, 0.18, 15, 36, 4, 0, '2026-09-05'::date),
('46385411-1cd3-4738-a3df-d60302619cc3', '1f741029-c147-42e8-a0d7-8a5eb380a6e1', 'Monthly'::package_plan, 6500, '2026-06-25'::date, '2026-10-29'::date, 'active'::package_status, 'paid'::payment_status, 'GREEN', 6500, 0, 'cash', '2026-06-25'::date, 5508, 992, 0.18, 14, 36, 4, 0, '2026-10-29'::date),
('59a192bc-ffd8-4e3b-ac27-5429af437eec', 'b19df532-ab8b-4341-a78f-16bf4c77988e', 'Monthly'::package_plan, 6500, '2026-06-25'::date, '2026-10-08'::date, 'active'::package_status, 'paid'::payment_status, 'GREEN', 6500, 0, 'cash', '2026-06-25'::date, 5508, 992, 0.18, 19, 36, 0, 0, '2026-10-08'::date),
('acb7646e-94fd-488e-a38f-78d6176f60a0', 'e74c612e-908b-4a28-a7ac-dfc87c0b12fb', 'Monthly'::package_plan, 6500, '2026-06-25'::date, '2026-09-11'::date, 'active'::package_status, 'paid'::payment_status, 'GREEN', 6500, 0, 'cash', '2026-06-25'::date, 5508, 992, 0.18, 17, 36, 0, 0, '2026-09-11'::date),
('e3bd4859-58f4-4c16-a354-b781f34c546d', '1b517753-a570-45f6-ac8c-c96cf1dcad59', 'Monthly'::package_plan, 6500, '2026-06-25'::date, '2026-10-15'::date, 'active'::package_status, 'paid'::payment_status, 'GREEN', 6500, 0, 'cash', '2026-06-25'::date, 5508, 992, 0.18, 25, 36, 0, 0, '2026-10-15'::date),
('b3a02cda-4a16-4a97-a41b-ce45d73ee3e7', 'dbdb35ea-3201-4bec-a048-b1417c218c98', 'Monthly'::package_plan, 6500, '2026-06-25'::date, '2026-09-13'::date, 'active'::package_status, 'pending'::payment_status, 'GREEN', 0, 6500, 'cash', NULL::date, 5508, 992, 0.18, 8, 36, 4, 0, '2026-09-13'::date),
('a310ae42-a381-4983-aa04-df04d0dcb93e', '3e7bc5a3-9ee8-4410-a725-ac0dcb30b6f1', 'Monthly'::package_plan, 6500, '2026-06-25'::date, '2026-08-18'::date, 'active'::package_status, 'paid'::payment_status, 'GREEN', 6500, 0, 'cash', '2026-06-25'::date, 5508, 992, 0.18, 36, 36, 4, 0, '2026-08-18'::date),
('1dbfe104-fdb5-4a22-a439-5404cef2183e', '697b5d61-3532-49dd-a152-32a90e55d1a1', 'Monthly'::package_plan, 5000, '2026-06-25'::date, '2026-10-29'::date, 'active'::package_status, 'paid'::payment_status, 'RED', 5000, 0, 'cash', '2026-06-25'::date, 4237, 763, 0.18, 19, 36, 4, 0, '2026-10-29'::date),
('1aa5e761-ee6c-4a4e-a214-0a7fa2e570e4', '87245bbe-a468-4a1e-add8-8e292b8845cf', 'Monthly'::package_plan, 5000, '2026-06-25'::date, '2026-09-14'::date, 'active'::package_status, 'paid'::payment_status, 'RED', 5000, 0, 'cash', '2026-06-25'::date, 4237, 763, 0.18, 28, 36, 0, 0, '2026-09-14'::date),
('c5d700d0-d207-40e7-ae1c-5f1a98863449', '620ab48f-0259-4be2-a503-d5c6ee60085e', 'Monthly'::package_plan, 5000, '2026-06-25'::date, '2026-10-10'::date, 'active'::package_status, 'paid'::payment_status, 'RED', 5000, 0, 'cash', '2026-06-25'::date, 4237, 763, 0.18, 30, 36, 4, 0, '2026-10-10'::date),
('37a90e8d-1751-433a-a677-c30a878483d4', '51e301ca-b634-429d-abd5-3fdf1a1cd6ea', 'Monthly'::package_plan, 5000, '2026-06-25'::date, '2026-11-07'::date, 'active'::package_status, 'paid'::payment_status, 'RED', 5000, 0, 'cash', '2026-06-25'::date, 4237, 763, 0.18, 30, 36, 4, 0, '2026-11-07'::date),
('1775b8e2-82b9-4b4c-abc2-db93bb1648ef', '33a5578b-d57b-4431-acff-b8f0c33420bf', 'Monthly'::package_plan, 5000, '2026-06-25'::date, '2026-10-21'::date, 'active'::package_status, 'paid'::payment_status, 'RED', 5000, 0, 'cash', '2026-06-25'::date, 4237, 763, 0.18, 23, 36, 0, 0, '2026-10-21'::date),
('9b9a7598-7c42-46ce-a155-2e5b43474758', '4cb22407-0462-428a-ae52-851bd4cd76e2', 'Monthly'::package_plan, 5000, '2026-06-25'::date, '2026-09-21'::date, 'active'::package_status, 'paid'::payment_status, 'RED', 5000, 0, 'cash', '2026-06-25'::date, 4237, 763, 0.18, 21, 36, 4, 0, '2026-09-21'::date),
('71bd0005-d357-4125-ad39-8daa16c8f4b3', 'ebc74af4-c853-44c5-a800-eac6377704e7', 'Monthly'::package_plan, 5000, '2026-06-25'::date, '2026-11-05'::date, 'active'::package_status, 'paid'::payment_status, 'RED', 5000, 0, 'cash', '2026-06-25'::date, 4237, 763, 0.18, 10, 36, 2, 0, '2026-11-05'::date),
('ca990e83-9786-44da-a779-53f29e978e99', 'd44bee9b-f985-4cf1-a8b7-c813df7b01e5', 'Monthly'::package_plan, 5000, '2026-06-25'::date, '2026-11-06'::date, 'active'::package_status, 'paid'::payment_status, 'RED', 5000, 0, 'cash', '2026-06-25'::date, 4237, 763, 0.18, 4, 36, 4, 0, '2026-11-06'::date),
('0b86b906-98db-43db-a922-82f525182b8b', 'c0c38a46-c681-428d-a101-0da68b3664d3', 'Monthly'::package_plan, 5000, '2026-06-25'::date, '2026-09-08'::date, 'active'::package_status, 'paid'::payment_status, 'RED', 5000, 0, 'cash', '2026-06-25'::date, 4237, 763, 0.18, 20, 36, 2, 0, '2026-09-08'::date),
('51a6cf34-7d3d-47ec-a44b-fec5358c428d', 'bfb04fa6-a3f7-4e4d-a6c4-09f0ba81443e', 'Monthly'::package_plan, 5000, '2026-06-25'::date, '2026-09-18'::date, 'active'::package_status, 'paid'::payment_status, 'RED', 5000, 0, 'cash', '2026-06-25'::date, 4237, 763, 0.18, 19, 36, 0, 0, '2026-09-18'::date),
('ced86269-f8f4-4922-ae29-7bea7a30f43b', '5b5e01b1-28f5-48c4-a65c-724dc8150eda', 'Monthly'::package_plan, 5000, '2026-06-25'::date, '2026-09-11'::date, 'active'::package_status, 'paid'::payment_status, 'RED', 5000, 0, 'cash', '2026-06-25'::date, 4237, 763, 0.18, 21, 36, 2, 0, '2026-09-11'::date),
('80f36206-f866-4941-a2d5-1335b6a64b93', '9001e041-4381-4844-aafd-2f85cdf9c4e0', 'Monthly'::package_plan, 5000, '2026-06-25'::date, '2026-10-24'::date, 'active'::package_status, 'paid'::payment_status, 'RED', 5000, 0, 'cash', '2026-06-25'::date, 4237, 763, 0.18, 12, 36, 0, 0, '2026-10-24'::date),
('ba1b7a3b-5b92-430e-a7bb-19cb5baf98f5', '1b517753-a570-45f6-ac8c-c96cf1dcad59', 'Monthly'::package_plan, 3000, '2026-06-25'::date, '2026-09-19'::date, 'active'::package_status, 'paid'::payment_status, 'FITNESS', 3000, 0, 'cash', '2026-06-25'::date, 2542, 458, 0.18, 14, 36, 2, 0, '2026-09-19'::date),
('25c58abe-dcbe-483c-a38e-1bf8b51b0612', '3e7bc5a3-9ee8-4410-a725-ac0dcb30b6f1', 'Monthly'::package_plan, 3000, '2026-06-25'::date, '2026-11-02'::date, 'active'::package_status, 'paid'::payment_status, 'FITNESS', 3000, 0, 'cash', '2026-06-25'::date, 2542, 458, 0.18, 20, 36, 0, 0, '2026-11-02'::date),
('268c919f-3f7c-47ee-a588-fd04fa564359', '1e725840-1b60-454c-a76b-cb1c911e0acb', 'Monthly'::package_plan, 3000, '2026-06-25'::date, '2026-10-26'::date, 'active'::package_status, 'paid'::payment_status, 'FITNESS', 3000, 0, 'cash', '2026-06-25'::date, 2542, 458, 0.18, 23, 36, 0, 0, '2026-10-26'::date),
('c317da9e-53fd-4a31-a881-299dc5466e73', '03fad9dd-d51f-47c3-ae22-27be61e82a15', 'Monthly'::package_plan, 4000, '2026-06-25'::date, '2026-09-13'::date, 'active'::package_status, 'pending'::payment_status, 'WEEKEND', 0, 4000, 'cash', NULL::date, 3390, 610, 0.18, 8, 36, 0, 0, '2026-09-13'::date),
('ce77b040-32b1-4b78-a5d8-4e54cb8a2d6b', '9007d16e-eb84-4f25-a881-062ac37b4253', 'Monthly'::package_plan, 4000, '2026-06-25'::date, '2026-09-05'::date, 'active'::package_status, 'paid'::payment_status, 'WEEKEND', 4000, 0, 'cash', '2026-06-25'::date, 3390, 610, 0.18, 5, 36, 0, 0, '2026-09-05'::date),
('fc4e0988-c1f3-4fa0-aa52-3e2be8b4c26e', '338fb59c-6113-4647-ac33-89586c2392f9', 'Monthly'::package_plan, 4000, '2026-06-25'::date, '2026-09-23'::date, 'active'::package_status, 'paid'::payment_status, 'WEEKEND', 4000, 0, 'cash', '2026-06-25'::date, 3390, 610, 0.18, 36, 36, 0, 0, '2026-09-23'::date),
('4f829d25-317f-4e2c-aad6-6c776a94643b', '9fb338e1-79b2-4200-a4b2-b1cff414f583', 'Monthly'::package_plan, 4000, '2026-06-25'::date, '2026-10-14'::date, 'active'::package_status, 'paid'::payment_status, 'WEEKEND', 4000, 0, 'cash', '2026-06-25'::date, 3390, 610, 0.18, 27, 36, 0, 0, '2026-10-14'::date),
('f058e5fb-0559-4289-a260-6c298028ca70', '0608b0f2-9475-4ead-a1ba-74f129da115c', 'Monthly'::package_plan, 4000, '2026-06-25'::date, '2026-11-05'::date, 'active'::package_status, 'paid'::payment_status, 'WEEKEND', 4000, 0, 'cash', '2026-06-25'::date, 3390, 610, 0.18, 7, 36, 2, 0, '2026-11-05'::date),
('b94290fe-d530-49a8-ab83-cb02880dd163', '98641bb3-544a-4261-a207-bd2b3a409a07', 'Monthly'::package_plan, 4000, '2026-06-25'::date, '2026-09-18'::date, 'active'::package_status, 'paid'::payment_status, 'WEEKEND', 4000, 0, 'cash', '2026-06-25'::date, 3390, 610, 0.18, 20, 36, 4, 0, '2026-09-18'::date),
('7e659e65-0175-4b7f-aca5-f7f8c20e78c1', '2f184785-51f7-4fb5-ad05-a0d53742e83d', 'Monthly'::package_plan, 4000, '2026-06-25'::date, '2026-09-28'::date, 'active'::package_status, 'paid'::payment_status, 'WEEKEND', 4000, 0, 'cash', '2026-06-25'::date, 3390, 610, 0.18, 26, 36, 4, 0, '2026-09-28'::date),
('ae57b95b-69c6-4ea5-ab9b-f2c8155d58e7', '98a57d62-7fbc-4083-a771-6598588d942f', 'Monthly'::package_plan, 4000, '2026-06-25'::date, '2026-08-18'::date, 'active'::package_status, 'paid'::payment_status, 'WEEKEND', 4000, 0, 'cash', '2026-06-25'::date, 3390, 610, 0.18, 36, 36, 0, 0, '2026-08-18'::date),
('cfd064fe-40c0-451d-ad1e-2f8c50f6a67f', 'fecf5068-a85a-42f5-af59-25340fb528d0', 'Monthly'::package_plan, 4000, '2026-06-25'::date, '2026-09-18'::date, 'active'::package_status, 'pending'::payment_status, 'WEEKEND', 4000, 0, 'cash', '2026-06-25'::date, 3390, 610, 0.18, 11, 36, 2, 0, '2026-09-18'::date),
('4a0e6567-173a-45ef-a523-57782a379d3f', '18acab55-2ba0-40be-a731-7ed22ada36b1', 'Monthly'::package_plan, 4000, '2026-06-25'::date, '2026-09-23'::date, 'active'::package_status, 'paid'::payment_status, 'WEEKEND', 4000, 0, 'cash', '2026-06-25'::date, 3390, 610, 0.18, 21, 36, 0, 0, '2026-09-23'::date),
('2c9665f1-91e2-4f0b-a453-7c9b3c75adb2', '045bd30f-2c33-4ed2-addc-aabd8fa39be1', 'Monthly'::package_plan, 4000, '2026-06-25'::date, '2026-09-30'::date, 'active'::package_status, 'paid'::payment_status, 'WEEKEND', 4000, 0, 'cash', '2026-06-25'::date, 3390, 610, 0.18, 20, 36, 0, 0, '2026-09-30'::date),
('ee21c722-9e03-4073-a12f-748c183ed43b', '7755fae3-5199-493d-a9ad-264bea982ae8', 'Monthly'::package_plan, 4000, '2026-06-25'::date, '2026-09-20'::date, 'active'::package_status, 'paid'::payment_status, 'WEEKEND', 4000, 0, 'cash', '2026-06-25'::date, 3390, 610, 0.18, 11, 36, 0, 0, '2026-09-20'::date),
('8b4230bf-632d-4979-aac3-1a742caff306', '64c4cb01-477f-449d-abb2-5a886233b532', 'Monthly'::package_plan, 4000, '2026-06-25'::date, '2026-10-13'::date, 'active'::package_status, 'paid'::payment_status, 'WEEKEND', 4000, 0, 'cash', '2026-06-25'::date, 3390, 610, 0.18, 23, 36, 0, 0, '2026-10-13'::date),
('73f2fba7-789e-4a29-af18-44535bb0b33c', '3426b026-756c-4585-ade9-04343861aa60', 'Monthly'::package_plan, 4000, '2026-06-25'::date, '2026-09-27'::date, 'active'::package_status, 'paid'::payment_status, 'WEEKEND', 4000, 0, 'cash', '2026-06-25'::date, 3390, 610, 0.18, 10, 36, 0, 0, '2026-09-27'::date),
('72866a56-c7e0-40aa-a956-c8d050fb564a', '412aaf7f-0409-4eeb-a183-f4bb9eadd936', 'Monthly'::package_plan, 4000, '2026-06-25'::date, '2026-09-20'::date, 'active'::package_status, 'paid'::payment_status, 'WEEKEND', 4000, 0, 'cash', '2026-06-25'::date, 3390, 610, 0.18, 11, 36, 0, 0, '2026-09-20'::date),
('7d7a660e-4a1d-4947-ae60-52e90fa65431', 'c5388f69-64a8-4ef3-a3a4-70c2099e028b', 'Monthly'::package_plan, 4000, '2026-06-25'::date, '2026-10-06'::date, 'active'::package_status, 'paid'::payment_status, 'WEEKEND', 4000, 0, 'cash', '2026-06-25'::date, 3390, 610, 0.18, 16, 36, 0, 0, '2026-10-06'::date),
('5697bd82-1340-4412-a2ec-c766ffe1a541', '91b19e7b-edd4-4f60-a4a4-5cf9b7aa9a67', 'Monthly'::package_plan, 4000, '2026-06-25'::date, '2026-10-26'::date, 'active'::package_status, 'paid'::payment_status, 'WEEKEND', 4000, 0, 'cash', '2026-06-25'::date, 3390, 610, 0.18, 21, 36, 0, 0, '2026-10-26'::date);

-- ----------------------------------------------------------------------------
-- SCHEDULE
-- ----------------------------------------------------------------------------
INSERT INTO schedule (
  id, type, student_id, coach_id, entity, day, start_time, end_time, 
  location, status, student_name
) VALUES
('4617ba02-10a4-4a09-a4da-5692b3f77a0c', 'one_on_one'::schedule_type, NULL, 'd454187b-f9e7-4354-a81c-1c6a9326ba42', 'the-club'::entity_type, 'MWF', '06:00', '07:00', 'court_2', 'CONFIRMED', 'Vivaan Lodha'),
('9130ec3e-c150-436b-a1b8-801a7b1e7d51', 'one_on_one'::schedule_type, NULL, '914754be-b79f-49fa-ae88-b58aa92f45ab', 'the-club'::entity_type, 'MWF', '06:00', '07:00', 'court_3', 'CONFIRMED', 'Mihail M'),
('003838dc-8315-4039-a1db-d44413773ecf', 'one_on_one'::schedule_type, NULL, '534116a3-b9a0-4b0e-a93b-98843988f9a8', 'the-club'::entity_type, 'MWF', '06:00', '07:00', 'court_4', 'CONFIRMED', 'Arjun Choudhary'),
('26f97bef-b4de-4b13-a35a-31f5becce793', 'one_on_one'::schedule_type, NULL, '0c92d8fe-030e-43dc-a067-356f8bca8573', 'the-club'::entity_type, 'MWF', '07:00', '08:00', 'court_4', 'CONFIRMED', 'Shauraya Sekhani'),
('88f6ec64-fcf6-4f9b-aeb1-24a5ea3dd8bf', 'one_on_one'::schedule_type, NULL, '534116a3-b9a0-4b0e-a93b-98843988f9a8', 'the-club'::entity_type, 'MWF', '08:00', '09:00', 'court_4', 'CONFIRMED', 'Arhaan Sanghvi'),
('7988ef1e-0449-49f1-ae79-1120cc291be2', 'one_on_one'::schedule_type, NULL, '914754be-b79f-49fa-ae88-b58aa92f45ab', 'the-club'::entity_type, 'MWF', '09:00', '10:00', 'court_4', 'CONFIRMED', 'Ananya Rajani'),
('660a2c87-8379-4e96-ae96-5151e4390c06', 'one_on_one'::schedule_type, NULL, '25194099-ebb5-4236-aaac-8f16208bca11', 'the-club'::entity_type, 'MWF', '18:00', '19:00', 'court_4', 'CONFIRMED', 'Amara Yalla'),
('79920993-0b05-4a5c-a170-37fa222498bd', 'one_on_one'::schedule_type, NULL, '7c25b62d-e407-4b59-a3f4-2219648276ea', 'the-club'::entity_type, 'MWF', '19:00', '20:00', 'court_4', 'CONFIRMED', 'Ivana Ganeriwal'),
('7050ff9f-6b5a-4c99-ae44-582e57458da4', 'one_on_one'::schedule_type, NULL, '7c25b62d-e407-4b59-a3f4-2219648276ea', 'the-club'::entity_type, 'MWF', '20:00', '21:00', 'court_4', 'CONFIRMED', 'Zayn Winston'),
('03c8f0e5-0f95-40f8-afe8-376934f51883', 'one_on_one'::schedule_type, NULL, '00e7a723-d95f-44c1-ad08-3acfad99f892', 'the-club'::entity_type, 'MWF', '06:00', '07:00', 'court_5', 'CONFIRMED', 'Aadvik Shah'),
('83b7ddec-cbc7-4819-a33f-6c1be3719e56', 'one_on_one'::schedule_type, NULL, '77c79e55-c804-4327-ae24-41203bf670fb', 'the-club'::entity_type, 'MWF', '07:00', '08:00', 'court_5', 'CONFIRMED', 'Devin Pittan'),
('fd6ed529-925b-432e-abf0-82f17fa32ef9', 'one_on_one'::schedule_type, NULL, '00e7a723-d95f-44c1-ad08-3acfad99f892', 'the-club'::entity_type, 'MWF', '08:00', '09:00', 'court_5', 'CONFIRMED', 'Hirvaan Mehta'),
('7445220f-5629-4a0c-a840-0e90e9f46d4b', 'one_on_one'::schedule_type, NULL, '77c79e55-c804-4327-ae24-41203bf670fb', 'the-club'::entity_type, 'MWF', '09:00', '10:00', 'court_5', 'CONFIRMED', 'Kaira Vajifdar'),
('de1367f7-12d3-40dd-a985-6bb53b398eee', 'one_on_one'::schedule_type, NULL, '7c25b62d-e407-4b59-a3f4-2219648276ea', 'the-club'::entity_type, 'MWF', '18:15', '19:15', 'court_5', 'CONFIRMED', 'Kavir Chopra'),
('acc26cb4-03e2-4803-ad86-06b19f7aa992', 'one_on_one'::schedule_type, NULL, '7c25b62d-e407-4b59-a3f4-2219648276ea', 'the-club'::entity_type, 'MWF', '19:15', '20:15', 'court_5', 'CONFIRMED', 'Shivan Chauhan'),
('cde2e6b0-6983-44da-ac36-b678ea6c78e1', 'one_on_one'::schedule_type, NULL, '7c25b62d-e407-4b59-a3f4-2219648276ea', 'the-club'::entity_type, 'MWF', '20:15', '21:15', 'court_5', 'CONFIRMED', 'Advait Parekh'),
('edf575d6-f6a4-45f5-a323-3e1b51dd9338', 'one_on_one'::schedule_type, NULL, '00e7a723-d95f-44c1-ad08-3acfad99f892', 'the-club'::entity_type, 'MWF', '06:00', '07:00', 'court_6', 'CONFIRMED', 'Aarush Mehta'),
('ecb54bba-e92e-4c3e-ade7-fc779b0eb522', 'one_on_one'::schedule_type, NULL, '77c79e55-c804-4327-ae24-41203bf670fb', 'the-club'::entity_type, 'MWF', '07:00', '08:00', 'court_6', 'CONFIRMED', 'Vivaan Mehra'),
('68e84e41-09c7-4b0e-aa81-0e071c5a45d4', 'one_on_one'::schedule_type, NULL, 'd454187b-f9e7-4354-a81c-1c6a9326ba42', 'the-club'::entity_type, 'TTS', '14:30', '15:30', 'court_3', 'CONFIRMED', 'Arun N'),
('fc6152b9-7a16-4698-a7ae-bf5bbfcdc357', 'one_on_one'::schedule_type, NULL, 'd454187b-f9e7-4354-a81c-1c6a9326ba42', 'the-club'::entity_type, 'TTS', '15:30', '16:30', 'court_3', 'CONFIRMED', 'Ahaan Kewalramani'),
('4397c271-3a4a-4f9e-a551-f1dcb80936fc', 'one_on_one'::schedule_type, NULL, '534116a3-b9a0-4b0e-a93b-98843988f9a8', 'the-club'::entity_type, 'TTS', '07:30', '08:30', 'court_4', 'CONFIRMED', 'Viana Shah'),
('06ce1db4-d807-4f1d-ad93-a44abefae888', 'one_on_one'::schedule_type, NULL, '534116a3-b9a0-4b0e-a93b-98843988f9a8', 'the-club'::entity_type, 'TTS', '08:30', '10:00', 'court_4', 'CONFIRMED', 'Anahat Goenka'),
('c91adba4-df15-4c76-a625-ab16b7a58811', 'one_on_one'::schedule_type, NULL, '914754be-b79f-49fa-ae88-b58aa92f45ab', 'the-club'::entity_type, 'TTS', '14:30', '15:30', 'court_4', 'CONFIRMED', 'Avish Shah'),
('7d654c15-2aab-4371-a274-e51af6c1def2', 'one_on_one'::schedule_type, NULL, '914754be-b79f-49fa-ae88-b58aa92f45ab', 'the-club'::entity_type, 'TTS', '15:30', '17:00', 'court_4', 'CONFIRMED', 'Anaiza Jhaveri'),
('1e08f2e5-5aa7-4a03-a92b-26157f64a0fd', 'one_on_one'::schedule_type, NULL, '25194099-ebb5-4236-aaac-8f16208bca11', 'the-club'::entity_type, 'TTS', '18:00', '19:00', 'court_4', 'CONFIRMED', 'Kianna Jain'),
('6b1f36c9-74c8-447a-a18f-3a53840c17c9', 'one_on_one'::schedule_type, NULL, '25194099-ebb5-4236-aaac-8f16208bca11', 'the-club'::entity_type, 'TTS', '19:00', '20:00', 'court_4', 'CONFIRMED', 'Parth Mehta'),
('57665233-45d6-4ae8-a4c4-82a532167391', 'one_on_one'::schedule_type, NULL, '25194099-ebb5-4236-aaac-8f16208bca11', 'the-club'::entity_type, 'TTS', '20:00', '21:00', 'court_4', 'CONFIRMED', 'Tanuj Gupte'),
('58a16cec-2cb8-4ac9-af58-48e85cb23ff2', 'one_on_one'::schedule_type, NULL, '77c79e55-c804-4327-ae24-41203bf670fb', 'the-club'::entity_type, 'TTS', '08:00', '09:00', 'court_5', 'CONFIRMED', 'Shivaay Ruia'),
('ea97d145-7498-468a-ace7-db7e47d45bd0', 'one_on_one'::schedule_type, NULL, '77c79e55-c804-4327-ae24-41203bf670fb', 'the-club'::entity_type, 'TTS', '09:00', '10:00', 'court_5', 'CONFIRMED', 'Vansh Katari'),
('48ee6d5d-0ee5-4fe7-a5e7-fa65099f640f', 'one_on_one'::schedule_type, NULL, '7c25b62d-e407-4b59-a3f4-2219648276ea', 'the-club'::entity_type, 'TTS', '18:00', '19:00', 'court_5', 'CONFIRMED', 'Prabhit Kanakia'),
('c2abbf78-ad73-4094-add7-807ee99c1c32', 'one_on_one'::schedule_type, NULL, '7c25b62d-e407-4b59-a3f4-2219648276ea', 'the-club'::entity_type, 'TTS', '19:00', '20:00', 'court_5', 'CONFIRMED', 'Dhven Mukhi'),
('5ab2b2d2-72a8-4e54-a49a-94b0f34c1f5c', 'one_on_one'::schedule_type, NULL, '7c25b62d-e407-4b59-a3f4-2219648276ea', 'the-club'::entity_type, 'TTS', '20:00', '21:00', 'court_5', 'CONFIRMED', 'Ziana Vora'),
('3a92cc37-631d-4656-a58a-8e7714260b75', 'one_on_one'::schedule_type, NULL, '00e7a723-d95f-44c1-ad08-3acfad99f892', 'the-club'::entity_type, 'TTS', '06:00', '07:00', 'court_6', 'CONFIRMED', 'Kyra Golcha'),
('c852d503-da42-4f5f-a4c6-85e827a0db15', 'one_on_one'::schedule_type, NULL, '00e7a723-d95f-44c1-ad08-3acfad99f892', 'the-club'::entity_type, 'TTS', '07:00', '08:00', 'court_6', 'CONFIRMED', 'Aditya Kapadia'),
('8fa7ae4d-dc8a-4d1d-a6ce-bace4037644a', 'one_on_one'::schedule_type, NULL, '00e7a723-d95f-44c1-ad08-3acfad99f892', 'the-club'::entity_type, 'TTS', '08:00', '09:00', 'court_6', 'CONFIRMED', 'Ananya Kapadia');


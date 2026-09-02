-- ============================================================================
-- Arnav Jain Tennis Academy — UC-3 Schema Migration
-- Supabase Postgres Migration 002
-- Adds: no_response confirmation status, sessions_consumed, remaining_balance
-- Run via: Supabase SQL Editor
-- ============================================================================

-- 1. Add 'no_response' to confirmation_status enum
ALTER TYPE confirmation_status ADD VALUE IF NOT EXISTS 'no_response';

-- 2. Add sessions_consumed to packages (track how many sessions the student has attended)
ALTER TABLE packages
  ADD COLUMN IF NOT EXISTS sessions_consumed integer NOT NULL DEFAULT 0;

-- 3. Add remaining_balance to packages (computed as sessions_consumed - total_allowed)
-- Only meaningful for session-limited packages; for date-based packages this is informational
ALTER TABLE packages
  ADD COLUMN IF NOT EXISTS remaining_balance integer NOT NULL DEFAULT 0;

-- 4. Add total_sessions to packages (the total number of sessions allowed in the package)
-- Default 0 means "unlimited / date-based"; >0 means "session-limited"
ALTER TABLE packages
  ADD COLUMN IF NOT EXISTS total_sessions integer NOT NULL DEFAULT 0;

-- ============================================================================
-- FUNCTION: Mark attendance and update package session counters
-- Called by the frontend via triggerWorkflow('attendance.mark')
-- Uses SECURITY DEFINER to bypass RLS with service_role context
-- ============================================================================
CREATE OR REPLACE FUNCTION mark_student_attendance(
  p_student_id uuid,
  p_batch_id uuid,
  p_coach_id uuid,
  p_attendance_date date,
  p_status attendance_status,
  p_check_in time DEFAULT NULL,
  p_check_out time DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_attendance_id uuid;
  v_package_id uuid;
BEGIN
  -- Upsert the attendance record
  INSERT INTO attendance (student_id, batch_id, coach_id, date, status, check_in, check_out)
  VALUES (p_student_id, p_batch_id, p_coach_id, p_attendance_date, p_status, p_check_in, p_check_out)
  ON CONFLICT (student_id, batch_id, date)
  DO UPDATE SET
    status = EXCLUDED.status,
    check_in = COALESCE(EXCLUDED.check_in, attendance.check_in),
    check_out = COALESCE(EXCLUDED.check_out, attendance.check_out),
    updated_at = now()
  RETURNING id INTO v_attendance_id;

  -- If marked present, find the active package and increment sessions_consumed
  IF p_status = 'present' THEN
    SELECT id INTO v_package_id
    FROM packages
    WHERE student_id = p_student_id
      AND status = 'active'
    ORDER BY expiry_date DESC
    LIMIT 1;

    IF v_package_id IS NOT NULL THEN
      UPDATE packages
      SET sessions_consumed = sessions_consumed + 1,
          remaining_balance = total_sessions - (sessions_consumed + 1)
      WHERE id = v_package_id
        AND total_sessions > 0
        AND sessions_consumed < total_sessions;
    END IF;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'attendance_id', v_attendance_id,
    'package_id', v_package_id
  );
END;
$$;

-- ============================================================================
-- INDEX: packages total_sessions for package validity queries
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_packages_total_sessions ON packages(total_sessions);
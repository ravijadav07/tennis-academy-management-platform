-- ============================================================================
-- Arnav Jain Tennis Academy — Database Schema
-- Supabase Postgres Migration 001
-- Run via: Supabase SQL Editor or `supabase db push`
-- ============================================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- ENUMS
-- ============================================================================
CREATE TYPE entity_type AS ENUM ('the-club', 'tots-tennis');
CREATE TYPE student_status AS ENUM ('active', 'injured', 'inactive', 'completed');
CREATE TYPE student_level AS ENUM ('beginner', 'intermediate', 'advanced', 'all');
CREATE TYPE batch_status AS ENUM ('active', 'inactive');
CREATE TYPE coach_status AS ENUM ('active', 'on_leave', 'inactive');
CREATE TYPE package_status AS ENUM ('active', 'expired', 'cancelled', 'lapsed');
CREATE TYPE payment_status AS ENUM ('paid', 'pending', 'overdue');
CREATE TYPE payment_gateway AS ENUM ('stripe', 'cc_avenue', 'excel_reported');
CREATE TYPE package_plan AS ENUM ('Monthly', 'Quarterly', '4-Week');
CREATE TYPE schedule_type AS ENUM ('group', 'one_on_one', 'cancelled');
CREATE TYPE confirmation_status AS ENUM ('confirmed_yes', 'sent_no_reply', 'declined_no', 'not_sent');
CREATE TYPE attendance_status AS ENUM ('present', 'absent', 'late');
CREATE TYPE coach_attendance_status AS ENUM ('present', 'absent', 'late', 'leave');
CREATE TYPE reminder_stage AS ENUM ('d_minus_7', 'd_minus_3', 'd_minus_1', 'expiry_day', 'd_plus_1', 'd_plus_7');
CREATE TYPE reminder_channel AS ENUM ('email', 'sms', 'whatsapp');
CREATE TYPE reminder_status AS ENUM ('pending', 'sent', 'failed');
CREATE TYPE leave_type AS ENUM ('casual', 'sick');
CREATE TYPE leave_request_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE comm_type AS ENUM ('welcome', 'reminder', 'confirmation', 'progress_report', 'certificate', 'invoice');
CREATE TYPE comm_channel AS ENUM ('email', 'sms', 'whatsapp');
CREATE TYPE comm_status AS ENUM ('pending', 'sent', 'delivered', 'failed');
CREATE TYPE progress_category AS ENUM ('forehand', 'backhand', 'serve', 'fitness', 'footwork', 'match_play');
CREATE TYPE reconciliation_status AS ENUM ('matched', 'mismatch', 'new');

-- Aug 2026 MoM additions: payroll entity-specific fields, absence alert settings
CREATE TYPE session_period_type AS ENUM ('half_day', 'full_day');
CREATE TYPE approval_status_type AS ENUM ('pending', 'approved');
CREATE TYPE marked_by_type AS ENUM ('coach', 'admin');
ALTER TYPE comm_type ADD VALUE IF NOT EXISTS 'absence_alert';
ALTER TYPE comm_type ADD VALUE IF NOT EXISTS 'payroll';
CREATE TYPE account_status AS ENUM ('active', 'inactive');

-- ============================================================================
-- AUTO-UPDATE TRIGGER FUNCTION
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TABLES
-- ============================================================================

-- 1. coaches
CREATE TABLE coaches (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name            text NOT NULL,
    phone           text,
    email           text,
    specialization  text,
    entity          entity_type NOT NULL,
    status          coach_status NOT NULL DEFAULT 'active',
    payroll_rate    integer NOT NULL DEFAULT 0,
    join_date       date,
    photo_url       text,
    created_at      timestamptz DEFAULT now(),
    updated_at      timestamptz DEFAULT now()
);
CREATE TRIGGER trg_coaches_updated_at BEFORE UPDATE ON coaches
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 2. batches
CREATE TABLE batches (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name            text NOT NULL,
    coach_id        uuid REFERENCES coaches(id) ON DELETE SET NULL,
    entity          entity_type NOT NULL,
    level           student_level NOT NULL,
    schedule_text   text,
    capacity        integer NOT NULL,
    location        text,
    age_group       text,
    status          batch_status NOT NULL DEFAULT 'active',
    created_at      timestamptz DEFAULT now(),
    updated_at      timestamptz DEFAULT now()
);
CREATE TRIGGER trg_batches_updated_at BEFORE UPDATE ON batches
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 3. students
CREATE TABLE students (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name            text NOT NULL,
    age             integer,
    age_group       text,
    level           student_level NOT NULL,
    batch_id        uuid REFERENCES batches(id) ON DELETE SET NULL,
    coach_id        uuid REFERENCES coaches(id) ON DELETE SET NULL,
    entity          entity_type NOT NULL,
    status          student_status NOT NULL DEFAULT 'active',
    join_date       date,
    photo_url       text,
    document_url    text,
    created_at      timestamptz DEFAULT now(),
    updated_at      timestamptz DEFAULT now()
);
CREATE TRIGGER trg_students_updated_at BEFORE UPDATE ON students
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 4. parents
CREATE TABLE parents (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name            text NOT NULL,
    phone           text NOT NULL,
    email           text,
    entity          entity_type NOT NULL,
    account_status  account_status NOT NULL DEFAULT 'active',
    created_at      timestamptz DEFAULT now(),
    updated_at      timestamptz DEFAULT now()
);
CREATE TRIGGER trg_parents_updated_at BEFORE UPDATE ON parents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 5. student_parents (junction)
CREATE TABLE student_parents (
    student_id      uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    parent_id       uuid NOT NULL REFERENCES parents(id) ON DELETE CASCADE,
    PRIMARY KEY (student_id, parent_id)
);

-- 6. packages
CREATE TABLE packages (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id      uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    plan_type       package_plan NOT NULL,
    amount          integer NOT NULL,
    start_date      date NOT NULL,
    expiry_date     date NOT NULL,
    status          package_status NOT NULL DEFAULT 'active',
    payment_status  payment_status NOT NULL DEFAULT 'pending',
    reminder_stage  reminder_stage,
    last_reminder_at timestamptz,
    overdue_days    integer NOT NULL DEFAULT 0,
    created_at      timestamptz DEFAULT now(),
    updated_at      timestamptz DEFAULT now()
);
CREATE TRIGGER trg_packages_updated_at BEFORE UPDATE ON packages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 7. schedule
CREATE TABLE schedule (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    type            schedule_type NOT NULL,
    batch_id        uuid REFERENCES batches(id) ON DELETE SET NULL,
    student_id      uuid REFERENCES students(id) ON DELETE SET NULL,
    coach_id        uuid REFERENCES coaches(id) ON DELETE SET NULL,
    entity          entity_type NOT NULL,
    day             text NOT NULL,
    start_time      time NOT NULL,
    end_time        time NOT NULL,
    location        text,
    status          text NOT NULL DEFAULT 'confirmed',
    confirmation    confirmation_status,
    cancelled_reason text,
    cancelled_type  text,
    created_at      timestamptz DEFAULT now(),
    updated_at      timestamptz DEFAULT now()
);
CREATE TRIGGER trg_schedule_updated_at BEFORE UPDATE ON schedule
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 8. attendance
CREATE TABLE attendance (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id      uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    batch_id        uuid REFERENCES batches(id) ON DELETE SET NULL,
    coach_id        uuid REFERENCES coaches(id) ON DELETE SET NULL,
    date            date NOT NULL,
    status          attendance_status NOT NULL,
    check_in        time,
    check_out       time,
    created_at      timestamptz DEFAULT now(),
    updated_at      timestamptz DEFAULT now(),
    UNIQUE (student_id, batch_id, date)
);
CREATE TRIGGER trg_attendance_updated_at BEFORE UPDATE ON attendance
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 9. coach_attendance
CREATE TABLE coach_attendance (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    coach_id        uuid NOT NULL REFERENCES coaches(id) ON DELETE CASCADE,
    date            date NOT NULL,
    status          coach_attendance_status NOT NULL,
    sessions_count  integer DEFAULT 0,
    created_at      timestamptz DEFAULT now(),
    updated_at      timestamptz DEFAULT now(),
    UNIQUE (coach_id, date)
);
CREATE TRIGGER trg_coach_attendance_updated_at BEFORE UPDATE ON coach_attendance
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 10. payments
CREATE TABLE payments (
    id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id              uuid REFERENCES students(id) ON DELETE SET NULL,
    parent_id               uuid REFERENCES parents(id) ON DELETE SET NULL,
    entity                  entity_type NOT NULL,
    amount                  integer NOT NULL,
    date                    date NOT NULL,
    gateway                 payment_gateway NOT NULL,
    type                    package_plan NOT NULL,
    status                  payment_status NOT NULL DEFAULT 'pending',
    invoice_id              text,
    stripe_payment_intent_id text,
    created_at              timestamptz DEFAULT now(),
    updated_at              timestamptz DEFAULT now()
);
CREATE TRIGGER trg_payments_updated_at BEFORE UPDATE ON payments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 11. reconciliation
CREATE TABLE reconciliation (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id      uuid REFERENCES students(id) ON DELETE SET NULL,
    entity          entity_type NOT NULL,
    excel_amount    integer NOT NULL,
    system_amount   integer NOT NULL DEFAULT 0,
    gateway         payment_gateway,
    status          reconciliation_status NOT NULL DEFAULT 'new',
    date            date NOT NULL,
    note            text,
    created_at      timestamptz DEFAULT now(),
    updated_at      timestamptz DEFAULT now()
);
CREATE TRIGGER trg_reconciliation_updated_at BEFORE UPDATE ON reconciliation
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 12. reminders
CREATE TABLE reminders (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id      uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    package_id      uuid NOT NULL REFERENCES packages(id) ON DELETE CASCADE,
    channel         reminder_channel NOT NULL,
    stage           reminder_stage NOT NULL,
    status          reminder_status NOT NULL DEFAULT 'pending',
    sent_at         timestamptz,
    message_body    text,
    created_at      timestamptz DEFAULT now()
);

-- 13. workflow_state
CREATE TABLE workflow_state (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_key    text NOT NULL,
    entity_key      text,
    entity_value    text,
    state_json      jsonb NOT NULL DEFAULT '{}',
    created_at      timestamptz DEFAULT now(),
    updated_at      timestamptz DEFAULT now(),
    UNIQUE (workflow_key, entity_key, entity_value)
);
CREATE TRIGGER trg_workflow_state_updated_at BEFORE UPDATE ON workflow_state
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 14. leave_requests
CREATE TABLE leave_requests (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    coach_id        uuid NOT NULL REFERENCES coaches(id) ON DELETE CASCADE,
    type            leave_type NOT NULL,
    start_date      date NOT NULL,
    end_date        date NOT NULL,
    reason          text,
    status          leave_request_status NOT NULL DEFAULT 'pending',
    created_at      timestamptz DEFAULT now(),
    updated_at      timestamptz DEFAULT now()
);
CREATE TRIGGER trg_leave_requests_updated_at BEFORE UPDATE ON leave_requests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 15. progress
CREATE TABLE progress (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id      uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    category        progress_category NOT NULL,
    rating          integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
    note            text,
    date            date NOT NULL,
    created_at      timestamptz DEFAULT now()
);

-- 16. communications_log
CREATE TABLE communications_log (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id      uuid REFERENCES students(id) ON DELETE SET NULL,
    parent_id       uuid REFERENCES parents(id) ON DELETE SET NULL,
    type            comm_type NOT NULL,
    channel         comm_channel NOT NULL,
    status          comm_status NOT NULL DEFAULT 'pending',
    date            date NOT NULL,
    file_link       text,
    created_at      timestamptz DEFAULT now()
);

-- ============================================================================
-- INDEXES
-- ============================================================================
CREATE INDEX idx_students_entity ON students(entity);
CREATE INDEX idx_students_coach_id ON students(coach_id);
CREATE INDEX idx_students_batch_id ON students(batch_id);
CREATE INDEX idx_students_status ON students(status);
CREATE INDEX idx_packages_expiry_date ON packages(expiry_date);
CREATE INDEX idx_packages_student_id ON packages(student_id);
CREATE INDEX idx_packages_status ON packages(status);
CREATE INDEX idx_packages_payment_status ON packages(payment_status);
CREATE INDEX idx_packages_overdue_days ON packages(overdue_days);
CREATE INDEX idx_schedule_day ON schedule(day);
CREATE INDEX idx_schedule_coach_id ON schedule(coach_id);
CREATE INDEX idx_schedule_type ON schedule(type);
CREATE INDEX idx_schedule_entity ON schedule(entity);
CREATE INDEX idx_attendance_date ON attendance(date);
CREATE INDEX idx_attendance_student_id ON attendance(student_id);
CREATE INDEX idx_attendance_batch_id ON attendance(batch_id);
CREATE INDEX idx_coach_attendance_date ON coach_attendance(date);
CREATE INDEX idx_coach_attendance_coach_id ON coach_attendance(coach_id);
CREATE INDEX idx_payments_date ON payments(date);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_student_id ON payments(student_id);
CREATE INDEX idx_payments_entity ON payments(entity);
CREATE INDEX idx_reminders_package_id ON reminders(package_id);
CREATE INDEX idx_reminders_status ON reminders(status);
CREATE INDEX idx_reminders_stage ON reminders(stage);
CREATE INDEX idx_workflow_state_lookup ON workflow_state(workflow_key, entity_key, entity_value);
CREATE INDEX idx_leave_requests_coach_id ON leave_requests(coach_id);
CREATE INDEX idx_leave_requests_status ON leave_requests(status);
CREATE INDEX idx_progress_student_id ON progress(student_id);
CREATE INDEX idx_comm_log_student_id ON communications_log(student_id);
CREATE INDEX idx_comm_log_parent_id ON communications_log(parent_id);
CREATE INDEX idx_reconciliation_status ON reconciliation(status);
CREATE INDEX idx_reconciliation_date ON reconciliation(date);

-- ============================================================================
-- Aug 2026 MoM: Schema additions for entity-specific payroll, absence alerts, manual attendance
-- ============================================================================

-- Coaches: add hourly billing fields for TOTS Tennis
ALTER TABLE coaches ADD COLUMN IF NOT EXISTS hours_logged INTEGER DEFAULT 0;
ALTER TABLE coaches ADD COLUMN IF NOT EXISTS hourly_rate INTEGER DEFAULT 0;

-- Schedule: add session_period for The Club half-day/full-day tracking
ALTER TABLE schedule ADD COLUMN IF NOT EXISTS session_period session_period_type;

-- Attendance: add session_period and marked_by fields
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS session_period session_period_type;
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS marked_by marked_by_type DEFAULT 'coach';
-- Allow batch_id to be NULL for trial/out-of-schedule entries
ALTER TABLE attendance ALTER COLUMN batch_id DROP NOT NULL;

-- Coach attendance: add session_period and approval_status for Club payroll gate
ALTER TABLE coach_attendance ADD COLUMN IF NOT EXISTS session_period session_period_type;
ALTER TABLE coach_attendance ADD COLUMN IF NOT EXISTS approval_status approval_status_type DEFAULT 'pending';

-- Platform settings table for admin-configurable values (e.g., absence alert delay)
CREATE TABLE IF NOT EXISTS platform_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Insert default absence alert delay (2 hours)
INSERT INTO platform_settings (key, value) VALUES ('absence_alert_delay_hours', '2')
ON CONFLICT (key) DO NOTHING;

-- ============================================================================
-- RLS — Enable on all tables
-- ============================================================================
ALTER TABLE coaches ENABLE ROW LEVEL SECURITY;
ALTER TABLE batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE parents ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_parents ENABLE ROW LEVEL SECURITY;
ALTER TABLE packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE coach_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE reconciliation ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE communications_log ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS POLICIES
-- Note: Workflows use service_role key (bypasses RLS).
-- These policies are for the React frontend's anon key access.
-- ============================================================================

-- Admin: full access to everything (role checked via auth.jwt())
CREATE POLICY "admin_full_access" ON coaches FOR ALL USING (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin');
CREATE POLICY "admin_full_access" ON batches FOR ALL USING (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin');
CREATE POLICY "admin_full_access" ON students FOR ALL USING (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin');
CREATE POLICY "admin_full_access" ON parents FOR ALL USING (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin');
CREATE POLICY "admin_full_access" ON student_parents FOR ALL USING (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin');
CREATE POLICY "admin_full_access" ON packages FOR ALL USING (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin');
CREATE POLICY "admin_full_access" ON schedule FOR ALL USING (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin');
CREATE POLICY "admin_full_access" ON attendance FOR ALL USING (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin');
CREATE POLICY "admin_full_access" ON coach_attendance FOR ALL USING (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin');
CREATE POLICY "admin_full_access" ON payments FOR ALL USING (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin');
CREATE POLICY "admin_full_access" ON reconciliation FOR ALL USING (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin');
CREATE POLICY "admin_full_access" ON leave_requests FOR ALL USING (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin');
CREATE POLICY "admin_full_access" ON progress FOR ALL USING (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin');
CREATE POLICY "admin_full_access" ON communications_log FOR ALL USING (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin');

-- Coach: see own data
CREATE POLICY "coach_own_data" ON coaches FOR SELECT
    USING (auth.uid() = id);
CREATE POLICY "coach_own_schedule" ON schedule FOR SELECT
    USING (coach_id = auth.uid());
CREATE POLICY "coach_own_attendance" ON attendance FOR SELECT
    USING (coach_id = auth.uid());
CREATE POLICY "coach_own_coach_attendance" ON coach_attendance FOR SELECT
    USING (coach_id = auth.uid());
CREATE POLICY "coach_own_leave" ON leave_requests FOR SELECT
    USING (coach_id = auth.uid());
CREATE POLICY "coach_own_students" ON students FOR SELECT
    USING (coach_id = auth.uid());
CREATE POLICY "coach_manage_attendance" ON attendance FOR UPDATE
    USING (coach_id = auth.uid())
    WITH CHECK (coach_id = auth.uid());

-- Parent: see own children's data via student_parents junction
CREATE POLICY "parent_own_children" ON student_parents FOR SELECT
    USING (parent_id = auth.uid());
CREATE POLICY "parent_own_students" ON students FOR SELECT
    USING (id IN (SELECT student_id FROM student_parents WHERE parent_id = auth.uid()));
CREATE POLICY "parent_own_packages" ON packages FOR SELECT
    USING (student_id IN (SELECT student_id FROM student_parents WHERE parent_id = auth.uid()));
CREATE POLICY "parent_own_attendance" ON attendance FOR SELECT
    USING (student_id IN (SELECT student_id FROM student_parents WHERE parent_id = auth.uid()));
CREATE POLICY "parent_own_schedule" ON schedule FOR SELECT
    USING (
        (student_id IN (SELECT student_id FROM student_parents WHERE parent_id = auth.uid()))
        OR type = 'group'
    );
CREATE POLICY "parent_own_payments" ON payments FOR SELECT
    USING (parent_id = auth.uid());
CREATE POLICY "parent_own_progress" ON progress FOR SELECT
    USING (student_id IN (SELECT student_id FROM student_parents WHERE parent_id = auth.uid()));

-- Workflow state and reminders: service_role only (no anon key access)
CREATE POLICY "service_role_only" ON workflow_state FOR ALL USING (false);
CREATE POLICY "service_role_only" ON reminders FOR ALL USING (false);

-- ============================================================================
-- PUBLIC READ POLICIES (for anon-key frontend dashboards)
-- ============================================================================
CREATE POLICY "public_read_packages" ON packages FOR SELECT USING (true);
CREATE POLICY "public_read_students" ON students FOR SELECT USING (true);
CREATE POLICY "public_read_parents" ON parents FOR SELECT USING (true);
CREATE POLICY "public_read_student_parents" ON student_parents FOR SELECT USING (true);
CREATE POLICY "public_read_reminders" ON reminders FOR SELECT USING (true);
CREATE POLICY "public_read_payments" ON payments FOR SELECT USING (true);
CREATE POLICY "public_read_coaches" ON coaches FOR SELECT USING (true);
CREATE POLICY "public_read_batches" ON batches FOR SELECT USING (true);
CREATE POLICY "public_read_schedule" ON schedule FOR SELECT USING (true);
CREATE POLICY "public_read_attendance" ON attendance FOR SELECT USING (true);
CREATE POLICY "public_read_coach_attendance" ON coach_attendance FOR SELECT USING (true);
CREATE POLICY "public_read_leave_requests" ON leave_requests FOR SELECT USING (true);
CREATE POLICY "public_read_progress" ON progress FOR SELECT USING (true);
CREATE POLICY "public_read_reconciliation" ON reconciliation FOR SELECT USING (true);
CREATE POLICY "public_read_communications_log" ON communications_log FOR SELECT USING (true);

-- ============================================================================
-- STORAGE BUCKET
-- ============================================================================
-- Run via Supabase Dashboard > Storage, or manually:
-- INSERT INTO storage.buckets (id, name, public) VALUES ('academy-assets', 'academy-assets', false);

-- Storage RLS (apply after bucket creation):
-- CREATE POLICY "admin_manage_assets" ON storage.objects FOR ALL
--     USING (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin');
-- CREATE POLICY "public_read_assets" ON storage.objects FOR SELECT
--     USING (bucket_id = 'academy-assets');

-- ============================================================================
-- SEED DATA — Realistic Indian tennis academy data
-- ============================================================================

-- Insert coaches
INSERT INTO coaches (name, phone, email, specialization, entity, status, payroll_rate, join_date) VALUES
('Vikram Singh', '9820012345', 'vikram.s@academy.com', 'Advanced Tournament', 'the-club', 'active', 45000, '2024-03-01'),
('Sania Mirza', '9820012346', 'sania.m@academy.com', 'Intermediate', 'the-club', 'active', 35000, '2024-06-15'),
('Rajesh Kumar', '9820012347', 'rajesh.k@academy.com', 'Beginners', 'tots-tennis', 'active', 28000, '2025-01-10'),
('Anjali Thakur', '9820012348', 'anjali.t@academy.com', '1-on-1 Elite', 'the-club', 'active', 55000, '2024-09-01'),
('Suresh Menon', '9820012349', 'suresh.m@academy.com', 'Fitness & Conditioning', 'tots-tennis', 'active', 25000, '2025-03-15'),
('Priya Sharma', '9820012350', 'priya.s@academy.com', 'Women U-14', 'the-club', 'active', 30000, '2025-06-01'),
('Deepak Verma', '9820012351', 'deepak.v@academy.com', 'Advanced Tournament', 'tots-tennis', 'active', 42000, '2024-04-15'),
('Neha Kapoor', '9820012352', 'neha.kp@academy.com', 'Junior Development', 'the-club', 'on_leave', 28000, '2025-08-01'),
('Arun Nair', '9820012353', 'arun.n@academy.com', 'Beginners', 'the-club', 'active', 22000, '2026-02-01'),
('Meera Iyer', '9820012354', 'meera.i@academy.com', '1-on-1', 'tots-tennis', 'active', 38000, '2025-11-01');

-- Insert batches (FK to coaches by name — resolve in a real migration with subqueries)
INSERT INTO batches (name, coach_id, entity, level, schedule_text, capacity, location, age_group, status)
SELECT
    b.name,
    c.id,
    b.entity::entity_type,
    b.level::student_level,
    b.schedule_text,
    b.capacity,
    b.location,
    b.age_group,
    'active'::batch_status
FROM (VALUES
    ('Advanced Tournament', 'Vikram Singh', 'the-club', 'advanced', 'Mon, Wed, Fri 4-6 PM', 20, 'Court 1', 'U-16/U-18'),
    ('Intermediate Group', 'Sania Mirza', 'the-club', 'intermediate', 'Tue, Thu 4-6 PM, Sat 8-10 AM', 24, 'Court 2', 'U-14/U-16'),
    ('Beginner Batch A', 'Rajesh Kumar', 'tots-tennis', 'beginner', 'Mon, Wed 4-5 PM', 16, 'Court 3', 'U-10'),
    ('Beginner Batch B', 'Rajesh Kumar', 'tots-tennis', 'beginner', 'Tue, Thu 4-5 PM', 16, 'Court 3', 'U-10/U-12'),
    ('1-on-1 Elite', 'Anjali Thakur', 'the-club', 'advanced', 'Flexible', 12, 'Court 1', 'All'),
    ('Fitness', 'Suresh Menon', 'tots-tennis', 'all', 'Daily 6-7 AM', 30, 'Gym', 'All'),
    ('Women U-14', 'Priya Sharma', 'the-club', 'intermediate', 'Mon, Wed, Fri 5-7 PM', 16, 'Court 2', 'U-14'),
    ('Advanced Tournament (TT)', 'Deepak Verma', 'tots-tennis', 'advanced', 'Tue, Thu, Sat 4-6 PM', 16, 'Court 4', 'U-16/U-18'),
    ('Junior Dev', 'Neha Kapoor', 'the-club', 'beginner', 'Sat, Sun 9-11 AM', 12, 'Court 3', 'U-8/U-10'),
    ('Beginner Batch C', 'Arun Nair', 'the-club', 'beginner', 'Mon, Wed, Fri 3-4 PM', 16, 'Court 3', 'U-10')
) AS b(name, coach_name, entity, level, schedule_text, capacity, location, age_group)
JOIN coaches c ON c.name = b.coach_name;

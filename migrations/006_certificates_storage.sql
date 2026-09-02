-- ============================================================================
-- Arnav Jain Tennis Academy -- Certificates Table & Storage
-- Supabase Postgres Migration 006
-- Run via: Supabase SQL Editor
-- ============================================================================

-- 1. Certificates table (idempotency + permanent reference)
CREATE TABLE certificates (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id      uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    package_id      uuid NOT NULL REFERENCES packages(id) ON DELETE CASCADE,
    file_path       text NOT NULL,
    generated_at    timestamptz DEFAULT now(),
    created_at      timestamptz DEFAULT now(),
    updated_at      timestamptz DEFAULT now(),
    UNIQUE (student_id, package_id)
);

CREATE TRIGGER trg_certificates_updated_at BEFORE UPDATE ON certificates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 2. Indexes
CREATE INDEX idx_certificates_student_id ON certificates(student_id);
CREATE INDEX idx_certificates_package_id ON certificates(package_id);

-- 3. RLS
ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;

-- Admin: full access
CREATE POLICY "admin_full_access" ON certificates FOR ALL
    USING (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin');

-- Parent: see own children's certificates
CREATE POLICY "parent_own_certificates" ON certificates FOR SELECT
    USING (student_id IN (
        SELECT student_id FROM student_parents WHERE parent_id = auth.uid()
    ));

-- Coach: see own students' certificates
CREATE POLICY "coach_own_certificates" ON certificates FOR SELECT
    USING (student_id IN (
        SELECT id FROM students WHERE coach_id = auth.uid()
    ));

-- Public read for anon-key dashboards
CREATE POLICY "public_read_certificates" ON certificates FOR SELECT USING (true);

-- ============================================================================
-- STORAGE BUCKET (run in Supabase Dashboard > SQL Editor or Storage UI)
-- ============================================================================

-- Create private bucket for certificates
-- INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
-- VALUES ('certificates', 'certificates', false, 10485760, ARRAY['application/pdf']);

-- Storage RLS policies:
-- Service role can manage (used by PDF microservice)
-- CREATE POLICY "service_role_manage_certificates" ON storage.objects FOR ALL
--     USING (auth.role() = 'service_role')
--     WITH CHECK (auth.role() = 'service_role');

-- Authenticated users can read their own student's certificates via signed URLs
-- CREATE POLICY "authenticated_read_certificates" ON storage.objects FOR SELECT
--     USING (auth.role() = 'authenticated' AND bucket_id = 'certificates');

-- No anon access to certificate storage

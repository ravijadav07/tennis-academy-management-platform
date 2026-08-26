-- ============================================================================
-- Arnav Jain Tennis Academy — Public Read Policies for Frontend
-- Supabase Postgres Migration 004
-- The frontend uses mock auth (anon key) — public SELECT policies are needed
-- for dashboards. Writes remain scoped to the Pucho workflows via service_role.
-- ============================================================================

-- Packages (Renewals.jsx, Package.jsx)
CREATE POLICY "public_read_packages" ON packages FOR SELECT USING (true);

-- Students (Renewals.jsx, Package.jsx)
CREATE POLICY "public_read_students" ON students FOR SELECT USING (true);

-- Parents (Renewals.jsx, Package.jsx)
CREATE POLICY "public_read_parents" ON parents FOR SELECT USING (true);

-- Student-Parent junction (Renewals.jsx, Package.jsx)
CREATE POLICY "public_read_student_parents" ON student_parents FOR SELECT USING (true);

-- Reminders (Renewals.jsx drip timeline)
CREATE POLICY "public_read_reminders" ON reminders FOR SELECT USING (true);

-- Payments (Package.jsx payment history)
CREATE POLICY "public_read_payments" ON payments FOR SELECT USING (true);

-- Coaches, Batches, Schedule, Attendance for other admin pages
CREATE POLICY "public_read_coaches" ON coaches FOR SELECT USING (true);
CREATE POLICY "public_read_batches" ON batches FOR SELECT USING (true);
CREATE POLICY "public_read_schedule" ON schedule FOR SELECT USING (true);
CREATE POLICY "public_read_attendance" ON attendance FOR SELECT USING (true);
CREATE POLICY "public_read_coach_attendance" ON coach_attendance FOR SELECT USING (true);
CREATE POLICY "public_read_leave_requests" ON leave_requests FOR SELECT USING (true);
CREATE POLICY "public_read_progress" ON progress FOR SELECT USING (true);
CREATE POLICY "public_read_reconciliation" ON reconciliation FOR SELECT USING (true);
CREATE POLICY "public_read_communications_log" ON communications_log FOR SELECT USING (true);

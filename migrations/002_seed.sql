-- ============================================================================
-- Arnav Jain Tennis Academy — Seed Data
-- Supabase Postgres Migration 002
-- Prerequisite: Run 001_schema.sql first
-- ============================================================================

-- Coaches and batches are seeded in 001_schema.sql.
-- This migration seeds: parents, students, student_parents, packages,
-- schedule, attendance, coach_attendance, payments, reconciliation, reminders.

-- ============================================================================
-- 4. PARENTS
-- ============================================================================
INSERT INTO parents (name, phone, email, entity, account_status) VALUES
('Rajesh Mehta', '9810012345', 'rajesh.m@email.com', 'the-club', 'active'),
('Sunita Reddy', '9810012346', 'sunita.r@email.com', 'the-club', 'active'),
('Manoj Desai', '9810012347', 'manoj.d@email.com', 'tots-tennis', 'active'),
('Harpreet Kaur', '9810012348', 'harpreet.k@email.com', 'tots-tennis', 'active'),
('Vikas Sharma', '9810012349', 'vikas.s@email.com', 'the-club', 'active'),
('Nisha Patel', '9810012350', 'nisha.p@email.com', 'the-club', 'active'),
('Ramesh Joshi', '9810012351', 'ramesh.j@email.com', 'tots-tennis', 'active'),
('Pooja Gupta', '9810012352', 'pooja.g@email.com', 'the-club', 'active'),
('Sandeep Agarwal', '9810012353', 'sandeep.a@email.com', 'tots-tennis', 'active'),
('Kavita Nair', '9810012354', 'kavita.n@email.com', 'the-club', 'active'),
('Deepak Choudhary', '9810012355', 'deepak.c@email.com', 'the-club', 'active'),
('Anita Iyer', '9810012356', 'anita.i@email.com', 'tots-tennis', 'active'),
('Gurpreet Singh', '9810012357', 'gurpreet.s@email.com', 'the-club', 'active'),
('Neelam Malhotra', '9810012358', 'neelam.m@email.com', 'tots-tennis', 'active'),
('Salman Khan', '9810012359', 'salman.k@email.com', 'the-club', 'active');

-- ============================================================================
-- 3. STUDENTS
-- ============================================================================
WITH coach_ids AS (
    SELECT id, name FROM coaches
), batch_ids AS (
    SELECT id, name FROM batches
)
INSERT INTO students (name, age, age_group, level, batch_id, coach_id, entity, status, join_date)
SELECT
    s.name, s.age, s.age_group, s.level::student_level, b.id, c.id, s.entity::entity_type, s.status::student_status, s.join_date::date
FROM (VALUES
    ('Arjun Mehta', 15, 'U-16', 'advanced', 'Advanced Tournament', 'Vikram Singh', 'the-club', 'active', '2026-01-15'),
    ('Kavya Reddy', 13, 'U-14', 'intermediate', 'Intermediate Group', 'Sania Mirza', 'the-club', 'active', '2026-03-01'),
    ('Rohit Desai', 17, 'U-18', 'advanced', 'Advanced Tournament', 'Vikram Singh', 'tots-tennis', 'active', '2025-11-10'),
    ('Simran Kaur', 16, 'U-16', 'intermediate', 'Intermediate Group', 'Sania Mirza', 'tots-tennis', 'active', '2026-02-20'),
    ('Aarav Sharma', 9, 'U-10', 'beginner', 'Beginner Batch A', 'Rajesh Kumar', 'the-club', 'active', '2026-06-01'),
    ('Ananya Patel', 14, 'U-14', 'intermediate', 'Intermediate Group', 'Sania Mirza', 'the-club', 'active', '2026-04-15'),
    ('Vihaan Joshi', 11, 'U-12', 'beginner', 'Beginner Batch B', 'Rajesh Kumar', 'tots-tennis', 'active', '2026-05-10'),
    ('Ishaan Gupta', 16, 'U-16', 'advanced', 'Advanced Tournament', 'Vikram Singh', 'the-club', 'injured', '2025-08-01'),
    ('Diya Agarwal', 8, 'U-10', 'beginner', 'Beginner Batch A', 'Rajesh Kumar', 'tots-tennis', 'active', '2026-07-01'),
    ('Reyansh Nair', 15, 'U-16', 'intermediate', 'Intermediate Group', 'Sania Mirza', 'the-club', 'active', '2026-01-05'),
    ('Myra Choudhary', 12, 'U-14', 'beginner', 'Beginner Batch B', 'Rajesh Kumar', 'the-club', 'active', '2026-06-15'),
    ('Advait Iyer', 18, 'U-18', 'advanced', 'Advanced Tournament', 'Vikram Singh', 'tots-tennis', 'active', '2025-06-01'),
    ('Pari Singh', 10, 'U-10', 'beginner', 'Beginner Batch A', 'Rajesh Kumar', 'the-club', 'active', '2026-07-10'),
    ('Kabir Malhotra', 14, 'U-14', 'intermediate', 'Intermediate Group', 'Sania Mirza', 'tots-tennis', 'active', '2026-03-20'),
    ('Zara Khan', 16, 'U-16', 'advanced', 'Advanced Tournament', 'Vikram Singh', 'the-club', 'active', '2025-09-15')
) AS s(name, age, age_group, level, batch_name, coach_name, entity, status, join_date)
JOIN coach_ids c ON c.name = s.coach_name
JOIN batch_ids b ON b.name = s.batch_name;

-- ============================================================================
-- 5. STUDENT_PARENTS (junction)
-- ============================================================================
WITH std AS (SELECT id, name FROM students),
     par AS (SELECT id, name FROM parents)
INSERT INTO student_parents (student_id, parent_id)
SELECT s.id, p.id
FROM (VALUES
    ('Arjun Mehta', 'Rajesh Mehta'),
    ('Kavya Reddy', 'Sunita Reddy'),
    ('Rohit Desai', 'Manoj Desai'),
    ('Simran Kaur', 'Harpreet Kaur'),
    ('Aarav Sharma', 'Vikas Sharma'),
    ('Ananya Patel', 'Nisha Patel'),
    ('Vihaan Joshi', 'Ramesh Joshi'),
    ('Ishaan Gupta', 'Pooja Gupta'),
    ('Diya Agarwal', 'Sandeep Agarwal'),
    ('Reyansh Nair', 'Kavita Nair'),
    ('Myra Choudhary', 'Deepak Choudhary'),
    ('Advait Iyer', 'Anita Iyer'),
    ('Pari Singh', 'Gurpreet Singh'),
    ('Kabir Malhotra', 'Neelam Malhotra'),
    ('Zara Khan', 'Salman Khan')
) AS m(student_name, parent_name)
JOIN std s ON s.name = m.student_name
JOIN par p ON p.name = m.parent_name;

-- ============================================================================
-- 6. PACKAGES
-- ============================================================================
WITH std AS (SELECT id, name FROM students)
INSERT INTO packages (student_id, plan_type, amount, start_date, expiry_date, status, payment_status)
SELECT s.id, p.plan_type::package_plan, p.amount, p.start_date::date, p.expiry_date::date, p.status::package_status, p.payment_status::payment_status
FROM (VALUES
    ('Arjun Mehta', 'Monthly', 4500, '2026-08-15', '2026-09-15', 'active', 'paid'),
    ('Kavya Reddy', 'Quarterly', 12000, '2026-07-01', '2026-10-01', 'active', 'paid'),
    ('Rohit Desai', 'Monthly', 5000, '2026-07-20', '2026-08-20', 'active', 'pending'),
    ('Simran Kaur', '4-Week', 4000, '2026-07-15', '2026-08-12', 'active', 'overdue'),
    ('Aarav Sharma', 'Monthly', 3500, '2026-08-01', '2026-09-01', 'active', 'paid'),
    ('Ananya Patel', 'Quarterly', 12000, '2026-08-15', '2026-11-15', 'active', 'paid'),
    ('Vihaan Joshi', 'Monthly', 3500, '2026-07-25', '2026-08-25', 'active', 'pending'),
    ('Ishaan Gupta', 'Monthly', 5000, '2026-07-30', '2026-08-30', 'active', 'paid'),
    ('Diya Agarwal', '4-Week', 3500, '2026-07-13', '2026-08-10', 'expired', 'overdue'),
    ('Reyansh Nair', 'Quarterly', 12000, '2026-06-05', '2026-09-05', 'active', 'paid'),
    ('Myra Choudhary', 'Monthly', 3500, '2026-08-15', '2026-09-15', 'active', 'paid'),
    ('Advait Iyer', 'Monthly', 5000, '2026-07-18', '2026-08-18', 'active', 'pending'),
    ('Pari Singh', '4-Week', 3000, '2026-07-10', '2026-08-07', 'expired', 'overdue'),
    ('Kabir Malhotra', 'Quarterly', 12000, '2026-07-20', '2026-10-20', 'active', 'paid'),
    ('Zara Khan', 'Monthly', 5000, '2026-08-01', '2026-09-01', 'active', 'paid')
) AS p(student_name, plan_type, amount, start_date, expiry_date, status, payment_status)
JOIN std s ON s.name = p.student_name;

-- ============================================================================
-- 7. SCHEDULE
-- ============================================================================
WITH std AS (SELECT id, name FROM students),
     bat AS (SELECT id, name FROM batches),
     coa AS (SELECT id, name FROM coaches)
INSERT INTO schedule (type, batch_id, student_id, coach_id, entity, day, start_time, end_time, location, status, confirmation, cancelled_reason, cancelled_type)
SELECT
    s.type::schedule_type,
    b.id,
    st.id,
    c.id,
    s.entity::entity_type,
    s.day,
    s.start_time::time,
    s.end_time::time,
    s.location,
    s.status,
    s.confirmation::confirmation_status,
    s.cancelled_reason,
    s.cancelled_type
FROM (VALUES
    ('group', 'Advanced Tournament', NULL, 'Vikram Singh', 'the-club', 'Mon', '16:00', '18:00', 'Court 1', 'confirmed', NULL, NULL, NULL),
    ('group', 'Intermediate Group', NULL, 'Sania Mirza', 'the-club', 'Tue', '16:00', '18:00', 'Court 2', 'confirmed', NULL, NULL, NULL),
    ('group', 'Beginner Batch A', NULL, 'Rajesh Kumar', 'tots-tennis', 'Mon', '16:00', '17:00', 'Court 3', 'confirmed', NULL, NULL, NULL),
    ('one_on_one', NULL, 'Arjun Mehta', 'Vikram Singh', 'the-club', 'Mon', '18:30', '19:30', 'Court 1', 'confirmed_yes', 'confirmed_yes', NULL, NULL),
    ('one_on_one', NULL, 'Kavya Reddy', 'Sania Mirza', 'the-club', 'Tue', '18:30', '19:30', 'Court 2', 'sent_no_reply', 'sent_no_reply', NULL, NULL),
    ('one_on_one', NULL, 'Rohit Desai', 'Vikram Singh', 'tots-tennis', 'Wed', '18:30', '19:30', 'Court 1', 'declined_no', 'declined_no', NULL, NULL),
    ('group', 'Beginner Batch B', NULL, 'Rajesh Kumar', 'tots-tennis', 'Tue', '16:00', '17:00', 'Court 3', 'confirmed', NULL, NULL, NULL),
    ('one_on_one', NULL, 'Simran Kaur', 'Sania Mirza', 'tots-tennis', 'Thu', '18:30', '19:30', 'Court 2', 'not_sent', 'not_sent', NULL, NULL),
    ('cancelled', 'Advanced Tournament', NULL, 'Vikram Singh', 'the-club', 'Wed', '16:00', '18:00', 'Court 1', 'cancelled', NULL, 'Coach unavailable', 'advance'),
    ('cancelled', 'Beginner Batch A', NULL, 'Rajesh Kumar', 'tots-tennis', 'Fri', '16:00', '17:00', 'Court 3', 'cancelled_charged', NULL, 'Rain', 'same_day'),
    ('group', 'Advanced Tournament (TT)', NULL, 'Deepak Verma', 'tots-tennis', 'Tue', '16:00', '18:00', 'Court 4', 'confirmed', NULL, NULL, NULL),
    ('one_on_one', NULL, 'Ishaan Gupta', 'Vikram Singh', 'the-club', 'Fri', '18:30', '19:30', 'Court 1', 'confirmed_yes', 'confirmed_yes', NULL, NULL)
) AS s(type, batch_name, student_name, coach_name, entity, day, start_time, end_time, location, status, confirmation, cancelled_reason, cancelled_type)
LEFT JOIN bat b ON b.name = s.batch_name
LEFT JOIN std st ON st.name = s.student_name
JOIN coa c ON c.name = s.coach_name;

-- ============================================================================
-- 8. ATTENDANCE (Student)
-- ============================================================================
WITH std AS (SELECT id, name FROM students),
     bat AS (SELECT id, name FROM batches),
     coa AS (SELECT id, name FROM coaches)
INSERT INTO attendance (student_id, batch_id, coach_id, date, status, check_in, check_out)
SELECT
    st.id, b.id, c.id, a.date::date, a.status::attendance_status, a.check_in::time, a.check_out::time
FROM (VALUES
    ('Arjun Mehta', 'Advanced Tournament', 'Vikram Singh', '2026-08-07', 'present', '15:55', '18:05'),
    ('Kavya Reddy', 'Intermediate Group', 'Sania Mirza', '2026-08-06', 'present', '15:58', '18:02'),
    ('Rohit Desai', 'Advanced Tournament', 'Vikram Singh', '2026-08-07', 'absent', NULL, NULL),
    ('Simran Kaur', 'Intermediate Group', 'Sania Mirza', '2026-08-06', 'late', '16:25', '18:00'),
    ('Aarav Sharma', 'Beginner Batch A', 'Rajesh Kumar', '2026-08-07', 'present', '15:50', '17:02'),
    ('Ananya Patel', 'Intermediate Group', 'Sania Mirza', '2026-08-06', 'present', '15:55', '18:00'),
    ('Vihaan Joshi', 'Beginner Batch B', 'Rajesh Kumar', '2026-08-05', 'absent', NULL, NULL),
    ('Ishaan Gupta', 'Advanced Tournament', 'Vikram Singh', '2026-08-07', 'present', '15:52', '18:00'),
    ('Diya Agarwal', 'Beginner Batch A', 'Rajesh Kumar', '2026-08-07', 'present', '15:57', '17:00'),
    ('Reyansh Nair', 'Intermediate Group', 'Sania Mirza', '2026-08-06', 'present', '16:00', '18:03'),
    ('Myra Choudhary', 'Beginner Batch B', 'Rajesh Kumar', '2026-08-05', 'late', '16:15', '17:00'),
    ('Advait Iyer', 'Advanced Tournament', 'Vikram Singh', '2026-08-07', 'present', '15:54', '18:05'),
    ('Pari Singh', 'Beginner Batch A', 'Rajesh Kumar', '2026-08-05', 'absent', NULL, NULL),
    ('Kabir Malhotra', 'Intermediate Group', 'Sania Mirza', '2026-08-06', 'present', '15:59', '18:00'),
    ('Zara Khan', 'Advanced Tournament', 'Vikram Singh', '2026-08-07', 'present', '15:53', '18:04')
) AS a(student_name, batch_name, coach_name, date, status, check_in, check_out)
JOIN std st ON st.name = a.student_name
JOIN bat b ON b.name = a.batch_name
JOIN coa c ON c.name = a.coach_name;

-- ============================================================================
-- 9. COACH_ATTENDANCE
-- ============================================================================
WITH coa AS (SELECT id, name FROM coaches)
INSERT INTO coach_attendance (coach_id, date, status, sessions_count)
SELECT c.id, ca.date::date, ca.status::coach_attendance_status, ca.sessions_count
FROM (VALUES
    ('Vikram Singh', '2026-08-07', 'present', 3),
    ('Sania Mirza', '2026-08-06', 'present', 2),
    ('Rajesh Kumar', '2026-08-07', 'present', 2)
) AS ca(coach_name, date, status, sessions_count)
JOIN coa c ON c.name = ca.coach_name;

-- ============================================================================
-- 10. PAYMENTS
-- ============================================================================
WITH std AS (SELECT id, name FROM students),
     par AS (SELECT id, name FROM parents)
INSERT INTO payments (student_id, parent_id, entity, amount, date, gateway, type, status, invoice_id)
SELECT
    s.id, p.id, pay.entity::entity_type, pay.amount, pay.date::date, pay.gateway::payment_gateway, pay.type::package_plan, pay.status::payment_status, pay.invoice_id
FROM (VALUES
    ('Arjun Mehta', 'Rajesh Mehta', 'the-club', 4500, '2026-08-01', 'cc_avenue', 'Monthly', 'paid', 'INV-2026-0842'),
    ('Kavya Reddy', 'Sunita Reddy', 'the-club', 12000, '2026-07-01', 'cc_avenue', 'Quarterly', 'paid', 'INV-2026-0810'),
    ('Rohit Desai', 'Manoj Desai', 'tots-tennis', 5000, '2026-08-01', 'stripe', 'Monthly', 'paid', 'INV-2026-0845'),
    ('Simran Kaur', 'Harpreet Kaur', 'tots-tennis', 4000, '2026-08-07', 'stripe', '4-Week', 'overdue', 'INV-2026-0850'),
    ('Aarav Sharma', 'Vikas Sharma', 'the-club', 3500, '2026-08-01', 'cc_avenue', 'Monthly', 'paid', 'INV-2026-0840'),
    ('Ananya Patel', 'Nisha Patel', 'the-club', 12000, '2026-08-01', 'cc_avenue', 'Quarterly', 'paid', 'INV-2026-0841'),
    ('Vihaan Joshi', 'Ramesh Joshi', 'tots-tennis', 3500, '2026-08-05', 'stripe', 'Monthly', 'pending', 'INV-2026-0848'),
    ('Ishaan Gupta', 'Pooja Gupta', 'the-club', 5000, '2026-08-01', 'cc_avenue', 'Monthly', 'paid', 'INV-2026-0843'),
    ('Diya Agarwal', 'Sandeep Agarwal', 'tots-tennis', 3500, '2026-08-06', 'stripe', '4-Week', 'overdue', 'INV-2026-0849'),
    ('Reyansh Nair', 'Kavita Nair', 'the-club', 12000, '2026-06-01', 'cc_avenue', 'Quarterly', 'paid', 'INV-2026-0799'),
    ('Advait Iyer', 'Anita Iyer', 'tots-tennis', 5000, '2026-08-02', 'stripe', 'Monthly', 'paid', 'INV-2026-0846'),
    ('Pari Singh', 'Gurpreet Singh', 'the-club', 3000, '2026-08-07', 'excel_reported', '4-Week', 'overdue', 'INV-2026-0851'),
    ('Kabir Malhotra', 'Neelam Malhotra', 'tots-tennis', 12000, '2026-07-20', 'stripe', 'Quarterly', 'paid', 'INV-2026-0820'),
    ('Zara Khan', 'Salman Khan', 'the-club', 5000, '2026-08-01', 'cc_avenue', 'Monthly', 'paid', 'INV-2026-0844'),
    ('Myra Choudhary', 'Deepak Choudhary', 'the-club', 3500, '2026-08-03', 'cc_avenue', 'Monthly', 'paid', 'INV-2026-0847')
) AS pay(student_name, parent_name, entity, amount, date, gateway, type, status, invoice_id)
JOIN std s ON s.name = pay.student_name
JOIN par p ON p.name = pay.parent_name;

-- ============================================================================
-- 11. RECONCILIATION
-- ============================================================================
WITH std AS (SELECT id, name FROM students)
INSERT INTO reconciliation (student_id, entity, excel_amount, system_amount, gateway, status, date, note)
SELECT
    s.id, r.entity::entity_type, r.excel_amount, r.system_amount, r.gateway::payment_gateway, r.status::reconciliation_status, r.date::date, r.note
FROM (VALUES
    ('Arjun Mehta', 'the-club', 4500, 4500, 'cc_avenue', 'matched', '2026-08-01', NULL),
    ('Kavya Reddy', 'the-club', 12000, 12000, 'cc_avenue', 'matched', '2026-07-01', NULL),
    ('Rohit Desai', 'tots-tennis', 5000, 5000, 'stripe', 'matched', '2026-08-01', NULL),
    ('Simran Kaur', 'tots-tennis', 4000, 0, 'stripe', 'mismatch', '2026-08-07', 'Payment not reflected in system'),
    ('Diya Agarwal', 'tots-tennis', 3500, 3500, 'stripe', 'matched', '2026-08-06', NULL),
    ('Pari Singh', 'the-club', 3000, 3000, 'excel_reported', 'new', '2026-08-07', 'New entry from Excel upload'),
    ('Vihaan Joshi', 'tots-tennis', 3500, 0, 'stripe', 'mismatch', '2026-08-05', 'Pending in system'),
    ('Advait Iyer', 'tots-tennis', 5000, 5000, 'stripe', 'matched', '2026-08-02', NULL)
) AS r(student_name, entity, excel_amount, system_amount, gateway, status, date, note)
JOIN std s ON s.name = r.student_name;

-- ============================================================================
-- 12. REMINDERS (initial state for active drip campaigns)
-- ============================================================================
WITH std AS (SELECT id, name FROM students),
     pkg AS (SELECT id, student_id FROM packages)
INSERT INTO reminders (student_id, package_id, channel, stage, status)
SELECT
    s.id, pk.id, r.channel::reminder_channel, r.stage::reminder_stage, r.status::reminder_status
FROM (VALUES
    ('Simran Kaur', 'email', 'd_minus_7', 'sent'),
    ('Simran Kaur', 'email', 'd_minus_3', 'pending'),
    ('Simran Kaur', 'email', 'd_minus_1', 'pending'),
    ('Diya Agarwal', 'email', 'd_minus_7', 'sent'),
    ('Diya Agarwal', 'email', 'd_minus_3', 'sent'),
    ('Diya Agarwal', 'email', 'd_minus_1', 'pending'),
    ('Rohit Desai', 'email', 'd_minus_7', 'sent'),
    ('Rohit Desai', 'email', 'd_minus_3', 'pending'),
    ('Vihaan Joshi', 'email', 'd_minus_7', 'sent'),
    ('Advait Iyer', 'email', 'd_minus_7', 'sent'),
    ('Pari Singh', 'email', 'd_minus_7', 'sent')
) AS r(student_name, channel, stage, status)
JOIN std s ON s.name = r.student_name
JOIN pkg pk ON pk.student_id = s.id;

-- ============================================================================
-- 14. LEAVE_REQUESTS (sample)
-- ============================================================================
WITH coa AS (SELECT id, name FROM coaches)
INSERT INTO leave_requests (coach_id, type, start_date, end_date, reason, status)
SELECT c.id, l.type::leave_type, l.start_date::date, l.end_date::date, l.reason, l.status::leave_request_status
FROM (VALUES
    ('Neha Kapoor', 'casual', '2026-08-01', '2026-08-03', 'Family function', 'approved'),
    ('Vikram Singh', 'sick', '2026-08-10', '2026-08-10', 'Fever', 'pending')
) AS l(coach_name, type, start_date, end_date, reason, status)
JOIN coa c ON c.name = l.coach_name;

-- ============================================================================
-- 16. COMMUNICATIONS_LOG (sample)
-- ============================================================================
WITH std AS (SELECT id, name FROM students),
     par AS (SELECT id, name FROM parents)
INSERT INTO communications_log (student_id, parent_id, type, channel, status, date)
SELECT
    s.id, p.id, cl.type::comm_type, cl.channel::comm_channel, cl.status::comm_status, cl.date::date
FROM (VALUES
    ('Arjun Mehta', 'Rajesh Mehta', 'welcome', 'email', 'delivered', '2026-01-15'),
    ('Arjun Mehta', 'Rajesh Mehta', 'progress_report', 'email', 'sent', '2026-06-15'),
    ('Kavya Reddy', 'Sunita Reddy', 'welcome', 'email', 'delivered', '2026-03-01'),
    ('Rohit Desai', 'Manoj Desai', 'reminder', 'email', 'sent', '2026-08-01'),
    ('Simran Kaur', 'Harpreet Kaur', 'reminder', 'email', 'sent', '2026-08-06')
) AS cl(student_name, parent_name, type, channel, status, date)
JOIN std s ON s.name = cl.student_name
JOIN par p ON p.name = cl.parent_name;

-- ============================================================================
-- VERIFICATION
-- ============================================================================
DO $$
BEGIN
    RAISE NOTICE 'Seed data loaded:';
    RAISE NOTICE '  coaches: %', (SELECT count(*) FROM coaches);
    RAISE NOTICE '  batches: %', (SELECT count(*) FROM batches);
    RAISE NOTICE '  students: %', (SELECT count(*) FROM students);
    RAISE NOTICE '  parents: %', (SELECT count(*) FROM parents);
    RAISE NOTICE '  student_parents: %', (SELECT count(*) FROM student_parents);
    RAISE NOTICE '  packages: %', (SELECT count(*) FROM packages);
    RAISE NOTICE '  schedule: %', (SELECT count(*) FROM schedule);
    RAISE NOTICE '  attendance: %', (SELECT count(*) FROM attendance);
    RAISE NOTICE '  coach_attendance: %', (SELECT count(*) FROM coach_attendance);
    RAISE NOTICE '  payments: %', (SELECT count(*) FROM payments);
    RAISE NOTICE '  reconciliation: %', (SELECT count(*) FROM reconciliation);
    RAISE NOTICE '  reminders: %', (SELECT count(*) FROM reminders);
    RAISE NOTICE '  leave_requests: %', (SELECT count(*) FROM leave_requests);
    RAISE NOTICE '  communications_log: %', (SELECT count(*) FROM communications_log);
END $$;
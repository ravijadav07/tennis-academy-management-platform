-- ============================================================================
-- MASTER MIGRATION CHECK QUERY
-- Run this in Supabase SQL Editor to verify which migrations are applied.
-- Each migration increments a sequential number (the "check" column).
-- ============================================================================

-- 001: Core Schema — check for all 16 tables + custom types
SELECT '001_schema' AS migration,
       CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'coaches') THEN 'OK' ELSE 'MISSING' END AS coaches,
       CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'batches') THEN 'OK' ELSE 'MISSING' END AS batches,
       CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'students') THEN 'OK' ELSE 'MISSING' END AS students,
       CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'parents') THEN 'OK' ELSE 'MISSING' END AS parents,
       CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'student_parents') THEN 'OK' ELSE 'MISSING' END AS student_parents,
       CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'packages') THEN 'OK' ELSE 'MISSING' END AS packages,
       CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'schedule') THEN 'OK' ELSE 'MISSING' END AS schedule,
       CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'attendance') THEN 'OK' ELSE 'MISSING' END AS attendance,
       CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'coach_attendance') THEN 'OK' ELSE 'MISSING' END AS coach_attendance,
       CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'payments') THEN 'OK' ELSE 'MISSING' END AS payments,
       CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'reconciliation') THEN 'OK' ELSE 'MISSING' END AS reconciliation,
       CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'reminders') THEN 'OK' ELSE 'MISSING' END AS reminders,
       CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'workflow_state') THEN 'OK' ELSE 'MISSING' END AS workflow_state,
       CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'leave_requests') THEN 'OK' ELSE 'MISSING' END AS leave_requests,
       CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'progress') THEN 'OK' ELSE 'MISSING' END AS progress,
       CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'communications_log') THEN 'OK' ELSE 'MISSING' END AS communications_log,
       CASE WHEN EXISTS (SELECT 1 FROM pg_type WHERE typname = 'entity_type') THEN 'OK' ELSE 'MISSING' END AS enum_entity_type,
       CASE WHEN EXISTS (SELECT 1 FROM pg_type WHERE typname = 'package_status') THEN 'OK' ELSE 'MISSING' END AS enum_package_status,
       CASE WHEN EXISTS (SELECT 1 FROM pg_type WHERE typname = 'reminder_stage') THEN 'OK' ELSE 'MISSING' END AS enum_reminder_stage,
       CASE WHEN EXISTS (SELECT 1 FROM pg_type WHERE typname = 'confirmation_status') THEN 'OK' ELSE 'MISSING' END AS enum_confirmation_status,
       CASE WHEN EXISTS (SELECT 1 FROM pg_type WHERE typname = 'comm_type') THEN 'OK' ELSE 'MISSING' END AS enum_comm_type
UNION ALL
-- 002_seed: Check row counts
SELECT '002_seed' AS migration,
       CASE WHEN (SELECT count(*) FROM coaches) >= 10 THEN 'OK ('|| (SELECT count(*) FROM coaches) ||')' ELSE 'LOW ('|| (SELECT count(*) FROM coaches) ||')' END AS coaches,
       CASE WHEN (SELECT count(*) FROM batches) >= 10 THEN 'OK ('|| (SELECT count(*) FROM batches) ||')' ELSE 'LOW ('|| (SELECT count(*) FROM batches) ||')' END AS batches,
       CASE WHEN (SELECT count(*) FROM students) >= 15 THEN 'OK ('|| (SELECT count(*) FROM students) ||')' ELSE 'LOW ('|| (SELECT count(*) FROM students) ||')' END AS students,
       CASE WHEN (SELECT count(*) FROM parents) >= 15 THEN 'OK ('|| (SELECT count(*) FROM parents) ||')' ELSE 'LOW ('|| (SELECT count(*) FROM parents) ||')' END AS parents,
       CASE WHEN (SELECT count(*) FROM student_parents) >= 15 THEN 'OK ('|| (SELECT count(*) FROM student_parents) ||')' ELSE 'LOW ('|| (SELECT count(*) FROM student_parents) ||')' END AS student_parents,
       CASE WHEN (SELECT count(*) FROM packages) >= 15 THEN 'OK ('|| (SELECT count(*) FROM packages) ||')' ELSE 'LOW ('|| (SELECT count(*) FROM packages) ||')' END AS packages,
       CASE WHEN (SELECT count(*) FROM schedule) >= 10 THEN 'OK ('|| (SELECT count(*) FROM schedule) ||')' ELSE 'LOW ('|| (SELECT count(*) FROM schedule) ||')' END AS schedule,
       CASE WHEN (SELECT count(*) FROM attendance) >= 10 THEN 'OK ('|| (SELECT count(*) FROM attendance) ||')' ELSE 'LOW ('|| (SELECT count(*) FROM attendance) ||')' END AS attendance,
       CASE WHEN (SELECT count(*) FROM coach_attendance) >= 3 THEN 'OK ('|| (SELECT count(*) FROM coach_attendance) ||')' ELSE 'LOW ('|| (SELECT count(*) FROM coach_attendance) ||')' END AS coach_attendance,
       CASE WHEN (SELECT count(*) FROM payments) >= 10 THEN 'OK ('|| (SELECT count(*) FROM payments) ||')' ELSE 'LOW ('|| (SELECT count(*) FROM payments) ||')' END AS payments,
       CASE WHEN (SELECT count(*) FROM reconciliation) >= 5 THEN 'OK ('|| (SELECT count(*) FROM reconciliation) ||')' ELSE 'LOW ('|| (SELECT count(*) FROM reconciliation) ||')' END AS reconciliation,
       CASE WHEN (SELECT count(*) FROM reminders) >= 5 THEN 'OK ('|| (SELECT count(*) FROM reminders) ||')' ELSE 'LOW ('|| (SELECT count(*) FROM reminders) ||')' END AS reminders,
       CASE WHEN (SELECT count(*) FROM leave_requests) >= 2 THEN 'OK ('|| (SELECT count(*) FROM leave_requests) ||')' ELSE 'LOW ('|| (SELECT count(*) FROM leave_requests) ||')' END AS leave_requests,
       CASE WHEN (SELECT count(*) FROM communications_log) >= 3 THEN 'OK ('|| (SELECT count(*) FROM communications_log) ||')' ELSE 'LOW ('|| (SELECT count(*) FROM communications_log) ||')' END AS communications_log,
       '---' AS _1, '---' AS _2, '---' AS _3, '---' AS _4, '---' AS _5, '---' AS _6, '---' AS _7
UNION ALL
-- 002_uc3: Check for no_response enum, sessions_consumed, total_sessions, remaining_balance columns, and mark_student_attendance function
SELECT '002_uc3' AS migration,
       CASE WHEN 'no_response' = ANY (SELECT unnest(enum_range(NULL::confirmation_status))::text) THEN 'OK' ELSE 'MISSING' END AS enum_no_response,
       CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'packages' AND column_name = 'sessions_consumed') THEN 'OK' ELSE 'MISSING' END AS col_sessions_consumed,
       CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'packages' AND column_name = 'total_sessions') THEN 'OK' ELSE 'MISSING' END AS col_total_sessions,
       CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'packages' AND column_name = 'remaining_balance') THEN 'OK' ELSE 'MISSING' END AS col_remaining_balance,
       CASE WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'mark_student_attendance') THEN 'OK' ELSE 'MISSING' END AS fn_mark_attendance,
       '---' AS _1, '---' AS _2, '---' AS _3, '---' AS _4, '---' AS _5, '---' AS _6, '---' AS _7, '---' AS _8, '---' AS _9, '---' AS _10, '---' AS _11, '---' AS _12, '---' AS _13, '---' AS _14, '---' AS _15, '---' AS _16
UNION ALL
-- 003_uc4: Check for 'lapsed' enum value and overdue_days column
SELECT '003_uc4' AS migration,
       CASE WHEN 'lapsed' = ANY (SELECT unnest(enum_range(NULL::package_status))::text) THEN 'OK' ELSE 'MISSING' END AS enum_lapsed,
       CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'packages' AND column_name = 'overdue_days') THEN 'OK' ELSE 'MISSING' END AS col_overdue_days,
       CASE WHEN EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_packages_overdue_days') THEN 'OK' ELSE 'MISSING' END AS idx_overdue_days,
       '---' AS _1, '---' AS _2, '---' AS _3, '---' AS _4, '---' AS _5, '---' AS _6, '---' AS _7, '---' AS _8, '---' AS _9, '---' AS _10, '---' AS _11, '---' AS _12, '---' AS _13, '---' AS _14, '---' AS _15, '---' AS _16, '---' AS _17, '---' AS _18
UNION ALL
-- 004_rls: Check for public_read policies on all tables
SELECT '004_rls' AS migration,
       CASE WHEN EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'public_read_packages') THEN 'OK' ELSE 'MISSING' END AS pol_packages,
       CASE WHEN EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'public_read_students') THEN 'OK' ELSE 'MISSING' END AS pol_students,
       CASE WHEN EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'public_read_parents') THEN 'OK' ELSE 'MISSING' END AS pol_parents,
       CASE WHEN EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'public_read_schedule') THEN 'OK' ELSE 'MISSING' END AS pol_schedule,
       CASE WHEN EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'public_read_attendance') THEN 'OK' ELSE 'MISSING' END AS pol_attendance,
       CASE WHEN EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'public_read_coaches') THEN 'OK' ELSE 'MISSING' END AS pol_coaches,
       CASE WHEN EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'public_read_batches') THEN 'OK' ELSE 'MISSING' END AS pol_batches,
       CASE WHEN EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'public_read_payments') THEN 'OK' ELSE 'MISSING' END AS pol_payments,
       CASE WHEN EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'public_read_progress') THEN 'OK' ELSE 'MISSING' END AS pol_progress,
       CASE WHEN EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'public_read_reconciliation') THEN 'OK' ELSE 'MISSING' END AS pol_reconciliation,
       CASE WHEN EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'public_read_communications_log') THEN 'OK' ELSE 'MISSING' END AS pol_comm_log,
       CASE WHEN EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'public_read_reminders') THEN 'OK' ELSE 'MISSING' END AS pol_reminders,
       CASE WHEN EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'public_read_student_parents') THEN 'OK' ELSE 'MISSING' END AS pol_student_parents,
       CASE WHEN EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'public_read_coach_attendance') THEN 'OK' ELSE 'MISSING' END AS pol_coach_att,
       CASE WHEN EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'public_read_leave_requests') THEN 'OK' ELSE 'MISSING' END AS pol_leave,
       '---' AS _1, '---' AS _2, '---' AS _3, '---' AS _4, '---' AS _5, '---' AS _6
UNION ALL
-- 005_uc4: Check for d_minus_6, d_plus_14, d_plus_21, d_plus_28 enum values
SELECT '005_uc4' AS migration,
       CASE WHEN 'd_minus_6' = ANY (SELECT unnest(enum_range(NULL::reminder_stage))::text) THEN 'OK' ELSE 'MISSING' END AS enum_d_minus_6,
       CASE WHEN 'd_plus_14' = ANY (SELECT unnest(enum_range(NULL::reminder_stage))::text) THEN 'OK' ELSE 'MISSING' END AS enum_d_plus_14,
       CASE WHEN 'd_plus_21' = ANY (SELECT unnest(enum_range(NULL::reminder_stage))::text) THEN 'OK' ELSE 'MISSING' END AS enum_d_plus_21,
       CASE WHEN 'd_plus_28' = ANY (SELECT unnest(enum_range(NULL::reminder_stage))::text) THEN 'OK' ELSE 'MISSING' END AS enum_d_plus_28,
       '---' AS _1, '---' AS _2, '---' AS _3, '---' AS _4, '---' AS _5, '---' AS _6, '---' AS _7, '---' AS _8, '---' AS _9, '---' AS _10, '---' AS _11, '---' AS _12, '---' AS _13, '---' AS _14, '---' AS _15, '---' AS _16, '---' AS _17
UNION ALL
-- 006_certificates: Check for certificates table + storage bucket
SELECT '006_cert' AS migration,
       CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'certificates') THEN 'OK' ELSE 'MISSING' END AS tbl_certificates,
       CASE WHEN EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'public_read_certificates') THEN 'OK' ELSE 'MISSING' END AS pol_certificates,
       CASE WHEN EXISTS (SELECT 1 FROM storage.buckets WHERE name = 'certificates') THEN 'OK' ELSE 'MISSING' END AS bucket_certificates,
       '---' AS _1, '---' AS _2, '---' AS _3, '---' AS _4, '---' AS _5, '---' AS _6, '---' AS _7, '---' AS _8, '---' AS _9, '---' AS _10, '---' AS _11, '---' AS _12, '---' AS _13, '---' AS _14, '---' AS _15, '---' AS _16, '---' AS _17, '---' AS _18
UNION ALL
-- 007_enum: Check for d_minus_10, dormant, payment_confirmation, payroll enum values
SELECT '007_enum' AS migration,
       CASE WHEN 'd_minus_10' = ANY (SELECT unnest(enum_range(NULL::reminder_stage))::text) THEN 'OK' ELSE 'MISSING' END AS enum_d_minus_10,
       CASE WHEN 'dormant' = ANY (SELECT unnest(enum_range(NULL::reminder_stage))::text) THEN 'OK' ELSE 'MISSING' END AS enum_dormant,
       CASE WHEN 'payment_confirmation' = ANY (SELECT unnest(enum_range(NULL::comm_type))::text) THEN 'OK' ELSE 'MISSING' END AS enum_payment_confirmation,
       CASE WHEN 'payroll' = ANY (SELECT unnest(enum_range(NULL::comm_type))::text) THEN 'OK' ELSE 'MISSING' END AS enum_payroll,
       '---' AS _1, '---' AS _2, '---' AS _3, '---' AS _4, '---' AS _5, '---' AS _6, '---' AS _7, '---' AS _8, '---' AS _9, '---' AS _10, '---' AS _11, '---' AS _12, '---' AS _13, '---' AS _14, '---' AS _15, '---' AS _16, '---' AS _17
UNION ALL
-- ============================================================================
-- SUMMARY: Quick at-a-glance status
-- ============================================================================
SELECT '--- SUMMARY ---' AS migration,
       CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'coaches') THEN 'MIGRATED' ELSE 'NOT' END AS "001_schema",
       CASE WHEN (SELECT count(*) FROM students) >= 15 THEN 'MIGRATED' ELSE 'NOT' END AS "002_seed",
       CASE WHEN 'no_response' = ANY (SELECT unnest(enum_range(NULL::confirmation_status))::text) THEN 'MIGRATED' ELSE 'NOT' END AS "002_uc3",
       CASE WHEN 'lapsed' = ANY (SELECT unnest(enum_range(NULL::package_status))::text) THEN 'MIGRATED' ELSE 'NOT' END AS "003_uc4",
       CASE WHEN EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'public_read_packages') THEN 'MIGRATED' ELSE 'NOT' END AS "004_rls",
       CASE WHEN 'd_plus_28' = ANY (SELECT unnest(enum_range(NULL::reminder_stage))::text) THEN 'MIGRATED' ELSE 'NOT' END AS "005_uc4",
       CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'certificates') THEN 'MIGRATED' ELSE 'NOT' END AS "006_cert",
       CASE WHEN 'payroll' = ANY (SELECT unnest(enum_range(NULL::comm_type))::text) THEN 'MIGRATED' ELSE 'NOT' END AS "007_enum",
       '---' AS _1, '---' AS _2, '---' AS _3, '---' AS _4, '---' AS _5, '---' AS _6, '---' AS _7, '---' AS _8, '---' AS _9, '---' AS _10, '---' AS _11, '---' AS _12, '---' AS _13;
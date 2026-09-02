-- ============================================================================
-- MASTER MIGRATION CHECK v2 — Clean single-value-per-row format
-- Run in Supabase SQL Editor. A single result column avoids column-name collision.
-- ============================================================================

SELECT check_name, status FROM (
    -- 001: Tables exist
    SELECT '001_schema | coaches table' AS check_name, CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='coaches') THEN 'OK' ELSE 'MISSING' END AS status UNION ALL
    SELECT '001_schema | batches table', CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='batches') THEN 'OK' ELSE 'MISSING' END UNION ALL
    SELECT '001_schema | students table', CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='students') THEN 'OK' ELSE 'MISSING' END UNION ALL
    SELECT '001_schema | parents table', CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='parents') THEN 'OK' ELSE 'MISSING' END UNION ALL
    SELECT '001_schema | packages table', CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='packages') THEN 'OK' ELSE 'MISSING' END UNION ALL
    SELECT '001_schema | schedule table', CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='schedule') THEN 'OK' ELSE 'MISSING' END UNION ALL
    SELECT '001_schema | attendance table', CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='attendance') THEN 'OK' ELSE 'MISSING' END UNION ALL
    SELECT '001_schema | payments table', CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='payments') THEN 'OK' ELSE 'MISSING' END UNION ALL
    SELECT '001_schema | workflow_state table', CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='workflow_state') THEN 'OK' ELSE 'MISSING' END UNION ALL
    SELECT '001_schema | progress table', CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='progress') THEN 'OK' ELSE 'MISSING' END UNION ALL
    SELECT '001_schema | communications_log table', CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='communications_log') THEN 'OK' ELSE 'MISSING' END UNION ALL
    SELECT '001_schema | enum: entity_type', CASE WHEN EXISTS (SELECT 1 FROM pg_type WHERE typname='entity_type') THEN 'OK' ELSE 'MISSING' END UNION ALL
    SELECT '001_schema | enum: package_status', CASE WHEN EXISTS (SELECT 1 FROM pg_type WHERE typname='package_status') THEN 'OK' ELSE 'MISSING' END UNION ALL
    SELECT '001_schema | enum: confirmation_status', CASE WHEN EXISTS (SELECT 1 FROM pg_type WHERE typname='confirmation_status') THEN 'OK' ELSE 'MISSING' END UNION ALL
    SELECT '001_schema | enum: reminder_stage', CASE WHEN EXISTS (SELECT 1 FROM pg_type WHERE typname='reminder_stage') THEN 'OK' ELSE 'MISSING' END UNION ALL
    SELECT '001_schema | enum: comm_type', CASE WHEN EXISTS (SELECT 1 FROM pg_type WHERE typname='comm_type') THEN 'OK' ELSE 'MISSING' END

    UNION ALL
    -- 002_seed: Row counts
    SELECT '002_seed | coaches count', CASE WHEN (SELECT count(*) FROM coaches)>=10 THEN 'OK ('||(SELECT count(*) FROM coaches)||')' ELSE 'LOW ('||(SELECT count(*) FROM coaches)||')' END UNION ALL
    SELECT '002_seed | students count', CASE WHEN (SELECT count(*) FROM students)>=15 THEN 'OK ('||(SELECT count(*) FROM students)||')' ELSE 'LOW ('||(SELECT count(*) FROM students)||')' END UNION ALL
    SELECT '002_seed | packages count', CASE WHEN (SELECT count(*) FROM packages)>=15 THEN 'OK ('||(SELECT count(*) FROM packages)||')' ELSE 'LOW ('||(SELECT count(*) FROM packages)||')' END UNION ALL
    SELECT '002_seed | schedule count', CASE WHEN (SELECT count(*) FROM schedule)>=10 THEN 'OK ('||(SELECT count(*) FROM schedule)||')' ELSE 'LOW ('||(SELECT count(*) FROM schedule)||')' END UNION ALL
    SELECT '002_seed | attendance count', CASE WHEN (SELECT count(*) FROM attendance)>=10 THEN 'OK ('||(SELECT count(*) FROM attendance)||')' ELSE 'LOW ('||(SELECT count(*) FROM attendance)||')' END UNION ALL
    SELECT '002_seed | payments count', CASE WHEN (SELECT count(*) FROM payments)>=10 THEN 'OK ('||(SELECT count(*) FROM payments)||')' ELSE 'LOW ('||(SELECT count(*) FROM payments)||')' END

    UNION ALL
    -- 002_uc3: no_response enum + package columns + function
    SELECT '002_uc3 | enum: no_response', CASE WHEN 'no_response'=ANY(SELECT unnest(enum_range(NULL::confirmation_status))::text) THEN 'OK' ELSE 'MISSING' END UNION ALL
    SELECT '002_uc3 | col: packages.sessions_consumed', CASE WHEN EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='packages' AND column_name='sessions_consumed') THEN 'OK' ELSE 'MISSING' END UNION ALL
    SELECT '002_uc3 | col: packages.total_sessions', CASE WHEN EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='packages' AND column_name='total_sessions') THEN 'OK' ELSE 'MISSING' END UNION ALL
    SELECT '002_uc3 | col: packages.remaining_balance', CASE WHEN EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='packages' AND column_name='remaining_balance') THEN 'OK' ELSE 'MISSING' END UNION ALL
    SELECT '002_uc3 | fn: mark_student_attendance', CASE WHEN EXISTS(SELECT 1 FROM pg_proc WHERE proname='mark_student_attendance') THEN 'OK' ELSE 'MISSING' END

    UNION ALL
    -- 003_uc4: lapsed enum + overdue_days
    SELECT '003_uc4 | enum: lapsed', CASE WHEN 'lapsed'=ANY(SELECT unnest(enum_range(NULL::package_status))::text) THEN 'OK' ELSE 'MISSING' END UNION ALL
    SELECT '003_uc4 | col: packages.overdue_days', CASE WHEN EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='packages' AND column_name='overdue_days') THEN 'OK' ELSE 'MISSING' END UNION ALL
    SELECT '003_uc4 | idx: packages_overdue_days', CASE WHEN EXISTS(SELECT 1 FROM pg_indexes WHERE indexname='idx_packages_overdue_days') THEN 'OK' ELSE 'MISSING' END

    UNION ALL
    -- 004_rls: public_read policies
    SELECT '004_rls | pol: public_read_packages', CASE WHEN EXISTS(SELECT 1 FROM pg_policies WHERE policyname='public_read_packages') THEN 'OK' ELSE 'MISSING' END UNION ALL
    SELECT '004_rls | pol: public_read_students', CASE WHEN EXISTS(SELECT 1 FROM pg_policies WHERE policyname='public_read_students') THEN 'OK' ELSE 'MISSING' END UNION ALL
    SELECT '004_rls | pol: public_read_schedule', CASE WHEN EXISTS(SELECT 1 FROM pg_policies WHERE policyname='public_read_schedule') THEN 'OK' ELSE 'MISSING' END UNION ALL
    SELECT '004_rls | pol: public_read_attendance', CASE WHEN EXISTS(SELECT 1 FROM pg_policies WHERE policyname='public_read_attendance') THEN 'OK' ELSE 'MISSING' END UNION ALL
    SELECT '004_rls | pol: public_read_payments', CASE WHEN EXISTS(SELECT 1 FROM pg_policies WHERE policyname='public_read_payments') THEN 'OK' ELSE 'MISSING' END UNION ALL
    SELECT '004_rls | pol: public_read_progress', CASE WHEN EXISTS(SELECT 1 FROM pg_policies WHERE policyname='public_read_progress') THEN 'OK' ELSE 'MISSING' END UNION ALL
    SELECT '004_rls | pol: public_read_coaches', CASE WHEN EXISTS(SELECT 1 FROM pg_policies WHERE policyname='public_read_coaches') THEN 'OK' ELSE 'MISSING' END UNION ALL
    SELECT '004_rls | pol: public_read_batches', CASE WHEN EXISTS(SELECT 1 FROM pg_policies WHERE policyname='public_read_batches') THEN 'OK' ELSE 'MISSING' END

    UNION ALL
    -- 005_uc4: reminder_stage values
    SELECT '005_uc4 | enum: d_minus_6', CASE WHEN 'd_minus_6'=ANY(SELECT unnest(enum_range(NULL::reminder_stage))::text) THEN 'OK' ELSE 'MISSING' END UNION ALL
    SELECT '005_uc4 | enum: d_plus_14', CASE WHEN 'd_plus_14'=ANY(SELECT unnest(enum_range(NULL::reminder_stage))::text) THEN 'OK' ELSE 'MISSING' END UNION ALL
    SELECT '005_uc4 | enum: d_plus_21', CASE WHEN 'd_plus_21'=ANY(SELECT unnest(enum_range(NULL::reminder_stage))::text) THEN 'OK' ELSE 'MISSING' END UNION ALL
    SELECT '005_uc4 | enum: d_plus_28', CASE WHEN 'd_plus_28'=ANY(SELECT unnest(enum_range(NULL::reminder_stage))::text) THEN 'OK' ELSE 'MISSING' END

    UNION ALL
    -- 006_cert: certificates table
    SELECT '006_cert | table: certificates', CASE WHEN EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='certificates') THEN 'OK' ELSE 'MISSING' END UNION ALL
    SELECT '006_cert | pol: public_read_certificates', CASE WHEN EXISTS(SELECT 1 FROM pg_policies WHERE policyname='public_read_certificates') THEN 'OK' ELSE 'MISSING' END UNION ALL
    SELECT '006_cert | bucket: certificates', CASE WHEN EXISTS(SELECT 1 FROM storage.buckets WHERE name='certificates') THEN 'OK' ELSE 'MISSING' END

    UNION ALL
    -- 007_enum: missing enum values
    SELECT '007_enum | enum: d_minus_10', CASE WHEN 'd_minus_10'=ANY(SELECT unnest(enum_range(NULL::reminder_stage))::text) THEN 'OK' ELSE 'MISSING' END UNION ALL
    SELECT '007_enum | enum: dormant', CASE WHEN 'dormant'=ANY(SELECT unnest(enum_range(NULL::reminder_stage))::text) THEN 'OK' ELSE 'MISSING' END UNION ALL
    SELECT '007_enum | enum: payment_confirmation', CASE WHEN 'payment_confirmation'=ANY(SELECT unnest(enum_range(NULL::comm_type))::text) THEN 'OK' ELSE 'MISSING' END UNION ALL
    SELECT '007_enum | enum: payroll', CASE WHEN 'payroll'=ANY(SELECT unnest(enum_range(NULL::comm_type))::text) THEN 'OK' ELSE 'MISSING' END
) t;

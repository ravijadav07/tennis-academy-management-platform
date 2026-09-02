-- ============================================================================
-- SUPABASE MASTER CHECK — Full Platform Audit
-- Run in Supabase SQL Editor
-- Covers: Storage, RLS, Auth, Extensions, Replication
-- NOTE: Edge Functions CANNOT be checked via SQL — use CLI checklist below.
-- ============================================================================

-- ========== SECTION 1: STORAGE BUCKETS ==========
SELECT 'STORAGE | bucket: academy-assets' AS check_name,
       CASE WHEN EXISTS(SELECT 1 FROM storage.buckets WHERE name='academy-assets') THEN 'OK' ELSE 'MISSING' END AS status
UNION ALL
SELECT 'STORAGE | bucket: certificates',
       CASE WHEN EXISTS(SELECT 1 FROM storage.buckets WHERE name='certificates') THEN 'OK' ELSE 'MISSING' END

UNION ALL
-- ========== SECTION 2: STORAGE POLICIES ==========
SELECT 'STORAGE | pol: academy-assets SELECT',
       CASE WHEN EXISTS(SELECT 1 FROM storage.policies WHERE name='public_read_assets' AND bucket_id='academy-assets') THEN 'OK' ELSE 'MISSING' END
UNION ALL
SELECT 'STORAGE | pol: academy-assets ADMIN',
       CASE WHEN EXISTS(SELECT 1 FROM storage.policies WHERE name='admin_manage_assets' AND bucket_id='academy-assets') THEN 'OK' ELSE 'MISSING' END
UNION ALL
SELECT 'STORAGE | pol: certificates service_role',
       CASE WHEN EXISTS(SELECT 1 FROM storage.policies WHERE name='service_role_manage_certificates' AND bucket_id='certificates') THEN 'OK' ELSE 'MISSING' END
UNION ALL
SELECT 'STORAGE | pol: certificates authenticated',
       CASE WHEN EXISTS(SELECT 1 FROM storage.policies WHERE name='authenticated_read_certificates' AND bucket_id='certificates') THEN 'OK' ELSE 'MISSING' END

UNION ALL
-- ========== SECTION 3: RLS ENABLED ON ALL TABLES ==========
SELECT 'RLS | coaches',
       CASE WHEN obj_description('public.coaches'::regclass) IS NOT NULL AND (SELECT relrowsecurity FROM pg_class WHERE oid='public.coaches'::regclass) THEN 'OK' ELSE 'MISSING' END
UNION ALL
SELECT 'RLS | batches',
       CASE WHEN (SELECT relrowsecurity FROM pg_class WHERE oid='public.batches'::regclass) THEN 'OK' ELSE 'MISSING' END
UNION ALL
SELECT 'RLS | students',
       CASE WHEN (SELECT relrowsecurity FROM pg_class WHERE oid='public.students'::regclass) THEN 'OK' ELSE 'MISSING' END
UNION ALL
SELECT 'RLS | parents',
       CASE WHEN (SELECT relrowsecurity FROM pg_class WHERE oid='public.parents'::regclass) THEN 'OK' ELSE 'MISSING' END
UNION ALL
SELECT 'RLS | packages',
       CASE WHEN (SELECT relrowsecurity FROM pg_class WHERE oid='public.packages'::regclass) THEN 'OK' ELSE 'MISSING' END
UNION ALL
SELECT 'RLS | schedule',
       CASE WHEN (SELECT relrowsecurity FROM pg_class WHERE oid='public.schedule'::regclass) THEN 'OK' ELSE 'MISSING' END
UNION ALL
SELECT 'RLS | attendance',
       CASE WHEN (SELECT relrowsecurity FROM pg_class WHERE oid='public.attendance'::regclass) THEN 'OK' ELSE 'MISSING' END
UNION ALL
SELECT 'RLS | payments',
       CASE WHEN (SELECT relrowsecurity FROM pg_class WHERE oid='public.payments'::regclass) THEN 'OK' ELSE 'MISSING' END
UNION ALL
SELECT 'RLS | reconciliation',
       CASE WHEN (SELECT relrowsecurity FROM pg_class WHERE oid='public.reconciliation'::regclass) THEN 'OK' ELSE 'MISSING' END
UNION ALL
SELECT 'RLS | reminders',
       CASE WHEN (SELECT relrowsecurity FROM pg_class WHERE oid='public.reminders'::regclass) THEN 'OK' ELSE 'MISSING' END
UNION ALL
SELECT 'RLS | workflow_state',
       CASE WHEN (SELECT relrowsecurity FROM pg_class WHERE oid='public.workflow_state'::regclass) THEN 'OK' ELSE 'MISSING' END
UNION ALL
SELECT 'RLS | leave_requests',
       CASE WHEN (SELECT relrowsecurity FROM pg_class WHERE oid='public.leave_requests'::regclass) THEN 'OK' ELSE 'MISSING' END
UNION ALL
SELECT 'RLS | progress',
       CASE WHEN (SELECT relrowsecurity FROM pg_class WHERE oid='public.progress'::regclass) THEN 'OK' ELSE 'MISSING' END
UNION ALL
SELECT 'RLS | communications_log',
       CASE WHEN (SELECT relrowsecurity FROM pg_class WHERE oid='public.communications_log'::regclass) THEN 'OK' ELSE 'MISSING' END
UNION ALL
SELECT 'RLS | certificates',
       CASE WHEN (SELECT relrowsecurity FROM pg_class WHERE oid='public.certificates'::regclass) THEN 'OK' ELSE 'MISSING' END

UNION ALL
-- ========== SECTION 4: AUTH USERS (test accounts) ==========
SELECT 'AUTH | total users',
       CASE WHEN (SELECT count(*) FROM auth.users) >= 3 THEN 'OK ('||(SELECT count(*) FROM auth.users)||')' ELSE 'LOW ('||(SELECT count(*) FROM auth.users)||')' END
UNION ALL
SELECT 'AUTH | user with role=admin',
       CASE WHEN EXISTS(SELECT 1 FROM auth.users WHERE raw_user_meta_data->>'role'='admin') THEN 'OK' ELSE 'MISSING' END
UNION ALL
SELECT 'AUTH | user with role=coach',
       CASE WHEN EXISTS(SELECT 1 FROM auth.users WHERE raw_user_meta_data->>'role'='coach') THEN 'OK' ELSE 'MISSING' END
UNION ALL
SELECT 'AUTH | user with role=parent',
       CASE WHEN EXISTS(SELECT 1 FROM auth.users WHERE raw_user_meta_data->>'role'='parent') THEN 'OK' ELSE 'MISSING' END

UNION ALL
-- ========== SECTION 5: EXTENSIONS ==========
SELECT 'EXTENSION | pgcrypto',
       CASE WHEN EXISTS(SELECT 1 FROM pg_extension WHERE extname='pgcrypto') THEN 'OK' ELSE 'MISSING' END
UNION ALL
SELECT 'EXTENSION | uuid-ossp',
       CASE WHEN EXISTS(SELECT 1 FROM pg_extension WHERE extname='uuid-ossp') THEN 'OK' ELSE 'MISSING' END

UNION ALL
-- ========== SECTION 6: DATABASE FUNCTIONS ==========
SELECT 'FUNCTION | update_updated_at_column',
       CASE WHEN EXISTS(SELECT 1 FROM pg_proc WHERE proname='update_updated_at_column') THEN 'OK' ELSE 'MISSING' END
UNION ALL
SELECT 'FUNCTION | mark_student_attendance',
       CASE WHEN EXISTS(SELECT 1 FROM pg_proc WHERE proname='mark_student_attendance') THEN 'OK' ELSE 'MISSING' END

UNION ALL
-- ========== SECTION 7: INDEXES (spot-check critical ones) ==========
SELECT 'INDEX | idx_schedule_coach_id',
       CASE WHEN EXISTS(SELECT 1 FROM pg_indexes WHERE indexname='idx_schedule_coach_id') THEN 'OK' ELSE 'MISSING' END
UNION ALL
SELECT 'INDEX | idx_attendance_date',
       CASE WHEN EXISTS(SELECT 1 FROM pg_indexes WHERE indexname='idx_attendance_date') THEN 'OK' ELSE 'MISSING' END
UNION ALL
SELECT 'INDEX | idx_packages_expiry_date',
       CASE WHEN EXISTS(SELECT 1 FROM pg_indexes WHERE indexname='idx_packages_expiry_date') THEN 'OK' ELSE 'MISSING' END
UNION ALL
SELECT 'INDEX | idx_payments_status',
       CASE WHEN EXISTS(SELECT 1 FROM pg_indexes WHERE indexname='idx_payments_status') THEN 'OK' ELSE 'MISSING' END
UNION ALL
SELECT 'INDEX | idx_workflow_state_lookup',
       CASE WHEN EXISTS(SELECT 1 FROM pg_indexes WHERE indexname='idx_workflow_state_lookup') THEN 'OK' ELSE 'MISSING' END
UNION ALL
SELECT 'INDEX | idx_certificates_student_id',
       CASE WHEN EXISTS(SELECT 1 FROM pg_indexes WHERE indexname='idx_certificates_student_id') THEN 'OK' ELSE 'MISSING' END
ORDER BY check_name;
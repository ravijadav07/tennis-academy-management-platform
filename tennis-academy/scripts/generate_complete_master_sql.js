import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

function stringToUuid(str) {
  if (!str) return null;
  const hash = crypto.createHash('md5').update(String(str)).digest('hex');
  return `${hash.slice(0,8)}-${hash.slice(8,12)}-4${hash.slice(13,16)}-a${hash.slice(17,20)}-${hash.slice(20,32)}`;
}

function escapeSqlStr(val) {
  if (val === null || val === undefined) return 'NULL';
  if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE';
  if (typeof val === 'number') return val;
  const str = String(val).replace(/'/g, "''");
  return `'${str}'`;
}

function normalizeEntity(val) {
  if (!val) return 'the-club';
  const str = String(val).toLowerCase();
  if (str.includes('tots') || str.includes('todds')) return 'tots-tennis';
  return 'the-club';
}

function mapStudentLevel(programOrLevel) {
  if (!programOrLevel) return 'beginner';
  const str = String(programOrLevel).toLowerCase();
  if (str.includes('hpp') || str.includes('advance') || str.includes('adv')) return 'advanced';
  if (str.includes('inter') || str.includes('int') || str.includes('jdp')) return 'intermediate';
  return 'beginner';
}

const corePath = 'd:/Ravi/Ravi/Tennis Academy Platform/tennis-academy/src/mocks/seed.core.json';
const historyPath = 'd:/Ravi/Ravi/Tennis Academy Platform/tennis-academy/src/mocks/seed.history.json';
const outputPath = 'd:/Ravi/Ravi/Tennis Academy Platform/migrations/010_complete_setup_and_real_data_seed.sql';

const core = JSON.parse(fs.readFileSync(corePath, 'utf8'));
const history = JSON.parse(fs.readFileSync(historyPath, 'utf8'));

const m006 = fs.readFileSync('d:/Ravi/Ravi/Tennis Academy Platform/migrations/006_certificates_storage.sql', 'utf8');
const m008a = fs.readFileSync('d:/Ravi/Ravi/Tennis Academy Platform/migrations/008a_enum_fix.sql', 'utf8');
const m008b = fs.readFileSync('d:/Ravi/Ravi/Tennis Academy Platform/migrations/008b_gap_fill.sql', 'utf8');

let sql = `-- ============================================================================
-- Arnav Jain Tennis Academy — COMPLETE MASTER SETUP & REAL CLIENT SEED
-- Migration 010: Combines 006 (Certificates), 008a (Enums), 008b (Gap-Fill), 
--                Table Creations, and Real Client Data Seed
-- Run this SINGLE SCRIPT in your Supabase SQL Editor!
-- Generated: ${new Date().toISOString()}
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
${m008a}

-- ============================================================================
-- PART 3: 008b — GAP-FILL (COLUMNS, COURTS TABLE, POLICIES)
-- ============================================================================
${m008b}

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
`;

const courtRows = core.courts.map(c => 
  `(${escapeSqlStr(c.id)}, ${escapeSqlStr(c.name)}, 'the-club'::entity_type, 'active')`
);
sql += courtRows.join(',\n') + ';\n\n';

// COACHES
sql += `-- ----------------------------------------------------------------------------
-- COACHES
-- ----------------------------------------------------------------------------
INSERT INTO coaches (
  id, name, designation, duty_type, base_salary, 
  rate_1on1_per_hour, rate_overtime_per_hour, paid_holidays_per_month, 
  phone, status, entity
) VALUES
`;

const coachRows = core.coaches.map(c => {
  const coachUuid = stringToUuid(c.id);
  const duty = c.dutyType || 'FULL_TIME';
  return `(${escapeSqlStr(coachUuid)}, ${escapeSqlStr(c.name)}, ${escapeSqlStr(c.designation)}, ${escapeSqlStr(duty)}::duty_type, ${c.baseSalary || 0}, ${c.rate1on1PerHour || 0}, ${c.rateOvertimePerHour || 0}, ${c.paidHolidaysPerMonth || 0}, ${escapeSqlStr(c.phone)}, 'active'::coach_status, 'the-club'::entity_type)`;
});
sql += coachRows.join(',\n') + ';\n\n';

// BATCHES
sql += `-- ----------------------------------------------------------------------------
-- BATCHES
-- ----------------------------------------------------------------------------
INSERT INTO batches (
  id, name, day_pattern, court_id, start_time, end_time, 
  program, ball_level, capacity, primary_coach_id, support_coach_id, 
  is_semi_batch, semi_batch_group, court_change_at, court_change_to, 
  status, entity, level
) VALUES
`;

const batchRows = core.batches.map(b => {
  const batchUuid = stringToUuid(b.id);
  const primaryCoachUuid = b.primaryCoachId ? stringToUuid(b.primaryCoachId) : null;
  const supportCoachUuid = b.supportCoachId ? stringToUuid(b.supportCoachId) : null;
  const level = mapStudentLevel(b.ballLevel || b.program);
  const entity = normalizeEntity(b.entity);
  
  return `(${escapeSqlStr(batchUuid)}, ${escapeSqlStr(b.name)}, ${escapeSqlStr(b.dayPattern)}, ${escapeSqlStr(b.courtId)}, ${escapeSqlStr(b.startTime)}, ${escapeSqlStr(b.endTime)}, ${escapeSqlStr(b.program)}, ${escapeSqlStr(b.ballLevel)}, ${b.capacity || 10}, ${escapeSqlStr(primaryCoachUuid)}, ${escapeSqlStr(supportCoachUuid)}, ${b.isSemiBatch ? 'TRUE' : 'FALSE'}, ${escapeSqlStr(b.semiBatchGroup)}, ${escapeSqlStr(b.courtChangeAt)}, ${escapeSqlStr(b.courtChangeTo)}, 'active'::batch_status, ${escapeSqlStr(entity)}::entity_type, ${escapeSqlStr(level)}::student_level)`;
});
sql += batchRows.join(',\n') + ';\n\n';

// PARENTS
sql += `-- ----------------------------------------------------------------------------
-- PARENTS
-- ----------------------------------------------------------------------------
`;

const parentMap = new Map();
core.students.forEach(s => {
  if (s.guardianName) {
    const key = `${s.guardianName.trim()}_${s.guardianPhone || ''}`;
    if (!parentMap.has(key)) {
      parentMap.set(key, {
        id: stringToUuid(`parent_${key}`),
        name: s.guardianName.trim(),
        phone: s.guardianPhone || '+91 9800000000',
        email: s.guardianEmail || null,
        entity: normalizeEntity(s.entity)
      });
    }
  }
});

const parentsArray = Array.from(parentMap.values());
sql += `INSERT INTO parents (id, name, phone, email, entity, account_status) VALUES\n`;
const parentRows = parentsArray.map(p => 
  `(${escapeSqlStr(p.id)}, ${escapeSqlStr(p.name)}, ${escapeSqlStr(p.phone)}, ${escapeSqlStr(p.email)}, ${escapeSqlStr(p.entity)}::entity_type, 'active'::account_status)`
);
sql += parentRows.join(',\n') + ';\n\n';

// STUDENTS & STUDENT_PARENTS
sql += `-- ----------------------------------------------------------------------------
-- STUDENTS & STUDENT_PARENTS
-- ----------------------------------------------------------------------------
INSERT INTO students (
  id, name, age, age_group, level, entity, status, join_date, 
  guardian_name, guardian_phone, guardian_email, membership_type
) VALUES
`;

const studentParentLinks = [];

const studentRows = core.students.map(s => {
  const studentUuid = stringToUuid(s.id);
  const level = mapStudentLevel(s.program || s.membershipType);
  const entity = normalizeEntity(s.entity);
  const status = s.status ? s.status.toLowerCase() : 'active';
  const joinDate = s.joinDate || '2026-08-01';

  if (s.guardianName) {
    const key = `${s.guardianName.trim()}_${s.guardianPhone || ''}`;
    const parent = parentMap.get(key);
    if (parent) {
      studentParentLinks.push({ studentId: studentUuid, parentId: parent.id });
    }
  }

  return `(${escapeSqlStr(studentUuid)}, ${escapeSqlStr(s.name)}, ${s.age || null}, ${escapeSqlStr(s.ageGroup || null)}, ${escapeSqlStr(level)}::student_level, ${escapeSqlStr(entity)}::entity_type, ${escapeSqlStr(status)}::student_status, ${escapeSqlStr(joinDate)}::date, ${escapeSqlStr(s.guardianName || null)}, ${escapeSqlStr(s.guardianPhone || null)}, ${escapeSqlStr(s.guardianEmail || null)}, ${escapeSqlStr(s.membershipType || null)})`;
});
sql += studentRows.join(',\n') + ';\n\n';

if (studentParentLinks.length > 0) {
  sql += `INSERT INTO student_parents (student_id, parent_id) VALUES\n`;
  const spRows = studentParentLinks.map(sp => 
    `(${escapeSqlStr(sp.studentId)}, ${escapeSqlStr(sp.parentId)})`
  );
  sql += spRows.join(',\n') + ';\n\n';
}

// ENROLLMENTS
sql += `-- ----------------------------------------------------------------------------
-- ENROLLMENTS
-- ----------------------------------------------------------------------------
INSERT INTO enrollments (id, student_id, batch_id, status, created_at, end_date) VALUES
`;

const enrollmentRows = core.enrollments.map(e => {
  const enrollmentUuid = stringToUuid(e.id);
  const studentUuid = stringToUuid(e.studentId);
  const batchUuid = stringToUuid(e.batchId);
  const status = e.status ? e.status.toLowerCase() : 'active';
  const fromDate = e.enrolledFrom || '2026-08-01';
  const toDate = e.enrolledTo || null;

  return `(${escapeSqlStr(enrollmentUuid)}, ${escapeSqlStr(studentUuid)}, ${escapeSqlStr(batchUuid)}, ${escapeSqlStr(status)}, ${escapeSqlStr(fromDate)}::timestamptz, ${escapeSqlStr(toDate)}::date)`;
});
sql += enrollmentRows.join(',\n') + ';\n\n';

// PACKAGES
sql += `-- ----------------------------------------------------------------------------
-- PACKAGES
-- ----------------------------------------------------------------------------
INSERT INTO packages (
  id, student_id, plan_type, amount, start_date, expiry_date, status, 
  payment_status, program, amount_received, balance_amount, payment_mode, 
  payment_date, base_amount, tax_amount, gst_rate, sessions_used, 
  sessions_purchased, makeup_credit, extension_days, valid_to
) VALUES
`;

const packageRows = core.packages.map(p => {
  const packageUuid = stringToUuid(p.id);
  const studentUuid = stringToUuid(p.studentId);
  const status = p.paymentStatus === 'PAID' ? 'active' : 'active';
  let paymentStatus = p.paymentStatus ? p.paymentStatus.toLowerCase() : 'pending';
  if (paymentStatus === 'partial') paymentStatus = 'pending';
  const startDate = p.validFrom || '2026-08-01';
  const expiryDate = p.validTo || '2026-08-31';

  return `(${escapeSqlStr(packageUuid)}, ${escapeSqlStr(studentUuid)}, 'Monthly'::package_plan, ${p.amount || 0}, ${escapeSqlStr(startDate)}::date, ${escapeSqlStr(expiryDate)}::date, ${escapeSqlStr(status)}::package_status, ${escapeSqlStr(paymentStatus)}::payment_status, ${escapeSqlStr(p.program || null)}, ${p.amountReceived || 0}, ${p.balanceAmount || 0}, ${escapeSqlStr(p.paymentMode || 'cash')}, ${escapeSqlStr(p.paymentDate || null)}::date, ${p.baseAmount || 0}, ${p.taxAmount || 0}, ${p.gstRate || 0}, ${p.sessionsUsed || 0}, ${p.sessionsPurchased || 0}, ${p.makeupCredit || 0}, ${p.extensionDays || 0}, ${escapeSqlStr(p.validTo || null)}::date)`;
});
sql += packageRows.join(',\n') + ';\n\n';

// SCHEDULE
if (core.privateSessions && core.privateSessions.length > 0) {
  sql += `-- ----------------------------------------------------------------------------
-- SCHEDULE
-- ----------------------------------------------------------------------------
INSERT INTO schedule (
  id, type, student_id, coach_id, entity, day, start_time, end_time, 
  location, status, student_name
) VALUES
`;

  const scheduleRows = core.privateSessions.map(ps => {
    const schedUuid = stringToUuid(ps.id);
    const coachUuid = ps.coachId ? stringToUuid(ps.coachId) : null;
    const studentUuid = ps.studentId ? stringToUuid(ps.studentId) : null;

    return `(${escapeSqlStr(schedUuid)}, 'one_on_one'::schedule_type, ${escapeSqlStr(studentUuid)}, ${escapeSqlStr(coachUuid)}, 'the-club'::entity_type, ${escapeSqlStr(ps.dayPattern || 'MWF')}, ${escapeSqlStr(ps.startTime)}, ${escapeSqlStr(ps.endTime)}, ${escapeSqlStr(ps.courtId)}, ${escapeSqlStr(ps.status || 'confirmed')}, ${escapeSqlStr(ps.clientName)})`;
  });
  sql += scheduleRows.join(',\n') + ';\n\n';
}

fs.writeFileSync(outputPath, sql);
console.log(`Successfully generated master script: ${outputPath}`);

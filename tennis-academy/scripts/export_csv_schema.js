import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rootDir = path.join(__dirname, '../..');
const dataDir = path.join(rootDir, 'data');
const corePath = path.join(__dirname, '../src/mocks/seed.core.json');
const historyPath = path.join(__dirname, '../src/mocks/seed.history.json');

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const core = fs.existsSync(corePath) ? JSON.parse(fs.readFileSync(corePath, 'utf8')) : {};
const history = fs.existsSync(historyPath) ? JSON.parse(fs.readFileSync(historyPath, 'utf8')) : {};

const academyId = '11111111-1111-1111-1111-111111111111';

function arrayToCsv(rows) {
  return rows.map(row => 
    row.map(field => {
      if (field === null || field === undefined) return '""';
      const stringified = String(field).replace(/"/g, '""');
      return `"${stringified}"`;
    }).join(',')
  ).join('\n');
}

// 1. ACADEMIES
const academiesRows = [
  ['id', 'name', 'code', 'currency', 'timezone', 'created_at'],
  [academyId, 'Ahmedabad Tennis Academy', 'ATA', 'INR', 'Asia/Kolkata', '2026-01-01T00:00:00Z']
];

// 2. COURTS
const courtsRows = [
  ['id', 'academy_id', 'name', 'surface', 'is_indoor', 'status', 'created_at']
];
(core.courts || [
  { id: 'court-1', name: 'Court 1 (Clay)', surface: 'Clay', isIndoor: false },
  { id: 'court-2', name: 'Court 2 (Hard)', surface: 'Hard', isIndoor: false },
  { id: 'court-3', name: 'Court 3 (Synthetic)', surface: 'Synthetic', isIndoor: true },
  { id: 'court-4', name: 'Court 4 (Hard)', surface: 'Hard', isIndoor: false },
  { id: 'court-5', name: 'Court 5 (Hard)', surface: 'Hard', isIndoor: false },
  { id: 'court-6', name: 'Court 6 (Fitness)', surface: 'Fitness', isIndoor: true }
]).forEach(c => {
  courtsRows.push([
    c.id,
    academyId,
    c.name,
    c.surface || 'Hard',
    c.isIndoor !== undefined ? String(c.isIndoor) : 'false',
    c.status || 'Active',
    '2026-01-01T00:00:00Z'
  ]);
});

// 3. COACHES
const coachesRows = [
  ['id', 'academy_id', 'full_name', 'phone', 'email', 'specialization', 'designation', 'duty_type', 'base_salary', 'rate_1on1_per_hour', 'rate_overtime_per_hour', 'paid_holidays_per_month', 'is_head_coach', 'status', 'joined_date']
];
(core.coaches || []).forEach(c => {
  coachesRows.push([
    c.id,
    academyId,
    c.name,
    c.phone || '',
    c.email || `${c.name.toLowerCase().replace(/\s+/g, '.')}@tennisacademy.com`,
    c.designation || 'Tennis Coach',
    c.designation || 'Tennis Coach',
    c.dutyType || 'Full Time',
    c.baseSalary || 0,
    c.rate1on1PerHour || 0,
    c.rateOvertimePerHour || 0,
    c.paidHolidaysPerMonth || 1,
    c.designation && c.designation.includes('Head') ? 'true' : 'false',
    'Active',
    '2025-01-01'
  ]);
});

// 4. PARENTS
const parentMap = new Map();
(core.students || []).forEach((s, idx) => {
  if (s.guardianName) {
    const key = `${s.guardianName.trim()}_${s.guardianPhone || ''}`;
    if (!parentMap.has(key)) {
      parentMap.set(key, {
        id: `parent-${parentMap.size + 1}`,
        name: s.guardianName.trim(),
        phone: s.guardianPhone || '+91 9800000000',
        email: s.guardianEmail || `${s.guardianName.toLowerCase().replace(/\s+/g, '.')}@example.com`,
        emergency_contact: s.guardianPhone || '+91 9800000000',
        address: 'Ahmedabad, Gujarat'
      });
    }
  }
});

const parentsRows = [
  ['id', 'academy_id', 'full_name', 'phone', 'email', 'emergency_contact', 'address', 'created_at']
];
Array.from(parentMap.values()).forEach(p => {
  parentsRows.push([
    p.id,
    academyId,
    p.name,
    p.phone,
    p.email,
    p.emergency_contact,
    p.address,
    '2026-01-05T00:00:00Z'
  ]);
});

// 5. STUDENTS
const studentsRows = [
  ['id', 'academy_id', 'parent_id', 'full_name', 'date_of_birth', 'age', 'age_group', 'gender', 'skill_level', 'status', 'join_date', 'guardian_name', 'guardian_phone', 'guardian_email', 'membership_type', 'created_at']
];
(core.students || []).forEach(s => {
  let pId = '';
  if (s.guardianName) {
    const key = `${s.guardianName.trim()}_${s.guardianPhone || ''}`;
    const p = parentMap.get(key);
    if (p) pId = p.id;
  }
  studentsRows.push([
    s.id,
    academyId,
    pId,
    s.name,
    s.dateOfBirth || '2014-01-01',
    s.age || '',
    s.ageGroup || '',
    s.gender || 'Other',
    s.program || s.level || 'Beginner',
    s.status || 'Active',
    s.joinDate || '2026-08-01',
    s.guardianName || '',
    s.guardianPhone || '',
    s.guardianEmail || '',
    s.membershipType || 'Monthly',
    '2026-01-05T00:00:00Z'
  ]);
});

// 6. BATCHES
const batchesRows = [
  ['id', 'academy_id', 'coach_id', 'support_coach_id', 'court_id', 'name', 'program', 'ball_level', 'level', 'start_time', 'end_time', 'days_of_week', 'max_capacity', 'is_semi_batch', 'semi_batch_group', 'status', 'created_at']
];
(core.batches || []).forEach(b => {
  batchesRows.push([
    b.id,
    academyId,
    b.primaryCoachId || 'coach-1',
    b.supportCoachId || '',
    b.courtId || 'court-1',
    b.name,
    b.program || '',
    b.ballLevel || '',
    b.ballLevel || 'Intermediate',
    b.startTime || '06:00',
    b.endTime || '08:00',
    b.dayPattern || 'Mon,Wed,Fri',
    b.capacity || 10,
    b.isSemiBatch ? 'true' : 'false',
    b.semiBatchGroup || '',
    'Active',
    '2026-01-01T00:00:00Z'
  ]);
});

// 7. ENROLLMENTS
const enrollmentsRows = [
  ['id', 'student_id', 'batch_id', 'package_id', 'status', 'billing_program', 'start_date', 'end_date', 'created_at']
];
(core.enrollments || []).forEach(e => {
  enrollmentsRows.push([
    e.id,
    e.studentId,
    e.batchId,
    `pkg-${e.id.replace('enr-', '')}`,
    e.status || 'Active',
    e.billingProgram || 'Monthly',
    e.enrolledFrom || '2026-08-01',
    e.enrolledTo || '2026-08-31',
    '2026-08-01T00:00:00Z'
  ]);
});

// 8. PACKAGES
const packagesRows = [
  ['id', 'academy_id', 'student_id', 'name', 'program', 'plan_type', 'amount', 'amount_received', 'balance_amount', 'payment_mode', 'payment_status', 'payment_date', 'start_date', 'expiry_date', 'sessions_purchased', 'sessions_used', 'status', 'created_at']
];
(core.packages || []).forEach(p => {
  packagesRows.push([
    p.id,
    academyId,
    p.studentId,
    p.program || 'Monthly Package',
    p.program || '',
    'Monthly',
    p.amount || 0,
    p.amountReceived || 0,
    p.balanceAmount || 0,
    p.paymentMode || 'cash',
    p.paymentStatus || 'PAID',
    p.paymentDate || '2026-08-01',
    p.validFrom || '2026-08-01',
    p.validTo || '2026-08-31',
    p.sessionsPurchased || 12,
    p.sessionsUsed || 0,
    'Active',
    '2026-08-01T00:00:00Z'
  ]);
});

// 9. PAYMENTS
const paymentsRows = [
  ['id', 'academy_id', 'student_id', 'parent_id', 'enrollment_id', 'package_id', 'amount', 'tax_amount', 'payment_mode', 'transaction_ref', 'payment_date', 'status', 'created_at']
];
(core.packages || []).forEach((p, idx) => {
  if (p.amountReceived && p.amountReceived > 0) {
    paymentsRows.push([
      `pay-${idx + 1}`,
      academyId,
      p.studentId,
      '',
      `enr-${p.studentId.replace('student-', '')}`,
      p.id,
      p.amountReceived,
      Math.round(p.amountReceived * 0.18),
      p.paymentMode || 'UPI',
      `TXN_${p.id}`,
      p.paymentDate || '2026-08-05',
      p.paymentStatus === 'PAID' ? 'Completed' : 'Pending',
      '2026-08-05T00:00:00Z'
    ]);
  }
});

// 10. ATTENDANCE
const attendanceRows = [
  ['id', 'batch_id', 'student_id', 'coach_id', 'date', 'status', 'check_in', 'check_out', 'marked_by', 'session_period', 'remarks']
];
(history.attendance || []).forEach((a, idx) => {
  attendanceRows.push([
    a.id || `att-${idx + 1}`,
    a.batchId || 'batch-1',
    a.studentId,
    a.coachId || 'coach-1',
    a.date || '2026-08-10',
    a.status || 'present',
    a.checkIn || '06:00',
    a.checkOut || '08:00',
    a.markedBy || 'coach',
    a.sessionPeriod || 'full_day',
    a.remarks || ''
  ]);
});

// 11. ONE ON ONE SESSIONS / SCHEDULE
const oooRows = [
  ['id', 'coach_id', 'student_id', 'court_id', 'student_name', 'session_date', 'day_pattern', 'start_time', 'end_time', 'fee', 'status', 'confirmation']
];
(core.privateSessions || []).concat(history.privateSessions || []).forEach((s, idx) => {
  oooRows.push([
    s.id || `ooo-${idx + 1}`,
    s.coachId || 'coach-1',
    s.studentId || '',
    s.courtId || 'court-1',
    s.clientName || s.studentName || '',
    s.date || s.sessionDate || '2026-08-12',
    s.dayPattern || 'MWF',
    s.startTime || '08:00',
    s.endTime || '09:00',
    s.fee || 1200,
    s.status || 'Scheduled',
    s.confirmation || 'confirmed_yes'
  ]);
});

// 12. COACH LEAVES
const leavesRows = [
  ['id', 'coach_id', 'leave_type', 'start_date', 'end_date', 'reason', 'status', 'approved_by', 'created_at'],
  ['lea-1', 'coach-2', 'casual', '2026-09-15', '2026-09-17', 'Personal Work', 'Approved', 'coach-1', '2026-09-10T00:00:00Z'],
  ['lea-2', 'coach-4', 'sick', '2026-09-20', '2026-09-21', 'Fever', 'Approved', 'coach-1', '2026-09-19T00:00:00Z']
];

// 13. PROGRESS REPORTS
const progressRows = [
  ['id', 'student_id', 'coach_id', 'report_date', 'category', 'rating', 'forehand_rating', 'backhand_rating', 'serve_rating', 'stamina_rating', 'remarks'],
  ['prog-1', 'student-1', 'coach-1', '2026-08-31', 'forehand', 4, 4, 4, 3, 5, 'Consistently improving top spin forehand.'],
  ['prog-2', 'student-2', 'coach-2', '2026-08-31', 'serve', 3, 3, 3, 3, 4, 'Good serve consistency and toss control.']
];

// 14. RECONCILIATION AUDITS
const reconciliationRows = [
  ['id', 'academy_id', 'filename', 'status', 'processed_records', 'discrepancies_count', 'excel_amount', 'system_amount', 'difference', 'created_at'],
  ['rec-1', academyId, 'Basic Program Details for ATA.xlsx', 'Completed', 130, 0, 450000, 450000, 0, '2026-09-01T10:00:00Z'],
  ['rec-2', academyId, 'August_Reconciliation.xlsx', 'Completed', 101, 0, 320000, 320000, 0, '2026-09-05T10:00:00Z']
];

// 15. REPORT VERIFICATIONS
const verificationsRows = [
  ['id', 'report_type', 'period_month', 'generated_at', 'verified_by', 'verification_status', 'notes'],
  ['ver-1', 'Slot Analysis Report', '2026-08', '2026-09-01T08:00:00Z', 'Parth Kalke', 'Verified', 'All 130 total slots verified across MWF, TTS, and Sat/Sun'],
  ['ver-2', 'Coach Payroll Audit', '2026-08', '2026-09-02T10:00:00Z', 'Parth Kalke', 'Verified', 'Team Details salary & 1-1 hourly rates matched']
];

const tables = {
  academies: academiesRows,
  courts: courtsRows,
  coaches: coachesRows,
  parents: parentsRows,
  students: studentsRows,
  batches: batchesRows,
  enrollments: enrollmentsRows,
  packages: packagesRows,
  payments: paymentsRows,
  attendance: attendanceRows,
  one_on_one_sessions: oooRows,
  coach_leaves: leavesRows,
  progress_reports: progressRows,
  reconciliation_audits: reconciliationRows,
  report_verifications: verificationsRows
};

const publicDataDir = path.join(__dirname, '../public/data');
if (!fs.existsSync(publicDataDir)) {
  fs.mkdirSync(publicDataDir, { recursive: true });
}

Object.entries(tables).forEach(([tableName, rows]) => {
  const csvContent = arrayToCsv(rows);
  const filePath = path.join(dataDir, `${tableName}.csv`);
  const publicPath = path.join(publicDataDir, `${tableName}.csv`);
  fs.writeFileSync(filePath, csvContent, 'utf8');
  fs.writeFileSync(publicPath, csvContent, 'utf8');
  console.log(`Generated ${tableName}.csv (${rows.length - 1} rows)`);
});

console.log(`All 15 schema CSV files successfully generated in ${dataDir} and ${publicDataDir}`);



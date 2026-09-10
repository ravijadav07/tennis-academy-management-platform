import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataDir = path.join(__dirname, '../../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const tables = {
  academies: [
    ['id', 'name', 'code', 'currency', 'timezone', 'created_at'],
    ['11111111-1111-1111-1111-111111111111', 'Ahmedabad Tennis Academy', 'ATA', 'INR', 'Asia/Kolkata', '2026-01-01T00:00:00Z']
  ],
  courts: [
    ['id', 'academy_id', 'name', 'surface', 'is_indoor', 'status', 'created_at'],
    ['court-1', '11111111-1111-1111-1111-111111111111', 'Court 1 (Clay)', 'Clay', 'false', 'Active', '2026-01-01T00:00:00Z'],
    ['court-2', '11111111-1111-1111-1111-111111111111', 'Court 2 (Hard)', 'Hard', 'false', 'Active', '2026-01-01T00:00:00Z'],
    ['court-3', '11111111-1111-1111-1111-111111111111', 'Court 3 (Synthetic)', 'Synthetic', 'true', 'Active', '2026-01-01T00:00:00Z']
  ],
  coaches: [
    ['id', 'academy_id', 'full_name', 'phone', 'email', 'specialization', 'is_head_coach', 'status', 'joined_date'],
    ['coach-1', '11111111-1111-1111-1111-111111111111', 'Rajesh Sharma', '+919876543210', 'head.coach@tennisacademy.com', 'High Performance', 'true', 'Active', '2025-01-01'],
    ['coach-2', '11111111-1111-1111-1111-111111111111', 'Suresh Patel', '+919876543211', 'suresh@tennisacademy.com', 'Intermediate & Youth', 'false', 'Active', '2025-03-15'],
    ['coach-3', '11111111-1111-1111-1111-111111111111', 'Priya Mehta', '+919876543212', 'priya@tennisacademy.com', 'Beginners & Fitness', 'false', 'Active', '2025-06-01']
  ],
  parents: [
    ['id', 'academy_id', 'full_name', 'phone', 'email', 'emergency_contact', 'address', 'created_at'],
    ['parent-1', '11111111-1111-1111-1111-111111111111', 'Anil Kumar', '+919825012345', 'anil.kumar@example.com', '+919825012346', 'Satellite, Ahmedabad', '2026-01-05T00:00:00Z'],
    ['parent-2', '11111111-1111-1111-1111-111111111111', 'Meena Shah', '+919825023456', 'meena.shah@example.com', '+919825023457', 'Bodakdev, Ahmedabad', '2026-01-10T00:00:00Z']
  ],
  students: [
    ['id', 'academy_id', 'parent_id', 'full_name', 'date_of_birth', 'gender', 'skill_level', 'status', 'created_at'],
    ['student-1', '11111111-1111-1111-1111-111111111111', 'parent-1', 'Rohan Kumar', '2012-05-14', 'Male', 'Intermediate', 'Active', '2026-01-05T00:00:00Z'],
    ['student-2', '11111111-1111-1111-1111-111111111111', 'parent-2', 'Aarav Shah', '2014-08-22', 'Male', 'Beginner', 'Active', '2026-01-10T00:00:00Z']
  ],
  batches: [
    ['id', 'academy_id', 'coach_id', 'court_id', 'name', 'level', 'start_time', 'end_time', 'days_of_week', 'max_capacity', 'status'],
    ['batch-1', '11111111-1111-1111-1111-111111111111', 'coach-1', 'court-1', 'Morning High Performance', 'Advanced', '06:00', '08:00', 'Mon,Wed,Fri', 8, 'Active'],
    ['batch-2', '11111111-1111-1111-1111-111111111111', 'coach-2', 'court-2', 'Evening Junior Beginner', 'Beginner', '16:30', '18:00', 'Tue,Thu,Sat', 12, 'Active']
  ],
  enrollments: [
    ['id', 'student_id', 'batch_id', 'package_id', 'start_date', 'end_date', 'status', 'created_at'],
    ['enr-1', 'student-1', 'batch-1', 'pkg-1', '2026-01-01', '2026-03-31', 'Active', '2026-01-05T00:00:00Z'],
    ['enr-2', 'student-2', 'batch-2', 'pkg-2', '2026-01-10', '2026-04-10', 'Active', '2026-01-10T00:00:00Z']
  ],
  packages: [
    ['id', 'academy_id', 'name', 'duration_months', 'sessions_count', 'price', 'gst_rate', 'status'],
    ['pkg-1', '11111111-1111-1111-1111-111111111111', 'Quarterly High Performance', 3, 36, 15000, 0.18, 'Active'],
    ['pkg-2', '11111111-1111-1111-1111-111111111111', 'Quarterly Junior Starter', 3, 36, 9000, 0.18, 'Active']
  ],
  payments: [
    ['id', 'academy_id', 'enrollment_id', 'amount', 'tax_amount', 'payment_mode', 'transaction_ref', 'payment_date', 'status'],
    ['pay-1', '11111111-1111-1111-1111-111111111111', 'enr-1', 17700, 2700, 'UPI', 'UPI987654321', '2026-01-05', 'Completed'],
    ['pay-2', '11111111-1111-1111-1111-111111111111', 'enr-2', 10620, 1620, 'NetBanking', 'NB123456789', '2026-01-10', 'Completed']
  ],
  attendance: [
    ['id', 'batch_id', 'student_id', 'date', 'status', 'marked_by', 'remarks'],
    ['att-1', 'batch-1', 'student-1', '2026-09-08', 'Present', 'coach-1', 'Good footwork'],
    ['att-2', 'batch-2', 'student-2', '2026-09-08', 'Absent', 'coach-2', 'Informed parent']
  ],
  progress_reports: [
    ['id', 'student_id', 'coach_id', 'report_date', 'forehand_rating', 'backhand_rating', 'serve_rating', 'stamina_rating', 'remarks'],
    ['prog-1', 'student-1', 'coach-1', '2026-08-31', 4, 4, 3, 5, 'Consistently improving top spin forehand.']
  ],
  one_on_one_sessions: [
    ['id', 'coach_id', 'student_id', 'court_id', 'session_date', 'start_time', 'end_time', 'fee', 'status'],
    ['ooo-1', 'coach-1', 'student-1', 'court-1', '2026-09-12', '08:00', '09:00', 1200, 'Scheduled']
  ],
  coach_leaves: [
    ['id', 'coach_id', 'start_date', 'end_date', 'reason', 'status', 'approved_by'],
    ['lea-1', 'coach-2', '2026-09-15', '2026-09-17', 'Personal Work', 'Approved', 'coach-1']
  ],
  reconciliation_audits: [
    ['id', 'academy_id', 'filename', 'status', 'processed_records', 'discrepancies_count', 'created_at'],
    ['rec-1', '11111111-1111-1111-1111-111111111111', 'August_Reconciliation.xlsx', 'Completed', 45, 0, '2026-09-01T10:00:00Z']
  ],
  report_verifications: [
    ['id', 'report_type', 'generated_at', 'verified_by', 'verification_status'],
    ['ver-1', 'Slot Analysis Report', '2026-09-01T08:00:00Z', 'coach-1', 'Verified']
  ]
};

function arrayToCsv(rows) {
  return rows.map(row => 
    row.map(field => {
      if (field === null || field === undefined) return '""';
      const stringified = String(field).replace(/"/g, '""');
      return `"${stringified}"`;
    }).join(',')
  ).join('\n');
}

Object.entries(tables).forEach(([tableName, rows]) => {
  const filePath = path.join(dataDir, `${tableName}.csv`);
  fs.writeFileSync(filePath, arrayToCsv(rows), 'utf8');
  console.log(`Created ${filePath}`);
});

console.log('All 15 schema CSV files generated in data/ folder.');

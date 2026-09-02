// src/config/roles.js
// 4-tier RBAC: admin, ops_head, coach, parent.
// OPS_HEAD has operational access but no financial visibility (no payments/payroll/reconciliation).

export const ROLES = {
  ADMIN: 'admin',
  OPS_HEAD: 'ops_head',
  COACH: 'coach',
  PARENT: 'parent',
};

export const PERMISSIONS = {
  admin: [
    'students.view', 'students.manage',
    'parents.view', 'parents.manage',
    'coaches.view', 'coaches.manage',
    'batches.view', 'batches.manage',
    'schedule.view', 'schedule.manage',
    'attendance.view', 'attendance.manage',
    'reports.view', 'reports.manage',
    'payments.view', 'payments.manage',
    'reconciliation.view', 'reconciliation.manage',
    'payroll.view', 'payroll.manage',
    'verification.manage',
  ],
  ops_head: [
    'students.view', 'students.manage',
    'coaches.view', 'coaches.manage',
    'batches.view', 'batches.manage',
    'schedule.view', 'schedule.manage',
    'attendance.view', 'attendance.manage',
    'reports.view',
    'verification.manage',
    // Explicitly excluded: payments, payroll, reconciliation
  ],
  coach: [
    'schedule.view_own',
    'attendance.view_own', 'attendance.manage_own',
    'leave.view_own', 'leave.manage_own',
    'stats.view_own',
    'one_on_one.view_own', 'one_on_one.manage_own',
    'private_sessions.view_own', 'private_sessions.manage_own',
  ],
  parent: [
    'student.view_own',
    'schedule.view_own',
    'attendance.view_own',
    'payments.view_own',
    'package.view_own',
    'progress.view_own',
  ],
};

export function hasPermission(role, permission) {
  return (PERMISSIONS[role] || []).includes(permission);
}
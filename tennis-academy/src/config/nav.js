// src/config/nav.js
// Navigation config with parentPath support for nested/detail routes.
// Detail routes (e.g. /admin/batches/:id) inherit their parent's sidebar
// active state, header title, and subtitle.
import {
  LayoutGrid, Calendar, GraduationCap, ClipboardCheck,
  BarChart3, IndianRupee, CheckCircle, MapPin, Receipt,
  Clock, TrendingUp, UserSquare2, Package, CreditCard, UserCheck,
} from 'lucide-react';

// CHILD_ROUTE_MAP: maps any route prefix → parent nav path + header override
const CHILD_ROUTE_MAP = {
  '/admin/batches': { parent: '/admin/schedule', title: 'Batch Detail', subtitle: 'Roster and capacity' },
  '/ops/batches':   { parent: '/ops/schedule',   title: 'Batch Detail', subtitle: 'Roster and capacity' },
};

export const adminNav = [
  { section: 'OVERVIEW', items: [
    { path: '/admin', label: 'Overview', subtitle: 'Daily academy snapshot', icon: LayoutGrid },
  ]},
  { section: 'OPERATIONS', items: [
    { path: '/admin/courts', label: 'Court Master', subtitle: 'Configure courts and time slots', icon: MapPin },
    { path: '/admin/coaches', label: 'Coach Mgmt', subtitle: 'Add, edit, and archive coaches', icon: UserCheck },
    { path: '/admin/schedule', label: 'Schedule', subtitle: 'Court schedule grid', icon: Calendar },
    { path: '/admin/students', label: 'Students', subtitle: 'Manage student profiles and enrollment', icon: GraduationCap },
    { path: '/admin/attendance', label: 'Attendance', subtitle: 'Track student and coach attendance', icon: ClipboardCheck },
    { path: '/admin/verification', label: 'Private Verif.', subtitle: 'Verify completed private sessions', icon: CheckCircle },
  ]},
  { section: 'REPORTS', items: [
    { path: '/admin/reports', label: 'Slot Analysis', subtitle: 'Occupancy and capacity reports', icon: BarChart3 },
    { path: '/admin/revenue', label: 'Revenue', subtitle: 'Finance and revenue reports', icon: IndianRupee },
    { path: '/admin/payroll', label: 'Payroll', subtitle: 'Coach payroll breakdown', icon: Receipt },
  ]},
];

export const opsHeadNav = [
  { section: 'OPERATIONS', items: [
    { path: '/ops', label: 'Overview', subtitle: 'Operational snapshot', icon: LayoutGrid },
    { path: '/ops/schedule', label: 'Schedule', subtitle: 'Court schedule grid', icon: Calendar },
    { path: '/ops/students', label: 'Students', subtitle: 'Student profiles', icon: GraduationCap },
    { path: '/ops/attendance', label: 'Attendance', subtitle: 'Track attendance', icon: ClipboardCheck },
    { path: '/ops/verification', label: 'Private Verif.', subtitle: 'Verify private sessions', icon: CheckCircle },
  ]},
  { section: 'REPORTS', items: [
    { path: '/ops/reports', label: 'Slot Analysis', subtitle: 'Occupancy reports', icon: BarChart3 },
  ]},
];

export const coachNav = [
  { section: 'MY WORK', items: [
    { path: '/coach', label: 'Today', subtitle: 'Your coaching day', icon: LayoutGrid },
    { path: '/coach/private-log', label: 'Private Coaching', subtitle: 'Manage private coaching sessions', icon: UserSquare2 },
    { path: '/coach/leave', label: 'Leave', subtitle: 'Apply and track leave requests', icon: Clock },
    { path: '/coach/stats', label: 'My Stats', subtitle: 'Coaching performance', icon: TrendingUp },
  ]},
];

export const parentNav = [
  { section: 'MY CHILD', items: [
    { path: '/parent', label: 'Dashboard', subtitle: "Overview of your child's tennis journey", icon: LayoutGrid },
    { path: '/parent/schedule', label: 'Schedule', subtitle: "View your child's class schedule", icon: Calendar },
    { path: '/parent/attendance', label: 'Attendance', subtitle: "Track your child's attendance", icon: ClipboardCheck },
    { path: '/parent/package', label: 'Package', subtitle: 'Current package details', icon: Package },
    { path: '/parent/progress', label: 'Progress', subtitle: "Track your child's development", icon: TrendingUp },
  ]},
  { section: 'ACCOUNT', items: [
    { path: '/parent/payments', label: 'Payments', subtitle: 'View payment history', icon: CreditCard },
  ]},
];

// Resolve what a child/detail route maps to — returns { parentPath, title, subtitle } or null
export function resolveChildRoute(pathname) {
  for (const [prefix, meta] of Object.entries(CHILD_ROUTE_MAP)) {
    if (pathname.startsWith(prefix + '/') || pathname === prefix) return meta;
  }
  return null;
}

export function titleForPath(pathname, navItems) {
  // Check child route map first
  const child = resolveChildRoute(pathname);
  if (child) return child.title;

  let best = null;
  for (const section of navItems) {
    for (const item of section.items) {
      if (pathname === item.path || pathname.startsWith(item.path + '/')) {
        if (!best || item.path.length > best.path.length) best = item;
      }
    }
  }
  return best ? best.label : 'Overview';
}

export function subtitleForPath(pathname, navItems) {
  const child = resolveChildRoute(pathname);
  if (child) return child.subtitle;

  let best = null;
  for (const section of navItems) {
    for (const item of section.items) {
      if (pathname === item.path || pathname.startsWith(item.path + '/')) {
        if (!best || item.path.length > best.path.length) best = item;
      }
    }
  }
  return best ? best.subtitle : '';
}

export function getNavForRole(role) {
  switch (role) {
    case 'admin': return adminNav;
    case 'ops_head': return opsHeadNav;
    case 'coach': return coachNav;
    case 'parent': return parentNav;
    default: return [];
  }
}

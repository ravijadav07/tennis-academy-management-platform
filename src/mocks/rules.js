// ---------------------------------------------------------------------------
// rules.js — the business logic. This is the part that must be exactly right.
// Pure functions, no React, no storage. Unit-test these first.
// ---------------------------------------------------------------------------

export const PROGRAMS = {
  HPP:     { name: 'High Performance Program', category: 'PROGRAM', durationMin: 120, inOccupancy: true,  rank: 1 },
  JDP:     { name: 'Junior Development Program', category: 'PROGRAM', durationMin: 120, inOccupancy: true,  rank: 2 },
  ADV:     { name: 'Advanced',        category: 'LEVEL',   durationMin: 120, inOccupancy: true,  rank: 3 },
  INT:     { name: 'Intermediate',    category: 'LEVEL',   durationMin:  90, inOccupancy: true,  rank: 4 },
  ADULT:   { name: 'Adults',          category: 'LEVEL',   durationMin:  60, inOccupancy: true,  rank: 5 },
  GREEN:   { name: 'Green Ball',      category: 'BALL',    durationMin:  60, inOccupancy: true,  rank: 6 },
  ORANGE:  { name: 'Orange Ball',     category: 'BALL',    durationMin:  45, inOccupancy: true,  rank: 7 },
  RED:     { name: 'Red Ball',        category: 'BALL',    durationMin:  45, inOccupancy: true,  rank: 8 },
  WEEKEND: { name: 'Weekend Coaching',category: 'PROGRAM', durationMin:  60, inOccupancy: true,  rank: 9 },
  FITNESS: { name: 'Fitness',         category: 'SUPPORT', durationMin:  60, inOccupancy: false, rank: 10 },
  PRIVATE: { name: 'Private Coaching',category: 'PRIVATE', durationMin:  60, inOccupancy: false, rank: 11 },
};

export const OCCUPANCY_SCOPES =
  ['ADV', 'INT', 'ADULT', 'GREEN', 'ORANGE', 'RED', 'JDP', 'HPP', 'WEEKEND'];

// ---------------------------------------------------------------------------
// RULE 1 — capacity follows the student.
//
// JDP and HPP have no batches of their own. Those students sit inside Advanced,
// Intermediate or Green batches. A seat held by a JDP-billed student IS a JDP
// slot, not an Advanced slot. Empty seats stay with the batch's own program.
//
// This is why JDP and HPP always report 0 open slots: their capacity is defined
// by how many students are enrolled.
//
// Verified: MWF Advanced batches hold 20 seats; 9 are held by JDP/HPP students;
// Advanced capacity is therefore 11 — exactly what the client's sheet records.
// ---------------------------------------------------------------------------
export function computeSlotAnalysis(batches, enrollments, { month } = {}) {
  const cap = {}, booked = {};
  const bump = (o, k, n) => { o[k] = (o[k] || 0) + n; };

  for (const b of batches) {
    if (b.status !== 'ACTIVE') continue;
    const roster = enrollments.filter(
      (e) => e.batchId === b.id && e.status === 'ACTIVE' && activeInMonth(e, month)
    );

    if (b.program === 'FITNESS') {
      bump(cap, 'FITNESS', b.capacity);
      bump(booked, 'FITNESS', roster.length);
      continue;
    }

    const reallocated = {};
    for (const e of roster) {
      if (e.billingProgram !== b.program) {
        reallocated[e.billingProgram] = (reallocated[e.billingProgram] || 0) + 1;
      }
    }
    const movedOut = Object.values(reallocated).reduce((a, c) => a + c, 0);

    bump(cap, b.program, b.capacity - movedOut);
    bump(booked, b.program, roster.filter((e) => e.billingProgram === b.program).length);

    for (const [p, n] of Object.entries(reallocated)) {
      bump(cap, p, n);
      bump(booked, p, n);
    }
  }

  const scopes = {};
  for (const s of [...OCCUPANCY_SCOPES, 'FITNESS']) {
    const c = cap[s] || 0, bk = booked[s] || 0;
    scopes[s] = { total: c, booked: bk, open: c - bk, occupancyPct: c ? +(bk / c * 100).toFixed(2) : 0 };
  }

  // Academy total EXCLUDES Fitness and Private Coaching.
  const total  = OCCUPANCY_SCOPES.reduce((a, s) => a + scopes[s].total, 0);
  const bk     = OCCUPANCY_SCOPES.reduce((a, s) => a + scopes[s].booked, 0);

  return {
    academy: { total, booked: bk, open: total - bk, occupancyPct: total ? +(bk / total * 100).toFixed(2) : 0 },
    scopes,
  };
}

function activeInMonth(e, month) {
  if (!month) return true;
  const start = `${month}-01`;
  const end   = `${month}-31`;
  if (e.enrolledFrom && e.enrolledFrom > end) return false;
  if (e.enrolledTo   && e.enrolledTo   < start) return false;
  return true;
}

// ---------------------------------------------------------------------------
// RULE 2 — program precedence. If a student somehow holds several active
// enrollments, the lowest rank wins. Used to detect and resolve double counting.
// ---------------------------------------------------------------------------
export function resolveBillingProgram(programs) {
  return [...programs].sort((a, b) => PROGRAMS[a].rank - PROGRAMS[b].rank)[0];
}

export function findAmbiguousStudents(enrollments) {
  const byStudent = {};
  for (const e of enrollments) {
    if (e.status !== 'ACTIVE') continue;
    if (e.billingProgram === 'FITNESS') continue;
    (byStudent[e.studentId] ||= []).push(e);
  }
  return Object.entries(byStudent)
    .filter(([, list]) => new Set(list.map((e) => e.billingProgram)).size > 1)
    .map(([studentId, list]) => ({
      studentId,
      programs: [...new Set(list.map((e) => e.billingProgram))],
      resolved: resolveBillingProgram(list.map((e) => e.billingProgram)),
    }));
}

// ---------------------------------------------------------------------------
// RULE 3 — attendance is gated on payment. Never hide the student; grey them out
// and say why. This is the feature the client asked for most directly.
// ---------------------------------------------------------------------------
export function getEligibility(pkg, today = new Date().toISOString().slice(0, 10)) {
  if (!pkg) {
    return { markable: false, reason: 'NO_PACKAGE', label: 'No active package' };
  }
  if (pkg.paymentStatus === 'PENDING') {
    return { markable: false, reason: 'PAYMENT_PENDING', label: 'Payment pending' };
  }
  if (pkg.paymentStatus === 'PARTIAL') {
    return { markable: true, reason: 'PARTIAL_PAYMENT', label: 'Part-paid', warn: true };
  }
  const effectiveTo = addDays(pkg.validTo, pkg.extensionDays || 0);
  if (today > effectiveTo) {
    return { markable: false, reason: 'EXPIRED', label: `Expired ${formatDate(effectiveTo)}` };
  }
  const allowed = pkg.sessionsPurchased + (pkg.makeupCredit || 0);
  if (pkg.sessionsUsed >= allowed) {
    return { markable: false, reason: 'EXHAUSTED', label: `Sessions used (${pkg.sessionsUsed}/${allowed})` };
  }
  return { markable: true, reason: 'OK', label: `${allowed - pkg.sessionsUsed} sessions left` };
}

// ---------------------------------------------------------------------------
// RULE 4 — payroll. 1 paid holiday a month for tennis coaches; extra days
// deduct pro-rata. The Fitness Team and Ops Head have no such rule — which is
// handled by paidHolidaysPerMonth = 0, never by special-casing names.
// ---------------------------------------------------------------------------
export function computePayroll(coach, { privateSessionsVerified, overtimeHours, leaveDays, daysInMonth }) {
  const privatePay  = privateSessionsVerified * coach.rate1on1PerHour;
  const overtimePay = overtimeHours * coach.rateOvertimePerHour;
  const unpaidDays  = Math.max(0, leaveDays - coach.paidHolidaysPerMonth);
  const deduction   = Math.round((coach.baseSalary / daysInMonth) * unpaidDays);
  return {
    base: coach.baseSalary, privatePay, overtimePay, unpaidDays, deduction,
    gross: coach.baseSalary + privatePay + overtimePay - deduction,
  };
}

// ---------------------------------------------------------------------------
// RULE 5 — a coach who has not checked in shortly before an assigned batch
// leaves that slot uncovered. The client asked to be told, not to find out later.
// ---------------------------------------------------------------------------
export function findUncoveredSlots(batches, coachAttendance, { date, now, leadMinutes = 15 }) {
  const checkedIn = new Set(
    coachAttendance.filter((c) => c.date === date && c.checkIn && c.leaveType === 'NONE').map((c) => c.coachId)
  );
  const dow = new Date(date).getDay();
  const patterns = { MWF: [1, 3, 5], TTS: [2, 4, 6], SAT_SUN: [6, 0] };

  return batches.filter((b) => {
    if (!(patterns[b.dayPattern] || []).includes(dow)) return false;
    if (checkedIn.has(b.primaryCoachId)) return false;
    return minutesUntil(now, b.startTime) <= leadMinutes;
  }).map((b) => ({
    batchId: b.id, batchName: b.name, startTime: b.startTime,
    coachId: b.primaryCoachId, severity: minutesUntil(now, b.startTime) < 0 ? 'CRITICAL' : 'WARNING',
  }));
}

// --- small helpers -----------------------------------------------------------
const toMin = (t) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
const minutesUntil = (now, start) => toMin(start) - toMin(now);

export function addDays(iso, n) {
  const d = new Date(iso); d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}
export function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
}

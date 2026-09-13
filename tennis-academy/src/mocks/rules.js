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

  // Breakdown by pattern matching the client's Excel sheet
  const patternCap = {
    MWF: {},
    TTS: {},
    WEEKEND: { slot230: { cap: 0, bk: 0 }, slot330: { cap: 0, bk: 0 } },
    FITNESS: { MWF: { cap: 0, bk: 0 }, TTS: { cap: 0, bk: 0 } }
  };
  const patternBk = { MWF: {}, TTS: {} };

  for (const rawB of batches) {
    if ((rawB.status || '').toLowerCase() !== 'active') continue;
    const b = {
      ...rawB,
      capacity: Number(rawB.capacity || rawB.maxCapacity || rawB.max_capacity || 0),
      dayPattern: rawB.dayPattern || rawB.daysOfWeek || rawB.days_of_week || '',
    };
    const roster = enrollments.filter(
      (e) => (e.batchId || e.batch_id) === b.id && ((e.status || '').toLowerCase() === 'active') && activeInMonth(e, month)
    );

    if (b.program === 'FITNESS') {
      bump(cap, 'FITNESS', b.capacity);
      bump(booked, 'FITNESS', roster.length);
      const pat = b.dayPattern === 'TTS' ? 'TTS' : 'MWF';
      patternCap.FITNESS[pat].cap += b.capacity;
      patternCap.FITNESS[pat].bk += roster.length;
      continue;
    }

    if (b.program === 'WEEKEND') {
      bump(cap, 'WEEKEND', b.capacity);
      bump(booked, 'WEEKEND', roster.length);
      const is230 = (b.startTime || '').includes('14:30');
      const target = is230 ? patternCap.WEEKEND.slot230 : patternCap.WEEKEND.slot330;
      target.cap += b.capacity;
      target.bk += roster.length;
      continue;
    }

    const reallocated = {};
    for (const e of roster) {
      const billingProg = e.billingProgram || e.billing_program || b.program;
      if (billingProg !== b.program) {
        reallocated[billingProg] = (reallocated[billingProg] || 0) + 1;
      }
    }
    const movedOut = Object.values(reallocated).reduce((a, c) => a + c, 0);

    const ownCap = b.capacity - movedOut;
    const ownBk = roster.filter((e) => (e.billingProgram || e.billing_program || b.program) === b.program).length;

    bump(cap, b.program, ownCap);
    bump(booked, b.program, ownBk);

    const pat = b.dayPattern === 'TTS' ? 'TTS' : 'MWF';
    bump(patternCap[pat], b.program, ownCap);
    bump(patternBk[pat], b.program, ownBk);

    for (const [p, n] of Object.entries(reallocated)) {
      bump(cap, p, n);
      bump(booked, p, n);
      bump(patternCap[pat], p, n);
      bump(patternBk[pat], p, n);
    }
  }

  const scopes = {};
  for (const s of [...OCCUPANCY_SCOPES, 'FITNESS']) {
    const c = cap[s] || 0, bk = booked[s] || 0;
    scopes[s] = { total: c, booked: bk, open: c - bk, occupancyPct: c ? +(bk / c * 100).toFixed(2) : 0 };
  }

  // Academy total EXCLUDES Fitness and Private Coaching.
  const total = OCCUPANCY_SCOPES.reduce((a, s) => a + scopes[s].total, 0);
  const bk = OCCUPANCY_SCOPES.reduce((a, s) => a + scopes[s].booked, 0);

  // MWF & TTS totals across Academy
  const mwfCap = OCCUPANCY_SCOPES.filter((s) => s !== 'WEEKEND').reduce((a, s) => a + (patternCap.MWF[s] || 0), 0);
  const mwfBk = OCCUPANCY_SCOPES.filter((s) => s !== 'WEEKEND').reduce((a, s) => a + (patternBk.MWF[s] || 0), 0);

  const ttsCap = OCCUPANCY_SCOPES.filter((s) => s !== 'WEEKEND').reduce((a, s) => a + (patternCap.TTS[s] || 0), 0);
  const ttsBk = OCCUPANCY_SCOPES.filter((s) => s !== 'WEEKEND').reduce((a, s) => a + (patternBk.TTS[s] || 0), 0);

  const wkCap = scopes.WEEKEND?.total || 0;
  const wkBk = scopes.WEEKEND?.booked || 0;

  // Executive Program Matrix matching the 11 blocks of the client's Excel sheet
  const matrix = {
    ADV: {
      title: 'Advance Class Analysis',
      mwf: { total: patternCap.MWF.ADV || 0, booked: patternBk.MWF.ADV || 0, open: (patternCap.MWF.ADV || 0) - (patternBk.MWF.ADV || 0) },
      tts: { total: patternCap.TTS.ADV || 0, booked: patternBk.TTS.ADV || 0, open: (patternCap.TTS.ADV || 0) - (patternBk.TTS.ADV || 0) },
      total: scopes.ADV
    },
    INT: {
      title: 'Intermediate Class Analysis',
      mwf: { total: patternCap.MWF.INT || 0, booked: patternBk.MWF.INT || 0, open: (patternCap.MWF.INT || 0) - (patternBk.MWF.INT || 0) },
      tts: { total: patternCap.TTS.INT || 0, booked: patternBk.TTS.INT || 0, open: (patternCap.TTS.INT || 0) - (patternBk.TTS.INT || 0) },
      total: scopes.INT
    },
    ADULT: {
      title: 'Adults Class Analysis',
      mwf: { total: patternCap.MWF.ADULT || 0, booked: patternBk.MWF.ADULT || 0, open: (patternCap.MWF.ADULT || 0) - (patternBk.MWF.ADULT || 0) },
      tts: { total: patternCap.TTS.ADULT || 0, booked: patternBk.TTS.ADULT || 0, open: (patternCap.TTS.ADULT || 0) - (patternBk.TTS.ADULT || 0) },
      total: scopes.ADULT
    },
    GREEN: {
      title: 'Green Ball Class Analysis',
      mwf: { total: patternCap.MWF.GREEN || 0, booked: patternBk.MWF.GREEN || 0, open: (patternCap.MWF.GREEN || 0) - (patternBk.MWF.GREEN || 0) },
      tts: { total: patternCap.TTS.GREEN || 0, booked: patternBk.TTS.GREEN || 0, open: (patternCap.TTS.GREEN || 0) - (patternBk.TTS.GREEN || 0) },
      total: scopes.GREEN
    },
    ORANGE: {
      title: 'Orange Ball Class Analysis',
      mwf: { total: patternCap.MWF.ORANGE || 0, booked: patternBk.MWF.ORANGE || 0, open: (patternCap.MWF.ORANGE || 0) - (patternBk.MWF.ORANGE || 0) },
      tts: { total: patternCap.TTS.ORANGE || 0, booked: patternBk.TTS.ORANGE || 0, open: (patternCap.TTS.ORANGE || 0) - (patternBk.TTS.ORANGE || 0) },
      total: scopes.ORANGE
    },
    RED: {
      title: 'Red Ball Class Analysis',
      mwf: { total: patternCap.MWF.RED || 0, booked: patternBk.MWF.RED || 0, open: (patternCap.MWF.RED || 0) - (patternBk.MWF.RED || 0) },
      tts: { total: patternCap.TTS.RED || 0, booked: patternBk.TTS.RED || 0, open: (patternCap.TTS.RED || 0) - (patternBk.TTS.RED || 0) },
      total: scopes.RED
    },
    JDP: {
      title: 'Junior Development Program Analysis',
      mwf: { total: patternCap.MWF.JDP || 0, booked: patternBk.MWF.JDP || 0, open: (patternCap.MWF.JDP || 0) - (patternBk.MWF.JDP || 0) },
      tts: { total: patternCap.TTS.JDP || 0, booked: patternBk.TTS.JDP || 0, open: (patternCap.TTS.JDP || 0) - (patternBk.TTS.JDP || 0) },
      total: scopes.JDP
    },
    HPP: {
      title: 'High Performance Program Analysis',
      mwf: { total: patternCap.MWF.HPP || 0, booked: patternBk.MWF.HPP || 0, open: (patternCap.MWF.HPP || 0) - (patternBk.MWF.HPP || 0) },
      tts: { total: patternCap.TTS.HPP || 0, booked: patternBk.TTS.HPP || 0, open: (patternCap.TTS.HPP || 0) - (patternBk.TTS.HPP || 0) },
      total: scopes.HPP
    },
    WEEKEND: {
      title: 'Weekend Coaching Program Analysis',
      slot230: { total: patternCap.WEEKEND.slot230.cap, booked: patternCap.WEEKEND.slot230.bk, open: patternCap.WEEKEND.slot230.cap - patternCap.WEEKEND.slot230.bk },
      slot330: { total: patternCap.WEEKEND.slot330.cap, booked: patternCap.WEEKEND.slot330.bk, open: patternCap.WEEKEND.slot330.cap - patternCap.WEEKEND.slot330.bk },
      total: scopes.WEEKEND
    },
    FITNESS: {
      title: 'Fitness Program Analysis',
      mwf: { total: patternCap.FITNESS.MWF.cap, booked: patternCap.FITNESS.MWF.bk, open: patternCap.FITNESS.MWF.cap - patternCap.FITNESS.MWF.bk },
      tts: { total: patternCap.FITNESS.TTS.cap, booked: patternCap.FITNESS.TTS.bk, open: patternCap.FITNESS.TTS.cap - patternCap.FITNESS.TTS.bk },
      total: scopes.FITNESS
    }
  };

  return {
    academy: {
      total,
      booked: bk,
      open: total - bk,
      occupancyPct: total ? +(bk / total * 100).toFixed(2) : 0,
      mwf: { total: mwfCap, booked: mwfBk, open: mwfCap - mwfBk },
      tts: { total: ttsCap, booked: ttsBk, open: ttsCap - ttsBk },
      weekend: { total: wkCap, booked: wkBk, open: wkCap - wkBk }
    },
    matrix,
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
    if ((e.status || '').toLowerCase() !== 'active') continue;
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
// Phase 2 update: duration-based packages no longer use sessions — expiry replaces exhaustion.
// Complimentary packages bypass payment gating entirely.
// ---------------------------------------------------------------------------
export function getEligibility(pkg, today = new Date().toISOString().slice(0, 10)) {
  if (!pkg || typeof pkg !== 'object') {
    return { markable: true, reason: 'OK', label: 'Active' };
  }
  try {
    const payStatus = String(pkg.paymentStatus || '').toUpperCase();
    if (payStatus === 'COMPLIMENTARY') {
      return { markable: true, reason: 'COMPLIMENTARY', label: 'Complimentary' };
    }
    if (payStatus === 'PENDING') {
      return { markable: false, reason: 'PAYMENT_PENDING', label: 'Payment pending' };
    }
    if (payStatus === 'PARTIAL') {
      return { markable: true, reason: 'PARTIAL_PAYMENT', label: 'Part-paid', warn: true };
    }

    if (pkg.packageDuration) {
      const validDate = pkg.endDate || pkg.validTo || pkg.expiryDate;
      const endDate = validDate ? addDays(validDate, pkg.extensionDays || 0) : '2099-12-31';
      if (today && today > endDate) {
        return { markable: false, reason: 'EXPIRED', label: `Expired ${formatDate(endDate)}` };
      }
      return { markable: true, reason: 'OK', label: `Valid until ${formatDate(endDate)}` };
    }

    const validDate = pkg.validTo || pkg.expiryDate || pkg.endDate;
    const effectiveTo = validDate ? addDays(validDate, pkg.extensionDays || 0) : '2099-12-31';
    if (today && today > effectiveTo) {
      return { markable: false, reason: 'EXPIRED', label: `Expired ${formatDate(effectiveTo)}` };
    }
    const allowed = (Number(pkg.sessionsPurchased) || 12) + (Number(pkg.makeupCredit) || 0);
    const used = Number(pkg.sessionsUsed) || 0;
    if (used >= allowed) {
      return { markable: false, reason: 'EXHAUSTED', label: `Sessions used (${used}/${allowed})` };
    }
    return { markable: true, reason: 'OK', label: `${allowed - used} sessions left` };
  } catch (err) {
    return { markable: true, reason: 'OK', label: 'Active' };
  }
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
const toMin = (t) => { const [h, m] = String(t || '0:0').split(':').map(Number); return h * 60 + m; };
const minutesUntil = (now, start) => toMin(start) - toMin(now);

export function addDays(iso, n = 0) {
  if (!iso) return new Date().toISOString().slice(0, 10);
  const d = new Date(iso);
  if (isNaN(d.getTime())) return new Date().toISOString().slice(0, 10);
  d.setDate(d.getDate() + (n || 0));
  return d.toISOString().slice(0, 10);
}

export function formatDate(iso) {
  if (!iso) return '--';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return String(iso);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
}

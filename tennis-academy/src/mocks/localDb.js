// ---------------------------------------------------------------------------
// localDb.js — the ONLY module that touches storage.
//
// Everything above this file (hooks, screens, components) talks to `db.*` and
// has no idea the data lives in localStorage. When the real backend arrives,
// swap this one file for an HTTP client with the same method signatures and
// nothing else in the app changes. Keep every method async for that reason —
// even though localStorage is synchronous.
// ---------------------------------------------------------------------------
import SEED from './seedData';

const KEY = 'ata.db.v5';
const LATENCY = 120;                       // fake network delay, keeps loading states honest
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const clone = (v) => JSON.parse(JSON.stringify(v));
const uid = (p) => `${p}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

// --- storage primitives ------------------------------------------------------
function readAll() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('[ata] local store unreadable, reseeding', e);
  }
  const fresh = clone(SEED);
  writeAll(fresh);
  return fresh;
}

function writeAll(state) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch (e) {
    // QuotaExceededError: attendance history is the bulk. Trim oldest 30% and retry once.
    if (e.name === 'QuotaExceededError') {
      state.attendance = state.attendance.slice(Math.floor(state.attendance.length * 0.3));
      try { localStorage.setItem(KEY, JSON.stringify(state)); return; } catch { /* fall through */ }
    }
    console.error('[ata] write failed', e);
    throw e;
  }
}

function mutate(fn) {
  const state = readAll();
  const result = fn(state);
  state.meta.updatedAt = new Date().toISOString();
  writeAll(state);
  notify();
  return result;
}

// --- change subscription (so open screens refresh after a write) -------------
const listeners = new Set();
export const subscribe = (fn) => { listeners.add(fn); return () => listeners.delete(fn); };
const notify = () => listeners.forEach((fn) => { try { fn(); } catch (e) { console.error(e); } });

// --- audit -------------------------------------------------------------------
function audit(state, action, entity, entityId, before, after) {
  (state.auditLog ||= []).unshift({
    id: uid('log'), timestamp: new Date().toISOString(),
    userId: state.session?.userId || 'user_admin',
    action, entity, entityId, before: before ? clone(before) : null, after: after ? clone(after) : null,
  });
  state.auditLog = state.auditLog.slice(0, 500);
}

// ---------------------------------------------------------------------------
// Public API. Mirror these names exactly when you build the real backend client.
// ---------------------------------------------------------------------------
export const db = {
  // --- court master (UC-1)
  async getCourts() { await sleep(LATENCY / 2); const s = readAll(); return s.courts || []; },
  async upsertCourt(court) {
    await sleep(LATENCY);
    return mutate((s) => {
      if (!s.courts) s.courts = [];
      const i = s.courts.findIndex((c) => c.id === court.id);
      const before = i >= 0 ? s.courts[i] : null;
      const row = { ...court, id: court.id || uid('court') };
      if (i >= 0) s.courts[i] = row; else s.courts.push(row);
      audit(s, before ? 'UPDATE' : 'CREATE', 'court', row.id, before, row);
      return row;
    });
  },

  // --- session remarks (UC-3)
  async saveSessionRemark({ batchId, date, remark, userId }) {
    await sleep(LATENCY);
    return mutate((s) => {
      if (!s.sessionRemarks) s.sessionRemarks = [];
      const existing = s.sessionRemarks.find((r) => r.batchId === batchId && r.date === date);
      const entry = { id: existing ? existing.id : uid('sr'), batchId, date, remark, updatedBy: userId || 'user_admin', updatedAt: new Date().toISOString() };
      if (existing) { const idx = s.sessionRemarks.indexOf(existing); s.sessionRemarks[idx] = entry; } else { s.sessionRemarks.push(entry); }
      audit(s, 'SAVE_SESSION_REMARK', 'sessionRemark', entry.id, null, entry);
      return entry;
    });
  },
  async getSessionRemark({ batchId, date }) {
    await sleep(LATENCY / 2);
    const s = readAll();
    return ((s.sessionRemarks || []).find((r) => r.batchId === batchId && r.date === date)) || null;
  },

  // --- monthly attendance % (UC-3)
  async getMonthlyAttendancePct(studentId, month, year) {
    await sleep(LATENCY);
    const s = readAll();
    const prefix = year + '-' + String(month).padStart(2, '0');
    const att = s.attendance.filter((a) => a.studentId === studentId && a.date.startsWith(prefix) && !a.exemption);
    const present = att.filter((a) => a.status === 'PRESENT').length;
    return { studentId, present, total: att.length, pct: att.length > 0 ? Math.round((present / att.length) * 100) : 0, month, year };
  },

  // --- lifecycle
  async reset() { localStorage.removeItem(KEY); readAll(); notify(); },
  async exportJson() { return JSON.stringify(readAll(), null, 2); },
  async importJson(json) { writeAll(JSON.parse(json)); notify(); },

  // Direct state read (no async delay — hooks read sync from hydrated memory)
  readAll,

  readSessionSync() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const state = JSON.parse(raw);
        if (state.session && state.session.userId) return state.session;
      }
    } catch {}
    return null;
  },

  setSessionSync(user) {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const state = JSON.parse(raw);
        state.session = user ? {
          userId: user.userId,
          name: user.name,
          role: user.role,
          linkedCoachId: user.linkedCoachId || null,
          isParent: user.isParent || false,
          guardianPhone: user.guardianPhone || null,
          childrenIds: user.childrenIds || []
        } : null;
        localStorage.setItem(KEY, JSON.stringify(state));
      }
    } catch {}
  },

  clearSessionSync() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const state = JSON.parse(raw);
        state.session = null;
        localStorage.setItem(KEY, JSON.stringify(state));
      }
    } catch {}
  },

  getAuditLog() {
    try {
      const state = readAll();
      return (state.auditLog || []).slice(0, 500);
    } catch {
      return [];
    }
  },

  getStorageUsage() {
    try {
      const raw = localStorage.getItem(KEY) || '';
      const usedKB = Math.round(new Blob([raw]).size / 1024);
      const pctUsed = Math.round((usedKB / 5120) * 100);
      return { usedKB, pctUsed };
    } catch {
      return { usedKB: 0, pctUsed: 0 };
    }
  },

  async recordPayment({ packageId, studentId, amount, paymentStatus = 'PAID', mode = 'DIRECT', reference = '' }) {
    await sleep(LATENCY);
    return mutate((s) => {
      const pkg = s.packages.find((p) => (packageId ? p.id === packageId : p.studentId === studentId));
      if (!pkg) throw new Error('PACKAGE_NOT_FOUND');
      const before = clone(pkg);
      pkg.paymentStatus = paymentStatus;
      if (amount) pkg.amount = amount;
      pkg.paidAt = new Date().toISOString();
      pkg.paymentMode = mode;
      pkg.paymentRef = reference;
      audit(s, 'RECORD_PAYMENT', 'package', pkg.id, before, pkg);
      return pkg;
    });
  },

  // --- reference data, one call, everything the shell needs to boot
  async getBootstrap() {
    await sleep(LATENCY);
    const s = readAll();
    return {
      meta: s.meta, courts: s.courts, coaches: s.coaches, users: s.users,
      batches: s.batches, driftFlags: s.driftFlags,
    };
  },

  // --- students
  async listStudents({ query = '', status = 'ACTIVE', page = 1, pageSize = 25 } = {}) {
    await sleep(LATENCY);
    const s = readAll();
    let rows = s.students.filter((x) => (status === 'ALL' ? true : x.status === status));
    if (query) {
      const q = query.toLowerCase();
      rows = rows.filter((x) => x.name.toLowerCase().includes(q) || x.guardianPhone.includes(q));
    }
    return { rows: rows.slice((page - 1) * pageSize, page * pageSize), total: rows.length, page, pageSize };
  },

  async getStudent(studentId) {
    await sleep(LATENCY);
    const s = readAll();
    const student = s.students.find((x) => x.id === studentId);
    if (!student) throw new Error('STUDENT_NOT_FOUND');
    return {
      ...student,
      enrollments: s.enrollments.filter((e) => e.studentId === studentId),
      packages: s.packages.filter((p) => p.studentId === studentId),
    };
  },

  // Duplicate check by name+phone before creating
  async checkDuplicateStudent({ name, guardianPhone }) {
    await sleep(LATENCY / 2);
    const s = readAll();
    return s.students.find((x) =>
      x.name.toLowerCase() === (name || '').toLowerCase() &&
      x.guardianPhone === guardianPhone) || null;
  },

  async upsertStudent(student) {
    await sleep(LATENCY);
    return mutate((s) => {
      const i = s.students.findIndex((x) => x.id === student.id);
      const before = i >= 0 ? s.students[i] : null;
      const row = { ...student, id: student.id || uid('st') };
      if (i >= 0) s.students[i] = row; else s.students.push(row);
      audit(s, before ? 'UPDATE' : 'CREATE', 'student', row.id, before, row);
      return row;
    });
  },

  // Archive (never hard-delete) — sets status: 'INACTIVE', requires reason
  async archiveStudent({ studentId, reason, userId }) {
    await sleep(LATENCY);
    if (!reason?.trim()) throw new Error('REASON_REQUIRED');
    return mutate((s) => {
      const student = s.students.find((x) => x.id === studentId);
      if (!student) throw new Error('STUDENT_NOT_FOUND');
      const before = clone(student);
      student.status = 'INACTIVE';
      student.archivedReason = reason;
      student.archivedBy = userId || 'user_admin';
      student.archivedAt = new Date().toISOString();
      audit(s, 'ARCHIVE', 'student', studentId, before, student);
      return student;
    });
  },

  // Quick trial-student entry — minimal fields only, no full enrollment
  async createTrialStudent({ name, guardianPhone, batchId, date, createdBy }) {
    await sleep(LATENCY);
    return mutate((s) => {
      const student = {
        id: uid('st'), name, guardianPhone, guardianName: name + "'s Guardian",
        status: 'TRIAL', isGuest: true, enrolledFrom: date, enrolledTo: null,
        createdBy: createdBy || 'user_admin', createdAt: new Date().toISOString(),
      };
      s.students.push(student);
      audit(s, 'CREATE_TRIAL', 'student', student.id, null, student);
      // Auto-mark attendance for the trial session if batchId provided
      if (batchId && date) {
        const attRow = {
          id: uid('at'), date, batchId, studentId: student.id,
          status: 'PRESENT', markedBy: createdBy || 'user_admin',
          markedByRole: 'ADMIN', markedAt: new Date().toISOString(), source: 'ADMIN',
          isMakeup: false, overrideReason: null,
        };
        s.attendance.push(attRow);
      }
      return { student, attendance: batchId ? { batchId, date, status: 'PRESENT' } : null };
    });
  },

  // --- batches & schedule
  async listBatches({ dayPattern } = {}) {
    await sleep(LATENCY);
    const s = readAll();
    const rows = s.batches.filter((b) => (dayPattern ? b.dayPattern === dayPattern : true));
    return rows.map((b) => {
      const roster = s.enrollments.filter((e) => e.batchId === b.id && e.status === 'ACTIVE');
      return { ...b, filled: roster.length, open: b.capacity - roster.length };
    });
  },

  async getBatch(batchId) {
    await sleep(LATENCY);
    const s = readAll();
    const batch = s.batches.find((b) => b.id === batchId);
    if (!batch) throw new Error('BATCH_NOT_FOUND');
    const roster = s.enrollments
      .filter((e) => e.batchId === batchId && e.status === 'ACTIVE')
      .map((e) => ({
        ...e,
        student: s.students.find((x) => x.id === e.studentId),
        package: s.packages.find((p) => p.studentId === e.studentId && p.program === e.billingProgram),
      }));
    return { ...batch, roster };
  },

  async upsertBatch(batch) {
    await sleep(LATENCY);
    return mutate((s) => {
      const conflict = s.batches.find((b) =>
        b.id !== batch.id && b.courtId === batch.courtId && b.dayPattern === batch.dayPattern &&
        b.status === 'ACTIVE' && batch.status !== 'INACTIVE' &&
        !b.isSemiBatch && !batch.isSemiBatch &&
        batch.startTime < b.endTime && b.startTime < batch.endTime);
      if (conflict) throw Object.assign(new Error('COURT_CONFLICT'), { conflictWith: conflict.name || conflict.program });

      if (!batch.allowCoachConflict && batch.primaryCoachId) {
        const coachConflict = s.batches.find((b) =>
          b.id !== batch.id && b.status === 'ACTIVE' && batch.status !== 'INACTIVE' &&
          b.dayPattern === batch.dayPattern &&
          (b.primaryCoachId === batch.primaryCoachId || b.supportCoachId === batch.primaryCoachId) &&
          batch.startTime < b.endTime && b.startTime < batch.endTime);
        if (coachConflict) {
          const cName = s.coaches?.find((c) => c.id === batch.primaryCoachId)?.name || 'Coach';
          throw Object.assign(new Error('COACH_CONFLICT'), {
            coachName: cName,
            conflictWith: `${coachConflict.program} (${coachConflict.startTime}-${coachConflict.endTime})`
          });
        }
      }

      const i = s.batches.findIndex((b) => b.id === batch.id);
      const before = i >= 0 ? s.batches[i] : null;
      const row = { ...batch, id: batch.id || uid('b') };
      if (i >= 0) s.batches[i] = row; else s.batches.push(row);
      audit(s, before ? 'UPDATE' : 'CREATE', 'batch', row.id, before, row);
      return row;
    });
  },

  async archiveBatch({ batchId, reason, userId }) {
    await sleep(LATENCY);
    if (!reason?.trim()) throw new Error('REASON_REQUIRED');
    return mutate((s) => {
      const batch = s.batches.find((b) => b.id === batchId);
      if (!batch) throw new Error('BATCH_NOT_FOUND');
      const before = clone(batch);
      batch.status = 'INACTIVE';
      batch.archivedReason = reason;
      batch.archivedBy = userId || 'user_admin';
      batch.archivedAt = new Date().toISOString();
      audit(s, 'ARCHIVE', 'batch', batchId, before, batch);
      return batch;
    });
  },

  // --- coach management (Item 4)
  async upsertCoach(coach) {
    await sleep(LATENCY);
    return mutate((s) => {
      if (!s.coaches) s.coaches = [];
      const i = s.coaches.findIndex((c) => c.id === coach.id);
      const before = i >= 0 ? s.coaches[i] : null;
      const row = { ...coach, id: coach.id || uid('coach') };
      if (i >= 0) s.coaches[i] = row; else s.coaches.push(row);
      audit(s, before ? 'UPDATE' : 'CREATE', 'coach', row.id, before, row);
      return row;
    });
  },

  async archiveCoach({ coachId, reason }) {
    await sleep(LATENCY);
    if (!reason?.trim()) throw new Error('REASON_REQUIRED');
    return mutate((s) => {
      const coach = (s.coaches || []).find((c) => c.id === coachId);
      if (!coach) throw new Error('COACH_NOT_FOUND');
      coach.status = 'INACTIVE';
      coach.archivedReason = reason;
      coach.archivedAt = new Date().toISOString();
      audit(s, 'ARCHIVE', 'coach', coachId, null, coach);
      return coach;
    });
  },

  // --- enrollments & packages
  async listEnrollments(filter = {}) {
    await sleep(LATENCY);
    const s = readAll();
    return s.enrollments.filter((e) =>
      Object.entries(filter).every(([k, v]) => v == null || e[k] === v));
  },

  async upsertEnrollment(enrollment) {
    await sleep(LATENCY);
    return mutate((s) => {
      const i = s.enrollments.findIndex((e) => e.id === enrollment.id);
      const row = { ...enrollment, id: enrollment.id || uid('en') };
      if (i >= 0) s.enrollments[i] = row; else s.enrollments.push(row);
      audit(s, i >= 0 ? 'UPDATE' : 'CREATE', 'enrollment', row.id, i >= 0 ? s.enrollments[i] : null, row);
      return row;
    });
  },

  async upsertPackage(pkg) {
    await sleep(LATENCY);
    return mutate((s) => {
      const i = s.packages.findIndex((p) => p.id === pkg.id);
      const before = i >= 0 ? s.packages[i] : null;
      const row = { ...pkg, id: pkg.id || uid('pkg') };
      if (i >= 0) s.packages[i] = row; else s.packages.push(row);
      audit(s, before ? 'UPDATE' : 'CREATE', 'package', row.id, before, row);
      return row;
    });
  },

  // Admin-only. Requires a reason — the client grants extensions rarely and
  // deliberately, so make the caller say why and record who did it.
  async extendPackage({ packageId, days, reason, userId }) {
    await sleep(LATENCY);
    if (!reason?.trim()) throw new Error('REASON_REQUIRED');
    return mutate((s) => {
      const p = s.packages.find((x) => x.id === packageId);
      if (!p) throw new Error('PACKAGE_NOT_FOUND');
      const before = clone(p);
      p.extensionDays = (p.extensionDays || 0) + days;
      p.extensionReason = reason;
      p.extendedBy = userId || 'user_admin';
      audit(s, 'EXTEND', 'package', p.id, before, p);
      return p;
    });
  },

  // --- attendance
  async getRoster({ batchId, date }) {
    await sleep(LATENCY);
    const s = readAll();
    const { getEligibility } = await import('./rules');
    const batch = s.batches.find((b) => b.id === batchId);
    const marked = s.attendance.filter((a) => a.batchId === batchId && a.date === date);
    const roster = s.enrollments
      .filter((e) => e.batchId === batchId && e.status === 'ACTIVE')
      .map((e) => {
        const student = s.students.find((x) => x.id === e.studentId);
        const pkg = s.packages.find((p) => p.studentId === e.studentId && p.program === e.billingProgram);
        return {
          enrollmentId: e.id, studentId: e.studentId, name: student?.name, isGuest: student?.isGuest,
          billingProgram: e.billingProgram,
          eligibility: getEligibility(pkg, date),
          attendance: marked.find((a) => a.studentId === e.studentId) || null,
        };
      });
    return { batch, date, roster };
  },

  // Idempotent on (date, batchId, studentId) — calling twice never duplicates.
  // Attendance lock: Coach can amend up to 2 days back, Admin up to 30 days.
  // Past the lock window, a mandatory overrideReason is required.
  async markAttendance({ batchId, date, entries, markedBy, markedByRole, source = 'ADMIN' }) {
    await sleep(LATENCY);
    const { getEligibility } = await import('./rules');
    const today = new Date();
    const targetDate = new Date(date + 'T00:00:00+05:30'); // Asia/Kolkata
    const diffDays = Math.floor((today - targetDate) / (1000 * 60 * 60 * 24));
    const isCoach = (markedByRole || '').toLowerCase() === 'coach';
    const lockDays = isCoach ? 2 : 30;

    return mutate((s) => {
      const written = [];
      for (const entry of entries) {
        const enr = s.enrollments.find((e) => e.batchId === batchId && e.studentId === entry.studentId);
        const pkg = s.packages.find((p) => p.studentId === entry.studentId && p.program === enr?.billingProgram);
        const elig = getEligibility(pkg, date);
        if (!elig.markable && !entry.overrideReason) {
          throw Object.assign(new Error('NOT_MARKABLE'), { studentId: entry.studentId, reason: elig.reason });
        }
        // Attendance lock: past-date entries beyond lock window require overrideReason
        if (diffDays > lockDays && !entry.overrideReason) {
          throw Object.assign(new Error('PAST_DATE_LOCKED'), {
            studentId: entry.studentId, diffDays, lockDays,
            reason: `Attendance locked for ${isCoach ? 'coach' : 'admin'} past ${lockDays} days. Provide overrideReason to back-date.`,
          });
        }
        const i = s.attendance.findIndex(
          (a) => a.batchId === batchId && a.date === date && a.studentId === entry.studentId);
        const row = {
          id: i >= 0 ? s.attendance[i].id : uid('at'),
          date, batchId, studentId: entry.studentId, status: entry.status,
          markedBy, markedByRole, markedAt: new Date().toISOString(), source,
          isMakeup: !!entry.isMakeup, overrideReason: entry.overrideReason || null,
        };
        if (i >= 0) s.attendance[i] = row; else s.attendance.push(row);
        if (entry.status === 'PRESENT' && i < 0 && pkg) pkg.sessionsUsed += 1;
        written.push(row);
      }
      audit(s, 'MARK_ATTENDANCE', 'batch', batchId, null, { date, count: written.length });
      return written;
    });
  },

  async getDailySummary(date) {
    await sleep(LATENCY);
    const s = readAll();
    const rows = s.attendance.filter((a) => a.date === date);
    return {
      date,
      present: rows.filter((r) => r.status === 'PRESENT').length,
      absent:  rows.filter((r) => r.status === 'ABSENT').length,
      late:    rows.filter((r) => r.status === 'LATE').length,
      excused: rows.filter((r) => r.status === 'EXCUSED').length,
      total: rows.length,
      byBatch: Object.values(rows.reduce((acc, r) => {
        (acc[r.batchId] ||= { batchId: r.batchId, present: 0, total: 0 });
        acc[r.batchId].total += 1;
        if (r.status === 'PRESENT') acc[r.batchId].present += 1;
        return acc;
      }, {})),
      students: rows.map((r) => ({
        ...r, name: s.students.find((x) => x.id === r.studentId)?.name,
      })),
    };
  },

  // --- coach
  async getCoachDay({ coachId, date }) {
    await sleep(LATENCY);
    const s = readAll();
    const dow = new Date(date).getDay();
    const patterns = { MWF: [1, 3, 5], TTS: [2, 4, 6], SAT_SUN: [6, 0] };
    return {
      date, coachId,
      attendance: s.coachAttendance.find((c) => c.coachId === coachId && c.date === date) || null,
      batches: s.batches.filter((b) =>
        (b.primaryCoachId === coachId || b.supportCoachId === coachId) &&
        (patterns[b.dayPattern] || []).includes(dow)),
      privateSessions: s.privateSessions.filter((p) => p.coachId === coachId && p.date === date),
    };
  },

  async coachCheckIn({ coachId, date, block, time }) {
    await sleep(LATENCY);
    return mutate((s) => {
      let rec = s.coachAttendance.find((c) => c.coachId === coachId && c.date === date);
      if (!rec) {
        rec = { id: uid('ca'), date, coachId, checkIn: null, checkOut: null,
                sessionBlock: block, overtimeHours: 0, leaveType: 'NONE', approvedBy: null };
        s.coachAttendance.push(rec);
      }
      rec.checkIn = time || new Date().toTimeString().slice(0, 5);
      rec.sessionBlock = block;
      audit(s, 'CHECK_IN', 'coach', coachId, null, rec);
      return rec;
    });
  },

  async coachCheckOut({ coachId, date, time }) {
    await sleep(LATENCY);
    return mutate((s) => {
      const rec = s.coachAttendance.find((c) => c.coachId === coachId && c.date === date);
      if (!rec) throw new Error('NO_CHECK_IN');
      rec.checkOut = time || new Date().toTimeString().slice(0, 5);
      audit(s, 'CHECK_OUT', 'coach', coachId, null, rec);
      return rec;
    });
  },

  async logOvertime({ coachId, date, hours, note }) {
    await sleep(LATENCY);
    return mutate((s) => {
      const rec = s.coachAttendance.find((c) => c.coachId === coachId && c.date === date);
      if (!rec) throw new Error('NO_CHECK_IN');
      rec.overtimeHours = hours;
      rec.notes = note;
      audit(s, 'LOG_OVERTIME', 'coach', coachId, null, rec);
      return rec;
    });
  },

  async applyLeave({ coachId, date, leaveType }) {
    await sleep(LATENCY);
    return mutate((s) => {
      let rec = s.coachAttendance.find((c) => c.coachId === coachId && c.date === date);
      if (!rec) { rec = { id: uid('ca'), date, coachId }; s.coachAttendance.push(rec); }
      Object.assign(rec, { leaveType, checkIn: null, checkOut: null, overtimeHours: 0 });
      audit(s, 'APPLY_LEAVE', 'coach', coachId, null, rec);
      return rec;
    });
  },

  // --- private coaching
  async listPrivateSessions({ coachId, from, to, status, page = 1, pageSize = 50 } = {}) {
    await sleep(LATENCY);
    const s = readAll();
    let rows = s.privateSessions.filter((p) =>
      (!coachId || p.coachId === coachId) && (!status || p.status === status) &&
      (!from || p.date >= from) && (!to || p.date <= to));
    rows.sort((a, b) => (a.date === b.date ? a.startTime.localeCompare(b.startTime) : b.date.localeCompare(a.date)));
    return { rows: rows.slice((page - 1) * pageSize, page * pageSize), total: rows.length, page, pageSize };
  },

  async completePrivateSession(sessionId) {
    await sleep(LATENCY);
    return mutate((s) => {
      const p = s.privateSessions.find((x) => x.id === sessionId);
      if (!p) throw new Error('SESSION_NOT_FOUND');
      p.status = 'PENDING_VERIFICATION';
      p.completedAt = new Date().toISOString();
      audit(s, 'COMPLETE_PRIVATE', 'privateSession', p.id, null, p);
      return p;
    });
  },

  async createPrivateSession(session) {
    await sleep(LATENCY);
    return mutate((s) => {
      const row = { ...session, id: uid('pv'), status: 'PENDING_VERIFICATION' };
      s.privateSessions.push(row);
      audit(s, 'CREATE', 'privateSession', row.id, null, row);
      return row;
    });
  },

  async verifyPrivateSessions({ sessionIds, userId }) {
    await sleep(LATENCY);
    return mutate((s) => {
      const done = [];
      for (const id of sessionIds) {
        const p = s.privateSessions.find((x) => x.id === id);
        if (!p) continue;
        p.status = 'COMPLETED';
        p.verifiedBy = userId || 'user_admin';
        p.verifiedAt = new Date().toISOString();
        done.push(p);
      }
      audit(s, 'VERIFY_PRIVATE', 'privateSession', null, null, { count: done.length });
      return done;
    });
  },

  async unverifyPrivateSessions({ sessionIds }) {
    await sleep(LATENCY);
    return mutate((s) => {
      const done = [];
      for (const id of sessionIds) {
        const p = s.privateSessions.find((x) => x.id === id);
        if (!p) continue;
        p.status = 'PENDING_VERIFICATION';
        p.verifiedBy = null;
        p.verifiedAt = null;
        done.push(p);
      }
      audit(s, 'UNVERIFY_PRIVATE', 'privateSession', null, null, { count: done.length });
      return done;
    });
  },

  // --- reports
  async getSlotAnalysis({ month } = {}) {
    await sleep(LATENCY * 2);
    const s = readAll();
    const { computeSlotAnalysis, findAmbiguousStudents } = await import('./rules');
    return {
      month: month || s.meta.periodMonth,
      ...computeSlotAnalysis(s.batches, s.enrollments, { month }),
      ambiguous: findAmbiguousStudents(s.enrollments),
      driftFlags: s.driftFlags,
    };
  },

  async getPayroll({ month, coachId } = {}) {
    await sleep(LATENCY);
    const s = readAll();
    const { computePayroll } = await import('./rules');
    const prefix = month || s.meta.periodMonth;
    const coaches = coachId ? s.coaches.filter((c) => c.id === coachId) : s.coaches;
    return coaches.map((c) => {
      const privates = s.privateSessions.filter(
        (p) => p.coachId === c.id && p.status === 'COMPLETED' && p.date.startsWith(prefix)).length;
      const att = s.coachAttendance.filter((a) => a.coachId === c.id && a.date.startsWith(prefix));
      return {
        coach: c, privateSessionsVerified: privates,
        ...computePayroll(c, {
          privateSessionsVerified: privates,
          overtimeHours: att.reduce((a, x) => a + (x.overtimeHours || 0), 0),
          leaveDays: att.filter((x) => x.leaveType !== 'NONE').length,
          daysInMonth: 30,
        }),
      };
    });
  },

  async getUncoveredSlots({ date, now }) {
    await sleep(LATENCY);
    const s = readAll();
    const { findUncoveredSlots } = await import('./rules');
    return findUncoveredSlots(s.batches, s.coachAttendance, { date, now });
  },

  // --- player notes (UC-3 attendance exemption notes)
  async createPlayerNote({ studentId, date, note, createdBy }) {
    await sleep(LATENCY);
    return mutate((s) => {
      if (!s.playerNotes) s.playerNotes = [];
      const entry = {
        id: uid('pn'), studentId, date: date || new Date().toISOString().slice(0, 10),
        note, createdBy: createdBy || 'user_admin', createdAt: new Date().toISOString(),
      };
      s.playerNotes.push(entry);
      audit(s, 'CREATE_NOTE', 'playerNote', entry.id, null, entry);
      return entry;
    });
  },

  async getPlayerNotes(studentId) {
    await sleep(LATENCY / 2);
    const s = readAll();
    return (s.playerNotes || []).filter((n) => n.studentId === studentId);
  },

  // --- attendance exemption (UC-3): mark attendance for non-enrolled students
  async markExemption({ batchId, date, studentId, status, markedBy, markedByRole }) {
    await sleep(LATENCY);
    return mutate((s) => {
      const existing = s.attendance.find(
        (a) => a.batchId === batchId && a.date === date && a.studentId === studentId);
      const row = {
        id: existing ? existing.id : uid('at'),
        date, batchId, studentId, status,
        markedBy: markedBy || 'user_admin',
        markedByRole: markedByRole || 'ADMIN',
        markedAt: new Date().toISOString(),
        source: 'ADMIN',
        exemption: true,
        isMakeup: false,
        overrideReason: null,
      };
      if (existing) {
        const idx = s.attendance.indexOf(existing);
        s.attendance[idx] = row;
      } else {
        s.attendance.push(row);
      }
      audit(s, 'MARK_EXEMPTION', 'attendance', row.id, null, row);
      return row;
    });
  },

  // --- report verifications (Verify-then-Send workflow)
  // Locks a month's report — records approver, timestamp, disables edits
  async verifyReport({ month, year, verifiedBy }) {
    await sleep(LATENCY);
    return mutate((s) => {
      if (!s.reportVerifications) s.reportVerifications = [];
      const key = year + '-' + String(month).padStart(2, '0');
      const existing = s.reportVerifications.find((r) => r.key === key);
      if (existing) {
        existing.verifiedBy = verifiedBy || 'user_admin';
        existing.verifiedAt = new Date().toISOString();
      } else {
        s.reportVerifications.push({ key, month, year, verifiedBy: verifiedBy || 'user_admin', verifiedAt: new Date().toISOString(), locked: true });
      }
      audit(s, 'VERIFY_REPORT', 'report', key, null, { month, year, verifiedBy });
      return s.reportVerifications.find((r) => r.key === key);
    });
  },

  async getReportVerification({ month, year }) {
    await sleep(LATENCY / 2);
    const s = readAll();
    const key = year + '-' + String(month).padStart(2, '0');
    return (s.reportVerifications || []).find((r) => r.key === key) || null;
  },

  // --- email template settings
  async getEmailTemplate() {
    await sleep(LATENCY / 2);
    const s = readAll();
    return s.reportEmailTemplate || {
      subject: 'Monthly Slot Analysis — {month} {year}',
      body: 'Please find attached the Slot Analysis report for {month} {year}.\n\nAcademy Total: {booked}/{total} ({occupancy}%)\n\n— Tennis Academy Management',
    };
  },

  async saveEmailTemplate({ subject, body }) {
    await sleep(LATENCY);
    return mutate((s) => {
      s.reportEmailTemplate = { subject, body };
      audit(s, 'UPDATE_TEMPLATE', 'reportEmailTemplate', null, null, { subject });
      return s.reportEmailTemplate;
    });
  },

  // --- report recipients
  async getReportRecipients() {
    await sleep(LATENCY / 2);
    const s = readAll();
    return s.reportRecipients || { emails: [], preferredTime: '' };
  },

  async saveReportRecipients({ emails, preferredTime }) {
    await sleep(LATENCY);
    return mutate((s) => {
      s.reportRecipients = { emails: emails || [], preferredTime: preferredTime || '' };
      audit(s, 'UPDATE_RECIPIENTS', 'reportRecipients', null, null, { count: emails.length });
      return s.reportRecipients;
    });
  },

  // --- dispatch log
  async logDispatch({ recipients, exportType, verifiedKey, sentBy }) {
    await sleep(LATENCY);
    return mutate((s) => {
      if (!s.reportDispatches) s.reportDispatches = [];
      const entry = {
        id: uid('disp'), recipients, exportType: exportType || 'CSV', verifiedKey,
        sentBy: sentBy || 'user_admin', sentAt: new Date().toISOString(),
      };
      s.reportDispatches.push(entry);
      audit(s, 'DISPATCH_REPORT', 'reportDispatches', entry.id, null, entry);
      return entry;
    });
  },

  async getDispatchLog() {
    await sleep(LATENCY / 2);
    const s = readAll();
    return (s.reportDispatches || []).slice().sort((a, b) => (b.sentAt || '').localeCompare(a.sentAt || ''));
  },

  // --- category history (UC-2)
  async recordCategoryChange({ enrollmentId, studentId, previousCategory, newCategory, effectiveDate, changedBy }) {
    await sleep(LATENCY);
    return mutate((s) => {
      if (!s.categoryHistory) s.categoryHistory = [];
      const entry = {
        id: uid('ch'), enrollmentId, studentId,
        previousCategory, newCategory,
        effectiveDate: effectiveDate || new Date().toISOString().slice(0, 10),
        changedBy: changedBy || 'user_admin',
        changedAt: new Date().toISOString(),
      };
      s.categoryHistory.push(entry);
      audit(s, 'CATEGORY_CHANGE', 'categoryHistory', entry.id, null, entry);
      return entry;
    });
  },

  async getCategoryHistory(studentId) {
    await sleep(LATENCY / 2);
    const s = readAll();
    return (s.categoryHistory || []).filter((h) => h.studentId === studentId).sort((a, b) => (b.changedAt || '').localeCompare(a.changedAt || ''));
  },

  // --- past attendance correction requests (UC-3)
  async createCorrectionRequest({ attendanceId, studentId, batchId, date, oldStatus, newStatus, reason, requestedBy }) {
    await sleep(LATENCY);
    return mutate((s) => {
      if (!s.correctionRequests) s.correctionRequests = [];
      const entry = {
        id: uid('cr'), attendanceId, studentId, batchId, date,
        oldStatus, newStatus, reason,
        requestedBy: requestedBy || 'user_coach_jagdish',
        requestedAt: new Date().toISOString(),
        status: 'pending',
        reviewedBy: null, reviewedAt: null, reviewNote: null,
      };
      s.correctionRequests.push(entry);
      audit(s, 'CREATE_CORRECTION_REQUEST', 'correctionRequest', entry.id, null, entry);
      return entry;
    });
  },

  async getCorrectionRequests({ status } = {}) {
    await sleep(LATENCY / 2);
    const s = readAll();
    let reqs = (s.correctionRequests || []).sort((a, b) => (b.requestedAt || '').localeCompare(a.requestedAt || ''));
    if (status) reqs = reqs.filter((r) => r.status === status);
    return reqs;
  },

  async approveCorrectionRequest({ requestId, reviewedBy }) {
    await sleep(LATENCY);
    return mutate((s) => {
      if (!s.correctionRequests) throw new Error('NO_REQUESTS');
      const req = s.correctionRequests.find((r) => r.id === requestId);
      if (!req) throw new Error('REQUEST_NOT_FOUND');
      if (req.status !== 'pending') throw new Error('ALREADY_RESOLVED');
      req.status = 'approved';
      req.reviewedBy = reviewedBy || 'user_admin';
      req.reviewedAt = new Date().toISOString();
      // Apply the correction to attendance
      const att = s.attendance.find((a) => a.id === req.attendanceId || (a.batchId === req.batchId && a.date === req.date && a.studentId === req.studentId));
      if (att) {
        const before = clone(att);
        att.status = req.newStatus;
        att.markedBy = req.reviewedBy;
        att.markedAt = new Date().toISOString();
        att.source = 'ADMIN';
        att.correctionId = requestId;
        audit(s, 'APPROVE_CORRECTION', 'attendance', att.id, before, att);
      }
      audit(s, 'APPROVE_CORRECTION_REQUEST', 'correctionRequest', req.id, null, req);
      return req;
    });
  },

  async rejectCorrectionRequest({ requestId, reviewedBy, reason }) {
    await sleep(LATENCY);
    return mutate((s) => {
      if (!s.correctionRequests) throw new Error('NO_REQUESTS');
      const req = s.correctionRequests.find((r) => r.id === requestId);
      if (!req) throw new Error('REQUEST_NOT_FOUND');
      if (req.status !== 'pending') throw new Error('ALREADY_RESOLVED');
      req.status = 'rejected';
      req.reviewedBy = reviewedBy || 'user_admin';
      req.reviewedAt = new Date().toISOString();
      req.reviewNote = reason || '';
      audit(s, 'REJECT_CORRECTION_REQUEST', 'correctionRequest', req.id, null, req);
      return req;
    });
  },

  // --- absence notification log (WF-1)
  async logAbsenceNotification({ studentId, batchId, date, guardianEmail }) {
    await sleep(LATENCY);
    return mutate((s) => {
      if (!s.absentNotifications) s.absentNotifications = [];
      const entry = { id: uid('an'), studentId, batchId, date, guardianEmail, sentAt: new Date().toISOString() };
      s.absentNotifications.push(entry);
      audit(s, 'ABSENCE_NOTIFY', 'absentNotifications', entry.id, null, entry);
      return entry;
    });
  },

  async getAbsenceNotification({ studentId, batchId, date }) {
    await sleep(LATENCY / 2);
    const s = readAll();
    return ((s.absentNotifications || []).find((a) => a.studentId === studentId && a.batchId === batchId && a.date === date)) || null;
  },

  // --- payment reminder log (WF-2)
  async logPaymentReminder({ studentId, packageId, guardianEmail, pendingAmount }) {
    await sleep(LATENCY);
    return mutate((s) => {
      if (!s.paymentReminders) s.paymentReminders = [];
      const entry = { id: uid('pr'), studentId, packageId, guardianEmail, pendingAmount, sentAt: new Date().toISOString() };
      s.paymentReminders.push(entry);
      audit(s, 'PAYMENT_REMINDER', 'paymentReminders', entry.id, null, entry);
      return entry;
    });
  },

  async getPaymentReminderLog({ packageId }) {
    await sleep(LATENCY / 2);
    const s = readAll();
    return (s.paymentReminders || []).filter((r) => r.packageId === packageId);
  },

  // --- multi-payment tracking (UC-8, F8/D3)
  // Each payment entry is a separate record linked to a service/package line.
  async recordPayment({ packageId, studentId, amount, paymentMode, paymentDate, transactionRef, recordedBy }) {
    await sleep(LATENCY);
    return mutate((s) => {
      if (!s.payments) s.payments = [];
      const entry = {
        id: uid('pay'), packageId, studentId,
        amount, paymentMode: paymentMode || '', paymentDate: paymentDate || new Date().toISOString().slice(0, 10),
        transactionRef: transactionRef || '', recordedBy: recordedBy || 'user_admin',
        recordedAt: new Date().toISOString(),
      };
      s.payments.push(entry);
      // Update cumulative amountReceived on the package
      const pkg = s.packages.find((p) => p.id === packageId);
      if (pkg) {
        const totalPaid = s.payments.filter((p) => p.packageId === packageId).reduce((sum, p) => sum + (parseInt(p.amount) || 0), 0);
        pkg.amountReceived = totalPaid;
        pkg.balanceAmount = (pkg.amount || pkg.finalAmount || 0) - totalPaid;
        if (pkg.balanceAmount <= 0) pkg.paymentStatus = 'PAID';
        else if (totalPaid > 0) pkg.paymentStatus = 'PARTIAL';
      }
      audit(s, 'RECORD_PAYMENT', 'payments', entry.id, null, entry);
      return entry;
    });
  },

  async getPayments({ packageId, studentId } = {}) {
    await sleep(LATENCY / 2);
    const s = readAll();
    let payments = s.payments || [];
    if (packageId) payments = payments.filter((p) => p.packageId === packageId);
    if (studentId) payments = payments.filter((p) => p.studentId === studentId);
    return payments.sort((a, b) => (b.paymentDate || '').localeCompare(a.paymentDate || ''));
  },

  // --- verification invalidation (UC-5, F9)
  // Called when attendance/batch/enrollment data changes for a previously-verified month.
  async invalidateVerification({ month, year }) {
    await sleep(LATENCY);
    return mutate((s) => {
      if (!s.reportVerifications) return null;
      const key = year + '-' + String(month).padStart(2, '0');
      const v = s.reportVerifications.find((r) => r.key === key);
      if (v) {
        v.locked = false;
        v.invalidatedAt = new Date().toISOString();
        v.invalidatedReason = 'Data modified after verification — reverification required';
        audit(s, 'INVALIDATE_VERIFICATION', 'reportVerifications', key, null, { month, year });
      }
      return v || null;
    });
  },
};

export default db;

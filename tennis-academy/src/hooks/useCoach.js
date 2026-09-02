// src/hooks/useCoach.js
import { useMemo } from 'react';
import { useDb } from '../context/DbContext';

export function useCoachDay(coachId, date) {
  const { db, tick } = useDb();
  const state = useMemo(() => db.readAll(), [db, tick]);
  const batches = state.batches.filter((b) => b.primaryCoachId === coachId || b.supportCoachId === coachId);
  const privSessions = (state.privateSessions || []).filter((s) => s.coachId === coachId && s.date === date);
  const coachAtt = (state.coachAttendance || []).find((a) => a.coachId === coachId && a.date === date);
  const coach = state.coaches.find((c) => c.id === coachId);
  return { coach, batches, privateSessions: privSessions, attendance: coachAtt, checkedIn: !!coachAtt?.checkIn, loading: false };
}

export function usePrivateSessions(coachId, { from, to, page = 1, pageSize = 20 } = {}) {
  const { db, tick } = useDb();
  const state = useMemo(() => db.readAll(), [db, tick]);
  let sessions = (state.privateSessions || []).filter((s) => s.coachId === coachId);
  if (from) sessions = sessions.filter((s) => s.date >= from);
  if (to) sessions = sessions.filter((s) => s.date <= to);
  return { sessions: sessions.slice((page - 1) * pageSize, page * pageSize), total: sessions.length, page, loading: false };
}

export function useAllPrivateSessions({ status, from, to, page = 1, pageSize = 50 } = {}) {
  const { db, tick } = useDb();
  const state = useMemo(() => db.readAll(), [db, tick]);
  let sessions = state.privateSessions || [];
  if (status) sessions = sessions.filter((s) => s.status === status);
  if (from) sessions = sessions.filter((s) => s.date >= from);
  if (to) sessions = sessions.filter((s) => s.date <= to);
  return { sessions: sessions.slice((page - 1) * pageSize, page * pageSize), total: sessions.length, page, loading: false };
}

export function usePayrollData({ month, coachId } = {}) {
  const { db, tick } = useDb();
  return useMemo(() => {
    const state = db.readAll();
    // Manual payroll calculation (rules.js computePayroll is available but uses ESM)
    const { coaches, privateSessions } = state;
    let filtered = coaches;
    if (coachId) filtered = filtered.filter((c) => c.id === coachId);
    return filtered.map((c) => {
      const privs = (privateSessions || []).filter((s) => s.coachId === c.id && s.status === 'COMPLETED');
      const privCount = privs.length;
      const privPay = privCount * (c.rate1on1PerHour || 0);
      const gross = (c.baseSalary || 0) + privPay;
      return { ...c, privateCount: privCount, privatePay: privPay, gross };
    });
  }, [db, tick, month, coachId]);
}
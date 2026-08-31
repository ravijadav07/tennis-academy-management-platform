// src/hooks/useAttendance.js
import { useMemo } from 'react';
import { useDb } from '../context/DbContext';
import { getEligibility } from '../mocks/rules';

export function useAttendance(batchId, date) {
  const { db, tick } = useDb();
  const state = useMemo(() => db.readAll(), [db, tick]);

  const batch = state.batches.find((b) => b.id === batchId);
  const marked = state.attendance.filter((a) => a.batchId === batchId && a.date === date);
  const roster = state.enrollments
    .filter((e) => e.batchId === batchId && e.status === 'ACTIVE')
    .map((e) => {
      const student = state.students.find((s) => s.id === e.studentId);
      const pkg = state.packages.find((p) => p.studentId === e.studentId && p.program === e.billingProgram);
      const att = marked.find((a) => a.studentId === e.studentId);
      const eligibility = getEligibility(pkg, date);
      return { enrollmentId: e.id, studentId: e.studentId, name: student?.name || 'Unknown', batchProgram: b.program, billingProgram: e.billingProgram, eligibility, attendance: att || null, isGuest: student?.isGuest || false };
    });

  return { batch, date, roster, presentCount: marked.filter((a) => a.status === 'PRESENT').length, totalMarked: marked.length, loading: false };
}

export function useAllBatches() {
  const { db, tick } = useDb();
  const state = useMemo(() => db.readAll(), [db, tick]);
  return state.batches.filter((b) => b.status === 'ACTIVE');
}
// src/hooks/useDashboard.js
import { useMemo } from 'react';
import { useDb } from '../context/DbContext';
import { computeSlotAnalysis } from '../mocks/rules';

export function useDashboard() {
  const { db, tick } = useDb();
  const state = useMemo(() => db.readAll(), [db, tick]);
  const { batches, courts, coaches, enrollments, students, packages, attendance } = state;

  const today = new Date().toISOString().split('T')[0];
  const todayAttendance = attendance.filter((a) => a.date === today);
  const presentCount = todayAttendance.filter((a) => a.status === 'PRESENT').length;
  const totalMarked = todayAttendance.length;
  const totalActiveStudents = students.filter((s) => s.status === 'ACTIVE').length;

  const todayCoachAtt = (state.coachAttendance || []).filter((a) => a.date === today);
  const coachesCheckedIn = new Set(todayCoachAtt.filter((a) => a.checkIn).map((a) => a.coachId));
  const uncoveredSlots = batches
    .filter((b) => b.status === 'ACTIVE' && b.primaryCoachId && !coachesCheckedIn.has(b.primaryCoachId))
    .map((b) => {
      const coach = coaches.find((c) => c.id === b.primaryCoachId);
      const court = courts.find((c) => c.id === b.courtId);
      return { batchId: b.id, batchName: b.name || `${b.program} ${b.dayPattern}`, coachName: coach?.name, courtName: court?.name, time: `${b.startTime || ''} - ${b.endTime || ''}`, program: b.program };
    });

  const slotAnalysis = useMemo(() => computeSlotAnalysis(batches, enrollments), [batches, enrollments]);
  const activeBatches = batches.filter((b) => b.status === 'ACTIVE').length;

  return { today, stats: { activeStudents: totalActiveStudents, activeBatches, coaches: coaches.length, todayAttendance: presentCount, totalAttendanceToday: totalMarked, unmarkedToday: totalActiveStudents - totalMarked }, uncoveredSlots, slotAnalysis, loading: false };
}
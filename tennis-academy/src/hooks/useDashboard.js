// src/hooks/useDashboard.js
import { useMemo } from 'react';
import { useDb } from '../context/DbContext';
import { computeSlotAnalysis } from '../mocks/rules';

export function useDashboard() {
  const { db, tick } = useDb();
  const state = useMemo(() => db.readAll(), [db, tick]);
  const { batches, courts, coaches, enrollments, students, attendance, coachAttendance } = state;

  const today = new Date().toISOString().split('T')[0];

  const activeBatches = batches.filter((b) => b.status === 'ACTIVE');

  // Today's batches — filter by day of week
  const todayDay = new Date().getDay();
  const todayBatches = activeBatches.filter((b) => {
    if (b.dayPattern === 'WEEKEND') return (todayDay === 0 || todayDay === 6);
    if (b.dayPattern === 'MWF') return [1, 3, 5].includes(todayDay);
    if (b.dayPattern === 'TTS') return [2, 4, 6].includes(todayDay);
    return false;
  });

  const todayByCourt = useMemo(() => {
    const map = {};
    todayBatches.forEach((b) => {
      const cid = b.courtId || 'unknown';
      if (!map[cid]) map[cid] = { court: courts.find((c) => c.id === cid), batches: [] };
      map[cid].batches.push(b);
    });
    Object.values(map).forEach((g) => g.batches.sort((a, b) => (a.startTime || '').localeCompare(b.startTime || '')));
    return Object.values(map);
  }, [todayBatches, courts]);

  // Attendance stats
  const todayAttendance = attendance.filter((a) => a.date === today);
  const presentCount = todayAttendance.filter((a) => a.status === 'PRESENT').length;
  const totalActiveStudents = students.filter((s) => s.status === 'ACTIVE').length;
  const totalMarked = todayAttendance.length;

  // Coach check-in
  const totalCoaches = coaches.length;
  const todayCoachAtt = (coachAttendance || []).filter((a) => a.date === today);
  const checkedInToday = todayCoachAtt.filter((a) => a.checkIn).length;
  const notCheckedIn = totalCoaches - checkedInToday;

  const coachesCheckedIn = new Set(todayCoachAtt.filter((a) => a.checkIn).map((a) => a.coachId));
  const uncoveredSlots = todayBatches
    .filter((b) => b.primaryCoachId && !coachesCheckedIn.has(b.primaryCoachId))
    .map((b) => {
      const coach = coaches.find((c) => c.id === b.primaryCoachId);
      const court = courts.find((c) => c.id === b.courtId);
      return { batchId: b.id, batchName: b.name || `${b.program} ${b.dayPattern}`, coachName: coach?.name, courtName: court?.name, time: `${b.startTime || ''} - ${b.endTime || ''}`, program: b.program };
    });

  // Coach double-booking conflicts
  const conflicts = useMemo(() => {
    const slots = {};
    activeBatches.forEach((b) => {
      if (!b.primaryCoachId) return;
      const key = b.primaryCoachId + '|' + b.dayPattern + '|' + b.startTime;
      if (!slots[key]) slots[key] = { coachId: b.primaryCoachId, batches: [] };
      slots[key].batches.push(b);
    });
    return Object.values(slots).filter((g) => g.batches.length > 1).map((g) => {
      const coach = coaches.find((c) => c.id === g.coachId);
      return { coachId: g.coachId, coachName: coach?.name || 'Unknown', batches: g.batches };
    });
  }, [activeBatches, coaches]);

  const slotAnalysis = useMemo(() => computeSlotAnalysis(batches, enrollments), [batches, enrollments]);

  return {
    today,
    stats: {
      activeStudents: totalActiveStudents,
      activeBatches: activeBatches.length,
      coaches: totalCoaches,
      todayAttendance: presentCount,
      totalAttendanceToday: totalMarked,
      unmarkedToday: totalActiveStudents - totalMarked,
      checkedInToday,
      notCheckedIn,
    },
    todayByCourt,
    uncoveredSlots,
    conflicts,
    slotAnalysis,
    loading: false,
  };
}
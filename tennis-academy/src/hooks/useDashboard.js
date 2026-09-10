// src/hooks/useDashboard.js
import { useState, useEffect, useMemo, useCallback } from 'react';
import { useSupabase } from '../context/SupabaseContext';
import { computeSlotAnalysis } from '../mocks/rules';
import { db } from '../mocks/localDb';

export function useDashboard() {
  const { services, entity } = useSupabase();
  const [data, setData] = useState({
    batches: [],
    courts: [],
    coaches: [],
    enrollments: [],
    students: [],
    attendance: [],
    coachAttendance: [],
    privateSessions: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const today = new Date().toISOString().split('T')[0];

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const entityOpt = entity === 'all' ? undefined : entity;
      const [
        batchesRes,
        courtsRes,
        coachesRes,
        studentsRes,
        enrollmentsRes,
        attendanceRes,
        coachAttRes,
        scheduleRes,
      ] = await Promise.all([
        services.batches.list({ entity: entityOpt, pageSize: 200 }),
        services.courts.list({ entity: entityOpt, pageSize: 100 }),
        services.coaches.list({ entity: entityOpt, pageSize: 100 }),
        services.students.list({ entity: entityOpt, pageSize: 500 }),
        services.enrollments.list({ entity: entityOpt, pageSize: 500 }),
        services.attendance.list({ entity: entityOpt, date: today, pageSize: 500 }),
        services.attendance.listCoachAttendance({ entity: entityOpt, date: today, pageSize: 100 }),
        services.schedule.list({ entity: entityOpt, pageSize: 500 }),
      ]);

      const schedList = scheduleRes.data || [];
      const privates = schedList.filter((s) => s.sessionType === 'private' || s.sessionType === '1-on-1' || s.studentName);

      setData({
        batches: batchesRes.data || [],
        courts: courtsRes.data || [],
        coaches: coachesRes.data || [],
        enrollments: enrollmentsRes.data || [],
        students: studentsRes.data || [],
        attendance: attendanceRes.data || [],
        coachAttendance: coachAttRes.data || [],
        privateSessions: privates,
        schedule: schedList,
      });
    } catch (err) {
      console.warn('[useDashboard] Supabase network/QUIC issue, using localDb fallback:', err?.message || err);
      try {
        const local = db.readAll();
        const schedList = local.schedule || [];
        const privates = local.privateSessions || schedList.filter((s) => s.sessionType === 'private' || s.sessionType === '1-on-1' || s.studentName);
        setData({
          batches: local.batches || [],
          courts: local.courts || [],
          coaches: local.coaches || [],
          enrollments: local.enrollments || [],
          students: local.students || [],
          attendance: local.attendance || [],
          coachAttendance: local.coachAttendance || [],
          privateSessions: privates,
          schedule: schedList,
        });
      } catch (fallbackErr) {
        console.error('[useDashboard] Local fallback error:', fallbackErr);
        setError(err);
      }
    } finally {
      setLoading(false);
    }
  }, [services, entity, today]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const { batches, courts, coaches, enrollments, students, attendance, coachAttendance, privateSessions } = data;

  const activeBatches = useMemo(() => batches.filter((b) => b.status === 'ACTIVE' || b.status === 'active'), [batches]);

  const todayDay = new Date().getDay();
  const todayBatches = useMemo(() => activeBatches.filter((b) => {
    if (b.dayPattern === 'WEEKEND') return (todayDay === 0 || todayDay === 6);
    if (b.dayPattern === 'MWF') return [1, 3, 5].includes(todayDay);
    if (b.dayPattern === 'TTS') return [2, 4, 6].includes(todayDay);
    return false;
  }), [activeBatches, todayDay]);

  const todayPattern = (todayDay === 0 || todayDay === 6) ? 'SAT_SUN' : [1, 3, 5].includes(todayDay) ? 'MWF' : 'TTS';
  const todayPrivates = useMemo(() => (privateSessions || []).filter((s) => s.dayPattern === todayPattern), [privateSessions, todayPattern]);

  const todayByCourt = useMemo(() => {
    const map = {};
    todayBatches.forEach((b) => {
      const cid = b.courtId || 'unknown';
      if (!map[cid]) map[cid] = { court: courts.find((c) => c.id === cid), batches: [] };
      map[cid].batches.push({ ...b, _type: 'group' });
    });

    todayPrivates.forEach((s) => {
      const cid = s.courtId || 'unknown';
      const coach = (coaches || []).find((c) => c.id === s.coachId);
      if (!map[cid]) map[cid] = { court: courts.find((c) => c.id === cid), batches: [] };
      map[cid].batches.push({
        id: s.id,
        _type: 'private',
        name: `Private Coaching - ${s.clientName || 'Client'}`,
        startTime: s.startTime,
        endTime: s.endTime,
        primaryCoachId: s.coachId,
        coachName: coach?.name || 'Coach',
        clientName: s.clientName,
        capacity: 1,
      });
    });

    Object.values(map).forEach((g) => g.batches.sort((a, b) => (a.startTime || '').localeCompare(b.startTime || '')));
    return Object.values(map);
  }, [todayBatches, todayPrivates, courts, coaches]);

  const presentCount = useMemo(() => attendance.filter((a) => a.status === 'PRESENT' || a.status === 'present').length, [attendance]);
  const totalActiveStudents = useMemo(() => students.filter((s) => s.status === 'ACTIVE' || s.status === 'active').length, [students]);
  const totalMarked = attendance.length;

  const totalCoaches = coaches.length;
  const todayCoachAtt = useMemo(() => (coachAttendance || []).filter((a) => a.date === today), [coachAttendance, today]);
  const checkedInToday = useMemo(() => todayCoachAtt.filter((a) => a.checkIn || a.status === 'checked_in').length, [todayCoachAtt]);
  const notCheckedIn = Math.max(0, totalCoaches - checkedInToday);

  const coachesCheckedIn = useMemo(() => new Set(todayCoachAtt.filter((a) => a.checkIn || a.status === 'checked_in').map((a) => a.coachId)), [todayCoachAtt]);
  const uncoveredSlots = useMemo(() => todayBatches
    .filter((b) => b.primaryCoachId && !coachesCheckedIn.has(b.primaryCoachId))
    .map((b) => {
      const coach = coaches.find((c) => c.id === b.primaryCoachId);
      const court = courts.find((c) => c.id === b.courtId);
      return { batchId: b.id, batchName: b.name || `${b.program} ${b.dayPattern}`, coachName: coach?.name, courtName: court?.name, time: `${b.startTime || ''} - ${b.endTime || ''}`, program: b.program };
    }), [todayBatches, coachesCheckedIn, coaches, courts]);

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
      unmarkedToday: Math.max(0, totalActiveStudents - totalMarked),
      checkedInToday,
      notCheckedIn,
    },
    todayByCourt,
    uncoveredSlots,
    conflicts,
    slotAnalysis,
    courts,
    batches,
    coaches,
    enrollments,
    students,
    attendance,
    coachAttendance,
    privateSessions,
    schedule: data.schedule || [],
    loading,
    error,
    refetch: fetchData,
  };
}
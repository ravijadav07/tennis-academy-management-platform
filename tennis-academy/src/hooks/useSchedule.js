// src/hooks/useSchedule.js
import { useMemo } from 'react';
import { useDb } from '../context/DbContext';

export function useSchedule(dayPattern = 'MWF') {
  const { db, tick } = useDb();
  const state = useMemo(() => db.readAll(), [db, tick]);
  const { batches, courts, enrollments, packages, privateSessions, coaches } = state;

  const filtered = useMemo(() => {
    const active = batches.filter((b) => b.status === 'ACTIVE' && b.dayPattern === dayPattern);
    return active.map((b) => {
      const roster = enrollments.filter((e) => e.batchId === b.id && e.status === 'ACTIVE');
      const court = courts.find((c) => c.id === b.courtId);
      const filled = roster.length;
      const blockedCount = roster.filter((e) => {
        const pkg = packages.find((p) => p.studentId === e.studentId);
        return pkg && (pkg.paymentStatus === 'PENDING' || (pkg.sessionsUsed >= (pkg.sessionsPurchased || 0) + (pkg.makeupCredit || 0)));
      }).length;
      return { ...b, court, roster, filled, capacity: b.capacity || 0, blockedCount, _type: 'batch' };
    });
  }, [batches, enrollments, courts, packages, dayPattern]);

  // Private coaching blocks — today's sessions on the selected dayPattern courts
  const today = new Date().toISOString().split('T')[0];
  const privateBlocks = useMemo(() => {
    if (!privateSessions) return [];
    // Show today's private sessions; for the grid, group by court+time
    return privateSessions
      .filter((s) => s.date === today)
      .map((s) => {
        const court = courts.find((c) => c.id === s.courtId);
        const coach = coaches.find((c) => c.id === s.coachId);
        return {
          id: s.id,
          _type: 'private',
          courtId: s.courtId,
          court,
          startTime: s.startTime,
          endTime: s.endTime,
          clientName: s.clientName || s.studentName || 'Private',
          coachName: coach?.name || '',
          status: s.status,
          program: 'PRIVATE',
        };
      });
  }, [privateSessions, courts, coaches, today]);

  const byCourt = useMemo(() => {
    const map = {};
    filtered.forEach((b) => {
      const cid = b.courtId || 'unknown';
      if (!map[cid]) map[cid] = { court: b.court, batches: [] };
      map[cid].batches.push(b);
    });
    // Add private blocks to their courts
    privateBlocks.forEach((p) => {
      const cid = p.courtId || 'unknown';
      if (!map[cid]) {
        const court = courts.find((c) => c.id === cid);
        map[cid] = { court, batches: [] };
      }
      map[cid].batches.push(p);
    });
    Object.values(map).forEach((g) => g.batches.sort((a, b) => (a.startTime || '').localeCompare(b.startTime || '')));
    return Object.values(map);
  }, [filtered, privateBlocks, courts]);

  const totalBatches = filtered.length;
  const totalPrivate = privateBlocks.length;

  return { batches: filtered, byCourt, total: totalBatches, privateCount: totalPrivate, loading: false };
}
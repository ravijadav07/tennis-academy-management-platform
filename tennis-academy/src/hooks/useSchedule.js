// src/hooks/useSchedule.js
import { useState, useEffect, useMemo, useCallback } from 'react';
import { useSupabase } from '../context/SupabaseContext';
import { db } from '../mocks/localDb';

export function useSchedule(dayPattern = 'MWF') {
  const { services, entity } = useSupabase();
  const [data, setData] = useState({
    batches: [],
    courts: [],
    enrollments: [],
    packages: [],
    coaches: [],
    privateSessions: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const today = new Date().toISOString().split('T')[0];

  const fetchSchedule = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const entityOpt = entity === 'all' ? undefined : entity;
      const [batchesRes, courtsRes, enrollmentsRes, packagesRes, coachesRes] = await Promise.all([
        services.batches.list({ entity: entityOpt, pageSize: 500 }),
        services.courts.list({ entity: entityOpt, pageSize: 100 }),
        services.enrollments.list({ entity: entityOpt, pageSize: 1000 }),
        services.packages.list({ entity: entityOpt, pageSize: 1000 }),
        services.coaches.list({ entity: entityOpt, pageSize: 200 }),
      ]);

      setData({
        batches: batchesRes.data || [],
        courts: courtsRes.data || [],
        enrollments: enrollmentsRes.data || [],
        packages: packagesRes.data || [],
        coaches: coachesRes.data || [],
        privateSessions: [],
      });
    } catch (err) {
      console.error('[useSchedule] Data fetch error:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [services, entity]);

  useEffect(() => {
    fetchSchedule();
  }, [fetchSchedule]);

  const { batches, courts, enrollments, packages, privateSessions, coaches } = data;

  const filtered = useMemo(() => {
    const active = batches.filter((b) => {
      const matchStatus = (b.status || '').toLowerCase() === 'active';
      const matchPattern = b.dayPattern === dayPattern ||
        (dayPattern === 'SAT_SUN' && (b.dayPattern === 'WEEKEND' || b.dayPattern === 'SAT_SUN')) ||
        (dayPattern === 'WEEKEND' && (b.dayPattern === 'SAT_SUN' || b.dayPattern === 'WEEKEND'));
      return matchStatus && matchPattern;
    });
    return active.map((b) => {
      const roster = enrollments.filter((e) => e.batchId === b.id && (e.status === 'ACTIVE' || e.status === 'active'));
      const court = courts.find((c) => c.id === b.courtId);
      const filled = roster.length;
      const blockedCount = roster.filter((e) => {
        const pkg = packages.find((p) => p.studentId === e.studentId);
        return pkg && (pkg.paymentStatus === 'PENDING' || pkg.paymentStatus === 'pending' || (pkg.sessionsUsed >= (pkg.sessionsPurchased || 0) + (pkg.makeupCredit || 0)));
      }).length;
      return { ...b, court, roster, filled, capacity: b.capacity || 0, blockedCount, _type: 'batch' };
    });
  }, [batches, enrollments, courts, packages, dayPattern]);

  const privateBlocks = useMemo(() => {
    if (!privateSessions) return [];
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

  return { batches: filtered, byCourt, total: filtered.length, privateCount: privateBlocks.length, loading, error, refetch: fetchSchedule };
}
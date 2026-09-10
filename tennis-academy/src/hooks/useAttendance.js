// src/hooks/useAttendance.js
import { useState, useEffect, useMemo, useCallback } from 'react';
import { useSupabase } from '../context/SupabaseContext';
import { getEligibility } from '../mocks/rules';
import { db } from '../mocks/localDb';

export function useAttendance(batchId, date) {
  const { services, entity } = useSupabase();
  const [data, setData] = useState({
    batches: [],
    attendance: [],
    enrollments: [],
    students: [],
    packages: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAttendanceData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const entityOpt = entity === 'all' ? undefined : entity;
      const [batchesRes, attendanceRes, enrollmentsRes, studentsRes, packagesRes] = await Promise.all([
        services.batches.list({ entity: entityOpt, pageSize: 500 }),
        services.attendance.list({ entity: entityOpt, batchId, date, pageSize: 500 }),
        services.enrollments.list({ entity: entityOpt, batchId, pageSize: 500 }),
        services.students.list({ entity: entityOpt, pageSize: 1000 }),
        services.packages.list({ entity: entityOpt, pageSize: 1000 }),
      ]);

      setData({
        batches: batchesRes.data || [],
        attendance: attendanceRes.data || [],
        enrollments: enrollmentsRes.data || [],
        students: studentsRes.data || [],
        packages: packagesRes.data || [],
      });
    } catch (err) {
      console.error('[useAttendance] Data fetch error:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [services, entity, batchId, date]);

  useEffect(() => {
    fetchAttendanceData();
  }, [fetchAttendanceData]);

  const { batches, attendance, enrollments, students, packages } = data;

  const batch = useMemo(() => batches.find((b) => b.id === batchId), [batches, batchId]);
  const marked = useMemo(() => attendance.filter((a) => (batchId ? a.batchId === batchId : true) && (date ? a.date === date : true)), [attendance, batchId, date]);

  const roster = useMemo(() => {
    if (!batchId) return [];
    return enrollments
      .filter((e) => e.batchId === batchId && (e.status === 'ACTIVE' || e.status === 'active'))
      .map((e) => {
        const student = students.find((s) => s.id === e.studentId);
        const pkg = packages.find((p) => p.studentId === e.studentId && (p.program === e.billingProgram || p.program === e.program));
        const att = marked.find((a) => a.studentId === e.studentId);
        const eligibility = getEligibility(pkg, date || new Date().toISOString().split('T')[0]);
        return { enrollmentId: e.id, studentId: e.studentId, name: student?.name || 'Unknown', batchProgram: batch?.program || '', billingProgram: e.billingProgram || e.program, eligibility, attendance: att || null, isGuest: student?.isGuest || false };
      });
  }, [enrollments, batchId, students, packages, marked, date, batch]);

  const presentCount = useMemo(() => marked.filter((a) => a.status === 'PRESENT' || a.status === 'present').length, [marked]);

  return { batch, date, roster, presentCount, totalMarked: marked.length, loading, error, refetch: fetchAttendanceData };
}

export function useAllBatches() {
  const { services, entity } = useSupabase();
  const [batches, setBatches] = useState([]);

  useEffect(() => {
    let active = true;
    async function loadBatches() {
      try {
        const entityOpt = entity === 'all' ? undefined : entity;
        const res = await services.batches.list({ entity: entityOpt, pageSize: 500 });
        if (active) {
          setBatches((res.data || []).filter((b) => b.status === 'ACTIVE' || b.status === 'active'));
        }
      } catch (err) {
        console.error('[useAllBatches] error:', err);
      }
    }
    loadBatches();
    return () => { active = false; };
  }, [services, entity]);

  return batches;
}
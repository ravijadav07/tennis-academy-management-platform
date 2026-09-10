// src/hooks/useStudents.js
import { useState, useEffect, useMemo, useCallback } from 'react';
import { useSupabase } from '../context/SupabaseContext';
import { getEligibility } from '../mocks/rules';
import { db } from '../mocks/localDb';

export function useStudents({ query = '', status = 'all', category = '', batch = '', membership = '', payment = '', page = 1, pageSize = 20 } = {}) {
  const { services, entity } = useSupabase();
  const [data, setData] = useState({
    students: [],
    enrollments: [],
    packages: [],
    batches: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const today = new Date().toISOString().split('T')[0];

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const entityOpt = entity === 'all' ? undefined : entity;
      const [studentsRes, enrollmentsRes, packagesRes, batchesRes] = await Promise.all([
        services.students.list({ entity: entityOpt, pageSize: 1000 }),
        services.enrollments.list({ entity: entityOpt, pageSize: 1000 }),
        services.packages.list({ entity: entityOpt, pageSize: 1000 }),
        services.batches.list({ entity: entityOpt, pageSize: 500 }),
      ]);

      setData({
        students: studentsRes.data || [],
        enrollments: enrollmentsRes.data || [],
        packages: packagesRes.data || [],
        batches: batchesRes.data || [],
      });
    } catch (err) {
      console.warn('[useStudents] Supabase network/QUIC issue, using localDb fallback:', err?.message || err);
      try {
        const local = db.readAll();
        setData({
          students: local.students || [],
          enrollments: local.enrollments || [],
          packages: local.packages || [],
          batches: local.batches || [],
        });
      } catch (fallbackErr) {
        console.error('[useStudents] Fallback error:', fallbackErr);
        setError(err);
      }
    } finally {
      setLoading(false);
    }
  }, [services, entity]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  const { students, enrollments, packages, batches } = data;

  const enriched = useMemo(() => {
    return students
      .filter((s) => {
        if (status !== 'all' && s.status !== status && s.status !== status.toUpperCase()) return false;
        if (query) {
          const q = query.toLowerCase();
          return (s.name || '').toLowerCase().includes(q) || (s.guardianName || '').toLowerCase().includes(q) || (s.phone || '').includes(q);
        }
        return true;
      })
      .map((s) => {
        const enr = enrollments.filter((e) => e.studentId === s.id && (e.status === 'ACTIVE' || e.status === 'active'));
        const allPkgs = packages.filter((p) => p.studentId === s.id);
        const pkg = allPkgs[0];
        const batchObj = batches.find((b) => enr.some((e) => e.batchId === b.id));
        const eligibility = pkg ? getEligibility(pkg, today) : { markable: true, reason: '', label: '', blocked: false };
        const programs = [...new Set(enr.map((e) => e.billingProgram || e.program))].filter(Boolean);
        const batchIds = [...new Set(enr.map((e) => e.batchId))].filter(Boolean);
        return { ...s, enrollments: enr, batch: batchObj, packages: allPkgs, package: pkg, eligibility, programs, batchIds, isAmbiguous: programs.length > 1 };
      })
      .filter((s) => {
        if (category && !s.programs?.includes(category)) return false;
        if (batch && !s.batchIds?.includes(batch)) return false;
        if (membership && s.membershipType !== membership) return false;
        if (payment && s.package?.paymentStatus !== payment) return false;
        return true;
      });
  }, [students, enrollments, packages, batches, query, status, category, batch, membership, payment, today]);

  const total = enriched.length;
  const paged = enriched.slice((page - 1) * pageSize, page * pageSize);
  return { students: paged, allStudents: enriched, total, page, loading, error, refetch: fetchStudents };
}
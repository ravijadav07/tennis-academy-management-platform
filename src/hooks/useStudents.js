// src/hooks/useStudents.js
import { useMemo } from 'react';
import { useDb } from '../context/DbContext';
import { getEligibility } from '../mocks/rules';

export function useStudents({ query = '', status = 'all', page = 1, pageSize = 20 } = {}) {
  const { db, tick } = useDb();
  const state = useMemo(() => db.readAll(), [db, tick]);
  const { students, enrollments, packages, batches } = state;
  const today = new Date().toISOString().split('T')[0];

  const enriched = useMemo(() => {
    return students
      .filter((s) => {
        if (status !== 'all' && s.status !== status) return false;
        if (query) { const q = query.toLowerCase(); return (s.name || '').toLowerCase().includes(q) || (s.guardianName || '').toLowerCase().includes(q); }
        return true;
      })
      .map((s) => {
        const enr = enrollments.filter((e) => e.studentId === s.id && e.status === 'ACTIVE');
        const pkg = packages.find((p) => p.studentId === s.id);
        const batch = batches.find((b) => enr.some((e) => e.batchId === b.id));
        const eligibility = pkg ? getEligibility(pkg, today) : { markable: true, reason: '', label: '', blocked: false };
        const programs = [...new Set(enr.map((e) => e.billingProgram))];
        return { ...s, enrollments: enr, batch, package: pkg, eligibility, programs, isAmbiguous: programs.length > 1 };
      });
  }, [students, enrollments, packages, batches, query, status, today]);

  const total = enriched.length;
  const paged = enriched.slice((page - 1) * pageSize, page * pageSize);
  return { students: paged, total, page, loading: false };
}
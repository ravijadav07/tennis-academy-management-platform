// src/hooks/useCoach.js
import { useState, useEffect, useMemo } from 'react';
import { useSupabase } from '../context/SupabaseContext';
import { db } from '../mocks/localDb';

export function useCoachDay(coachId, date) {
  const { services, entity } = useSupabase();
  const [data, setData] = useState({ coach: null, batches: [], privateSessions: [], coachAtt: null });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function load() {
      if (!coachId) { setLoading(false); return; }
      setLoading(true);
      try {
        const entityOpt = entity === 'all' ? undefined : entity;
        const [coachesRes, batchesRes, coachAttRes] = await Promise.all([
          services.coaches.list({ entity: entityOpt, pageSize: 200 }),
          services.batches.list({ entity: entityOpt, pageSize: 500 }),
          services.attendance.listCoachAttendance({ entity: entityOpt, coachId, date, pageSize: 50 }),
        ]);

        if (active) {
          const coachObj = (coachesRes.data || []).find((c) => c.id === coachId);
          const bList = (batchesRes.data || []).filter((b) => b.primaryCoachId === coachId || b.supportCoachId === coachId);
          const att = (coachAttRes.data || []).find((a) => a.coachId === coachId && a.date === date);
          setData({ coach: coachObj, batches: bList, privateSessions: [], coachAtt: att });
        }
      } catch (err) {
        console.warn('[useCoachDay] Data fetch error:', err?.message || err);
        if (active) {
          setData({ coach: null, batches: [], privateSessions: [], coachAtt: null });
        }
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => { active = false; };
  }, [services, entity, coachId, date]);

  return { ...data, attendance: data.coachAtt, checkedIn: !!(data.coachAtt?.checkIn || data.coachAtt?.status === 'checked_in'), loading };
}

export function usePrivateSessions(coachId, { from, to, page = 1, pageSize = 20 } = {}) {
  return { sessions: [], total: 0, page, loading: false };
}

export function useAllPrivateSessions({ status, from, to, page = 1, pageSize = 50 } = {}) {
  return { sessions: [], total: 0, page, loading: false };
}

export function usePayrollData({ month, coachId } = {}) {
  const { services, entity } = useSupabase();
  const [coaches, setCoaches] = useState([]);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const entityOpt = entity === 'all' ? undefined : entity;
        const res = await services.coaches.list({ entity: entityOpt, pageSize: 200 });
        if (active) {
          setCoaches(res.data || []);
        }
      } catch (err) {
        console.warn('[usePayrollData] error:', err);
        if (active) {
          setCoaches([]);
        }
      }
    }
    load();
    return () => { active = false; };
  }, [services, entity]);

  return useMemo(() => {
    let filtered = coaches;
    if (coachId) filtered = filtered.filter((c) => c.id === coachId);
    return filtered.map((c) => {
      const privCount = 0;
      const privPay = 0;
      const gross = (c.baseSalary || 0) + privPay;
      return { ...c, privateCount: privCount, privatePay: privPay, gross };
    });
  }, [coaches, coachId]);
}
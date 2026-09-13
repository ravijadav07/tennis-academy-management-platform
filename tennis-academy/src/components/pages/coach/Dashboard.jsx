import { useState, useEffect, useMemo } from 'react';
import { useSupabase } from '../../../context/SupabaseContext';
import { useAuth } from '../../../context/AuthContext';
import StatCard from '../../ui/StatCard';
import Card from '../../ui/Card';
import StatusPill from '../../ui/StatusPill';
import { Calendar, Users, TrendingUp, UserCheck } from 'lucide-react';
import { formatDateDDMMYY, formatTime12h, getBatchDisplayName, getTodayPattern } from '../../../utils/formatters';
import { db } from '../../../mocks/localDb';

export default function CoachDashboard() {
  const { services, entity } = useSupabase();
  const { user } = useAuth();
  const [data, setData] = useState({
    coaches: [],
    batches: [],
    courts: [],
    enrollments: [],
    coachAttendance: [],
  });
  const [loading, setLoading] = useState(true);

  const today = new Date().toISOString().split('T')[0];
  const todayPattern = getTodayPattern();

  useEffect(() => {
    let active = true;
    async function loadCoachData() {
      setLoading(true);
      try {
        const entityOpt = entity === 'all' ? undefined : entity;
        const [coachesRes, batchesRes, courtsRes, enrollmentsRes, coachAttRes] = await Promise.all([
          services.coaches.list({ entity: entityOpt, pageSize: 100 }),
          services.batches.list({ entity: entityOpt, pageSize: 200 }),
          services.courts.list({ entity: entityOpt, pageSize: 100 }),
          services.enrollments.list({ entity: entityOpt, pageSize: 500 }),
          services.attendance.listCoachAttendance({ entity: entityOpt, date: today, pageSize: 100 }),
        ]);

        if (active) {
          if (!coachesRes.data || coachesRes.data.length === 0) {
            const local = db.readAll();
            setData({
              coaches: local.coaches || [],
              batches: local.batches || [],
              courts: local.courts || [],
              enrollments: local.enrollments || [],
              coachAttendance: local.coachAttendance || [],
            });
          } else {
            setData({
              coaches: coachesRes.data || [],
              batches: batchesRes.data || [],
              courts: courtsRes.data || [],
              enrollments: enrollmentsRes.data || [],
              coachAttendance: coachAttRes.data || [],
            });
          }
        }
      } catch (err) {
        console.warn('[CoachDashboard] load error, using localDb fallback:', err);
        if (active) {
          const local = db.readAll();
          setData({
            coaches: local.coaches || [],
            batches: local.batches || [],
            courts: local.courts || [],
            enrollments: local.enrollments || [],
            coachAttendance: local.coachAttendance || [],
          });
        }
      } finally {
        if (active) setLoading(false);
      }
    }
    loadCoachData();
    return () => { active = false; };
  }, [services, entity, today]);

  const coachId = user?.linkedCoachId || (data.coaches.find(c => c.email === user?.email)?.id);

  const coach = useMemo(() => data.coaches.find((c) => c.id === coachId), [data.coaches, coachId]);

  const todayData = useMemo(() => {
    if (!coachId) return { batches: [], privateSessions: [], checkedIn: false };
    const batches = data.batches.filter(
      (b) => (b.primaryCoachId === coachId || b.supportCoachId === coachId) &&
             ((b.status || '').toLowerCase() === 'active') &&
             (b.dayPattern === todayPattern ||
              (todayPattern === 'SAT_SUN' && (b.dayPattern === 'WEEKEND' || b.dayPattern === 'SAT_SUN')) ||
              (todayPattern === 'WEEKEND' && (b.dayPattern === 'SAT_SUN' || b.dayPattern === 'WEEKEND')))
    );
    const coachAtt = (data.coachAttendance || []).find((a) => a.coachId === coachId && a.date === today);
    return { batches, privateSessions: [], checkedIn: !!(coachAtt?.checkIn || coachAtt?.status === 'checked_in') };
  }, [data.batches, data.coachAttendance, coachId, today, todayPattern]);

  const myStudents = useMemo(() => {
    if (!coachId) return 0;
    return data.enrollments.filter((e) => {
      const b = data.batches.find((b) => b.id === e.batchId);
      return b && (b.primaryCoachId === coachId || b.supportCoachId === coachId) && ((b.status || '').toLowerCase() === 'active');
    }).length;
  }, [data.enrollments, data.batches, coachId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="w-8 h-8 rounded-full border-2 border-brand border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!coachId) return <div className="p-4 text-sm text-ink-muted">No coach profile linked to this account.</div>;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Calendar} label="Today's Batches" value={todayData.batches.length} />
        <StatCard icon={Users} label="My Students" value={myStudents} />
        <StatCard icon={UserCheck} label="Private Sessions" value={todayData.privateSessions.length} />
        <StatCard icon={TrendingUp} label="Coach" value={coach?.name || ''} sublabel={coach?.designation || ''} />
      </div>
      <Card>
        <h3 className="text-sm font-semibold text-ink mb-3">Today ({todayPattern}) — {formatDateDDMMYY(today)}</h3>
        <div className="flex items-center gap-2 mb-3">
          <StatusPill status={todayData.checkedIn ? 'active' : 'inactive'} />
          <span className="text-xs text-ink-muted">{todayData.checkedIn ? 'Checked In' : 'Not checked in yet'}</span>
        </div>
        {todayData.batches.length === 0 && todayData.privateSessions.length === 0 ? (
          <p className="text-xs text-ink-muted py-2">No {todayPattern} batches scheduled for you today.</p>
        ) : (
          <div className="space-y-2">
            {todayData.batches.map((b) => (
              <div key={b.id} className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg bg-canvas-soft text-xs">
                <span className="font-semibold text-ink">{getBatchDisplayName(b, data.courts)}</span>
                <div className="flex items-center gap-2">
                  <span className="text-ink-muted">{formatTime12h(b.startTime)} - {formatTime12h(b.endTime)}</span>
                  <StatusPill status="confirmed" />
                </div>
              </div>
            ))}
            {todayData.privateSessions.map((s) => (
              <div key={s.id} className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg bg-[#F5F3FF] border border-brand/10 text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-brand-600">Private Coaching</span>
                  <span className="text-ink-muted">Client: {s.clientName}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-ink-muted">{formatTime12h(s.startTime)} - {formatTime12h(s.endTime)}</span>
                  <StatusPill status="confirmed" />
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
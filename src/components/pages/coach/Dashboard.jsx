import { useMemo } from 'react';
import { useDb } from '../../../context/DbContext';
import { useAuth } from '../../../context/AuthContext';
import StatCard from '../../ui/StatCard';
import Card from '../../ui/Card';
import StatusPill from '../../ui/StatusPill';
import { Calendar, Users, TrendingUp, UserCheck } from 'lucide-react';

export default function CoachDashboard() {
  const { db, tick } = useDb();
  const { user } = useAuth();
  const state = useMemo(() => db.readAll(), [db, tick]);
  const today = new Date().toISOString().split('T')[0];
  const coachId = user?.linkedCoachId;

  const todayData = useMemo(() => {
    if (!coachId) return { batches: [], privateSessions: [], checkedIn: false };
    const batches = state.batches.filter((b) => b.primaryCoachId === coachId || b.supportCoachId === coachId);
    const privSessions = (state.privateSessions || []).filter((s) => s.coachId === coachId && s.date === today);
    const coachAtt = (state.coachAttendance || []).find((a) => a.coachId === coachId && a.date === today);
    return { batches, privateSessions: privSessions, checkedIn: !!coachAtt?.checkIn };
  }, [state, coachId, today]);

  const coach = state.coaches.find((c) => c.id === coachId);
  const myStudents = state.enrollments.filter((e) => {
    const b = state.batches.find((b) => b.id === e.batchId);
    return b && (b.primaryCoachId === coachId || b.supportCoachId === coachId);
  }).length;

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
        <h3 className="text-sm font-semibold text-ink mb-3">Today — {today}</h3>
        <div className="flex items-center gap-2 mb-3">
          <StatusPill status={todayData.checkedIn ? 'active' : 'inactive'} />
          <span className="text-xs text-ink-muted">{todayData.checkedIn ? 'Checked In' : 'Not checked in yet'}</span>
        </div>
        {todayData.batches.length === 0 ? (
          <p className="text-xs text-ink-muted">No batches scheduled today.</p>
        ) : (
          <div className="space-y-2">
            {todayData.batches.map((b) => (
              <div key={b.id} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-canvas-soft text-xs">
                <span className="font-semibold text-ink">{b.program} {b.dayPattern}</span>
                <span className="text-ink-muted">{b.startTime} - {b.endTime}</span>
                <StatusPill status="confirmed" />
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
import { useDashboard } from '../../../hooks/useDashboard';
import { useSupabase } from '../../../context/SupabaseContext';
import StatCard from '../../ui/StatCard';
import Card from '../../ui/Card';
import StatusPill from '../../ui/StatusPill';
import CapacityIndicator from '../../ui/CapacityIndicator';
import { formatTime12h, getBatchDisplayName } from '../../../utils/formatters';
import { useMemo, useState, useEffect } from 'react';
import { Users, LayoutGrid, AlertTriangle, TrendingUp, Calendar, Clock, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function AdminDashboard() {
  const { stats, todayByCourt, uncoveredSlots, conflicts, slotAnalysis, courts = [], batches = [], coaches = [], enrollments = [], loading } = useDashboard();
  const { services } = useSupabase();
  const navigate = useNavigate();
  const [unverifiedMonth, setUnverifiedMonth] = useState(false);

  // Check if current month is unverified via Supabase workflow state
  useEffect(() => {
    let active = true;
    async function checkVerification() {
      try {
        const now = new Date();
        const res = await services.workflow.list({ action: 'report_verification' });
        const list = res?.data || [];
        const currentKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        const verified = list.some(
          (item) => item.data?.verified && (item.data?.monthYear === currentKey || (item.data?.month === now.getMonth() + 1 && item.data?.year === now.getFullYear()))
        );
        if (active) setUnverifiedMonth(!verified);
      } catch (err) {
        if (active) setUnverifiedMonth(false);
      }
    }
    checkVerification();
    return () => { active = false; };
  }, [services]);

  const [agendaPattern, setAgendaPattern] = useState('TODAY');

  const displayByCourt = useMemo(() => {
    if (agendaPattern === 'TODAY') return todayByCourt;
    const courtsMap = {};
    (courts || []).filter(c => c.status !== 'INACTIVE' && c.status !== 'inactive').forEach(c => {
      courtsMap[c.id] = { court: c, batches: [] };
    });
    (batches || []).filter(b => (b.status === 'ACTIVE' || b.status === 'active') && b.dayPattern === agendaPattern).forEach(b => {
      if (courtsMap[b.courtId]) courtsMap[b.courtId].batches.push(b);
    });
    return Object.values(courtsMap).filter(g => g.batches.length > 0);
  }, [agendaPattern, todayByCourt, courts, batches]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="w-8 h-8 rounded-full border-2 border-brand border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {unverifiedMonth && (
        <Card>
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-warn flex-shrink-0" />
            <p className="text-xs text-warn flex-1">
              The current month's Slot Analysis report has not been verified yet.
              Reports cannot be sent without verification.
            </p>
            <button onClick={() => navigate('/admin/reports')}
              className="text-[11px] font-semibold text-brand-600 hover:underline flex-shrink-0 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> Verify Now
            </button>
          </div>
        </Card>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Active Students" value={stats.activeStudents} />
        <StatCard icon={LayoutGrid} label="Active Batches" value={stats.activeBatches} />
        <StatCard icon={Calendar} label="Today" value={`${stats.todayAttendance}/${stats.totalAttendanceToday}`} sublabel={`${stats.unmarkedToday} unmarked`} />
        <StatCard icon={Clock} label="Coach Check-in" value={`${stats.checkedInToday}/${stats.coaches}`} sublabel={`${stats.notCheckedIn} not checked in`} color={stats.notCheckedIn > 0 ? 'warn' : 'ok'} />
      </div>

      {conflicts.length > 0 && (
        <Card>
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-err" />
            <h3 className="text-sm font-semibold text-ink">Coach Conflicts — {conflicts.length} coach(es) double-booked</h3>
          </div>
          <div className="space-y-2">
            {conflicts.map((c) => (
              <div key={c.coachId} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-err-bg text-xs">
                <span className="font-semibold text-ink">{c.coachName}</span>
                <span className="text-ink-muted">has {c.batches.length} concurrent batches:</span>
                {c.batches.map((b) => (
                  <span key={b.id} className="text-ink-muted">{b.program} {b.dayPattern} {formatTime12h(b.startTime)}</span>
                ))}
              </div>
            ))}
          </div>
        </Card>
      )}

      {uncoveredSlots.length > 0 && (
        <Card>
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-warn" />
            <h3 className="text-sm font-semibold text-ink">Uncovered Slots — {uncoveredSlots.length} coach(es) not checked in</h3>
          </div>
          <div className="space-y-2">
            {uncoveredSlots.map((s) => (
              <div key={s.batchId} className="flex flex-wrap items-center gap-2 sm:gap-3 px-3 py-2 rounded-lg bg-warn-bg text-xs">
                <span className="font-semibold text-ink">{s.batchName}</span><span className="text-ink-muted">{s.time}</span>
                <span className="text-ink-muted">Coach: {s.coachName}</span><span>Court: {s.courtName}</span><StatusPill status="warning" />
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Today's Agenda with MWF / TTS Toggle and Batch Drilldown */}
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div>
            <h3 className="text-sm font-semibold text-ink">
              {agendaPattern === 'TODAY' ? "Today's Agenda" : `${agendaPattern} Pattern Agenda`}
            </h3>
            <p className="text-xs text-ink-muted">Click any batch to inspect or edit its roster</p>
          </div>
          <div className="flex items-center gap-1.5 p-0.5 bg-canvas-soft rounded-lg border border-line">
            {['TODAY', 'MWF', 'TTS'].map((p) => (
              <button
                key={p}
                onClick={() => setAgendaPattern(p)}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                  agendaPattern === p
                    ? 'bg-white text-brand shadow-xs font-bold'
                    : 'text-ink-muted hover:text-ink'
                }`}
              >
                {p === 'TODAY' ? 'Today' : p}
              </button>
            ))}
          </div>
        </div>

        {displayByCourt.length === 0 ? (
          <p className="text-xs text-ink-muted py-4 text-center">No batches scheduled for {agendaPattern === 'TODAY' ? 'today' : agendaPattern}.</p>
        ) : (
          <div className="space-y-4">
            {displayByCourt.map(({ court, batches: courtBatches }) => (
              <div key={court?.id || 'unknown'}>
                <p className="text-[10px] font-semibold text-ink-muted uppercase tracking-wider mb-2">{court?.name || 'Unknown Court'}</p>
                <div className="space-y-1">
                  {courtBatches.map((b) => {
                    if (b._type === 'private') {
                      return (
                        <div
                          key={b.id}
                          className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-2 sm:gap-3 px-3 py-2 rounded-lg bg-[#F5F3FF] border border-brand/10 text-xs"
                        >
                          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-wrap">
                            <span className="font-semibold text-brand-600 min-w-[70px]">Private Coaching</span>
                            <span className="text-ink-muted shrink-0">{formatTime12h(b.startTime)} - {formatTime12h(b.endTime)}</span>
                            <span className="text-ink-muted truncate">Client: {b.clientName}</span>
                            <span className="text-ink-muted truncate">Coach: {b.coachName}</span>
                          </div>
                          <StatusPill status="confirmed" />
                        </div>
                      );
                    }
                    const coach = (coaches || []).find((c) => c.id === b.primaryCoachId);
                    const roster = (enrollments || []).filter((e) => e.batchId === b.id && (e.status === 'ACTIVE' || e.status === 'active'));
                    return (
                      <div
                        key={b.id}
                        onClick={() => navigate('/admin/batches/' + b.id)}
                        className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-2 sm:gap-3 px-3 py-2 rounded-lg bg-canvas-soft hover:bg-canvas-soft/80 cursor-pointer border border-transparent hover:border-brand/20 transition-all text-xs group"
                      >
                        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-wrap">
                          <span className="font-semibold text-ink min-w-[70px] group-hover:text-brand transition-colors">{getBatchDisplayName(b, courts)}</span>
                          <span className="text-ink-muted shrink-0">{formatTime12h(b.startTime)} - {formatTime12h(b.endTime)}</span>
                          <span className="text-ink-muted truncate">Coach: {coach?.name || '—'}</span>
                          {b.isSemiBatch && <StatusPill status="semi-batch" />}
                        </div>
                        <CapacityIndicator filled={roster.length} total={b.capacity} className="w-24 sm:w-28 shrink-0 ml-auto sm:ml-0" />
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card>
        <h3 className="text-sm font-semibold text-ink mb-3">Slot Analysis Summary</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {Object.entries(slotAnalysis.scopes || {}).map(([scope, data]) => (
            <div key={scope} className="bg-canvas-soft rounded-lg p-3 min-w-0 flex flex-col justify-between gap-2.5">
              <p className="text-[10px] font-semibold text-ink-muted uppercase truncate">{scope}</p>
              <CapacityIndicator filled={data.booked} total={data.total} variant="segments" maxBlocks={10} className="w-full" />
            </div>
          ))}
          <div className="bg-brand-50 rounded-lg p-3 min-w-0 flex flex-col justify-between gap-2.5">
            <p className="text-[10px] font-semibold text-brand-600 uppercase truncate">ACADEMY</p>
            <CapacityIndicator filled={slotAnalysis.academy.booked} total={slotAnalysis.academy.total} variant="segments" maxBlocks={10} className="w-full" />
          </div>
        </div>
      </Card>
    </div>
  );
}
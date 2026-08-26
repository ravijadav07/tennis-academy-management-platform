import { useDashboard } from '../../../hooks/useDashboard';
import StatCard from '../../ui/StatCard';
import Card from '../../ui/Card';
import StatusPill from '../../ui/StatusPill';
import { Users, LayoutGrid, AlertTriangle, TrendingUp, Calendar } from 'lucide-react';

export default function AdminDashboard() {
  const { stats, uncoveredSlots, slotAnalysis } = useDashboard();

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Active Students" value={stats.activeStudents} />
        <StatCard icon={LayoutGrid} label="Active Batches" value={stats.activeBatches} />
        <StatCard icon={Calendar} label="Today" value={`${stats.todayAttendance}/${stats.totalAttendanceToday}`} sublabel={`${stats.unmarkedToday} unmarked`} />
        <StatCard icon={TrendingUp} label="Occupancy" value={`${slotAnalysis.academy.occupancyPct}%`} sublabel={`${slotAnalysis.academy.booked}/${slotAnalysis.academy.total} booked`} />
      </div>

      {uncoveredSlots.length > 0 && (
        <Card>
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-warn" />
            <h3 className="text-sm font-semibold text-ink">Uncovered Slots — {uncoveredSlots.length} coach(es) not checked in</h3>
          </div>
          <div className="space-y-2">
            {uncoveredSlots.map((s) => (
              <div key={s.batchId} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-warn-bg text-xs">
                <span className="font-semibold text-ink">{s.batchName}</span><span className="text-ink-muted">{s.time}</span>
                <span className="text-ink-muted">Coach: {s.coachName}</span><span>Court: {s.courtName}</span><StatusPill status="warning" />
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card>
        <h3 className="text-sm font-semibold text-ink mb-3">Slot Analysis Summary</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
          {Object.entries(slotAnalysis.scopes || {}).map(([scope, data]) => (
            <div key={scope} className="bg-canvas-soft rounded-lg p-3">
              <p className="text-[10px] font-semibold text-ink-muted uppercase">{scope}</p>
              <p className="text-lg font-bold text-ink">{data.booked}/{data.total}</p>
              <p className="text-[10px] text-ink-faint">{data.open} open · {data.occupancyPct}%</p>
            </div>
          ))}
          <div className="bg-brand-50 rounded-lg p-3">
            <p className="text-[10px] font-semibold text-brand-600 uppercase">ACADEMY</p>
            <p className="text-lg font-bold text-brand">{slotAnalysis.academy.booked}/{slotAnalysis.academy.total}</p>
            <p className="text-[10px] text-brand-600/70">{slotAnalysis.academy.open} open · {slotAnalysis.academy.occupancyPct}%</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
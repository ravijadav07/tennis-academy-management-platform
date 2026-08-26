import { useMemo, useState, useEffect } from 'react';
import { useDb } from '../../../context/DbContext';
import { computeSlotAnalysis, findAmbiguousStudents } from '../../../mocks/rules';
import Card from '../../ui/Card';
import StatusPill from '../../ui/StatusPill';
import Button from '../../ui/Button';
import { toast } from 'sonner';
import { Download, AlertTriangle, TrendingUp, Radio } from 'lucide-react';

function timeAgo(ms) {
  const sec = Math.floor((Date.now() - ms) / 1000);
  if (sec < 5) return 'just now';
  if (sec < 60) return `${sec}s ago`;
  if (sec < 3600) return `${Math.floor(sec / 60)}m ago`;
  return `${Math.floor(sec / 3600)}h ago`;
}

export default function Reports() {
  const { db, tick, lastUpdated } = useDb();
  const state = useMemo(() => db.readAll(), [db, tick]);
  const { batches, enrollments, driftFlags: driftFlagsRaw } = state;
  const analysis = useMemo(() => computeSlotAnalysis(batches, enrollments), [batches, enrollments]);
  const ambiguous = useMemo(() => findAmbiguousStudents(enrollments), [enrollments]);
  const driftFlags = (driftFlagsRaw || []);
  const [ago, setAgo] = useState(timeAgo(lastUpdated));

  useEffect(() => {
    setAgo(timeAgo(lastUpdated));
    const interval = setInterval(() => setAgo(timeAgo(lastUpdated)), 5000);
    return () => clearInterval(interval);
  }, [lastUpdated]);

  // Recent activity from audit log
  const auditLog = (state.auditLog || []);
  const recentActivity = auditLog.slice(0, 5).map((entry) => ({
    time: entry.timestamp ? new Date(entry.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '',
    who: entry.userId?.replace('user_', '') || 'system',
    action: entry.action?.replace(/_/g, ' ') || '',
    detail: entry.entityType + (entry.entityId ? ' #' + String(entry.entityId).slice(-4) : ''),
  }));

  return (
    <div className="space-y-4">
      {/* Live indicator */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-ok opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-ok" />
          </span>
          <span className="text-[11px] font-semibold text-ok tracking-wide">LIVE</span>
          <span className="text-[11px] text-ink-faint ml-1">Updated {ago}</span>
        </div>
      </div>

      <Card>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-lg font-bold text-ink">Slot Analysis</h3>
            <p className="text-xs text-ink-muted">Academy Total: {analysis.academy.booked}/{analysis.academy.total} · {analysis.academy.occupancyPct}% occupancy</p>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="secondary" icon={Download} onClick={() => toast.success('PDF export generated (stub)')}>PDF</Button>
            <Button size="sm" variant="secondary" icon={Download} onClick={() => toast.success('Excel export generated (stub)')}>Excel</Button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead><tr className="border-b border-line text-left text-ink-muted">
              <th className="py-2 font-semibold">Category</th><th className="py-2 font-semibold">Total</th><th className="py-2 font-semibold">Booked</th><th className="py-2 font-semibold">Open</th><th className="py-2 font-semibold">Occupancy</th></tr></thead>
            <tbody>
              {Object.entries(analysis.scopes || {}).filter(([s]) => s !== 'FITNESS').map(([scope, data]) => (
                <tr key={scope} className="border-b border-line/50">
                  <td className="py-2 font-semibold text-ink">{scope}</td><td className="py-2">{data.total}</td>
                  <td className="py-2">{data.booked}</td><td className="py-2">{data.open}</td>
                  <td className="py-2"><StatusPill status={data.occupancyPct >= 80 ? 'success' : data.occupancyPct >= 50 ? 'warning' : 'error'} /> {data.occupancyPct}%</td>
                </tr>
              ))}
              {analysis.scopes?.FITNESS && (
                <tr className="border-b border-line/50 bg-canvas-soft">
                  <td className="py-2 font-semibold text-ink-muted">FITNESS</td><td className="py-2 text-ink-muted">{analysis.scopes.FITNESS.total}</td>
                  <td className="py-2 text-ink-muted">{analysis.scopes.FITNESS.booked}</td><td className="py-2 text-ink-muted">{analysis.scopes.FITNESS.open}</td>
                  <td className="py-2 text-ink-muted">{analysis.scopes.FITNESS.occupancyPct}%</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Recent Activity */}
      {recentActivity.length > 0 && (
        <Card>
          <div className="flex items-center gap-2 mb-3"><Radio className="w-4 h-4 text-brand" /><h3 className="text-sm font-semibold text-ink">Recent Activity</h3></div>
          <div className="space-y-1">
            {recentActivity.map((a, i) => (
              <div key={i} className="flex items-center gap-3 px-3 py-1.5 text-[11px] text-ink-muted">
                <span className="font-mono text-ink-faint w-14">{a.time}</span>
                <span className="font-semibold text-ink w-20 truncate">{a.who}</span>
                <span>{a.action} · {a.detail}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {ambiguous.length > 0 && (
        <Card>
          <div className="flex items-center gap-2 mb-3"><AlertTriangle className="w-4 h-4 text-warn" /><h3 className="text-sm font-semibold text-ink">Ambiguous Students ({ambiguous.length})</h3></div>
          {ambiguous.map((a, i) => (
            <div key={i} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-warn-bg text-xs">
              <span className="font-semibold text-ink">{a.studentName || a.studentId}</span>
              <span className="text-ink-muted">Programs: {a.programs?.join(', ')}</span>
              <span className="text-brand-600">→ Resolves to: {a.resolvedProgram}</span>
            </div>
          ))}
        </Card>
      )}

      {driftFlags.length > 0 && (
        <Card>
          <div className="flex items-center gap-2 mb-3"><TrendingUp className="w-4 h-4 text-brand" /><h3 className="text-sm font-semibold text-ink">Needs Review — Drift Flags ({driftFlags.length})</h3></div>
          {driftFlags.map((d, i) => (
            <div key={i} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-brand-50 text-xs">
              <span className="font-semibold text-brand-600">{d.scope}</span>
              <span className="text-ink-muted">Stored: {d.sheetValue} | Actual: {d.actualValue}</span>
              <span className="text-ink-faint">{d.note}</span>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}
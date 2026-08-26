import { useState, useMemo } from 'react';
import { useDb } from '../../../context/DbContext';
import { useAuth } from '../../../context/AuthContext';
import StatCard from '../../ui/StatCard';
import Card from '../../ui/Card';
import StatusPill from '../../ui/StatusPill';
import { Package, Calendar, TrendingUp, Clock } from 'lucide-react';

export default function ParentDashboard() {
  const { db, tick } = useDb();
  const { user } = useAuth();
  const [selectedChildIdx, setSelectedChildIdx] = useState(0);
  const state = useMemo(() => db.readAll(), [db, tick]);
  const today = new Date().toISOString().split('T')[0];

  const children = useMemo(() => {
    if (!user?.isParent || !user?.guardianPhone) return [];
    return state.students.filter((s) => s.guardianPhone === user.guardianPhone);
  }, [state, user]);

  const child = children[selectedChildIdx];
  const pkg = child ? state.packages.find((p) => p.studentId === child.id) : null;
  const enrollment = child ? state.enrollments.find((e) => e.studentId === child.id && e.status === 'ACTIVE') : null;
  const batch = enrollment ? state.batches.find((b) => b.id === enrollment.batchId) : null;
  const childAttendance = child ? state.attendance.filter((a) => a.studentId === child.id) : [];
  const presentCount = childAttendance.filter((a) => a.status === 'PRESENT').length;
  const attendanceRate = childAttendance.length > 0 ? Math.round((presentCount / childAttendance.length) * 100) : 0;

  if (!user?.isParent) return <div className="p-4 text-sm text-ink-muted">Parent login required.</div>;
  if (children.length === 0) return <div className="p-4 text-sm text-ink-muted">No students found for this phone number.</div>;

  return (
    <div className="space-y-4">
      {children.length > 1 && (
        <div className="flex gap-2 pb-2">
          {children.map((c, i) => (
            <button key={c.id} onClick={() => setSelectedChildIdx(i)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${i === selectedChildIdx ? 'bg-brand-50 text-brand-600' : 'text-ink-muted hover:bg-canvas-soft'}`}>{c.name}</button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Calendar} label="Attendance" value={`${attendanceRate}%`} sublabel={`${presentCount}/${childAttendance.length} sessions`} />
        <StatCard icon={Package} label="Package" value={pkg ? pkg.program : 'None'} sublabel={pkg ? `${pkg.sessionsUsed}/${pkg.sessionsPurchased} used` : ''} />
        <StatCard icon={Clock} label="Next Class" value={batch ? `${batch.dayPattern} ${batch.startTime}` : 'N/A'} />
        <StatCard icon={TrendingUp} label="Payment" value={pkg?.paymentStatus || 'N/A'} />
      </div>

      <Card>
        <h3 className="text-sm font-semibold text-ink mb-3">{child?.name} — Package Details</h3>
        {pkg ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div><p className="text-ink-faint">Plan</p><p className="font-semibold text-ink">{pkg.program}</p></div>
            <div><p className="text-ink-faint">Sessions</p><p className="font-semibold text-ink">{pkg.sessionsUsed}/{pkg.sessionsPurchased}</p></div>
            <div><p className="text-ink-faint">Valid Until</p><p className="font-semibold text-ink">{pkg.validTo}</p></div>
            <div><p className="text-ink-faint">Status</p><StatusPill status={pkg.paymentStatus} /></div>
          </div>
        ) : <p className="text-xs text-ink-muted">No active package.</p>}
      </Card>
    </div>
  );
}
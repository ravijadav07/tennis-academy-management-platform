import { useState, useEffect, useMemo } from 'react';
import { useSupabase } from '../../../context/SupabaseContext';
import { useAuth } from '../../../context/AuthContext';
import StatCard from '../../ui/StatCard';
import Card from '../../ui/Card';
import StatusPill from '../../ui/StatusPill';
import { Package, Calendar, TrendingUp, Clock } from 'lucide-react';
import { db } from '../../../mocks/localDb';

export default function ParentDashboard() {
  const { services, entity } = useSupabase();
  const { user } = useAuth();
  const [selectedChildIdx, setSelectedChildIdx] = useState(0);
  const [data, setData] = useState({
    students: [],
    packages: [],
    enrollments: [],
    batches: [],
    attendance: [],
  });
  const [loading, setLoading] = useState(true);

  const phone = user?.guardianPhone || user?.phone;

  useEffect(() => {
    let active = true;
    async function loadParentData() {
      setLoading(true);
      try {
        const entityOpt = entity === 'all' ? undefined : entity;
        const [studentsRes, packagesRes, enrollmentsRes, batchesRes, attendanceRes] = await Promise.all([
          services.students.list({ entity: entityOpt, pageSize: 500 }),
          services.packages.list({ entity: entityOpt, pageSize: 500 }),
          services.enrollments.list({ entity: entityOpt, pageSize: 500 }),
          services.batches.list({ entity: entityOpt, pageSize: 200 }),
          services.attendance.list({ entity: entityOpt, pageSize: 500 }),
        ]);

        if (active) {
          if (!studentsRes.data || studentsRes.data.length === 0) {
            const local = db.readAll();
            setData({
              students: local.students || [],
              packages: local.packages || [],
              enrollments: local.enrollments || [],
              batches: local.batches || [],
              attendance: local.attendance || [],
            });
          } else {
            setData({
              students: studentsRes.data || [],
              packages: packagesRes.data || [],
              enrollments: enrollmentsRes.data || [],
              batches: batchesRes.data || [],
              attendance: attendanceRes.data || [],
            });
          }
        }
      } catch (err) {
        console.warn('[ParentDashboard] load error, using localDb fallback:', err);
        if (active) {
          const local = db.readAll();
          setData({
            students: local.students || [],
            packages: local.packages || [],
            enrollments: local.enrollments || [],
            batches: local.batches || [],
            attendance: local.attendance || [],
          });
        }
      } finally {
        if (active) setLoading(false);
      }
    }
    loadParentData();
    return () => { active = false; };
  }, [services, entity]);

  const children = useMemo(() => {
    if (!phone) return data.students; // fallback to all students if testing or previewing
    const matched = data.students.filter((s) => s.guardianPhone === phone || s.phone === phone);
    return matched.length > 0 ? matched : data.students;
  }, [data.students, phone]);

  const child = children[selectedChildIdx] || children[0];
  const pkg = useMemo(() => (child ? data.packages.find((p) => p.studentId === child.id) : null), [data.packages, child]);
  const enrollment = useMemo(() => (child ? data.enrollments.find((e) => e.studentId === child.id && (e.status === 'ACTIVE' || e.status === 'active')) : null), [data.enrollments, child]);
  const batch = useMemo(() => (enrollment ? data.batches.find((b) => b.id === enrollment.batchId) : null), [data.batches, enrollment]);
  const childAttendance = useMemo(() => (child ? data.attendance.filter((a) => a.studentId === child.id) : []), [data.attendance, child]);
  const presentCount = useMemo(() => childAttendance.filter((a) => a.status === 'PRESENT' || a.status === 'present').length, [childAttendance]);
  const attendanceRate = childAttendance.length > 0 ? Math.round((presentCount / childAttendance.length) * 100) : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="w-8 h-8 rounded-full border-2 border-brand border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!user?.isParent && children.length === 0) return <div className="p-4 text-sm text-ink-muted">Parent login required.</div>;
  if (children.length === 0) return <div className="p-4 text-sm text-ink-muted">No students found for this account.</div>;

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
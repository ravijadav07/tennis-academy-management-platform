import { useState, useEffect, useMemo } from 'react';
import { Users, TrendingUp, BarChart3, Star } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { useSupabase } from '../../../context/SupabaseContext';
import StatCard from '../../ui/StatCard';
import Card from '../../ui/Card';
import StatusPill from '../../ui/StatusPill';
import { formatCurrency } from '../../../utils/formatters';

export default function MyStats() {
  const { user } = useAuth();
  const { services, entity } = useSupabase();
  const coachId = user?.linkedCoachId;

  const [state, setState] = useState({
    coaches: [],
    batches: [],
    enrollments: [],
    students: [],
    attendance: [],
  });

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const entityOpt = entity === 'all' ? undefined : entity;
        const [coachesRes, batchesRes, enrollmentsRes, studentsRes, attendanceRes] = await Promise.all([
          services.coaches.list({ entity: entityOpt, pageSize: 200 }),
          services.batches.list({ entity: entityOpt, pageSize: 500 }),
          services.enrollments.list({ entity: entityOpt, pageSize: 500 }),
          services.students.list({ entity: entityOpt, pageSize: 1000 }),
          services.attendance.list({ entity: entityOpt, pageSize: 1000 }),
        ]);
        if (active) {
          setState({
            coaches: coachesRes.data || [],
            batches: batchesRes.data || [],
            enrollments: enrollmentsRes.data || [],
            students: studentsRes.data || [],
            attendance: attendanceRes.data || [],
          });
        }
      } catch (err) {
        console.error('[MyStats] load error:', err);
      }
    }
    load();
    return () => { active = false; };
  }, [services, entity]);

  const coach = useMemo(() => {
    return (state.coaches || []).find((c) => c.id === coachId);
  }, [state.coaches, coachId]);

  const coachBatches = useMemo(() => {
    if (!coachId) return [];
    return (state.batches || []).filter(
      (b) => (b.primaryCoachId === coachId || b.supportCoachId === coachId) && (b.status === 'ACTIVE' || b.status === 'active')
    );
  }, [state.batches, coachId]);

  const assignedStudents = useMemo(() => {
    if (!coachId) return [];
    const batchIds = new Set(coachBatches.map((b) => b.id));
    const studentIds = new Set(
      (state.enrollments || [])
        .filter((e) => batchIds.has(e.batchId) && (e.status === 'ACTIVE' || e.status === 'active'))
        .map((e) => e.studentId)
    );
    return (state.students || []).filter((s) => studentIds.has(s.id));
  }, [state.enrollments, state.students, coachBatches, coachId]);

  const studentPerformance = useMemo(() => {
    return assignedStudents.map((s) => {
      const studentAtt = (state.attendance || []).filter((a) => a.studentId === s.id);
      const presentCount = studentAtt.filter((a) => a.status === 'PRESENT' || a.status === 'present').length;
      const pct = studentAtt.length > 0 ? Math.round((presentCount / studentAtt.length) * 100) : 100;
      return {
        id: s.id,
        name: s.name,
        ageGroup: `Age ${s.age || '—'}`,
        level: s.program || 'ADV',
        attendance: pct,
      };
    });
  }, [assignedStudents, state.attendance]);

  const stats = useMemo(() => {
    const totalStudents = assignedStudents.length;
    const avgAtt = studentPerformance.length > 0
      ? Math.round(studentPerformance.reduce((acc, s) => acc + s.attendance, 0) / studentPerformance.length)
      : 100;
    const sessionsThisMonth = coachBatches.length * 12;
    return {
      totalStudents,
      avgAttendance: avgAtt,
      sessionsThisMonth,
      rating: 4.8,
    };
  }, [assignedStudents, studentPerformance, coachBatches]);

  const payrollInfo = useMemo(() => {
    if (!coach) return null;
    const baseSalary = coach.baseSalary || 25000;
    return {
      method: 'Monthly Base Salary',
      monthlySalary: baseSalary,
      estimatedNet: baseSalary,
    };
  }, [coach]);

  if (!coachId) return <div className="p-4 text-sm text-ink-muted">No coach profile linked to this account.</div>;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users} label="My Assigned Students" value={stats.totalStudents} />
        <StatCard icon={TrendingUp} label="Avg Attendance" value={`${stats.avgAttendance}%`} color="ok" />
        <StatCard icon={BarChart3} label="Monthly Sessions" value={stats.sessionsThisMonth} />
        <StatCard icon={Star} label="Coach Rating" value={`${stats.rating}/5`} />
      </div>

      {payrollInfo && (
        <Card>
          <h3 className="text-sm font-semibold text-ink mb-1">My Payroll & Earnings Summary</h3>
          <p className="text-xs text-ink-muted mb-3">
            {coach?.name} ({coach?.designation || 'Coach'}) — Base salary breakdown
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div>
              <p className="text-[11px] text-ink-faint">Duty Type</p>
              <p className="text-sm font-semibold text-ink capitalize">{coach?.dutyType?.toLowerCase().replace('_', ' ') || 'Full Time'}</p>
            </div>
            <div>
              <p className="text-[11px] text-ink-faint">Base Salary</p>
              <p className="text-sm font-semibold text-ink">{formatCurrency(payrollInfo.monthlySalary)}</p>
            </div>
            <div>
              <p className="text-[11px] text-ink-faint">1-on-1 Rate</p>
              <p className="text-sm font-semibold text-ok">{formatCurrency(coach?.rate1on1PerHour || 800)}/hr</p>
            </div>
          </div>
        </Card>
      )}

      <Card>
        <h3 className="text-sm font-semibold text-ink mb-3">My Students Performance</h3>
        <div className="divide-y divide-line">
          {studentPerformance.map((student) => (
            <div key={student.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-[34px] h-[34px] rounded-full bg-brand-50 flex items-center justify-center text-brand text-xs font-semibold shrink-0">
                  {(student.name || 'S').charAt(0)}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-ink truncate">{student.name}</p>
                  <p className="text-xs text-ink-muted">
                    {student.ageGroup} &bull; {student.level}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <StatusPill status={student.level} />
                <span className="text-sm font-semibold text-ink">{student.attendance}%</span>
              </div>
            </div>
          ))}
          {studentPerformance.length === 0 && (
            <p className="py-3 text-sm text-ink-muted text-center">No students assigned to your batches</p>
          )}
        </div>
      </Card>
    </div>
  );
}
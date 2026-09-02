import { useState, useEffect, useCallback } from 'react';
import { Users, TrendingUp, BarChart3, Star, IndianRupee } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../../../utils/supabase';
import { useAuth } from '../../../context/AuthContext';
import StatCard from '../../ui/StatCard';
import Card from '../../ui/Card';
import StatusPill from '../../ui/StatusPill';
import Skeleton from '../../ui/Skeleton';
import { BarChartWidget } from '../../data/ResponsiveChart';
import { formatCurrency } from '../../../utils/formatters';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function MyStats() {
  const { user } = useAuth();
  const [students, setStudents] = useState([]);
  const [stats, setStats] = useState({ totalStudents: 0, avgAttendance: 0, sessionsThisMonth: 0, rating: 0 });
  const [attendanceTrend, setAttendanceTrend] = useState([]);
  const [loading, setLoading] = useState(true);
  const [payrollInfo, setPayrollInfo] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const coachName = user?.name;
      if (!coachName) { setLoading(false); return; }

      const { data: coachRows } = await supabase
        .from('coaches')
        .select('id, entity, payroll_rate, hours_logged, hourly_rate')
        .eq('name', coachName)
        .limit(1);

      if (!coachRows || coachRows.length === 0) { setLoading(false); return; }
      const coachId = coachRows[0].id;
      const coachData = coachRows[0];

      // Set payroll info based on entity
      if (coachData) {
        const isClub = coachData.entity === 'the-club';
        setPayrollInfo({
          entity: coachData.entity,
          method: isClub ? 'Salary (Club)' : 'Hourly (TOTS)',
          monthlySalary: coachData.payroll_rate || 0,
          hoursLogged: coachData.hours_logged || 0,
          hourlyRate: coachData.hourly_rate || 0,
          estimatedMonthly: isClub
            ? coachData.payroll_rate || 0
            : (coachData.hours_logged || 0) * (coachData.hourly_rate || 0),
        });
      }

      const { data: studentRows } = await supabase
        .from('students')
        .select('id, name, age_group, level, status')
        .eq('coach_id', coachId)
        .eq('status', 'active');

      const studentList = studentRows || [];
      const studentIds = studentList.map(s => s.id);

      const { data: attRows } = await supabase
        .from('attendance')
        .select('student_id, status, date')
        .in('student_id', studentIds);

      const attendanceRows = attRows || [];

      let totalAttendance = 0;
      let attendanceCount = 0;
      const studentAttendance = {};
      studentList.forEach(s => { studentAttendance[s.id] = { present: 0, total: 0 }; });

      attendanceRows.forEach(a => {
        if (studentAttendance[a.student_id]) {
          studentAttendance[a.student_id].total++;
          if (a.status === 'present') studentAttendance[a.student_id].present++;
        }
      });

      const studentWithAttendance = studentList.map(s => {
        const att = studentAttendance[s.id] || { present: 0, total: 0 };
        const pct = att.total > 0 ? Math.round((att.present / att.total) * 100) : 0;
        totalAttendance += pct;
        attendanceCount++;
        return {
          id: s.id,
          name: s.name,
          ageGroup: s.age_group,
          level: s.level,
          attendance: pct,
        };
      });

      const avgAtt = attendanceCount > 0 ? Math.round(totalAttendance / attendanceCount) : 0;

const now = new Date();
const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
const monthEnd = `${nextMonth.getFullYear()}-${String(nextMonth.getMonth() + 1).padStart(2, '0')}-01`;

      const { data: monthSched } = await supabase
        .from('schedule')
        .select('id')
        .eq('coach_id', coachId)
        .gte('created_at', monthStart)
        .lt('created_at', monthEnd);

      const sessionsCount = (monthSched || []).length;

      const { data: progRows } = await supabase
        .from('progress')
        .select('rating')
        .in('student_id', studentIds);

let avgRating = 0;
if (progRows && progRows.length > 0) {
  avgRating = Math.round((progRows.reduce((sum, p) => sum + p.rating, 0) / progRows.length) * 10) / 10;
}

      const trend = [];
      for (let i = 7; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
        const nextMonthStr = `${d.getFullYear()}-${String(d.getMonth() + 2).padStart(2, '0')}-01`;

        const monthAtt = attendanceRows.filter(a => {
          const ad = a.date;
          return ad >= monthStr && ad < nextMonthStr;
        });

        const monthPct = monthAtt.length > 0
          ? Math.round((monthAtt.filter(a => a.status === 'present').length / monthAtt.length) * 100)
          : 0;

        trend.push({ label: MONTHS[d.getMonth()], value: monthPct });
      }

      setStudents(studentWithAttendance);
      setStats({
        totalStudents: studentList.length,
        avgAttendance: avgAtt,
        sessionsThisMonth: sessionsCount,
        rating: avgRating,
      });
      setAttendanceTrend(trend);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
      toast.error('Failed to load stats');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Skeleton.SkeletonCard />
          <Skeleton.SkeletonCard />
          <Skeleton.SkeletonCard />
          <Skeleton.SkeletonCard />
        </div>
        <Skeleton.SkeletonCard />
        <Skeleton.SkeletonCard />
      </div>
    );
  }

  return (
    <div className="space-y-4">

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Total Students" value={stats.totalStudents} />
        <StatCard icon={TrendingUp} label="Avg Attendance" value={`${stats.avgAttendance}%`} />
        <StatCard icon={BarChart3} label="Monthly Sessions" value={stats.sessionsThisMonth} />
        <StatCard icon={Star} label="Rating" value={`${stats.rating}/5`} />
      </div>

      {payrollInfo && (
        <Card>
          <h3 className="text-sm font-semibold text-ink mb-1">Payroll Summary</h3>
          <p className="text-sm text-ink-muted mb-3">
            {payrollInfo.method} — Estimated earnings for the current month
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div>
              <p className="text-[11px] text-ink-faint">Method</p>
              <p className="text-sm font-semibold text-ink">{payrollInfo.method}</p>
            </div>
            {payrollInfo.entity === 'the-club' ? (
              <>
                <div>
                  <p className="text-[11px] text-ink-faint">Monthly Salary</p>
                  <p className="text-sm font-semibold text-ink">{formatCurrency(payrollInfo.monthlySalary)}</p>
                </div>
                <div>
                  <p className="text-[11px] text-ink-faint">Estimated Net</p>
                  <p className="text-sm font-semibold text-ok">{formatCurrency(payrollInfo.estimatedMonthly)}</p>
                </div>
              </>
            ) : (
              <>
                <div>
                  <p className="text-[11px] text-ink-faint">Hours Logged (this month)</p>
                  <p className="text-sm font-semibold text-ink">{payrollInfo.hoursLogged}h</p>
                </div>
                <div>
                  <p className="text-[11px] text-ink-faint">Hourly Rate</p>
                  <p className="text-sm font-semibold text-ink">{formatCurrency(payrollInfo.hourlyRate)}</p>
                </div>
                <div>
                  <p className="text-[11px] text-ink-faint">Estimated Monthly</p>
                  <p className="text-sm font-semibold text-ok">{formatCurrency(payrollInfo.estimatedMonthly)}</p>
                </div>
              </>
            )}
          </div>
        </Card>
      )}

      <Card>
        <h3 className="text-sm font-semibold text-ink mb-1">Attendance Trend</h3>
        <p className="text-sm text-ink-muted mb-3">Monthly attendance rate across all students</p>
        <BarChartWidget data={attendanceTrend} dataKey="value" xKey="label" height={240} />
      </Card>

      <Card>
        <h3 className="text-sm font-semibold text-ink mb-3">Student Performance</h3>
        <div className="divide-y divide-line">
          {students.map((student) => (
            <div key={student.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-[34px] h-[34px] rounded-full bg-brand-50 flex items-center justify-center text-brand text-xs font-semibold shrink-0">
                  {student.name.charAt(0)}
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
          {students.length === 0 && (
            <p className="py-3 text-sm text-ink-muted text-center">No students assigned</p>
          )}
        </div>
      </Card>
    </div>
  );
}
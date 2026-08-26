import { useMemo, useState, useEffect, useCallback } from 'react';
import { ClipboardCheck, CheckCircle, AlertTriangle, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../../../utils/supabase';
import { useAuth } from '../../../context/AuthContext';
import StatCard from '../../ui/StatCard';
import StatusPill from '../../ui/StatusPill';
import AdaptiveTable from '../../data/AdaptiveTable';
import Skeleton from '../../ui/Skeleton';
import { TrendChart } from '../../data/ResponsiveChart';
import { formatDate } from '../../../utils/formatters';

export default function Attendance() {
  const { user } = useAuth();
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const parentName = user?.name;
      if (!parentName) { setLoading(false); return; }

      const { data: parentRows } = await supabase
        .from('parents')
        .select('id')
        .eq('name', parentName)
        .limit(1);

      if (!parentRows || parentRows.length === 0) { setLoading(false); return; }
      const parentId = parentRows[0].id;

      const { data: spRows } = await supabase
        .from('student_parents')
        .select('student_id')
        .eq('parent_id', parentId);

      if (!spRows || spRows.length === 0) { setLoading(false); return; }
      const studentIds = spRows.map(r => r.student_id);

      const { data: attRows, error } = await supabase
        .from('attendance')
        .select('id, date, status, check_in, check_out, batches(name)')
        .in('student_id', studentIds)
        .order('date', { ascending: false })
        .limit(30);

      if (error) throw error;

      const mapped = (attRows || []).map(a => ({
        id: a.id,
        date: a.date,
        batch: a.batches?.name || 'N/A',
        status: a.status,
        checkIn: a.check_in?.substring(0, 5) || null,
        checkOut: a.check_out?.substring(0, 5) || null,
      }));

      setAttendance(mapped);
    } catch (err) {
      console.error('Failed to fetch attendance:', err);
      toast.error('Failed to load attendance');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const attendanceSummary = useMemo(() => {
    const now = new Date();
    const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
    const thisMonth = attendance.filter(a => a.date >= monthStart);
    const total = thisMonth.length;
    const attended = thisMonth.filter(a => a.status === 'present').length;
    const absent = thisMonth.filter(a => a.status === 'absent').length;
    const late = thisMonth.filter(a => a.status === 'late').length;
    const pct = total > 0 ? Math.round((attended / total) * 100) : 0;

    return {
      thisMonth: pct,
      totalSessions: total,
      attended,
      absent,
      late,
    };
  }, [attendance]);

  const trendData = useMemo(() => {
    return attendance.slice(0, 7).map(a => {
      const statMap = { present: 100, late: 75, absent: 0 };
      return { label: formatDate(a.date), value: statMap[a.status] || 0 };
    }).reverse();
  }, [attendance]);

  const columns = [
    { accessorKey: 'date', header: 'Date', cell: info => <span className="font-medium">{formatDate(info.getValue())}</span> },
    { accessorKey: 'batch', header: 'Batch', cell: info => info.getValue() },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: info => <StatusPill status={info.getValue()} />,
    },
    { accessorKey: 'checkIn', header: 'Check-in', cell: info => info.getValue() || '--' },
    { accessorKey: 'checkOut', header: 'Check-out', cell: info => info.getValue() || '--' },
  ];

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
        <Skeleton.SkeletonTable rows={5} />
      </div>
    );
  }

  const hasAttendance = attendance.length > 0;

  return (
    <div className="space-y-4">

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={ClipboardCheck}
          label="This Month"
          value={hasAttendance ? `${attendanceSummary.thisMonth}%` : '--'}
        />
        <StatCard
          icon={CheckCircle}
          label="Attended"
          value={hasAttendance ? `${attendanceSummary.attended}/${attendanceSummary.totalSessions}` : '--'}
        />
        <StatCard
          icon={AlertTriangle}
          label="Absent"
          value={attendanceSummary.absent}
        />
        <StatCard
          icon={Clock}
          label="Late"
          value={attendanceSummary.late}
        />
      </div>

      {hasAttendance && (
        <TrendChart
          data={trendData}
          dataKey="value"
          xKey="label"
          height={220}
        />
      )}

      <AdaptiveTable
        data={attendance}
        columns={columns}
        searchPlaceholder="Search attendance..."
        renderCard={(item) => (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-ink">{formatDate(item.date)}</span>
              <StatusPill status={item.status} />
            </div>
            <p className="text-xs text-ink-muted">{item.batch}</p>
            <div className="flex items-center gap-4 text-xs text-ink-faint">
              <span>In: {item.checkIn || '--'}</span>
              <span>Out: {item.checkOut || '--'}</span>
            </div>
          </div>
        )}
      />
    </div>
  );
}
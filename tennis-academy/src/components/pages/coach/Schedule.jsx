import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../../utils/supabase';
import { useAuth } from '../../../context/AuthContext';
import AdaptiveTable from '../../data/AdaptiveTable';
import StatusPill from '../../ui/StatusPill';
import Skeleton from '../../ui/Skeleton';

const DAY_ORDER = { Mon: 0, Tue: 1, Wed: 2, Thu: 3, Fri: 4, Sat: 5, Sun: 6 };

export default function Schedule() {
  const { user } = useAuth();
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchSchedule = useCallback(async () => {
    setLoading(true);
    try {
      const coachName = user?.name;
      if (!coachName) { setLoading(false); return; }

      const { data: coachRows } = await supabase
        .from('coaches')
        .select('id')
        .eq('name', coachName)
        .limit(1);

      if (!coachRows || coachRows.length === 0) { setLoading(false); return; }
      const coachId = coachRows[0].id;

      const { data: schedRows, error } = await supabase
        .from('schedule')
        .select('id, type, day, start_time, end_time, location, status, confirmation, batches(name), students(name)')
        .eq('coach_id', coachId);

      if (error) throw error;

      const mapped = (schedRows || []).map(s => ({
        id: s.id,
        type: s.type,
        batch: s.batches?.name || null,
        student: s.students?.name || null,
        day: s.day,
        time: `${s.start_time?.substring(0, 5) || '--'} - ${s.end_time?.substring(0, 5) || '--'}`,
        students: null,
        location: s.location,
        status: s.status,
        confirmation: s.confirmation,
      })).sort((a, b) => (DAY_ORDER[a.day] ?? 7) - (DAY_ORDER[b.day] ?? 7));

      setSchedule(mapped);
    } catch (err) {
      console.error('Failed to fetch schedule:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { fetchSchedule(); }, [fetchSchedule]);

  const columns = [
    {
      accessorKey: 'day',
      header: 'Day',
      cell: ({ getValue }) => (
        <span className="font-medium text-ink text-sm">{getValue()}</span>
      ),
    },
    {
      accessorKey: 'time',
      header: 'Time',
      cell: ({ getValue }) => (
        <span className="text-sm text-ink-muted font-mono">{getValue()}</span>
      ),
    },
    {
      accessorKey: 'type',
      header: 'Type',
      cell: ({ getValue }) => (
        <StatusPill status={getValue() === 'group' ? 'Group' : '1-on-1'} />
      ),
    },
    {
      accessorKey: 'batch',
      header: 'Batch / Student',
      cell: ({ row }) => (
        <span className="text-sm text-ink">
          {row.original.batch || row.original.student}
        </span>
      ),
    },
    {
      accessorKey: 'students',
      header: 'Students',
      cell: ({ row }) => (
        <span className="text-sm text-ink-muted">
          {row.original.students != null ? row.original.students : '--'}
        </span>
      ),
    },
    {
      accessorKey: 'location',
      header: 'Location',
      cell: ({ getValue }) => (
        <span className="text-sm text-ink-muted">{getValue() || '--'}</span>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        if (row.original.type === 'one_on_one') {
          return <StatusPill status={row.original.confirmation || 'not_sent'} />;
        }
        return <StatusPill status="confirmed" />;
      },
    },
  ];

  const renderCard = (item) => (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-ink">{item.day}</span>
          <span className="text-xs text-ink-muted font-mono">{item.time}</span>
        </div>
        <StatusPill status={item.type === 'one_on_one' ? (item.confirmation || 'not_sent') : 'confirmed'} />
      </div>
      <div className="flex items-center gap-2 text-xs text-ink-muted">
        <StatusPill status={item.type === 'group' ? 'Group' : '1-on-1'} />
        <span className="text-ink font-medium">{item.batch || item.student}</span>
        {item.students != null && <span>{item.students} students</span>}
      </div>
      {item.location && <p className="text-xs text-ink-faint">{item.location}</p>}
    </div>
  );

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton.SkeletonTable rows={7} />
      </div>
    );
  }

  return (
    <div className="space-y-4">

      <AdaptiveTable
        data={schedule}
        columns={columns}
        renderCard={renderCard}
        searchPlaceholder="Search schedule..."
        emptyMessage="No sessions scheduled"
      />
    </div>
  );
}
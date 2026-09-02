import { useMemo } from 'react';
import { Calendar, MapPin, Clock } from 'lucide-react';
import { parentSchedule } from '../../../data/parent/scheduleData';
import StatCard from '../../ui/StatCard';
import StatusPill from '../../ui/StatusPill';
import AdaptiveTable from '../../data/AdaptiveTable';

const columns = [
  { accessorKey: 'day', header: 'Day', cell: info => <span className="font-medium">{info.getValue()}</span> },
  { accessorKey: 'time', header: 'Time', cell: info => info.getValue() },
  {
    accessorKey: 'type',
    header: 'Type',
    cell: info => <StatusPill status={info.getValue()} />,
  },
  {
    id: 'batchCoach',
    header: 'Batch / Coach',
    cell: info => {
      const row = info.row.original;
      return row.batch || `1-on-1: ${row.coach}`;
    },
  },
  { accessorKey: 'location', header: 'Location', cell: info => info.getValue() || '--' },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: info => {
      const row = info.row.original;
      const s = row.type === 'one_on_one' ? (row.confirmation || row.status) : row.status;
      return <StatusPill status={s} />;
    },
  },
];

export default function Schedule() {
  const classesThisWeek = useMemo(() => {
    return parentSchedule.filter(s => s.status !== 'cancelled').length;
  }, []);

  return (
    <div className="space-y-4">

      <StatCard
        icon={Calendar}
        label="Classes This Week"
        value={classesThisWeek}
      />

      <AdaptiveTable
        data={parentSchedule}
        columns={columns}
        searchPlaceholder="Search schedule..."
        renderCard={(item) => (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-ink">{item.day} {item.time}</span>
              <StatusPill status={item.type === 'one_on_one' ? (item.confirmation || item.status) : item.status} />
            </div>
            <div className="flex items-center gap-2 text-xs text-ink-muted">
              <StatusPill status={item.type} />
              <span>{item.batch || `1-on-1: ${item.coach}`}</span>
            </div>
            <div className="flex items-center gap-3 text-xs text-ink-faint">
              <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{item.location || 'Academy'}</span>
              <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{item.time}</span>
            </div>
          </div>
        )}
      />
    </div>
  );
}

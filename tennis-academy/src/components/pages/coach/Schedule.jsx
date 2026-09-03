import { useMemo } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useDb } from '../../../context/DbContext';
import AdaptiveTable from '../../data/AdaptiveTable';
import StatusPill from '../../ui/StatusPill';
import { formatTime12h, getBatchDisplayName } from '../../../utils/formatters';

export default function Schedule() {
  const { user } = useAuth();
  const { db, tick } = useDb();
  const state = useMemo(() => db.readAll(), [db, tick]);
  const coachId = user?.linkedCoachId;

  const schedule = useMemo(() => {
    if (!coachId) return [];

    const coachBatches = (state.batches || [])
      .filter((b) => (b.primaryCoachId === coachId || b.supportCoachId === coachId) && b.status === 'ACTIVE')
      .map((b) => {
        const court = (state.courts || []).find((c) => c.id === b.courtId);
        const roster = (state.enrollments || []).filter((e) => e.batchId === b.id && e.status === 'ACTIVE');
        return {
          id: b.id,
          type: 'group',
          batchName: getBatchDisplayName(b, state.courts),
          dayPattern: b.dayPattern,
          time: `${formatTime12h(b.startTime)} - ${formatTime12h(b.endTime)}`,
          studentsCount: roster.length,
          location: court?.name || 'Court',
          status: 'active',
        };
      });

    const privates = (state.privateSessions || [])
      .filter((s) => s.coachId === coachId)
      .map((s) => {
        const court = (state.courts || []).find((c) => c.id === s.courtId);
        return {
          id: s.id,
          type: 'one_on_one',
          batchName: `Private - ${s.clientName || s.studentName || 'Client'}`,
          dayPattern: s.date || 'Today',
          time: `${formatTime12h(s.startTime || s.time)} - ${formatTime12h(s.endTime)}`,
          studentsCount: 1,
          location: court?.name || 'Court',
          status: s.status || 'confirmed',
        };
      });

    return [...coachBatches, ...privates];
  }, [state.batches, state.courts, state.enrollments, state.privateSessions, coachId]);

  const columns = [
    {
      accessorKey: 'dayPattern',
      header: 'Days / Date',
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
      accessorKey: 'batchName',
      header: 'Batch / Session',
      cell: ({ getValue }) => (
        <span className="text-sm font-semibold text-ink">{getValue()}</span>
      ),
    },
    {
      accessorKey: 'studentsCount',
      header: 'Students',
      cell: ({ getValue }) => (
        <span className="text-sm text-ink-muted">{getValue()} enrolled</span>
      ),
    },
    {
      accessorKey: 'location',
      header: 'Location',
      cell: ({ getValue }) => (
        <span className="text-sm text-ink-muted">{getValue()}</span>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ getValue }) => <StatusPill status={getValue()} />,
    },
  ];

  const renderCard = (item) => (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-ink">{item.dayPattern}</span>
          <span className="text-xs text-ink-muted font-mono">{item.time}</span>
        </div>
        <StatusPill status={item.status} />
      </div>
      <div className="flex items-center gap-2 text-xs text-ink-muted">
        <StatusPill status={item.type === 'group' ? 'Group' : '1-on-1'} />
        <span className="text-ink font-medium">{item.batchName}</span>
        <span>({item.studentsCount} students)</span>
      </div>
      <p className="text-xs text-ink-faint">{item.location}</p>
    </div>
  );

  return (
    <div className="space-y-4">
      <AdaptiveTable
        data={schedule}
        columns={columns}
        renderCard={renderCard}
        searchPlaceholder="Search schedule..."
        emptyMessage="No sessions assigned to you"
      />
    </div>
  );
}
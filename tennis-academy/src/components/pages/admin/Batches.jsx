import { useState, useEffect, useMemo, useCallback } from 'react';
import { Layers, Users, GraduationCap, Pencil, Plus, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSupabase } from '../../../context/SupabaseContext';
import AdaptiveTable from '../../data/AdaptiveTable';
import RowActionsMenu from '../../data/RowActionsMenu';
import StatCard from '../../ui/StatCard';
import StatusPill from '../../ui/StatusPill';
import Button from '../../ui/Button';
import CapacityIndicator from '../../ui/CapacityIndicator';
import { formatTime12h, getTodayPattern, getBatchDisplayName } from '../../../utils/formatters';
import { db } from '../../../mocks/localDb';

const PATTERNS = ['TODAY', 'MWF', 'TTS', 'SAT_SUN', 'ALL'];

export default function Batches() {
  const navigate = useNavigate();
  const { services, entity } = useSupabase();
  const [data, setData] = useState({
    batches: [],
    courts: [],
    coaches: [],
    enrollments: [],
  });
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const entityOpt = entity === 'all' ? undefined : entity;
      const [batchesRes, courtsRes, coachesRes, enrollmentsRes] = await Promise.all([
        services.batches.list({ entity: entityOpt, pageSize: 500 }),
        services.courts.list({ entity: entityOpt, pageSize: 100 }),
        services.coaches.list({ entity: entityOpt, pageSize: 200 }),
        services.enrollments.list({ entity: entityOpt, pageSize: 1000 }),
      ]);

      setData({
        batches: batchesRes.data || [],
        courts: courtsRes.data || [],
        coaches: coachesRes.data || [],
        enrollments: enrollmentsRes.data || [],
      });
    } catch (err) {
      console.error('[Batches] Google Sheets load error:', err);
    } finally {
      setLoading(false);
    }
  }, [services, entity]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const { batches, courts, coaches, enrollments } = data;

  const todayPattern = getTodayPattern();
  const [selectedPattern, setSelectedPattern] = useState('TODAY');

  const processedBatches = useMemo(() => {
    return batches
      .filter((b) => (b.status || '').toLowerCase() === 'active')
      .map((b) => {
        const batchCap = Number(b.capacity || b.maxCapacity || b.max_capacity || 0);
        const dayPat = b.dayPattern || b.daysOfWeek || b.days_of_week || '';
        const coachId = b.primaryCoachId || b.coach_id || b.coachId;
        const courtId = b.courtId || b.court_id;
        const roster = enrollments.filter((e) => (e.batchId || e.batch_id) === b.id && (e.status || '').toLowerCase() === 'active');
        const court = courts.find((c) => c.id === courtId);
        const coach = coaches.find((c) => c.id === coachId);
        const displayName = getBatchDisplayName({ ...b, dayPattern: dayPat, capacity: batchCap }, courts);
        return {
          ...b,
          capacity: batchCap,
          dayPattern: dayPat,
          displayName,
          courtName: court?.name || 'Court',
          coachName: coach?.name || 'Unassigned',
          enrolled: roster.length,
          scheduleText: `${dayPat} · ${formatTime12h(b.startTime || b.start_time)} - ${formatTime12h(b.endTime || b.end_time)}`,
        };
      });
  }, [batches, enrollments, courts, coaches]);

  const filteredBatches = useMemo(() => {
    if (selectedPattern === 'TODAY') {
      return processedBatches.filter((b) => b.dayPattern === todayPattern || (todayPattern === 'SAT_SUN' && (b.dayPattern === 'WEEKEND' || b.dayPattern === 'SAT_SUN')) || (todayPattern === 'WEEKEND' && (b.dayPattern === 'SAT_SUN' || b.dayPattern === 'WEEKEND')));
    }
    if (selectedPattern === 'ALL') {
      return processedBatches;
    }
    if (selectedPattern === 'SAT_SUN' || selectedPattern === 'WEEKEND') {
      return processedBatches.filter((b) => b.dayPattern === 'SAT_SUN' || b.dayPattern === 'WEEKEND');
    }
    return processedBatches.filter((b) => b.dayPattern === selectedPattern);
  }, [processedBatches, selectedPattern, todayPattern]);

  const stats = useMemo(() => ({
    total: filteredBatches.length,
    capacity: filteredBatches.reduce((s, b) => s + (b.capacity || 0), 0),
    enrolled: filteredBatches.reduce((s, b) => s + (b.enrolled || 0), 0),
  }), [filteredBatches]);

  const columns = useMemo(() => [
    {
      accessorKey: 'displayName',
      header: 'Batch Name',
      cell: ({ row }) => (
        <div
          onClick={() => navigate(`/admin/batches/${row.original.id}`)}
          className="font-semibold text-ink hover:text-brand cursor-pointer transition-colors"
        >
          {row.original.displayName}
        </div>
      ),
    },
    {
      accessorKey: 'coachName',
      header: 'Coach',
      cell: ({ getValue }) => (
        <span className="text-ink-muted text-xs font-medium">{getValue()}</span>
      ),
    },
    {
      accessorKey: 'entity',
      header: 'Business Entity',
      cell: ({ getValue }) => (
        <span className="px-2 py-0.5 rounded-lg text-[11px] font-semibold bg-brand-50 text-brand-600 capitalize">
          {getValue() === 'The Club' || getValue() === 'the-club' ? 'The Club' : 'TOTS Tennis'}
        </span>
      ),
    },
    {
      accessorKey: 'dayPattern',
      header: 'Days',
      cell: ({ getValue }) => (
        <span className="font-mono text-xs font-semibold text-ink-muted">{getValue()}</span>
      ),
    },
    {
      accessorKey: 'capacity',
      header: 'Capacity',
      cell: ({ getValue }) => (
        <span className="font-mono text-ink text-xs">{getValue()}</span>
      ),
    },
    {
      id: 'enrolled',
      header: 'Enrolled / Occupancy',
      cell: ({ row }) => {
        const { enrolled, capacity } = row.original;
        return <CapacityIndicator filled={enrolled} total={capacity} />;
      },
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ getValue }) => <StatusPill status={getValue()} />,
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <RowActionsMenu
          actions={[
            { label: 'View Details', icon: Pencil, onClick: () => navigate(`/admin/batches/${row.original.id}`) },
          ]}
          itemLabel={row.original.displayName}
        />
      ),
      enableSorting: false,
      size: 48,
    },
  ], [navigate]);

  const renderCard = (batch) => {
    return (
      <div
        onClick={() => navigate(`/admin/batches/${batch.id}`)}
        className="space-y-3 cursor-pointer group"
      >
        <div className="flex items-start justify-between gap-2">
          <div>
            <h4 className="font-semibold text-ink group-hover:text-brand transition-colors text-sm">{batch.displayName}</h4>
            <p className="text-xs text-ink-muted font-medium">Coach: {batch.coachName}</p>
          </div>
          <StatusPill status={batch.status} />
        </div>
        <div className="flex items-center gap-2 text-xs text-ink-muted">
          <span>{batch.scheduleText}</span>
        </div>
        <CapacityIndicator filled={batch.enrolled} total={batch.capacity} />
        <div className="flex items-center gap-2 flex-wrap pt-1">
          <span className="px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-brand-50 text-brand-600 capitalize">
            {batch.entity === 'The Club' || batch.entity === 'the-club' ? 'The Club' : 'TOTS Tennis'}
          </span>
          <span className="font-mono text-[11px] font-medium text-ink-muted px-2 py-0.5 rounded bg-canvas-soft">
            {batch.dayPattern}
          </span>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="w-8 h-8 rounded-full border-2 border-brand border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2 items-center">
          {PATTERNS.map((p) => {
            const isToday = p === 'TODAY';
            let label = p;
            if (p === 'TODAY') label = `Today's Batches (${todayPattern})`;
            else if (p === 'SAT_SUN') label = 'Sat & Sun';
            else if (p === 'ALL') label = 'All Batches';

            return (
              <button
                key={p}
                onClick={() => setSelectedPattern(p)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  selectedPattern === p
                    ? 'bg-brand-50 text-brand-600 border border-brand/20 shadow-sm'
                    : 'text-ink-muted hover:bg-canvas-soft border border-transparent'
                }`}
              >
                <span>{label}</span>
                {isToday && (
                  <span className="px-1.5 py-0.5 text-[9px] font-bold bg-brand text-white rounded-full uppercase tracking-wider">
                    Today
                  </span>
                )}
              </button>
            );
          })}
        </div>
        <Button size="sm" icon={Plus} onClick={() => navigate('/admin/batches/new')}>
          Add Batch
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard icon={Layers} label="Batches Shown" value={stats.total} />
        <StatCard icon={Users} label="Total Capacity" value={stats.capacity} />
        <StatCard icon={GraduationCap} label="Enrolled Students" value={stats.enrolled} color="ok" />
      </div>

      <AdaptiveTable
        data={filteredBatches}
        columns={columns}
        renderCard={renderCard}
        searchPlaceholder="Search batches by name, court, coach..."
        emptyMessage="No batches found for this selection"
      />
    </div>
  );
}
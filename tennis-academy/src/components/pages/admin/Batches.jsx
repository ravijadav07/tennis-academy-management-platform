import { useState, useMemo, useEffect } from 'react';
import { Layers, Users, GraduationCap, Pencil } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../../../utils/supabase';
import AdaptiveTable from '../../data/AdaptiveTable';
import RowActionsMenu from '../../data/RowActionsMenu';
import StatCard from '../../ui/StatCard';
import StatusPill from '../../ui/StatusPill';
import Modal from '../../ui/Modal';
import Input from '../../ui/Input';
import Button from '../../ui/Button';
import Skeleton from '../../ui/Skeleton';

const INITIAL_FORM = { name: '', coach: '', level: 'beginner', schedule: '', capacity: '', status: 'active' };

export default function Batches() {
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState(INITIAL_FORM);
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      const { data, error } = await supabase
        .from('batches')
        .select('*, coaches(name), students(id)');
      if (cancelled) return;
      if (error) {
        console.error('[Batches] Supabase error:', error);
        toast.error('Failed to load batches');
        setLoading(false);
        return;
      }
      setBatches((data || []).map(b => ({
        id: b.id,
        name: b.name,
        coach: b.coaches?.name ?? 'Unassigned',
        business_entity: b.entity,
        level: b.level,
        schedule: b.schedule_text ?? '',
        capacity: b.capacity,
        enrolled: Array.isArray(b.students) ? b.students.length : 0,
        status: b.status,
        ageGroup: b.age_group ?? '',
        location: b.location ?? '',
      })));
      setLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const filteredBatches = batches;

  const stats = useMemo(() => ({
    total: filteredBatches.length,
    capacity: filteredBatches.reduce((s, b) => s + b.capacity, 0),
    enrolled: filteredBatches.reduce((s, b) => s + b.enrolled, 0),
  }), [filteredBatches]);

  const openEdit = (batch) => {
    setEditItem(batch);
    setForm({
      name: batch.name,
      coach: batch.coach,
      level: batch.level,
      schedule: batch.schedule,
      capacity: String(batch.capacity),
      status: batch.status,
    });
  };

  const handleSave = async () => {
    try {
      const { error } = await supabase
        .from('batches')
        .update({
          name: form.name,
          level: form.level,
          schedule_text: form.schedule,
          capacity: parseInt(form.capacity, 10) || 0,
          status: form.status,
        })
        .eq('id', editItem.id);
      if (error) throw error;
      toast.success(`Batch "${form.name}" updated successfully`);
      setEditItem(null);
      setBatches(prev => prev.map(b => b.id === editItem.id ? { ...b, name: form.name, level: form.level, schedule: form.schedule, capacity: parseInt(form.capacity, 10) || 0, status: form.status } : b));
    } catch (err) {
      console.error('[Batches] Save error:', err);
      toast.error('Failed to update batch');
    }
  };

  const columns = useMemo(() => [
    {
      accessorKey: 'name',
      header: 'Name',
      cell: ({ getValue }) => (
        <span className="font-medium text-ink">{getValue()}</span>
      ),
    },
    {
      accessorKey: 'coach',
      header: 'Coach',
      cell: ({ getValue }) => (
        <span className="text-ink-muted text-xs">{getValue()}</span>
      ),
    },
    {
      accessorKey: 'business_entity',
      header: 'Business Entity',
      cell: ({ getValue }) => (
        <span className="px-2 py-0.5 rounded-lg text-[11px] font-semibold bg-brand-50 text-brand-600 capitalize">
          {getValue() === 'the-club' ? 'The Club' : "TOTS Tennis"}
        </span>
      ),
    },
    {
      accessorKey: 'level',
      header: 'Level',
      cell: ({ getValue }) => (
        <StatusPill status={getValue()} />
      ),
    },
    {
      accessorKey: 'schedule',
      header: 'Schedule',
      cell: ({ getValue }) => (
        <span className="text-ink-muted text-xs">{getValue()}</span>
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
      header: 'Enrolled',
      cell: ({ row }) => {
        const { enrolled, capacity } = row.original;
        const pct = capacity > 0 ? Math.round((enrolled / capacity) * 100) : 0;
        return (
          <div className="flex items-center gap-2">
            <span className="font-mono text-ink text-xs w-10">{enrolled}/{capacity}</span>
            <div className="w-20 h-2 bg-canvas-soft rounded-full overflow-hidden">
              <div
                className="h-full bg-brand rounded-full transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="text-ink-faint text-xs">{pct}%</span>
          </div>
        );
      },
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ getValue }) => (
        <StatusPill status={getValue()} />
      ),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <RowActionsMenu
          actions={[{ label: 'Edit', icon: Pencil, onClick: () => openEdit(row.original) }]}
          itemLabel={row.original.name}
        />
      ),
      enableSorting: false,
      size: 48,
    },
  ], []);

  const renderCard = (batch) => {
    const pct = batch.capacity > 0 ? Math.round((batch.enrolled / batch.capacity) * 100) : 0;
    return (
      <div className="space-y-3">
        <div className="flex items-start justify-between">
          <div>
            <h4 className="font-semibold text-ink">{batch.name}</h4>
            <p className="text-xs text-ink-muted">{batch.coach}</p>
          </div>
          <StatusPill status={batch.status} />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-ink-muted">{batch.schedule}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-full h-2.5 bg-canvas-soft rounded-full overflow-hidden">
            <div
              className="h-full bg-brand rounded-full transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className="text-xs font-mono text-ink whitespace-nowrap">{batch.enrolled}/{batch.capacity} ({pct}%)</span>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <StatusPill status={batch.level} />
          <span className="px-2 py-0.5 rounded-lg text-[10px] font-medium bg-brand-50 text-brand-600 capitalize">
            {batch.business_entity === 'the-club' ? 'The Club' : "TOTS Tennis"}
          </span>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Skeleton.SkeletonCard /><Skeleton.SkeletonCard /><Skeleton.SkeletonCard />
        </div>
        <Skeleton.SkeletonTable />
      </div>
    );
  }

  return (
    <div className="space-y-4">

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard icon={Layers} label="Total Batches" value={stats.total} />
        <StatCard icon={Users} label="Total Capacity" value={stats.capacity} />
        <StatCard icon={GraduationCap} label="Enrolled" value={stats.enrolled} color="ok" />
      </div>

      <AdaptiveTable
        data={filteredBatches}
        columns={columns}
        renderCard={renderCard}
        searchPlaceholder="Search batches..."
        emptyMessage="No batches found"
      />

      <Modal open={!!editItem} onClose={() => setEditItem(null)} title="Edit Batch" size="md">
        <div className="space-y-4">
          <Input label="Batch Name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Coach" value={form.coach} onChange={e => setForm(f => ({ ...f, coach: e.target.value }))} />
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-ink-muted">Level</label>
              <select
                value={form.level}
                onChange={e => setForm(f => ({ ...f, level: e.target.value }))}
                className="w-full h-[38px] px-3 rounded-lg border border-line bg-white text-[13px] text-ink outline-none focus:ring-2 focus:ring-brand/10 focus:border-brand"
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
                <option value="all">All Levels</option>
              </select>
            </div>
          </div>
          <Input label="Schedule" value={form.schedule} onChange={e => setForm(f => ({ ...f, schedule: e.target.value }))} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Capacity" value={form.capacity} onChange={e => setForm(f => ({ ...f, capacity: e.target.value }))} />
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-ink-muted">Status</label>
              <select
                value={form.status}
                onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                className="w-full h-[38px] px-3 rounded-lg border border-line bg-white text-[13px] text-ink outline-none focus:ring-2 focus:ring-brand/10 focus:border-brand"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
          <div className="flex items-center justify-end gap-2 pt-2">
            <Button variant="secondary" size="sm" onClick={() => setEditItem(null)}>Cancel</Button>
            <Button variant="primary" size="sm" onClick={handleSave}>Save Changes</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
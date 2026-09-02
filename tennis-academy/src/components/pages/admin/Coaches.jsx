import { useState } from 'react';
import { Users, Mail, Phone, Layers, CheckCircle, XCircle, Pencil } from 'lucide-react';
import { toast } from 'sonner';
import { coaches } from '../../../data/admin/coachesData';
import AdaptiveTable from '../../data/AdaptiveTable';
import RowActionsMenu from '../../data/RowActionsMenu';
import StatCard from '../../ui/StatCard';
import StatusPill from '../../ui/StatusPill';
import Modal from '../../ui/Modal';
import Input from '../../ui/Input';
import Button from '../../ui/Button';
import { formatCurrency } from '../../../utils/formatters';

const INITIAL_FORM = { name: '', phone: '', email: '', specialization: '', status: 'active', payroll: '' };

export default function Coaches() {
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState(INITIAL_FORM);

  const filteredCoaches = coaches;

  const stats = useMemo(() => ({
    total: filteredCoaches.length,
    active: filteredCoaches.filter(c => c.status === 'active').length,
    onLeave: filteredCoaches.filter(c => c.status === 'on_leave').length,
  }), [filteredCoaches]);

  const openEdit = (coach) => {
    setEditItem(coach);
    setForm({
      name: coach.name,
      phone: coach.phone,
      email: coach.email,
      specialization: coach.specialization,
      status: coach.status,
      payroll: String(coach.payroll),
    });
  };

  const handleSave = () => {
    toast.success(`Coach "${form.name}" updated successfully`);
    setEditItem(null);
  };

  const columns = useMemo(() => [
    {
      accessorKey: 'name',
      header: 'Name',
      cell: ({ getValue }) => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-brand-50 flex items-center justify-center text-brand text-xs font-semibold">
            {getValue().split(' ').map(n => n[0]).join('')}
          </div>
          <span className="font-medium text-ink">{getValue()}</span>
        </div>
      ),
    },
    {
      accessorKey: 'phone',
      header: 'Phone',
      cell: ({ getValue }) => (
        <span className="text-ink-muted text-xs font-mono">{getValue()}</span>
      ),
    },
    {
      accessorKey: 'email',
      header: 'Email',
      cell: ({ getValue }) => (
        <span className="text-ink-muted text-xs">{getValue()}</span>
      ),
    },
    {
      accessorKey: 'specialization',
      header: 'Specialization',
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
      accessorKey: 'students',
      header: 'Students',
      cell: ({ getValue }) => (
        <span className="font-semibold text-ink">{getValue()}</span>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ getValue }) => {
        const status = getValue();
        const label = status === 'active' ? 'Active' : 'On Leave';
        return <StatusPill status={label} />;
      },
    },
    {
      accessorKey: 'payroll',
      header: 'Payroll',
      cell: ({ row }) => {
        const coach = row.original;
        const isClub = coach.business_entity === 'the-club';
        return (
          <div className="flex flex-col">
            <span className="font-medium text-ink">{isClub ? formatCurrency(coach.payroll) : formatCurrency(coach.hours_logged * coach.hourly_rate)}</span>
            <span className="text-[10px] text-ink-faint">{isClub ? 'Salary (Club)' : `Hourly (TOTS) — ${coach.hours_logged}h × Rs.${coach.hourly_rate}`}</span>
          </div>
        );
      },
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

  const renderCard = (coach) => (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-brand-50 flex items-center justify-center text-brand text-sm font-semibold">
            {coach.name.split(' ').map(n => n[0]).join('')}
          </div>
          <div>
            <h4 className="font-semibold text-ink">{coach.name}</h4>
            <p className="text-xs text-ink-muted">{coach.specialization}</p>
          </div>
        </div>
        <StatusPill status={coach.status === 'active' ? 'Active' : 'On Leave'} />
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="flex items-center gap-1.5 text-ink-muted">
          <Mail className="w-3.5 h-3.5" /> {coach.email}
        </div>
        <div className="flex items-center gap-1.5 text-ink-muted">
          <Phone className="w-3.5 h-3.5" /> {coach.phone}
        </div>
        <div className="flex items-center gap-1.5 text-ink-muted">
          <Users className="w-3.5 h-3.5" /> {coach.students} students
        </div>
        <div className="flex items-center gap-1.5 text-ink-muted">
          <Layers className="w-3.5 h-3.5" /> {coach.business_entity === 'the-club' ? formatCurrency(coach.payroll) : `Rs.${(coach.hours_logged * coach.hourly_rate).toLocaleString('en-IN')}`}
        </div>
      </div>
      <div className="pt-1 flex items-center gap-2 flex-wrap">
        <span className="px-2 py-0.5 rounded-lg text-[10px] font-medium bg-brand-50 text-brand-600 capitalize">
          {coach.business_entity === 'the-club' ? 'The Club' : "TOTS Tennis"}
        </span>
        <span className="text-[10px] text-ink-faint">
          {coach.business_entity === 'the-club' ? 'Salary (Club)' : `Hourly — ${coach.hours_logged}h × Rs.${coach.hourly_rate}`}
        </span>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard icon={Users} label="Total Coaches" value={stats.total} />
        <StatCard icon={CheckCircle} label="Active" value={stats.active} color="ok" />
        <StatCard icon={XCircle} label="On Leave" value={stats.onLeave} color="warn" />
      </div>

      <AdaptiveTable
        data={filteredCoaches}
        columns={columns}
        renderCard={renderCard}
        searchPlaceholder="Search coaches..."
        emptyMessage="No coaches found"
      />

      <Modal open={!!editItem} onClose={() => setEditItem(null)} title="Edit Coach" size="md">
        <div className="space-y-4">
          <Input label="Name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Phone" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
            <Input label="Email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
          </div>
          <Input label="Specialization" value={form.specialization} onChange={e => setForm(f => ({ ...f, specialization: e.target.value }))} />
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-ink-muted">Status</label>
              <select
                value={form.status}
                onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                className="w-full h-[38px] px-3 rounded-lg border border-line bg-white text-[13px] text-ink outline-none focus:ring-2 focus:ring-brand/10 focus:border-brand"
              >
                <option value="active">Active</option>
                <option value="on_leave">On Leave</option>
              </select>
            </div>
            <Input label="Payroll (Rs.)" value={form.payroll} onChange={e => setForm(f => ({ ...f, payroll: e.target.value }))} />
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
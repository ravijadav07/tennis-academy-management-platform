import { useState, useMemo } from 'react';
import { CreditCard, IndianRupee, Clock, Eye, Send, FileText, CheckCircle, Pencil } from 'lucide-react';
import { toast } from 'sonner';
import { payments } from '../../../data/admin/paymentsData';
import { triggerWorkflow } from '../../../utils/api';
import AdaptiveTable from '../../data/AdaptiveTable';
import StatCard from '../../ui/StatCard';
import StatusPill from '../../ui/StatusPill';
import FilterBar from '../../data/FilterBar';
import RowActionsMenu from '../../data/RowActionsMenu';
import Modal from '../../ui/Modal';
import Input from '../../ui/Input';
import Dropdown from '../../ui/Dropdown';
import Button from '../../ui/Button';
import { formatCurrency, formatDate } from '../../../utils/formatters';

const gatewayOptions = [
  { value: 'stripe', label: 'Stripe' },
  { value: 'cc_avenue', label: 'CCAvenue' },
  { value: 'excel_reported', label: 'Excel Reported' },
];

const statusOptions = [
  { value: 'paid', label: 'Paid' },
  { value: 'pending', label: 'Pending' },
  { value: 'overdue', label: 'Overdue' },
];

const gatewayFormOptions = [
  { value: 'stripe', label: 'Stripe' },
  { value: 'cc_avenue', label: 'CCAvenue' },
  { value: 'excel_reported', label: 'Excel Reported' },
];

const statusFormOptions = [
  { value: 'paid', label: 'Paid' },
  { value: 'pending', label: 'Pending' },
  { value: 'overdue', label: 'Overdue' },
];

const INITIAL_FORM = { amount: '', status: 'paid', gateway: 'stripe' };

export default function Payments() {
  const [gatewayFilter, setGatewayFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState(INITIAL_FORM);

  const filteredPayments = useMemo(() => {
    let result = payments;
    if (gatewayFilter !== 'all') {
      result = result.filter(p => p.gateway === gatewayFilter);
    }
    if (statusFilter !== 'all') {
      result = result.filter(p => p.status === statusFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(p =>
        p.studentName.toLowerCase().includes(q) ||
        p.parentName.toLowerCase().includes(q)
      );
    }
    return result;
  }, [gatewayFilter, statusFilter, search]);

  const filterConfig = useMemo(() => [
    { key: 'gateway', label: 'Gateway', value: gatewayFilter, onChange: setGatewayFilter, options: gatewayOptions, defaultValue: 'all' },
    { key: 'status', label: 'Status', value: statusFilter, onChange: setStatusFilter, options: statusOptions, defaultValue: 'all' },
  ], [gatewayFilter, statusFilter]);

  const stats = useMemo(() => {
    const base = filteredPayments;
    const totalRev = base.reduce((s, p) => s + p.amount, 0);
    const collected = base.filter(p => p.status === 'paid').reduce((s, p) => s + p.amount, 0);
    const outstanding = base.filter(p => p.status !== 'paid').reduce((s, p) => s + p.amount, 0);
    return { totalRev, collected, outstanding };
  }, [filteredPayments]);

  const columns = useMemo(() => [
    {
      accessorKey: 'studentName',
      header: 'Student',
      cell: ({ getValue }) => <span className="font-medium text-ink">{getValue()}</span>,
    },
    {
      accessorKey: 'parentName',
      header: 'Parent',
      cell: ({ getValue }) => <span className="text-ink-muted">{getValue()}</span>,
    },
    {
      accessorKey: 'business_entity',
      header: 'Entity',
      cell: ({ getValue }) => (
        <span className="px-2 py-0.5 rounded-lg text-[11px] font-semibold bg-brand-50 text-brand-600 capitalize">
          {getValue() === 'the-club' ? 'The Club' : "TOTS Tennis"}
        </span>
      ),
    },
    {
      accessorKey: 'amount',
      header: 'Amount',
      cell: ({ getValue }) => <span className="font-medium text-ink">{formatCurrency(getValue())}</span>,
    },
    {
      accessorKey: 'date',
      header: 'Date',
      cell: ({ getValue }) => <span className="text-ink-muted text-xs">{formatDate(getValue())}</span>,
    },
    {
      accessorKey: 'gateway',
      header: 'Gateway',
      cell: ({ getValue }) => {
        const g = getValue();
        const label = g === 'cc_avenue' ? 'CCAvenue' : g === 'stripe' ? 'Stripe' : 'Excel Reported';
        return <StatusPill status={label} />;
      },
    },
    {
      accessorKey: 'type',
      header: 'Type',
      cell: ({ getValue }) => <span className="text-ink-muted text-xs">{getValue()}</span>,
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ getValue }) => <StatusPill status={getValue()} />,
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => {
        const paymentActions = [
          { label: 'Edit', icon: Pencil, onClick: () => openEdit(row.original) },
          { label: 'View Details', icon: Eye },
          { label: 'Mark as Paid', icon: CheckCircle, onClick: () => handleMarkAsPaid(row.original) },
          { label: 'Send Reminder', icon: Send },
          { label: 'Download Invoice', icon: FileText },
        ];
        return <RowActionsMenu actions={paymentActions} itemLabel={row.original.studentName} />;
      },
      enableSorting: false,
      size: 48,
    },
  ], []);

  const openEdit = (item) => {
    setEditItem(item);
    setForm({
      amount: String(item.amount),
      status: item.status,
      gateway: item.gateway,
    });
  };

  const handleSave = () => {
    toast.success(`Payment for "${editItem.studentName}" updated successfully`);
    setEditItem(null);
  };

  const handleMarkAsPaid = async (item) => {
    const p = toast.loading('Capturing payment...');
    try {
      await triggerWorkflow('payment.capture', {
        payment_id: item.id,
        student_id: item.studentId,
        student_name: item.studentName,
        parent_name: item.parentName,
        amount: item.amount,
        gateway: item.gateway,
        type: item.type,
        business_entity: item.business_entity,
      });
      toast.success(`Payment captured for ${item.studentName}`, { id: p });
    } catch (err) {
      toast.error('Payment capture failed: ' + err.message, { id: p });
    }
  };

  const renderCard = (item) => (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-semibold text-ink">{item.studentName}</h4>
          <p className="text-xs text-ink-muted">{item.parentName}</p>
        </div>
        <span className="text-base font-bold text-ink">{formatCurrency(item.amount)}</span>
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <span className="text-ink-muted">{item.type}</span>
        <span className="text-ink-muted text-right">{formatDate(item.date)}</span>
        <StatusPill status={item.gateway === 'cc_avenue' ? 'CCAvenue' : item.gateway === 'stripe' ? 'Stripe' : 'Excel Reported'} />
        <StatusPill status={item.status} />
      </div>
    </div>
  );

  return (
    <div className="space-y-4">

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard icon={IndianRupee} label="Total Revenue (This Month)" value={formatCurrency(stats.totalRev)} />
        <StatCard icon={CreditCard} label="Collected" value={formatCurrency(stats.collected)} color="ok" />
        <StatCard icon={Clock} label="Outstanding" value={formatCurrency(stats.outstanding)} color={stats.outstanding > 0 ? 'warn' : 'ok'} />
      </div>

      <FilterBar
        filters={filterConfig}
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search payments..."
      />

      <AdaptiveTable
        data={filteredPayments}
        columns={columns}
        renderCard={renderCard}
        emptyMessage="No payments found"
        hideSearch
      />

      <Modal open={!!editItem} onClose={() => setEditItem(null)} title="Edit Payment" size="sm">
        {editItem && (
          <div className="space-y-4">
            <Input label="Student" value={editItem.studentName} disabled />
            <Input label="Amount" type="number" value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} />
            <Dropdown label="Status" options={statusFormOptions} value={form.status} onChange={(v) => setForm((f) => ({ ...f, status: v }))} getOptionLabel={(o) => o.label} getOptionValue={(o) => o.value} />
            <Dropdown label="Gateway" options={gatewayFormOptions} value={form.gateway} onChange={(v) => setForm((f) => ({ ...f, gateway: v }))} getOptionLabel={(o) => o.label} getOptionValue={(o) => o.value} />
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="secondary" onClick={() => setEditItem(null)}>Cancel</Button>
              <Button onClick={handleSave}>Save Changes</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

import { useState, useMemo, useCallback, useEffect } from 'react';
import { AlertTriangle, Clock, Bell, Send, Pencil } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../../../utils/supabase';
import AdaptiveTable from '../../data/AdaptiveTable';
import StatCard from '../../ui/StatCard';
import StatusPill from '../../ui/StatusPill';
import RowActionsMenu from '../../data/RowActionsMenu';
import Modal from '../../ui/Modal';
import Input from '../../ui/Input';
import Dropdown from '../../ui/Dropdown';
import Button from '../../ui/Button';
import { formatCurrency, formatDate } from '../../../utils/formatters';
import { cn } from '../../../utils/cn';
import { db } from '../../../mocks/localDb';

const PACKAGE_DURATION_DAYS = 45;

function computeDaysRemaining(expiryDate) {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const exp = new Date(expiryDate);
  exp.setHours(0, 0, 0, 0);
  return Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

const columns = [
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
    accessorKey: 'entity',
    header: 'Business Entity',
    cell: ({ getValue }) => (
      <span className="px-2 py-0.5 rounded-lg text-[11px] font-semibold bg-brand-50 text-brand-600 capitalize">
        {getValue() === 'the-club' ? 'The Club' : "TOTS Tennis"}
      </span>
    ),
  },
  {
    accessorKey: 'plan',
    header: 'Plan',
  },
  {
    accessorKey: 'amount',
    header: 'Amount',
    cell: ({ getValue }) => <span className="font-medium text-ink">{formatCurrency(getValue())}</span>,
  },
  {
    accessorKey: 'expiry',
    header: 'Expiry',
    cell: ({ getValue }) => <span className="text-ink-muted">{formatDate(getValue())}</span>,
  },
  {
    accessorKey: 'daysRemaining',
    header: 'Days Remaining',
    cell: ({ getValue }) => {
      const days = getValue();
      const color = days <= 0 ? 'text-err font-semibold' : days < 7 ? 'text-err' : days < 14 ? 'text-warn' : 'text-ok';
      return (
        <div className="flex items-center gap-2">
          <span className={cn('text-sm', color)}>{days <= 0 ? 'EXPIRED' : `${days}d`}</span>
          <div className="w-20 h-1.5 rounded-full bg-canvas-soft overflow-hidden">
            <div
              className={cn('h-full rounded-full transition-all', color.replace('text-', 'bg-'))}
              style={{ width: `${Math.min(100, Math.max(0, ((PACKAGE_DURATION_DAYS - days) / PACKAGE_DURATION_DAYS) * 100))}%` }}
            />
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: 'paymentStatus',
    header: 'Payment Status',
    cell: ({ getValue }) => <StatusPill status={getValue()} />,
  },
  {
    accessorKey: 'lastReminder',
    header: 'Last Reminder',
    cell: ({ getValue }) => (
      <span className="text-ink-muted text-xs">{getValue() ? formatDate(getValue()) : '--'}</span>
    ),
  },
  {
    accessorKey: 'nextReminder',
    header: 'Next Reminder',
    cell: ({ getValue }) => (
      <span className="text-ink-muted text-xs">{getValue() ? formatDate(getValue()) : '--'}</span>
    ),
  },
  {
    id: 'actions',
    header: '',
    cell: ({ row }) => (
      <RowActionsMenu
        actions={[
          { label: 'Edit', icon: Pencil, onClick: () => openEdit(row.original) },
          { label: 'View Drip', icon: Bell, onClick: () => setSelectedRenewal(row.original) },
        ]}
        itemLabel={row.original.studentName}
      />
    ),
    enableSorting: false,
    size: 48,
  },
];

const statusOptions = [
  { value: 'paid', label: 'Paid' },
  { value: 'pending', label: 'Pending' },
  { value: 'overdue', label: 'Overdue' },
];

const INITIAL_FORM = { plan: '', amount: '', expiry: '', paymentStatus: 'paid' };

let openEdit;
let setSelectedRenewal;

export default function Renewals() {
  const [selectedRenewal, _setSelectedRenewal] = useState(null);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState(INITIAL_FORM);
  const [packages, setPackages] = useState([]);
  const [remindersByPkg, setRemindersByPkg] = useState({});
  const [loading, setLoading] = useState(true);

  setSelectedRenewal = _setSelectedRenewal;

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { data: pkgs, error: pkgErr } = await supabase
        .from('packages')
        .select('id, student_id, plan_type, amount, start_date, expiry_date, status, payment_status, reminder_stage, last_reminder_at, overdue_days, students(name, entity)')
        .in('status', ['active', 'expired', 'lapsed'])
        .order('expiry_date', { ascending: true });

      if (pkgErr || !pkgs || pkgs.length === 0) {
        const local = db.readAll();
        const localPkgs = local.packages || [];
        const rows = localPkgs.map(p => {
          const student = (local.students || []).find(s => s.id === p.studentId);
          const expiryDate = p.endDate || p.expiryDate || new Date().toISOString().slice(0, 10);
          const daysRemaining = computeDaysRemaining(expiryDate);
          return {
            id: p.id,
            studentId: p.studentId,
            studentName: student ? student.name : 'Unknown',
            parentName: student ? (student.guardianName || 'Parent') : '--',
            entity: student ? (student.entity || 'the-club') : 'the-club',
            plan: p.program || 'Quarterly',
            amount: p.amount || 12000,
            expiry: expiryDate,
            daysRemaining,
            paymentStatus: p.paymentStatus === 'PAID' ? 'paid' : (p.paymentStatus || 'pending').toLowerCase(),
            lastReminder: null,
            nextReminder: daysRemaining > 0 && daysRemaining <= 7 ? expiryDate : null,
            status: p.status || 'active',
            reminderStage: 'd_minus_6',
            overdueDays: daysRemaining < 0 ? Math.abs(daysRemaining) : 0,
          };
        });
        setPackages(rows);
        setLoading(false);
        return;
      }

      const studentIds = [...new Set(pkgs.map(p => p.student_id))];
      const { data: spRows, error: spErr } = await supabase
        .from('student_parents')
        .select('student_id, parents(id, name)')
        .in('student_id', studentIds);

      if (spErr) throw spErr;
      const parentMap = {};
      if (spRows) {
        for (const sp of spRows) {
          if (sp.parents && !parentMap[sp.student_id]) {
            parentMap[sp.student_id] = sp.parents.name;
          }
        }
      }

      const pkgIds = pkgs.map(p => p.id);
      const { data: reminders, error: remErr } = await supabase
        .from('reminders')
        .select('package_id, stage, channel, status, sent_at')
        .in('package_id', pkgIds)
        .order('sent_at', { ascending: false });

      if (remErr) throw remErr;
      const remMap = {};
      if (reminders) {
        for (const r of reminders) {
          if (!remMap[r.package_id]) remMap[r.package_id] = [];
          remMap[r.package_id].push(r);
        }
      }
      setRemindersByPkg(remMap);

      const rows = pkgs.map(p => {
        const student = p.students;
        const daysRemaining = computeDaysRemaining(p.expiry_date);
        const reminderList = remMap[p.id] || [];
        const lastReminder = reminderList.length > 0 ? reminderList[0].sent_at : null;
        const nextReminder = daysRemaining > 0 && daysRemaining <= 7 ? p.expiry_date : null;
        return {
          id: p.id,
          studentId: p.student_id,
          studentName: student ? student.name : 'Unknown',
          parentName: parentMap[p.student_id] || '--',
          entity: student ? student.entity : 'the-club',
          plan: p.plan_type,
          amount: p.amount,
          expiry: p.expiry_date,
          daysRemaining,
          paymentStatus: p.payment_status,
          lastReminder,
          nextReminder,
          status: p.status,
          reminderStage: p.reminder_stage,
          overdueDays: p.overdue_days,
        };
      });
      setPackages(rows);
    } catch (err) {
      console.warn('Failed to fetch renewals, using localDb fallback:', err);
      const local = db.readAll();
      const localPkgs = local.packages || [];
      const rows = localPkgs.map(p => {
        const student = (local.students || []).find(s => s.id === p.studentId);
        const expiryDate = p.endDate || p.expiryDate || new Date().toISOString().slice(0, 10);
        const daysRemaining = computeDaysRemaining(expiryDate);
        return {
          id: p.id,
          studentId: p.studentId,
          studentName: student ? student.name : 'Unknown',
          parentName: student ? (student.guardianName || 'Parent') : '--',
          entity: student ? (student.entity || 'the-club') : 'the-club',
          plan: p.program || 'Quarterly',
          amount: p.amount || 12000,
          expiry: expiryDate,
          daysRemaining,
          paymentStatus: p.paymentStatus === 'PAID' ? 'paid' : (p.paymentStatus || 'pending').toLowerCase(),
          lastReminder: null,
          nextReminder: daysRemaining > 0 && daysRemaining <= 7 ? expiryDate : null,
          status: p.status || 'active',
          reminderStage: 'd_minus_6',
          overdueDays: daysRemaining < 0 ? Math.abs(daysRemaining) : 0,
        };
      });
      setPackages(rows);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filteredRenewals = packages;

  const stats = useMemo(() => {
    const base = filteredRenewals;
    return {
      upcoming: base.filter(r => r.daysRemaining > 0 && r.daysRemaining <= 7).length,
      overdue: base.filter(r => r.paymentStatus === 'overdue' || r.status === 'expired').length,
      activeCampaigns: base.filter(r => r.status === 'active' || r.status === 'expired').length,
      pausedCampaigns: base.filter(r => r.status === 'lapsed').length,
    };
  }, [filteredRenewals]);

  const drip = useMemo(() => {
    if (!selectedRenewal) return null;
    const remList = remindersByPkg[selectedRenewal.id] || [];
    if (remList.length === 0) return { touchpoints: [], autoStop: false };
    const sorted = [...remList].sort((a, b) => new Date(a.sent_at) - new Date(b.sent_at));
    const touchpoints = sorted.map(r => {
      const stageMap = {
        d_minus_6: -6, d_plus_7: 7, d_plus_14: 14, d_plus_21: 21, d_plus_28: 28,
      };
      return {
        day: stageMap[r.stage] || 0,
        date: r.sent_at,
        channel: r.channel === 'email' ? 'Email' : r.channel,
        status: r.status,
      };
    });
    const autoStop = selectedRenewal.status === 'lapsed';
    const note = autoStop ? `Campaign stopped — package lapsed after ${PACKAGE_DURATION_DAYS}+ days` : null;
    return { touchpoints, autoStop, note };
  }, [selectedRenewal, remindersByPkg]);

  openEdit = (item) => {
    setEditItem(item);
    setForm({
      plan: item.plan,
      amount: String(item.amount),
      expiry: item.expiry,
      paymentStatus: item.paymentStatus,
    });
  };

  const handleSave = async () => {
    try {
      const { error } = await supabase
        .from('packages')
        .update({
          plan_type: form.plan,
          amount: parseInt(form.amount, 10) || 0,
          expiry_date: form.expiry,
          payment_status: form.paymentStatus,
        })
        .eq('id', editItem.id);
      if (error) throw error;
      toast.success(`Renewal for "${editItem.studentName}" updated successfully`);
      setEditItem(null);
      setPackages(prev => prev.map(p => p.id === editItem.id ? { ...p, plan: form.plan, amount: parseInt(form.amount, 10) || 0, expiry: form.expiry, paymentStatus: form.paymentStatus } : p));
    } catch (err) {
      console.error('[Renewals] Save error:', err);
      toast.error('Failed to update renewal');
    }
  };

  const renderCard = (item) => {
    const days = item.daysRemaining;
    const dayColor = days <= 0 ? 'text-err' : days < 7 ? 'text-err' : days < 14 ? 'text-warn' : 'text-ok';
    const barColor = days <= 0 ? 'bg-err' : days < 7 ? 'bg-err' : days < 14 ? 'bg-warn' : 'bg-ok';
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-semibold text-ink">{item.studentName}</h4>
            <p className="text-xs text-ink-muted">{item.parentName}</p>
          </div>
          <StatusPill status={item.paymentStatus} />
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <span className="text-ink-muted">Plan: <span className="text-ink font-medium">{item.plan}</span></span>
          <span className="text-ink-muted">Amount: <span className="text-ink font-medium">{formatCurrency(item.amount)}</span></span>
          <span className="text-ink-muted">Expiry: {formatDate(item.expiry)}</span>
          <span className={cn('font-medium', dayColor)}>{days <= 0 ? 'EXPIRED' : `${days}d remaining`}</span>
        </div>
        <div className="w-full h-1.5 rounded-full bg-canvas-soft overflow-hidden">
          <div className={cn('h-full rounded-full', barColor)} style={{ width: `${Math.min(100, Math.max(0, ((PACKAGE_DURATION_DAYS - days) / PACKAGE_DURATION_DAYS) * 100))}%` }} />
        </div>
        <div className="flex items-center gap-2 text-[10px] text-ink-faint">
          {item.lastReminder ? <span>Last: {formatDate(item.lastReminder)}</span> : null}
          {item.nextReminder ? <span>Next: {formatDate(item.nextReminder)}</span> : null}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard icon={Clock} label="Upcoming Renewals (7 days)" value={stats.upcoming} color="warn" />
        <StatCard icon={AlertTriangle} label="Overdue Payments" value={stats.overdue} color="err" />
        <StatCard
          icon={Bell}
          label="Reminder Campaign Status"
          value={stats.activeCampaigns + stats.pausedCampaigns}
          sublabel={`Active: ${stats.activeCampaigns}, Lapsed: ${stats.pausedCampaigns}`}
        />
      </div>

      <AdaptiveTable
        data={filteredRenewals}
        columns={columns}
        renderCard={renderCard}
        onRowClick={(row) => setSelectedRenewal(row)}
        searchPlaceholder="Search renewals..."
        emptyMessage={loading ? 'Loading...' : 'No renewals found'}
      />

      <Modal open={!!editItem} onClose={() => setEditItem(null)} title="Edit Renewal" size="sm">
        {editItem && (
          <div className="space-y-4">
            <Input label="Plan" value={form.plan} onChange={(e) => setForm((f) => ({ ...f, plan: e.target.value }))} />
            <Input label="Amount" value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} />
            <Input label="Expiry Date" type="date" value={form.expiry} onChange={(e) => setForm((f) => ({ ...f, expiry: e.target.value }))} />
            <Dropdown label="Payment Status" options={statusOptions} value={form.paymentStatus} onChange={(v) => setForm((f) => ({ ...f, paymentStatus: v }))} getOptionLabel={(o) => o.label} getOptionValue={(o) => o.value} />
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="secondary" onClick={() => setEditItem(null)}>Cancel</Button>
              <Button onClick={handleSave}>Save Changes</Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal open={!!selectedRenewal} onClose={() => setSelectedRenewal(null)} title="Reminder Drip Timeline" size="lg">
        {selectedRenewal && (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-brand-50 rounded-xl">
              <div>
                <p className="font-semibold text-ink">{selectedRenewal.studentName}</p>
                <p className="text-xs text-ink-muted">{selectedRenewal.plan} Plan</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-ink-muted">Expiry</p>
                <p className="font-semibold text-ink">{formatDate(selectedRenewal.expiry)}</p>
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-ink mb-2.5">Touchpoint Timeline</p>
              {drip && drip.touchpoints.length > 0 ? (
                <div className="space-y-0">
                  {drip.touchpoints.map((tp, idx) => {
                    const isExpiry = tp.day === 0;
                    const isAfter = tp.day > 0;
                    return (
                      <div key={idx} className="flex items-start gap-4">
                        <div className="flex flex-col items-center">
                          <div className={cn(
                            'w-3 h-3 rounded-full border-2',
                            tp.status === 'sent' ? 'bg-ok border-ok' : tp.status === 'pending' ? 'bg-warn border-warn' : 'bg-off-bg border-off'
                          )} />
                          {idx < drip.touchpoints.length - 1 && <div className="w-0.5 h-8 bg-line" />}
                        </div>
                        <div className="flex-1 pb-4">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-ink-muted">
                              {isExpiry ? 'Expiry (Day 0)' : isAfter ? `Day +${tp.day}` : `Day ${tp.day}`}
                            </span>
                            <span className="text-xs text-ink-faint">{formatDate(tp.date)}</span>
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <Send className="w-3 h-3 text-ink-faint" />
                            <span className="text-sm text-ink">{tp.channel}</span>
                            <StatusPill status={tp.status} />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-ink-muted py-4 text-center">No reminder drip configured for this renewal.</p>
              )}
            </div>

            {drip?.autoStop && (
              <div className="p-3 bg-warn-bg rounded-xl text-sm text-warn flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" /> Auto-stop enabled for this drip
              </div>
            )}
            {drip?.note && (
              <div className="p-3 bg-canvas-soft rounded-xl text-sm text-ink-muted">{drip.note}</div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
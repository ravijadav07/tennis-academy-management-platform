import { useState, useEffect, useMemo } from 'react';
import { Clock, AlertTriangle, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../../context/AuthContext';
import { useSupabase } from '../../../context/SupabaseContext';
import { formatDate } from '../../../utils/formatters';
import { triggerWorkflow } from '../../../utils/api';
import AdaptiveTable from '../../data/AdaptiveTable';
import StatCard from '../../ui/StatCard';
import Button from '../../ui/Button';
import StatusPill from '../../ui/StatusPill';
import Modal from '../../ui/Modal';
import { generateIncrementalId } from '../../../utils/idGenerator';

const LEAVE_QUOTA = 24;

export default function Leave() {
  const { user } = useAuth();
  const { services, entity } = useSupabase();
  const coachId = user?.linkedCoachId;

  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ type: 'casual', startDate: '', endDate: '', reason: '' });
  const [leaveRequestsList, setLeaveRequestsList] = useState([]);

  const leaveRequests = useMemo(() => {
    return leaveRequestsList.map((l) => ({
      id: l.id,
      type: l.type || 'casual',
      startDate: l.startDate,
      endDate: l.endDate,
      reason: l.reason || '',
      status: l.status || 'pending',
      appliedDate: l.appliedDate || l.startDate,
    }));
  }, [leaveRequestsList]);

  const leaveStats = useMemo(() => {
    const used = leaveRequests.filter((l) => l.status === 'approved').reduce((sum, l) => {
      const start = new Date(l.startDate);
      const end = new Date(l.endDate);
      return sum + Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1);
    }, 0);
    const pending = leaveRequests.filter((l) => l.status === 'pending').length;
    return {
      totalLeaves: LEAVE_QUOTA,
      used,
      remaining: Math.max(0, LEAVE_QUOTA - used),
      pending,
    };
  }, [leaveRequests]);

  const handleApply = async () => {
    if (!form.startDate || !form.endDate) {
      toast.error('Please select start and end dates');
      return;
    }
    if (!form.reason || !form.reason.trim()) {
      toast.error('Reason is required for leave request');
      return;
    }
    try {
      const leaveId = generateIncrementalId('lea', leaveRequestsList, { startFrom: 101 });
      const academyId = import.meta.env.VITE_ACADEMY_ID;

      const newLeave = {
        id: leaveId,
        coachId,
        type: form.type.toUpperCase(),
        startDate: form.startDate,
        endDate: form.endDate,
        reason: form.reason,
        status: 'pending',
        appliedDate: new Date().toISOString().split('T')[0],
      };
      setLeaveRequestsList((prev) => [newLeave, ...prev]);

      triggerWorkflow('leave.apply', {
        leaveId,
        leave_id: leaveId,
        coachId,
        coach_id: coachId,
        academyId,
        academy_id: academyId,
        coachName: coach?.name || '',
        coachEmail: coach?.email || '',
        coachPhone: coach?.phone || '',
        type: form.type.toUpperCase(),
        leaveType: form.type.toUpperCase(),
        startDate: form.startDate,
        endDate: form.endDate,
        reason: form.reason,
        status: 'PENDING',
        appliedDate: new Date().toISOString().split('T')[0],
      }).catch((wErr) => console.warn('[api] leave.apply workflow skip:', wErr));
      toast.success('Leave request submitted successfully');
      setModalOpen(false);
      setForm({ type: 'casual', startDate: '', endDate: '', reason: '' });
    } catch (err) {
      toast.error('Failed to submit leave: ' + err.message);
    }
  };

  const columns = [
    {
      accessorKey: 'type',
      header: 'Type',
      cell: ({ getValue }) => {
        const val = getValue();
        return <StatusPill status={val === 'casual' || val === 'CASUAL' ? 'Casual' : 'Sick'} />;
      },
    },
    {
      accessorKey: 'startDate',
      header: 'Dates',
      cell: ({ row }) => (
        <span className="text-sm text-ink">
          {formatDate(row.original.startDate)}
          {row.original.startDate !== row.original.endDate &&
            ` - ${formatDate(row.original.endDate)}`}
        </span>
      ),
    },
    {
      accessorKey: 'reason',
      header: 'Reason',
      cell: ({ getValue }) => (
        <span className="text-sm text-ink-muted truncate max-w-[200px] inline-block">
          {getValue() || '—'}
        </span>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ getValue }) => <StatusPill status={getValue()} />,
    },
    {
      accessorKey: 'appliedDate',
      header: 'Applied',
      cell: ({ getValue }) => (
        <span className="text-xs text-ink-muted">{formatDate(getValue())}</span>
      ),
    },
  ];

  const renderCard = (leave) => (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <StatusPill status={leave.type === 'casual' || leave.type === 'CASUAL' ? 'Casual' : 'Sick'} />
          <StatusPill status={leave.status} />
        </div>
        <span className="text-xs text-ink-faint">{formatDate(leave.appliedDate)}</span>
      </div>
      <p className="text-sm font-medium text-ink">
        {formatDate(leave.startDate)}
        {leave.startDate !== leave.endDate && ` - ${formatDate(leave.endDate)}`}
      </p>
      <p className="text-xs text-ink-muted truncate">{leave.reason || 'No reason provided'}</p>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <StatCard
          icon={Clock}
          label="Leave Balance"
          value={`${leaveStats.remaining}/${leaveStats.totalLeaves}`}
          sublabel={`${leaveStats.used} days used`}
        />
        <StatCard
          icon={AlertTriangle}
          label="Pending"
          value={leaveStats.pending}
          color="warn"
        />
      </div>

      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-ink">My Leave Requests</h3>
        <Button icon={Plus} onClick={() => setModalOpen(true)}>
          Apply Leave
        </Button>
      </div>

      <AdaptiveTable
        data={leaveRequests}
        columns={columns}
        renderCard={renderCard}
        searchPlaceholder="Search leave requests..."
        emptyTitle="No leaves taken so far"
        emptyDescription="You haven't requested or taken any leave so far. Click 'Apply Leave' above if you need to submit a request."
      />

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Apply Leave">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-ink-muted mb-1.5">Type</label>
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
              className="w-full h-[38px] px-3 rounded-lg border border-line bg-white text-[13px] text-ink outline-none focus:ring-2 focus:ring-brand/10 focus:border-brand"
            >
              <option value="casual">Casual</option>
              <option value="sick">Sick</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-ink-muted mb-1.5">Start Date *</label>
              <input
                type="date"
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                className="w-full h-[38px] px-3 rounded-lg border border-line bg-white text-[13px] text-ink outline-none focus:ring-2 focus:ring-brand/10 focus:border-brand"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-ink-muted mb-1.5">End Date *</label>
              <input
                type="date"
                value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                className="w-full h-[38px] px-3 rounded-lg border border-line bg-white text-[13px] text-ink outline-none focus:ring-2 focus:ring-brand/10 focus:border-brand"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-ink-muted mb-1.5">Reason *</label>
            <textarea
              value={form.reason}
              onChange={(e) => setForm({ ...form, reason: e.target.value })}
              placeholder="Describe the reason for leave..."
              rows={3}
              className="w-full px-3 py-2 rounded-lg border border-line bg-white text-sm text-ink outline-none focus:ring-2 focus:ring-brand/10 focus:border-brand resize-none"
            />
          </div>
          <div className="flex items-center gap-3 justify-end pt-2">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={handleApply}>Submit Request</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
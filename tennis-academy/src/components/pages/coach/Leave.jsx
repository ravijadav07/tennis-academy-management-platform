import { useState, useEffect, useCallback } from 'react';
import { Clock, AlertTriangle, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../../../utils/supabase';
import { useAuth } from '../../../context/AuthContext';
import { formatDate } from '../../../utils/formatters';
import { triggerWorkflow } from '../../../utils/api';
import AdaptiveTable from '../../data/AdaptiveTable';
import StatCard from '../../ui/StatCard';
import Button from '../../ui/Button';
import StatusPill from '../../ui/StatusPill';
import Modal from '../../ui/Modal';
import Skeleton from '../../ui/Skeleton';

const LEAVE_QUOTA = 24;

export default function Leave() {
  const { user } = useAuth();
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ type: 'casual', startDate: '', endDate: '', reason: '' });

  const fetchLeaves = useCallback(async () => {
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

      const { data: leaveRows, error } = await supabase
        .from('leave_requests')
        .select('id, type, start_date, end_date, reason, status, created_at')
        .eq('coach_id', coachId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const mapped = (leaveRows || []).map(l => ({
        id: l.id,
        type: l.type,
        startDate: l.start_date,
        endDate: l.end_date,
        reason: l.reason || '',
        status: l.status,
        appliedDate: l.created_at?.split('T')[0] || '',
      }));

      setLeaveRequests(mapped);
    } catch (err) {
      console.error('Failed to fetch leave requests:', err);
      toast.error('Failed to load leave requests');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { fetchLeaves(); }, [fetchLeaves]);

  const leaveStats = (() => {
    const used = leaveRequests.filter(l => l.status === 'approved').reduce((sum, l) => {
      const start = new Date(l.startDate);
      const end = new Date(l.endDate);
      return sum + Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
    }, 0);
    const pending = leaveRequests.filter(l => l.status === 'pending').length;
    return {
      totalLeaves: LEAVE_QUOTA,
      used,
      remaining: Math.max(0, LEAVE_QUOTA - used),
      pending,
    };
  })();

  const handleApply = async () => {
    if (!form.startDate || !form.endDate) {
      toast.error('Please select start and end dates');
      return;
    }
    const p = toast.loading('Submitting leave request...');
    try {
      await triggerWorkflow('leave.apply', {
        type: form.type,
        start_date: form.startDate,
        end_date: form.endDate,
        reason: form.reason,
      });
      toast.success('Leave request submitted successfully', { id: p });
      setModalOpen(false);
      setForm({ type: 'casual', startDate: '', endDate: '', reason: '' });
      fetchLeaves();
    } catch (err) {
      toast.error('Failed to submit leave: ' + err.message, { id: p });
    }
  };

  const columns = [
    {
      accessorKey: 'type',
      header: 'Type',
      cell: ({ getValue }) => {
        const val = getValue();
        return <StatusPill status={val === 'casual' ? 'Casual' : 'Sick'} />;
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
          {getValue()}
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
          <StatusPill status={leave.type === 'casual' ? 'Casual' : 'Sick'} />
          <StatusPill status={leave.status} />
        </div>
        <span className="text-xs text-ink-faint">{formatDate(leave.appliedDate)}</span>
      </div>
      <p className="text-sm font-medium text-ink">
        {formatDate(leave.startDate)}
        {leave.startDate !== leave.endDate && ` - ${formatDate(leave.endDate)}`}
      </p>
      <p className="text-xs text-ink-muted truncate">{leave.reason}</p>
    </div>
  );

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Skeleton.SkeletonCard />
          <Skeleton.SkeletonCard />
        </div>
        <Skeleton.SkeletonTable rows={3} />
      </div>
    );
  }

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
        <h3 className="text-sm font-semibold text-ink">Leave Requests</h3>
        <Button icon={Plus} onClick={() => setModalOpen(true)}>
          Apply Leave
        </Button>
      </div>

      <AdaptiveTable
        data={leaveRequests}
        columns={columns}
        renderCard={renderCard}
        searchPlaceholder="Search leave requests..."
        emptyMessage="No leave requests"
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
              <label className="block text-xs font-medium text-ink-muted mb-1.5">Start Date</label>
              <input
                type="date"
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                className="w-full h-[38px] px-3 rounded-lg border border-line bg-white text-[13px] text-ink outline-none focus:ring-2 focus:ring-brand/10 focus:border-brand"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-ink-muted mb-1.5">End Date</label>
              <input
                type="date"
                value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                className="w-full h-[38px] px-3 rounded-lg border border-line bg-white text-[13px] text-ink outline-none focus:ring-2 focus:ring-brand/10 focus:border-brand"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-ink-muted mb-1.5">Reason</label>
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
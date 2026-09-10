import { useState, useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import { useAuth } from '../../../context/AuthContext';
import { useSupabase } from '../../../context/SupabaseContext';
import AdaptiveTable from '../../data/AdaptiveTable';
import Button from '../../ui/Button';
import StatusPill from '../../ui/StatusPill';
import Modal from '../../ui/Modal';
import { Send, CalendarClock } from 'lucide-react';
import { formatTime12h } from '../../../utils/formatters';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function OneOnOne() {
  const { user } = useAuth();
  const { services, entity } = useSupabase();
  const coachId = user?.linkedCoachId;

  const [state, setState] = useState({ courts: [], privateSessions: [] });
  const [rescheduleTarget, setRescheduleTarget] = useState(null);
  const [rescheduleForm, setRescheduleForm] = useState({ day: '', startTime: '', endTime: '', location: '' });

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const entityOpt = entity === 'all' ? undefined : entity;
        const [courtsRes] = await Promise.all([
          services.courts.list({ entity: entityOpt, pageSize: 100 }),
        ]);
        if (active) {
          setState({ courts: courtsRes.data || [], privateSessions: [] });
        }
      } catch (err) {
        console.error('[OneOnOne] load error:', err);
      }
    }
    load();
    return () => { active = false; };
  }, [services, entity]);

  const sessions = useMemo(() => {
    if (!coachId) return [];
    return (state.privateSessions || [])
      .filter((s) => s.coachId === coachId)
      .map((s) => {
        const court = (state.courts || []).find((c) => c.id === s.courtId);
        return {
          id: s.id,
          student: s.clientName || s.studentName || 'Client',
          day: s.date || 'Today',
          startTime: s.startTime || '',
          endTime: s.endTime || '',
          time: `${formatTime12h(s.startTime || s.time)} - ${formatTime12h(s.endTime)}`,
          confirmation: s.status === 'COMPLETED' ? 'confirmed' : 'not_sent',
          location: court?.name || 'Court',
        };
      });
  }, [state.privateSessions, state.courts, coachId]);

  function handleSendConfirmation(session) {
    toast.success(`Confirmation notification sent to ${session.student}`);
  }

  function openReschedule(session) {
    setRescheduleTarget(session);
    setRescheduleForm({
      day: session.day,
      startTime: session.startTime || '',
      endTime: session.endTime || '',
      location: session.location || '',
    });
  }

  function handleReschedule() {
    if (!rescheduleTarget) return;
    toast.success(`Rescheduled 1-on-1 session for ${rescheduleTarget.student}`);
    setRescheduleTarget(null);
  }

  const columns = useMemo(() => [
    {
      accessorKey: 'student',
      header: 'Student / Client',
      cell: ({ getValue }) => (
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-brand-50 flex items-center justify-center text-brand text-xs font-semibold">
            {getValue().charAt(0)}
          </div>
          <span className="text-sm font-medium text-ink">{getValue()}</span>
        </div>
      ),
    },
    {
      accessorKey: 'day',
      header: 'Date / Day',
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
      accessorKey: 'confirmation',
      header: 'Confirmation',
      cell: ({ getValue }) => (
        <StatusPill status={getValue() || 'not_sent'} />
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            icon={Send}
            onClick={() => handleSendConfirmation(row.original)}
          >
            Notify
          </Button>
          <Button variant="ghost" size="sm" icon={CalendarClock} onClick={() => openReschedule(row.original)}>
            Reschedule
          </Button>
        </div>
      ),
    },
  ], []);

  const renderCard = (session) => (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-[34px] h-[34px] rounded-full bg-brand-50 flex items-center justify-center text-brand text-xs font-semibold">
            {session.student.charAt(0)}
          </div>
          <div>
            <p className="text-sm font-semibold text-ink">{session.student}</p>
            <p className="text-xs text-ink-muted">
              {session.day} &bull; {session.time}
            </p>
          </div>
        </div>
        <StatusPill status={session.confirmation || 'not_sent'} />
      </div>
      <div className="flex items-center gap-2">
        <Button variant="secondary" size="sm" icon={Send} className="flex-1" onClick={() => handleSendConfirmation(session)}>
          Notify
        </Button>
        <Button variant="ghost" size="sm" className="flex-1" icon={CalendarClock} onClick={() => openReschedule(session)}>
          Reschedule
        </Button>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      <AdaptiveTable
        data={sessions}
        columns={columns}
        renderCard={renderCard}
        searchPlaceholder="Search 1-on-1 sessions..."
        emptyMessage="No 1-on-1 sessions scheduled for you"
      />

      <Modal open={!!rescheduleTarget} onClose={() => setRescheduleTarget(null)} title="Reschedule Session">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-ink-muted mb-1.5">Day / Date</label>
            <select
              value={rescheduleForm.day}
              onChange={(e) => setRescheduleForm({ ...rescheduleForm, day: e.target.value })}
              className="w-full h-[38px] px-3 rounded-lg border border-line bg-white text-[13px] text-ink outline-none focus:ring-2 focus:ring-brand/10 focus:border-brand"
            >
              {DAYS.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-ink-muted mb-1.5">Start Time</label>
              <input
                type="time"
                value={rescheduleForm.startTime}
                onChange={(e) => setRescheduleForm({ ...rescheduleForm, startTime: e.target.value })}
                className="w-full h-[38px] px-3 rounded-lg border border-line bg-white text-[13px] text-ink outline-none focus:ring-2 focus:ring-brand/10 focus:border-brand"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-ink-muted mb-1.5">End Time</label>
              <input
                type="time"
                value={rescheduleForm.endTime}
                onChange={(e) => setRescheduleForm({ ...rescheduleForm, endTime: e.target.value })}
                className="w-full h-[38px] px-3 rounded-lg border border-line bg-white text-[13px] text-ink outline-none focus:ring-2 focus:ring-brand/10 focus:border-brand"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-ink-muted mb-1.5">Location</label>
            <input
              type="text"
              value={rescheduleForm.location}
              onChange={(e) => setRescheduleForm({ ...rescheduleForm, location: e.target.value })}
              placeholder="Court 1, Court 2, Gym"
              className="w-full h-[38px] px-3 rounded-lg border border-line bg-white text-[13px] text-ink outline-none focus:ring-2 focus:ring-brand/10 focus:border-brand"
            />
          </div>
          <div className="flex items-center gap-3 justify-end pt-2">
            <Button variant="secondary" onClick={() => setRescheduleTarget(null)}>Cancel</Button>
            <Button onClick={handleReschedule}>Reschedule</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
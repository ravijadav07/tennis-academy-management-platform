import { useState, useEffect, useMemo, useCallback } from 'react';
import { toast } from 'sonner';
import { supabase } from '../../../utils/supabase';
import { useAuth } from '../../../context/AuthContext';
import AdaptiveTable from '../../data/AdaptiveTable';
import Button from '../../ui/Button';
import StatusPill from '../../ui/StatusPill';
import Skeleton from '../../ui/Skeleton';
import Modal from '../../ui/Modal';
import { Send, CalendarClock } from 'lucide-react';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function OneOnOne() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rescheduleTarget, setRescheduleTarget] = useState(null);
  const [rescheduleForm, setRescheduleForm] = useState({ day: '', startTime: '', endTime: '', location: '' });

  const fetchSessions = useCallback(async () => {
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

      const { data: schedRows, error } = await supabase
        .from('schedule')
        .select('id, day, start_time, end_time, student_id, confirmation, location, students(name)')
        .eq('coach_id', coachId)
        .eq('type', 'one_on_one')
        .order('day', { ascending: true });

      if (error) throw error;

      const mapped = (schedRows || []).map(s => ({
        id: s.id,
        student: s.students?.name || 'Unknown',
        day: s.day,
        startTime: s.start_time?.substring(0, 5) || '',
        endTime: s.end_time?.substring(0, 5) || '',
        time: `${s.start_time?.substring(0, 5) || '--'} - ${s.end_time?.substring(0, 5) || '--'}`,
        confirmation: s.confirmation || 'not_sent',
        location: s.location,
      }));

      setSessions(mapped);
    } catch (err) {
      console.error('Failed to fetch 1-on-1 sessions:', err);
      toast.error('Failed to load 1-on-1 sessions');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { fetchSessions(); }, [fetchSessions]);

  async function handleSendConfirmation(session) {
    const p = toast.loading('Sending confirmation...');
    try {
      const { error } = await supabase
        .from('schedule')
        .update({ confirmation: 'sent_no_reply' })
        .eq('id', session.id);
      if (error) throw error;
      toast.success(`Confirmation sent to ${session.student}`, { id: p });
      fetchSessions();
    } catch (err) {
      toast.error('Failed to send confirmation: ' + err.message, { id: p });
    }
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

  async function handleReschedule() {
    if (!rescheduleTarget) return;
    if (!rescheduleForm.day || !rescheduleForm.startTime || !rescheduleForm.endTime) {
      toast.error('Please fill day, start time and end time');
      return;
    }
    const p = toast.loading('Rescheduling session...');
    try {
      const { error } = await supabase
        .from('schedule')
        .update({
          day: rescheduleForm.day,
          start_time: rescheduleForm.startTime,
          end_time: rescheduleForm.endTime,
          location: rescheduleForm.location,
          confirmation: 'not_sent',
        })
        .eq('id', rescheduleTarget.id);
      if (error) throw error;
      toast.success(`Rescheduled session for ${rescheduleTarget.student}`, { id: p });
      setRescheduleTarget(null);
      fetchSessions();
    } catch (err) {
      toast.error('Failed to reschedule: ' + err.message, { id: p });
    }
  }

  const columns = useMemo(() => [
    {
      accessorKey: 'student',
      header: 'Student',
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
      header: 'Day',
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
            icon={Send}
            onClick={() => handleSendConfirmation(row.original)}
          >
            Send Confirmation
          </Button>
          <Button variant="ghost" icon={CalendarClock} onClick={() => openReschedule(row.original)}>
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
        <Button variant="secondary" icon={Send} className="flex-1" onClick={() => handleSendConfirmation(session)}>
          Send Confirmation
        </Button>
        <Button variant="ghost" className="flex-1" icon={CalendarClock} onClick={() => openReschedule(session)}>
          Reschedule
        </Button>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton.SkeletonTable rows={4} />
      </div>
    );
  }

  return (
    <div className="space-y-4">

      <AdaptiveTable
        data={sessions}
        columns={columns}
        renderCard={renderCard}
        searchPlaceholder="Search sessions..."
        emptyMessage="No 1-on-1 sessions scheduled"
      />

      <Modal open={!!rescheduleTarget} onClose={() => setRescheduleTarget(null)} title="Reschedule Session">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-ink-muted mb-1.5">Day</label>
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
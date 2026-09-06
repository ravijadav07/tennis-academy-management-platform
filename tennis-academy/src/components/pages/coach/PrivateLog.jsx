import { useMemo, useState } from 'react';
import { useDb } from '../../../context/DbContext';
import { useAuth } from '../../../context/AuthContext';
import Card from '../../ui/Card';
import Button from '../../ui/Button';
import StatusPill from '../../ui/StatusPill';
import { toast } from 'sonner';
import { CheckCircle, Plus, Clock, MapPin, User } from 'lucide-react';
import TimePicker12h from '../../ui/TimePicker12h';
import { formatDateDDMMYY, formatTime12h } from '../../../utils/formatters';
import { validateName } from '../../../utils/validators';

function getToday() { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; }

export default function PrivateLog() {
  const { db, tick } = useDb();
  const { user } = useAuth();
  const state = useMemo(() => db.readAll(), [db, tick]);
  const today = getToday();
  const coachId = user?.linkedCoachId;
  const [showNew, setShowNew] = useState(false);
  const [newName, setNewName] = useState('');
  const [newTime, setNewTime] = useState('');
  const [newCourtId, setNewCourtId] = useState('');
  const [page, setPage] = useState(1);
  const [optimistic, setOptimistic] = useState(new Set());
  const PAGE_SIZE = 20;

  const courts = state.courts || [];
  const coach = state.coaches.find((c) => c.id === coachId);
  const allSessions = (state.privateSessions || [])
    .filter((s) => s.coachId === coachId)
    .sort((a, b) => (b.date + b.startTime).localeCompare(a.date + a.startTime));
  const todaySessions = allSessions.filter((s) => s.date === today);
  const total = allSessions.length;
  const paged = allSessions.slice(0, page * PAGE_SIZE);
  const hasMore = (page * PAGE_SIZE) < total;

  const handleComplete = async (sessionId) => {
    setOptimistic((prev) => new Set(prev).add(sessionId));
    try {
      await db.completePrivateSession({ sessionId, coachId, notes: '' });
      toast.success('Session marked as completed — pending verification');
    } catch (e) { toast.error(e.message); }
    setOptimistic((prev) => { const s = new Set(prev); s.delete(sessionId); return s; });
  };

  const handleCreate = async () => {
    const nameErr = validateName(newName, 'Client/Student name');
    if (nameErr) { toast.error(nameErr); return; }
    if (!newTime) { toast.error('Start time is required'); return; }
    try {
      await db.createPrivateSession({
        coachId,
        date: today,
        startTime: newTime,
        endTime: addHour(newTime),
        courtId: newCourtId || courts[0]?.id || '',
        clientName: newName.trim(),
        studentId: null,
        notes: '',
      });
      setShowNew(false); setNewName(''); setNewTime(''); setNewCourtId('');
      toast.success('Ad-hoc private session logged');
    } catch (e) { toast.error(e.message); }
  };

  if (!coachId) return <div className="p-4 text-sm text-ink-muted">No coach profile linked.</div>;

  return (
    <div className="space-y-4 max-w-lg mx-auto">
      {/* Header */}
      <div className="text-center space-y-1">
        <h3 className="text-lg font-bold text-ink">{today}</h3>
        <p className="text-xs text-ink-muted">
          {coach?.name} · {todaySessions.length} today · {total} total sessions
        </p>
      </div>

      <div className="flex justify-end">
        <Button size="sm" icon={Plus} onClick={() => setShowNew(true)}>New Session</Button>
      </div>

      {/* Today's Sessions — large Complete tap targets */}
      {todaySessions.length === 0 ? (
        <Card>
          <p className="text-center text-sm text-ink-muted py-4">No private sessions scheduled today.</p>
        </Card>
      ) : (
        todaySessions.map((s) => {
          const isOptimistic = optimistic.has(s.id);
          const isPending = s.status === 'PENDING_VERIFICATION';
          const isCompleted = s.status === 'COMPLETED';
          const courtName = (courts.find((c) => c.id === s.courtId) || {}).name || '';
          const done = isPending || isCompleted || isOptimistic;
          return (
            <Card key={s.id} className={done ? 'opacity-70' : ''}>
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-ink flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-ink-faint flex-shrink-0" />
                    {s.clientName || s.studentName || 'Unnamed'}
                  </p>
                  <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1 text-[11px] text-ink-muted">
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{formatTime12h(s.startTime)} - {formatTime12h(s.endTime)}</span>
                    {courtName && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{courtName}</span>}
                    <StatusPill status={s.clientType || 'MEMBER'} />
                  </div>
                </div>
                {done ? (
                  <StatusPill status={isCompleted ? 'completed' : 'pending'} />
                ) : (
                  <Button
                    size="sm"
                    icon={CheckCircle}
                    onClick={() => handleComplete(s.id)}
                    className="flex-shrink-0 !h-9 !px-4 !text-[12px]"
                  >
                    Complete
                  </Button>
                )}
              </div>
            </Card>
          );
        })
      )}

      {/* History — paginated, Load More */}
      {paged.filter((s) => s.date !== today).length > 0 && (
        <Card>
          <p className="text-xs font-semibold text-ink-muted uppercase tracking-wider mb-2">History</p>
          <div className="divide-y divide-line">
            {paged.filter((s) => s.date !== today).map((s) => (
              <div key={s.id} className="flex items-center gap-2 py-2 text-xs">
                <span className="font-medium text-ink truncate flex-1">{s.clientName || s.studentName || 'Unnamed'}</span>
                <span className="text-ink-faint flex-shrink-0">{formatDateDDMMYY(s.date)}</span>
                <span className="text-ink-faint flex-shrink-0">{formatTime12h(s.startTime)}</span>
                <StatusPill status={s.status === 'COMPLETED' ? 'completed' : 'pending'} />
              </div>
            ))}
          </div>

          {hasMore && (
            <Button variant="ghost" size="sm" onClick={() => setPage((p) => p + 1)} className="w-full mt-3">
              Load More ({total - page * PAGE_SIZE} remaining)
            </Button>
          )}
        </Card>
      )}

      {/* Ad-hoc New Session Modal */}
      {showNew && (
        <div className="fixed inset-0 z-[310] flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={() => setShowNew(false)}>
          <div className="bg-white rounded-2xl p-5 w-full max-w-sm m-4 shadow-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-base font-semibold text-ink mb-4">New Private Session</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-semibold text-ink-muted uppercase tracking-[0.04em] mb-1">Client / Student Name *</label>
                <input value={newName} onChange={(e) => setNewName(e.target.value)}
                  className="w-full h-[38px] px-3 rounded-lg border border-line text-[13px] outline-none focus:ring-2 focus:ring-brand/10 focus:border-brand" placeholder="Name" />
              </div>
              <div>
                <TimePicker12h label="Start Time *" value={newTime} onChange={setNewTime} />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-ink-muted uppercase tracking-[0.04em] mb-1">Court</label>
                <select value={newCourtId} onChange={(e) => setNewCourtId(e.target.value)}
                  className="w-full h-[38px] px-3 rounded-lg border border-line bg-white text-[13px] outline-none focus:ring-2 focus:ring-brand/10 focus:border-brand">
                  {courts.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="secondary" onClick={() => setShowNew(false)}>Cancel</Button>
                <Button onClick={handleCreate}>Log Session</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function addHour(time24) {
  const [h, m] = time24.split(':').map(Number);
  const total = h * 60 + m + 60;
  const nh = Math.floor(total / 60) % 24;
  return `${String(nh).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDb } from '../../../context/DbContext';
import { useAuth } from '../../../context/AuthContext';
import Card from '../../ui/Card';
import Button from '../../ui/Button';
import StatusPill from '../../ui/StatusPill';
import Modal from '../../ui/Modal';
import { toast } from 'sonner';
import { LogIn, LogOut, Clock, Coffee, MapPin, ChevronRight, CheckSquare } from 'lucide-react';
import { formatDateDDMMYY, formatTime12h } from '../../../utils/formatters';

function getToday() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function CoachToday() {
  const { db, tick } = useDb();
  const { user } = useAuth();
  const navigate = useNavigate();
  const state = useMemo(() => db.readAll(), [db, tick]);
  const today = getToday();
  const coachId = user?.linkedCoachId;
  const [showLeave, setShowLeave] = useState(false);
  const [showOT, setShowOT] = useState(false);
  const [otHours, setOtHours] = useState('1');

  const coachAtt = (state.coachAttendance || []).find((a) => a.coachId === coachId && a.date === today);
  const checkedIn = !!coachAtt?.checkIn;
  const batches = (state.batches || []).filter((b) => (b.primaryCoachId === coachId || b.supportCoachId === coachId) && b.status === 'ACTIVE');
  const privSessions = (state.privateSessions || []).filter((s) => s.coachId === coachId && s.date === today);

  const handleCheckIn = async () => {
    try {
      await db.coachCheckIn({ coachId, date: today, block: 'morning', time: new Date().toTimeString().slice(0, 5) });
      toast.success(checkedIn ? 'Checked out' : 'Checked in for today');
    } catch (e) {
      toast.error(e.message);
    }
  };

  const handleOT = async () => {
    const hrs = parseFloat(otHours);
    if (!hrs || hrs <= 0) { toast.error('Enter valid hours'); return; }
    try {
      await db.logOvertime({ coachId, date: today, hours: hrs, autoApproved: hrs < 2 });
      setShowOT(false);
      setOtHours('1');
      toast.success(`Overtime logged: ${hrs}h${hrs < 2 ? ' (auto-approved)' : ' (pending admin)'}`);
    } catch (e) {
      toast.error(e.message);
    }
  };

  const handleLeave = async () => {
    if (batches.length > 0) {
      toast('Leave requested with scheduled batches — admin will assign substitute coach.');
    }
    try {
      await db.applyLeave({ coachId, date: today, type: 'CASUAL' });
      setShowLeave(false);
      toast.success('Leave application submitted');
    } catch (e) {
      toast.error(e.message);
    }
  };

  return (
    <div className="space-y-4 max-w-lg mx-auto">
      {/* Check-In Card (Large Courtside Touch Targets) */}
      <Card>
        <div className="text-center space-y-3">
          <div className="flex items-center justify-center gap-2">
            <StatusPill status={checkedIn ? 'active' : 'inactive'} />
            <span className="text-xs font-semibold text-ink-muted uppercase tracking-wider">
              {checkedIn ? 'Coach Checked In' : 'Not Checked In'}
            </span>
          </div>
          <h3 className="text-xl font-bold text-ink tracking-tight">{formatDateDDMMYY(today)}</h3>
          <p className="text-xs text-ink-faint">Coach: {user?.name || 'Coach'}</p>
          <Button
            onClick={handleCheckIn}
            icon={checkedIn ? LogOut : LogIn}
            className="w-full justify-center !h-12 !text-base font-semibold shadow-sm"
          >
            {checkedIn ? 'Check Out' : 'Check In for Session'}
          </Button>
        </div>
      </Card>

      {/* Today's Schedule (Tap through to session roster) */}
      <Card>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-ink">My Batches ({batches.length})</h3>
          <span className="text-[11px] text-ink-faint">Tap to mark attendance</span>
        </div>

        {batches.length === 0 ? (
          <p className="text-xs text-ink-faint py-3 text-center">No batches assigned to you today.</p>
        ) : (
          <div className="space-y-2">
            {batches.map((b) => {
              const court = (state.courts || []).find((c) => c.id === b.courtId);
              const isSupport = b.supportCoachId === coachId;
              const primaryCoach = (state.coaches || []).find((c) => c.id === b.primaryCoachId);
              return (
                <div
                  key={b.id}
                  onClick={() => navigate(`/coach/attendance?batchId=${b.id}`)}
                  className="flex items-center justify-between p-3 rounded-xl bg-canvas-soft hover:bg-canvas-soft/80 border border-line/60 cursor-pointer active:scale-[0.99] transition-all group"
                >
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm text-ink group-hover:text-brand transition-colors">
                        {b.program} {b.dayPattern}
                      </span>
                      {b.ballLevel && <span className="text-brand-600 text-xs font-medium">{b.ballLevel}</span>}
                      {isSupport && <span className="px-1.5 py-0.5 rounded text-[10px] bg-brand-50 text-brand-600 font-medium">Support Coach</span>}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-ink-muted flex-wrap">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-ink-faint" />
                        {formatTime12h(b.startTime)} - {formatTime12h(b.endTime)}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-ink-faint" />
                        {court?.name || 'Court —'}
                      </span>
                      {isSupport && primaryCoach && (
                        <span className="text-ink-faint text-[11px]">Primary: {primaryCoach.name}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 text-brand font-medium text-xs shrink-0 pl-2">
                    <CheckSquare className="w-4 h-4" />
                    <ChevronRight className="w-4 h-4 text-ink-faint group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Private Sessions */}
      <Card>
        <h3 className="text-sm font-semibold text-ink mb-3">Private Sessions ({privSessions.length})</h3>
        {privSessions.length === 0 ? (
          <p className="text-xs text-ink-faint py-3 text-center">No private sessions scheduled today.</p>
        ) : (
          <div className="space-y-1.5">
            {privSessions.map((s) => (
              <div key={s.id} className="flex items-center justify-between px-3 py-2 rounded-lg bg-canvas-soft text-xs border border-line/40">
                <div className="space-y-0.5">
                  <p className="font-medium text-ink">{s.clientName || 'Private Client'}</p>
                  <p className="text-ink-faint">{formatTime12h(s.startTime || s.time)} - {formatTime12h(s.endTime)}</p>
                </div>
                <StatusPill status={s.status || 'confirmed'} />
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Overtime & Leave Actions */}
      <div className="flex gap-2.5">
        <Button variant="secondary" icon={Clock} onClick={() => setShowOT(true)} className="flex-1 !h-11">
          Log Overtime
        </Button>
        <Button variant="secondary" icon={Coffee} onClick={() => setShowLeave(true)} className="flex-1 !h-11">
          Apply Leave
        </Button>
      </div>

      {/* Overtime Modal */}
      <Modal open={showOT} onClose={() => setShowOT(false)} title="Log Overtime" size="sm">
        <div className="space-y-3">
          <label className="block text-xs font-medium text-ink-muted">Hours</label>
          <input
            type="number"
            value={otHours}
            onChange={(e) => setOtHours(e.target.value)}
            min="0.5"
            max="12"
            step="0.5"
            className="w-full h-[38px] px-3 rounded-lg border border-line text-[13px] outline-none focus:ring-2 focus:ring-brand/10"
          />
          <p className="text-[10px] text-ink-faint">OT under 2 hours is auto-approved. 2+ hours requires admin approval.</p>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowOT(false)}>Cancel</Button>
            <Button onClick={handleOT}>Log Overtime</Button>
          </div>
        </div>
      </Modal>

      {/* Leave Modal */}
      <Modal open={showLeave} onClose={() => setShowLeave(false)} title="Apply Leave" size="sm">
        <div className="space-y-3">
          <p className="text-xs text-ink-muted">Apply leave for {formatDateDDMMYY(today)}. Substitute coaches will be assigned for your batches.</p>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowLeave(false)}>Cancel</Button>
            <Button onClick={handleLeave}>Confirm Leave</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
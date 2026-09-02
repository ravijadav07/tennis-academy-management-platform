import { useMemo, useState } from 'react';
import { useDb } from '../../../context/DbContext';
import { useAuth } from '../../../context/AuthContext';
import Card from '../../ui/Card';
import Button from '../../ui/Button';
import StatusPill from '../../ui/StatusPill';
import Modal from '../../ui/Modal';
import { toast } from 'sonner';
import { LogIn, LogOut, Clock, Coffee } from 'lucide-react';

function getToday() { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; }

export default function CoachToday() {
  const { db, tick } = useDb();
  const { user } = useAuth();
  const state = useMemo(() => db.readAll(), [db, tick]);
  const today = getToday();
  const coachId = user?.linkedCoachId;
  const [showLeave, setShowLeave] = useState(false);
  const [showOT, setShowOT] = useState(false);
  const [otHours, setOtHours] = useState('1');

  const coachAtt = (state.coachAttendance || []).find((a) => a.coachId === coachId && a.date === today);
  const checkedIn = !!coachAtt?.checkIn;
  const batches = state.batches.filter((b) => b.primaryCoachId === coachId || b.supportCoachId === coachId);
  const privSessions = (state.privateSessions || []).filter((s) => s.coachId === coachId && s.date === today);

  const handleCheckIn = async () => {
    try {
      await db.coachCheckIn({ coachId, date: today, block: 'morning', time: new Date().toTimeString().slice(0, 5) });
      toast.success(checkedIn ? 'Checked out' : 'Checked in');
    } catch (e) { toast.error(e.message); }
  };

  const handleOT = async () => {
    const hrs = parseFloat(otHours);
    if (!hrs || hrs <= 0) { toast.error('Enter valid hours'); return; }
    try {
      await db.logOvertime({ coachId, date: today, hours: hrs, autoApproved: hrs < 2 });
      setShowOT(false); setOtHours('1');
      toast.success(`Overtime logged: ${hrs}h${hrs < 2 ? ' (auto-approved)' : ' (pending admin)'}`);
    } catch (e) { toast.error(e.message); }
  };

  const handleLeave = async () => {
    if (batches.length > 0) {
      toast('Leave with scheduled batches — substitute assignment needed.');
    }
    try {
      await db.applyLeave({ coachId, date: today, type: 'CASUAL' });
      setShowLeave(false);
      toast.success('Leave applied');
    } catch (e) { toast.error(e.message); }
  };

  return (
    <div className="space-y-4 max-w-lg mx-auto">
      <Card>
        <div className="text-center space-y-3">
          <StatusPill status={checkedIn ? 'active' : 'inactive'} />
          <h3 className="text-lg font-bold text-ink">{today}</h3>
          <Button onClick={handleCheckIn} icon={checkedIn ? LogOut : LogIn} className="w-full justify-center !h-12 !text-base">
            {checkedIn ? 'Check Out' : 'Check In'}
          </Button>
        </div>
      </Card>

      <Card>
        <h3 className="text-sm font-semibold text-ink mb-3">Today's Schedule</h3>
        {batches.map((b) => (
          <div key={b.id} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-canvas-soft text-xs mb-1">
            <span className="font-semibold">{b.program} {b.dayPattern}</span>
            <span className="text-ink-muted">{b.startTime} - {b.endTime}</span>
          </div>
        ))}
      </Card>

      <Card>
        <h3 className="text-sm font-semibold text-ink mb-3">Private Sessions ({privSessions.length})</h3>
        {privSessions.map((s) => (
          <div key={s.id} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-canvas-soft text-xs mb-1">
            <StatusPill status={s.status} />
            <span>{s.startTime || s.time}</span>
          </div>
        ))}
      </Card>

      <div className="flex gap-2">
        <Button variant="secondary" icon={Clock} onClick={() => setShowOT(true)} className="flex-1">Log OT</Button>
        <Button variant="secondary" icon={Coffee} onClick={() => setShowLeave(true)} className="flex-1">Apply Leave</Button>
      </div>

      <Modal open={showOT} onClose={() => setShowOT(false)} title="Log Overtime" size="sm">
        <div className="space-y-3">
          <label className="block text-xs font-medium text-ink-muted">Hours</label>
          <input type="number" value={otHours} onChange={(e) => setOtHours(e.target.value)} min="0.5" max="12" step="0.5"
            className="w-full h-[38px] px-3 rounded-lg border border-line text-[13px]" />
          <p className="text-[10px] text-ink-faint">OT under 2 hours is auto-approved. 2+ hours requires admin approval.</p>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowOT(false)}>Cancel</Button>
            <Button onClick={handleOT}>Log Overtime</Button>
          </div>
        </div>
      </Modal>

      <Modal open={showLeave} onClose={() => setShowLeave(false)} title="Apply Leave" size="sm">
        <div className="space-y-3">
          <p className="text-xs text-ink-muted">Apply leave for {today}. Batches unaffected will remain on schedule.</p>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowLeave(false)}>Cancel</Button>
            <Button onClick={handleLeave}>Confirm Leave</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
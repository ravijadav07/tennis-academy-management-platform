import { useMemo, useState, useCallback } from 'react';
import { useDb } from '../../../context/DbContext';
import { getEligibility } from '../../../mocks/rules';
import Card from '../../ui/Card';
import StatusPill from '../../ui/StatusPill';
import Button from '../../ui/Button';
import Modal from '../../ui/Modal';
import EligibilityStatusPill from '../../ui/EligibilityStatusPill';
import Dropdown from '../../ui/Dropdown';
import { CheckSquare, Printer, Loader2, UserPlus } from 'lucide-react';
import { toast } from 'sonner';

const FIELD = 'w-full h-[38px] px-3 rounded-lg border border-line bg-white text-[13px] text-ink outline-none focus:ring-2 focus:ring-brand/10 focus:border-brand transition-all';
const LBL = 'block text-[10px] font-semibold text-ink-muted uppercase tracking-[0.04em] mb-1';

function getToday() { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0'); }

export default function AdminAttendance() {
  const { db, tick } = useDb();
  const state = useMemo(() => db.readAll(), [db, tick]);
  const today = getToday();
  const [selectedBatchId, setSelectedBatchId] = useState(state.batches[0] && state.batches[0].id || '');
  const [selectedDate, setSelectedDate] = useState(today);
  const [showPrint, setShowPrint] = useState(false);
  const [optimistic, setOptimistic] = useState({});
  const [pending, setPending] = useState(new Set());

  // Add Student modal state
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [addMode, setAddMode] = useState('existing'); // 'existing' | 'trial'
  const [addStudentId, setAddStudentId] = useState('');
  const [trialName, setTrialName] = useState('');
  const [trialPhone, setTrialPhone] = useState('');

  const batch = state.batches.find((b) => b.id === selectedBatchId);
  const roster = useMemo(() => {
    if (!batch) return [];
    const marked = state.attendance.filter((a) => a.batchId === selectedBatchId && a.date === selectedDate);
    return state.enrollments
      .filter((e) => e.batchId === selectedBatchId && e.status === 'ACTIVE')
      .map((e) => {
        const student = state.students.find((s) => s.id === e.studentId);
        const pkg = state.packages.find((p) => p.studentId === e.studentId);
        const att = marked.find((a) => a.studentId === e.studentId);
        const elig = getEligibility(pkg, selectedDate);
        const key = e.studentId + '|' + selectedBatchId + '|' + selectedDate;
        const optStatus = optimistic[key];
        return { studentId: e.studentId, name: student && student.name || 'Unknown', program: e.billingProgram, eligibility: elig, package: pkg, attendance: att, blocked: !elig.markable, optStatus };
      });
  }, [state, batch, selectedBatchId, selectedDate, optimistic]);

  // Students NOT in this batch (for out-of-schedule)
  const otherStudents = state.students.filter((s) => s.status === 'ACTIVE' && !roster.some((r) => r.studentId === s.id));

  const markAll = async (status) => {
    const entries = roster.filter((r) => !r.blocked).map((r) => ({ studentId: r.studentId, status }));
    if (entries.length === 0) { toast.error('No markable students'); return; }
    const opt = { ...optimistic };
    entries.forEach((e) => { opt[e.studentId + '|' + selectedBatchId + '|' + selectedDate] = status; });
    setOptimistic(opt);
    setPending(new Set(entries.map((e) => e.studentId)));
    try {
      await db.markAttendance({ batchId: selectedBatchId, date: selectedDate, entries, markedBy: 'admin', markedByRole: 'ADMIN', source: 'ADMIN' });
      entries.forEach((e) => toast.success('Marked ' + (roster.find((r) => r.studentId === e.studentId) || {}).name + ' as ' + status, { duration: 2000 }));
      setOptimistic({}); setPending(new Set());
    } catch (e) { setOptimistic({}); setPending(new Set()); toast.error(e.message || 'Failed'); }
  };

  const toggleStudent = useCallback(async (entry) => {
    if (entry.blocked && !entry.attendance) { toast.error('Not markable: ' + entry.eligibility.reason); return; }
    const nextStatus = entry.attendance && entry.attendance.status === 'PRESENT' ? 'ABSENT' : entry.attendance && entry.attendance.status === 'ABSENT' ? 'PRESENT' : 'PRESENT';
    const key = entry.studentId + '|' + selectedBatchId + '|' + selectedDate;
    setOptimistic((prev) => ({ ...prev, [key]: nextStatus }));
    setPending((prev) => new Set(prev).add(entry.studentId));
    try {
      await db.markAttendance({ batchId: selectedBatchId, date: selectedDate, entries: [{ studentId: entry.studentId, status: nextStatus }], markedBy: 'admin', markedByRole: 'ADMIN', source: 'ADMIN' });
      toast.success(entry.name + ' \u2192 ' + nextStatus, { duration: 2000 });
      setOptimistic((prev) => { const n = { ...prev }; delete n[key]; return n; });
      setPending((prev) => { const s = new Set(prev); s.delete(entry.studentId); return s; });
    } catch (e) {
      setOptimistic((prev) => { const n = { ...prev }; delete n[key]; return n; });
      setPending((prev) => { const s = new Set(prev); s.delete(entry.studentId); return s; });
      toast.error(e.message);
    }
  }, [optimistic, selectedBatchId, selectedDate, db]);

  const handleAddExisting = async () => {
    if (!addStudentId) { toast.error('Select a student'); return; }
    const stu = otherStudents.find((s) => s.id === addStudentId);
    try {
      await db.markAttendance({ batchId: selectedBatchId, date: selectedDate, entries: [{ studentId: addStudentId, status: 'PRESENT' }], markedBy: 'admin', markedByRole: 'ADMIN', source: 'ADMIN' });
      toast.success((stu ? stu.name : 'Student') + ' added to attendance (out-of-schedule)');
      setShowAddStudent(false); setAddStudentId(''); setAddMode('existing');
    } catch (e) { toast.error(e.message); }
  };

  const handleAddTrial = async () => {
    if (!trialName.trim()) { toast.error('Name is required'); return; }
    try {
      await db.createTrialStudent({ name: trialName, guardianPhone: trialPhone, batchId: selectedBatchId, date: selectedDate });
      toast.success('Trial student ' + trialName + ' logged and marked present');
      setShowAddStudent(false); setTrialName(''); setTrialPhone(''); setAddMode('existing');
    } catch (e) { toast.error(e.message); }
  };

  const presentCount = roster.filter((r) => (r.optStatus || (r.attendance && r.attendance.status)) === 'PRESENT').length;
  const absentCount = roster.filter((r) => (r.optStatus || (r.attendance && r.attendance.status)) === 'ABSENT').length;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <Dropdown
          className="w-72 flex-shrink-0"
          value={selectedBatchId}
          onChange={(v) => setSelectedBatchId(typeof v === 'object' ? (v.value || v) : v)}
          placeholder="Select batch..."
          options={state.batches.filter((b) => b.status === 'ACTIVE').map((b) => ({ value: b.id, label: b.program + ' ' + b.dayPattern + ' (' + b.startTime + ')' }))}
          getOptionLabel={(o) => (o && o.label) || ''}
          getOptionValue={(o) => (o && o.value) || ''}
        />
        <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className={FIELD} style={{ width: 'auto' }} />
        <div className="flex gap-2">
          <Button size="sm" icon={CheckSquare} onClick={() => markAll('PRESENT')}>All Present</Button>
          <Button size="sm" variant="secondary" onClick={() => markAll('ABSENT')}>All Absent</Button>
          <Button size="sm" variant="ghost" icon={Printer} onClick={() => setShowPrint(true)}>Print</Button>
          <Button size="sm" variant="secondary" icon={UserPlus} onClick={() => setShowAddStudent(true)}>Add Student</Button>
        </div>
        <span className="text-[11px] text-ink-muted ml-auto">
          <span className="text-ok font-semibold">{presentCount} present</span>
          {' \u00b7 '}
          <span className="text-err font-semibold">{absentCount} absent</span>
          {' \u00b7 '}
          {roster.length} total
        </span>
      </div>

      {batch && (
        <Card>
          <h3 className="text-sm font-semibold text-ink mb-3">{batch.program} {batch.dayPattern} {'\u2014'} {selectedDate}</h3>
          <div className="space-y-1">
            {roster.map((r) => {
              const displayStatus = r.optStatus || (r.attendance && r.attendance.status);
              const isPending = pending.has(r.studentId);
              return (
                <div key={r.studentId} onClick={() => toggleStudent(r)}
                  className={'flex items-center gap-3 px-3 py-2 rounded-lg text-xs transition-colors ' +
                    (r.blocked ? 'bg-err-bg/20 opacity-50 cursor-not-allowed' : displayStatus === 'PRESENT' ? 'bg-ok-bg/30 cursor-pointer' : displayStatus === 'ABSENT' ? 'bg-err-bg/30 cursor-pointer' : 'bg-canvas-soft hover:bg-canvas-soft/50 cursor-pointer')}>
                  <span className="font-semibold text-ink">{r.name}</span>
                  <StatusPill status={r.program} />
                  {displayStatus ? <StatusPill status={displayStatus} /> : <span className="text-ink-faint">{'\u2014'}</span>}
                  {r.blocked && <EligibilityStatusPill package={r.package} date={selectedDate} />}
                  {isPending && <Loader2 className="w-3 h-3 animate-spin text-brand" />}
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {showPrint && (
        <Modal open={showPrint} onClose={() => setShowPrint(false)} title="Printable Roster" size="lg">
          <div className="print-only">
            <h3 className="text-lg font-bold mb-2">{batch && batch.program} {'\u2014'} {selectedDate}</h3>
            <table className="w-full text-sm border-collapse"><thead><tr className="border-b"><th className="text-left py-1">Student</th><th className="text-left py-1">Status</th><th className="text-left py-1">Notes</th></tr></thead>
              <tbody>{roster.map((r) => (<tr key={r.studentId} className="border-b"><td className="py-1">{r.name}</td><td className="py-1">{r.attendance ? r.attendance.status : '\u2014'}</td><td className="py-1">{r.attendance && r.attendance.notes || ''}</td></tr>))}</tbody></table>
          </div>
          <div className="flex justify-end mt-4"><Button onClick={() => window.print()}>Print</Button></div>
        </Modal>
      )}

      {/* Add Student Modal */}
      <Modal open={showAddStudent} onClose={() => { setShowAddStudent(false); setAddMode('existing'); }} title="Add Student to Attendance" size="md">
        <div className="space-y-4">
          <div className="flex gap-2">
            <button onClick={() => setAddMode('existing')} className={'px-4 py-1.5 rounded-full text-xs font-semibold transition-colors ' + (addMode === 'existing' ? 'bg-brand-50 text-brand-600' : 'text-ink-muted hover:bg-canvas-soft')}>
              Existing Student
            </button>
            <button onClick={() => setAddMode('trial')} className={'px-4 py-1.5 rounded-full text-xs font-semibold transition-colors ' + (addMode === 'trial' ? 'bg-brand-50 text-brand-600' : 'text-ink-muted hover:bg-canvas-soft')}>
              New / Trial
            </button>
          </div>

          {addMode === 'existing' ? (
            <div className="space-y-3">
              <p className="text-xs text-ink-muted">Pick a student not normally in this batch for out-of-schedule attendance.</p>
              <div className="space-y-1">
                <label className={LBL}>Student</label>
                <Dropdown
                  value={addStudentId}
                  onChange={(v) => setAddStudentId(typeof v === 'object' ? (v.value || v) : v)}
                  placeholder="Select student..."
                  options={otherStudents.map((s) => ({ value: s.id, label: s.name + (s.isGuest ? ' (Guest)' : '') }))}
                  getOptionLabel={(o) => (o && o.label) || ''}
                  getOptionValue={(o) => (o && o.value) || ''}
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="secondary" onClick={() => setShowAddStudent(false)}>Cancel</Button>
                <Button onClick={handleAddExisting} disabled={!addStudentId}>Add to Session</Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-xs text-ink-muted">Create a lightweight trial student record and mark them present for this session. No full enrollment required.</p>
              <div className="space-y-1">
                <label className={LBL}>Name *</label>
                <input value={trialName} onChange={(e) => setTrialName(e.target.value)} className={FIELD} placeholder="Student name" />
              </div>
              <div className="space-y-1">
                <label className={LBL}>Guardian Phone</label>
                <input value={trialPhone} onChange={(e) => setTrialPhone(e.target.value)} className={FIELD} placeholder="Phone number" />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="secondary" onClick={() => setShowAddStudent(false)}>Cancel</Button>
                <Button onClick={handleAddTrial} disabled={!trialName.trim()}>Log Trial Student</Button>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
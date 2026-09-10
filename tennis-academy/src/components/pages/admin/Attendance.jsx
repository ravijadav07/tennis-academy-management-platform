import { useMemo, useState, useCallback, useEffect } from 'react';
import { useSupabase } from '../../../context/SupabaseContext';
import { getEligibility } from '../../../mocks/rules';
import { db } from '../../../mocks/localDb';
import Card from '../../ui/Card';
import StatusPill from '../../ui/StatusPill';
import Button from '../../ui/Button';
import Modal from '../../ui/Modal';
import EligibilityStatusPill from '../../ui/EligibilityStatusPill';
import Dropdown from '../../ui/Dropdown';
import { CheckSquare, Printer, Loader2, UserPlus, FileText, ShieldCheck, Mail } from 'lucide-react';
import { formatDateDDMMYY, formatTime12h, getBatchDisplayName } from '../../../utils/formatters';
import { prepareAbsenceEmail, getNotificationWindow } from '../../../utils/notificationEngine';
import { triggerWorkflow } from '../../../utils/api';
import { toast } from 'sonner';
import { validateName, validatePhone } from '../../../utils/validators';
import { useAuth } from '../../../context/AuthContext';

const FIELD = 'w-full h-[38px] px-3 rounded-lg border border-line bg-white text-[13px] text-ink outline-none focus:ring-2 focus:ring-brand/10 focus:border-brand transition-all';
const LBL = 'block text-[10px] font-semibold text-ink-muted uppercase tracking-[0.04em] mb-1';

function getToday() { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0'); }

export default function AdminAttendance() {
  const { services, entity } = useSupabase();
  const { user } = useAuth();

  const [data, setData] = useState({
    batches: [],
    courts: [],
    students: [],
    enrollments: [],
    packages: [],
    attendance: [],
  });
  const [loading, setLoading] = useState(true);

  const today = getToday();
  const isAdmin = user?.role === 'admin' || user?.role === 'ops_head';
  const [selectedBatchId, setSelectedBatchId] = useState('');
  const [selectedDate, setSelectedDate] = useState(today);
  const [showPrint, setShowPrint] = useState(false);
  const [optimistic, setOptimistic] = useState({});
  const [pending, setPending] = useState(new Set());

  const [showAddStudent, setShowAddStudent] = useState(false);
  const [addMode, setAddMode] = useState('existing');
  const [addStudentId, setAddStudentId] = useState('');
  const [trialName, setTrialName] = useState('');
  const [trialPhone, setTrialPhone] = useState('');
  const [sessionRemark, setSessionRemark] = useState('');
  const [sessionRemarkSaved, setSessionRemarkSaved] = useState(false);

  const handleSaveRemark = useCallback(() => {
    setSessionRemarkSaved(true);
    toast.success('Session remark saved successfully');
    setTimeout(() => setSessionRemarkSaved(false), 3000);
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const entityOpt = entity === 'all' ? undefined : entity;
      const [batchesRes, courtsRes, studentsRes, enrollmentsRes, packagesRes, attendanceRes] = await Promise.all([
        services.batches.list({ entity: entityOpt, pageSize: 500 }),
        services.courts.list({ entity: entityOpt, pageSize: 100 }),
        services.students.list({ entity: entityOpt, pageSize: 1000 }),
        services.enrollments.list({ entity: entityOpt, pageSize: 1000 }),
        services.packages.list({ entity: entityOpt, pageSize: 1000 }),
        services.attendance.list({ entity: entityOpt, date: selectedDate, pageSize: 1000 }),
      ]);

      const bList = batchesRes.data || [];
      setData({
        batches: bList,
        courts: courtsRes.data || [],
        students: studentsRes.data || [],
        enrollments: enrollmentsRes.data || [],
        packages: packagesRes.data || [],
        attendance: attendanceRes.data || [],
      });

      if (!selectedBatchId && bList.length > 0) {
        setSelectedBatchId(bList[0].id);
      }
    } catch (err) {
      console.warn('[AdminAttendance] Supabase load issue, using localDb fallback:', err?.message || err);
      try {
        const local = db.readAll();
        const bList = local.batches || [];
        setData({
          batches: bList,
          courts: local.courts || [],
          students: local.students || [],
          enrollments: local.enrollments || [],
          packages: local.packages || [],
          attendance: local.attendance || [],
        });
        if (!selectedBatchId && bList.length > 0) {
          setSelectedBatchId(bList[0].id);
        }
      } catch (fallbackErr) {
        console.error('[AdminAttendance] Fallback error:', fallbackErr);
      }
    } finally {
      setLoading(false);
    }
  }, [services, entity, selectedDate, selectedBatchId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const [correctionRequests, setCorrectionRequests] = useState([]);
  const [showCorrectionReason, setShowCorrectionReason] = useState(false);
  const [correctionTarget, setCorrectionTarget] = useState(null);
  const [correctionReason, setCorrectionReason] = useState('');
  const [notifiedAbsences, setNotifiedAbsences] = useState(new Set());

  const batch = useMemo(() => data.batches.find((b) => b.id === selectedBatchId), [data.batches, selectedBatchId]);

  const roster = useMemo(() => {
    if (!batch) return [];
    const marked = data.attendance.filter((a) => a.batchId === selectedBatchId && a.date === selectedDate);
    return data.enrollments
      .filter((e) => e.batchId === selectedBatchId && (e.status === 'ACTIVE' || e.status === 'active'))
      .map((e) => {
        const student = (data.students || []).find((s) => String(s.id).trim() === String(e.studentId).trim());
        const pkg = (data.packages || []).find((p) => String(p.studentId).trim() === String(e.studentId).trim());
        const att = marked.find((a) => String(a.studentId).trim() === String(e.studentId).trim());
        const elig = getEligibility(pkg, selectedDate);
        const key = e.studentId + '|' + selectedBatchId + '|' + selectedDate;
        const optStatus = optimistic[key];
        return {
          studentId: e.studentId,
          name: student?.name || student?.fullName || student?.full_name || student?.studentName || 'Unknown',
          program: e.billingProgram || e.program,
          membershipType: student?.membershipType || 'Member',
          eligibility: elig,
          package: pkg,
          attendance: att,
          blocked: !elig.markable,
          optStatus,
          latestNote: student?.remarks || '',
        };
      });
  }, [data, batch, selectedBatchId, selectedDate, optimistic]);

  const otherStudents = useMemo(() => data.students.filter((s) => (s.status === 'ACTIVE' || s.status === 'active') && !roster.some((r) => r.studentId === s.id)), [data.students, roster]);

  const markAll = async (status) => {
    const entries = roster.filter((r) => !r.blocked).map((r) => ({ studentId: r.studentId, status }));
    if (entries.length === 0) { toast.error('No markable students'); return; }
    const opt = { ...optimistic };
    entries.forEach((e) => { opt[e.studentId + '|' + selectedBatchId + '|' + selectedDate] = status; });
    setOptimistic(opt);
    setPending(new Set(entries.map((e) => e.studentId)));
    try {
      await Promise.all(
        entries.map(e => services.attendance.markAttendance({
          studentId: e.studentId,
          batchId: selectedBatchId,
          date: selectedDate,
          status,
          markedBy: 'admin',
        }))
      );
      toast.success('Marked all students as ' + status);
      setOptimistic({}); setPending(new Set());
      loadData();
    } catch (e) { setOptimistic({}); setPending(new Set()); toast.error(e.message || 'Failed'); }
  };

  const isPastDate = selectedDate < today;

  const handleToggleOrRequest = useCallback(async (entry) => {
    if (entry.blocked && !entry.attendance) { toast.error('Not markable: ' + entry.eligibility.reason); return; }
    const nextStatus = entry.attendance && (entry.attendance.status === 'PRESENT' || entry.attendance.status === 'present') ? 'ABSENT' : 'PRESENT';

    const key = entry.studentId + '|' + selectedBatchId + '|' + selectedDate;
    setOptimistic((prev) => ({ ...prev, [key]: nextStatus }));
    setPending((prev) => new Set(prev).add(entry.studentId));
    try {
      await services.attendance.markAttendance({
        studentId: entry.studentId,
        batchId: selectedBatchId,
        date: selectedDate,
        status: nextStatus,
        markedBy: isAdmin ? 'admin' : 'coach',
      });
      toast.success(entry.name + ' \u2192 ' + nextStatus, { duration: 2000 });
      setOptimistic((prev) => { const n = { ...prev }; delete n[key]; return n; });
      setPending((prev) => { const s = new Set(prev); s.delete(entry.studentId); return s; });
      loadData();
    } catch (e) {
      setOptimistic((prev) => { const n = { ...prev }; delete n[key]; return n; });
      setPending((prev) => { const s = new Set(prev); s.delete(entry.studentId); return s; });
      toast.error(e.message);
    }
  }, [optimistic, selectedBatchId, selectedDate, services, isAdmin, loadData]);

  const handleAddExisting = async () => {
    if (!addStudentId) { toast.error('Select a student'); return; }
    const stu = otherStudents.find((s) => s.id === addStudentId);
    try {
      await db.markExemption({ batchId: selectedBatchId, date: selectedDate, studentId: addStudentId, status: 'PRESENT', markedByRole: 'ADMIN' });
      toast.success((stu ? stu.name : 'Student') + ' added to attendance (out-of-schedule)');
      setShowAddStudent(false); setAddStudentId(''); setAddMode('existing');
    } catch (e) { toast.error(e.message); }
  };

  const handleAddTrial = async () => {
    const nameErr = validateName(trialName, 'Trial student name'); if (nameErr) { toast.error(nameErr); return; }
    if (trialPhone && trialPhone.trim()) {
      const phoneErr = validatePhone(trialPhone); if (phoneErr) { toast.error(phoneErr); return; }
    }
    try {
      await db.createTrialStudent({ name: trialName, guardianPhone: trialPhone, batchId: selectedBatchId, date: selectedDate });
      toast.success('Trial student ' + trialName + ' logged and marked present');
      setShowAddStudent(false); setTrialName(''); setTrialPhone(''); setAddMode('existing');
    } catch (e) { toast.error(e.message); }
  };

  // Load correction requests for admin
  useEffect(() => {
    if (isAdmin) { db.getCorrectionRequests().then(setCorrectionRequests); }
  }, [isAdmin]);

  const handleRequestCorrection = async () => {
    if (!correctionReason.trim()) { toast.error('Reason is required'); return; }
    const { studentId, attendance } = correctionTarget;
    try {
      await db.createCorrectionRequest({
        attendanceId: attendance?.id || null, studentId, batchId: selectedBatchId, date: selectedDate,
        oldStatus: attendance?.status || 'ABSENT', newStatus: correctionTarget.nextStatus,
        reason: correctionReason.trim(), requestedBy: user?.userId || 'user_admin',
      });
      toast.success('Correction request submitted for admin approval');
      setShowCorrectionReason(false); setCorrectionTarget(null); setCorrectionReason('');
      if (isAdmin) db.getCorrectionRequests().then(setCorrectionRequests);
    } catch (e) { toast.error(e.message); }
  };

  const handleApproveRequest = async (reqId) => {
    try { await db.approveCorrectionRequest({ requestId: reqId, reviewedBy: user?.userId }); toast.success('Correction approved'); db.getCorrectionRequests().then(setCorrectionRequests); }
    catch (e) { toast.error(e.message); }
  };

  const handleRejectRequest = async (reqId) => {
    try { await db.rejectCorrectionRequest({ requestId: reqId, reviewedBy: user?.userId }); toast.success('Correction rejected'); db.getCorrectionRequests().then(setCorrectionRequests); }
    catch (e) { toast.error(e.message); }
  };

  const presentCount = roster.filter((r) => (r.optStatus || (r.attendance && r.attendance.status)) === 'PRESENT').length;
  const absentCount = roster.filter((r) => (r.optStatus || (r.attendance && r.attendance.status)) === 'ABSENT').length;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-wrap">
        <div className="w-full sm:w-72">
          <Dropdown
            className="w-full"
            value={selectedBatchId}
            onChange={(v) => setSelectedBatchId(typeof v === 'object' ? (v.value || v) : v)}
            placeholder="Select batch..."
            options={(data.batches || []).filter((b) => b.status === 'ACTIVE' || b.status === 'active').map((b) => ({
              value: b.id,
              label: `${getBatchDisplayName(b, data.courts)} (${b.dayPattern})`
            }))}
            getOptionLabel={(o) => (o && o.label) || ''}
            getOptionValue={(o) => (o && o.value) || ''}
          />
        </div>
        <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className={`${FIELD} w-full sm:w-auto`} />
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" icon={CheckSquare} onClick={() => markAll('PRESENT')}>All Present</Button>
          <Button size="sm" variant="secondary" onClick={() => markAll('ABSENT')}>All Absent</Button>
          <Button size="sm" variant="ghost" icon={Printer} onClick={() => setShowPrint(true)}>Print</Button>
          <Button size="sm" variant="secondary" icon={UserPlus} onClick={() => setShowAddStudent(true)}>Add Student</Button>
        </div>
        <span className="text-[11px] text-ink-muted sm:ml-auto w-full sm:w-auto text-right">
          <span className="text-ok font-semibold">{presentCount} present</span>
          {' \u00b7 '}
          <span className="text-err font-semibold">{absentCount} absent</span>
          {' \u00b7 '}
          {roster.length} total
        </span>
      </div>

      {batch && (
        <Card>
          <h3 className="text-sm font-semibold text-ink mb-3">{getBatchDisplayName(batch, data.courts)} ({batch.dayPattern}) {'\u2014'} {formatDateDDMMYY(selectedDate)}</h3>
          <div className="space-y-1">
            {roster.map((r) => {
              const displayStatus = r.optStatus || (r.attendance && r.attendance.status);
              const isPending = pending.has(r.studentId);
              const isReallocated = batch && r.program !== batch.program;
              return (
                <div key={r.studentId} onClick={() => handleToggleOrRequest(r)}
                  className={'flex flex-wrap items-center gap-2 sm:gap-3 px-3 py-2 rounded-lg text-xs transition-colors ' +
                    (r.blocked ? 'bg-err-bg/20 opacity-50 cursor-not-allowed' : displayStatus === 'PRESENT' ? 'bg-ok-bg/30 cursor-pointer' : displayStatus === 'ABSENT' ? 'bg-err-bg/30 cursor-pointer' : 'bg-canvas-soft hover:bg-canvas-soft/50 cursor-pointer')}>
                  <span className="font-semibold text-ink min-w-[120px]">{r.name}</span>
                  <span className={`px-2 py-0.5 rounded font-bold text-[11px] uppercase tracking-wider ${
                    r.program === 'JDP'
                      ? 'bg-purple-100 text-purple-800 border border-purple-300'
                      : r.program === 'HPP'
                      ? 'bg-rose-100 text-rose-800 border border-rose-300'
                      : 'bg-brand-50 text-brand-700 border border-brand/20'
                  }`}>
                    {r.program}
                  </span>
                  {isReallocated && (
                    <span className="text-[10px] text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded font-medium border border-purple-200">
                      Capacity follows student ({r.program} in {batch.program})
                    </span>
                  )}
                  {r.membershipType && r.membershipType !== 'Member' && <StatusPill status={r.membershipType.toLowerCase()} />}
                  {displayStatus ? <StatusPill status={displayStatus} /> : (
                    <button onClick={(e) => { e.stopPropagation(); handleToggleOrRequest(r); }} className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-canvas-soft border border-line text-ink-muted hover:bg-brand-50 hover:text-brand-600 hover:border-brand/30 transition-colors cursor-pointer">
                      Mark Attendance
                    </button>
                  )}
                  {r.blocked && <EligibilityStatusPill package={r.package} date={selectedDate} />}

                  {r.latestNote && (
                    <span className="px-2 py-0.5 rounded bg-brand-50 text-brand-700 text-[10px] max-w-[200px] truncate" title={r.latestNote}>
                      Note: {r.latestNote}
                    </span>
                  )}
                  {isPending && <Loader2 className="w-3 h-3 animate-spin text-brand" />}
                  {/* Notify Parent button for absent students */}
                  {displayStatus === 'ABSENT' && selectedDate === today && (
                    <div className="sm:ml-auto" onClick={(e) => e.stopPropagation()}>
                      <NotifyButton r={r} batch={batch} selectedDate={selectedDate} data={data} notifiedAbsences={notifiedAbsences} setNotifiedAbsences={setNotifiedAbsences} />
                    </div>
                  )}

                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Session Remark */}
      {batch && (
        <Card>
          <div className="flex items-center gap-2 mb-2">
            <FileText className="w-4 h-4 text-ink-faint" />
            <h3 className="text-sm font-semibold text-ink">Session Remark</h3>
            {sessionRemarkSaved && <span className="text-[10px] text-ok">Saved</span>}
          </div>
          <p className="text-[11px] text-ink-faint mb-2">Record court condition, weather, early finish, or any session-level observation. This is separate from individual player attendance notes.</p>
          <div className="flex gap-2">
            <textarea value={sessionRemark} onChange={(e) => setSessionRemark(e.target.value)}
              className="flex-1 h-16 px-3 py-2 rounded-lg border border-line text-[13px] outline-none focus:ring-2 focus:ring-brand/10 resize-none"
              placeholder="e.g. Court surface wet, session ended 15 minutes early" />
            <Button size="sm" onClick={handleSaveRemark}>Save Remark</Button>
          </div>
        </Card>
      )}

      {/* Exemption Attendees — students marked present who aren't in this batch's enrollment */}
      {batch && (() => {
        const exemptions = (data.attendance || []).filter(
          (a) => a.batchId === selectedBatchId && a.date === selectedDate && a.exemption);
        if (exemptions.length === 0) return null;
        const totalHeadcount = roster.filter((r) => (r.optStatus || (r.attendance && r.attendance.status)) === 'PRESENT').length + exemptions.filter((a) => a.status === 'PRESENT').length;
        const over = totalHeadcount > batch.capacity;
        return (
          <Card>
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-sm font-semibold text-ink">Exemption Attendees</h3>
              {over && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-warn-bg text-warn">
                  Over capacity ({totalHeadcount}/{batch.capacity})
                </span>
              )}
            </div>
            <p className="text-[11px] text-ink-faint mb-3">
              These students are attending this session but are not permanently enrolled in this batch.
              Marking them present does not alter their permanent batch assignment.
            </p>
            <div className="space-y-1">
              {exemptions.map((a) => {
                const stu = (data.students || []).find((s) => s.id === a.studentId);
                return (
                  <div key={a.id} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-canvas-soft text-xs">
                    <span className="font-semibold text-ink">{stu ? stu.name : a.studentId}</span>
                    <StatusPill status={a.status} />
                    {stu && stu.membershipType === 'Guest' ? <StatusPill status="guest" /> : null}
                    <span className="text-ink-faint text-[10px]">Marked by {a.markedByRole} • Exemption</span>
                  </div>
                );
              })}
            </div>
          </Card>
        );
      })()}

      {showPrint && (
        <Modal open={showPrint} onClose={() => setShowPrint(false)} title="Printable Roster" size="lg">
          <div className="print-only">
            <h3 className="text-lg font-bold mb-2">{batch && batch.program} {'\u2014'} {selectedDate}</h3>
            <table className="w-full text-sm border-collapse"><thead><tr className="border-b"><th className="text-left py-1">Student</th><th className="text-left py-1">Status</th><th className="text-left py-1">Notes</th></tr></thead>
              <tbody>{roster.map((r) => (<tr key={r.studentId} className="border-b"><td className="py-1">{r.name}</td><td className="py-1">{r.attendance ? r.attendance.status : 'Unmarked'}</td><td className="py-1">{r.attendance && r.attendance.notes || ''}</td></tr>))}</tbody></table>
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

      {/* Correction Reason Modal */}
      <Modal open={showCorrectionReason} onClose={() => setShowCorrectionReason(false)} title="Request Attendance Correction" size="sm">
        <div className="space-y-3">
          <p className="text-xs text-ink-muted">
            You are changing a past attendance record. This requires admin approval.
            Your request will be reviewed before the change is applied.
          </p>
          <div className="px-3 py-2 rounded-lg bg-canvas-soft text-xs">
            <span className="font-semibold">{correctionTarget?.studentName || 'Student'}</span>
            <span className="text-ink-muted"> {'\u2192'} {correctionTarget?.nextStatus}</span>
          </div>
          <div className="space-y-1">
            <label className={LBL}>Reason *</label>
            <textarea value={correctionReason} onChange={(e) => setCorrectionReason(e.target.value)}
              className="w-full h-20 px-3 py-2 rounded-lg border border-line text-[13px] outline-none focus:ring-2 focus:ring-brand/10 resize-none"
              placeholder="Why does this attendance record need to be corrected?" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowCorrectionReason(false)}>Cancel</Button>
            <Button onClick={handleRequestCorrection} disabled={!correctionReason.trim()}>Submit Request</Button>
          </div>
        </div>
      </Modal>

      {/* Admin Correction Requests Panel */}
      {isAdmin && correctionRequests.length > 0 && (
        <Card>
          <div className="flex items-center gap-2 mb-3">
            <ShieldCheck className="w-4 h-4 text-brand" />
            <h3 className="text-sm font-semibold text-ink">Pending Correction Requests ({correctionRequests.filter((r) => r.status === 'pending').length})</h3>
          </div>
          <div className="space-y-1">
            {correctionRequests.filter((r) => r.status === 'pending').map((req) => {
              const stu = (data.students || []).find((s) => s.id === req.studentId);
              return (
                <div key={req.id} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-canvas-soft text-xs">
                  <span className="font-semibold text-ink">{stu?.name || req.studentId}</span>
                  <span className="text-ink-muted">{req.date}</span>
                  <StatusPill status={req.oldStatus} />
                  <span className="text-ink-faint">{'\u2192'}</span>
                  <StatusPill status={req.newStatus} />
                  <span className="text-ink-muted flex-1 truncate">Reason: {req.reason}</span>
                  <span className="text-ink-faint">by {(req.requestedBy || '').replace('user_', '')}</span>
                  <Button size="sm" variant="primary" onClick={() => handleApproveRequest(req.id)} className="!h-7 !px-2 !text-[10px]">Approve</Button>
                  <Button size="sm" variant="danger" onClick={() => handleRejectRequest(req.id)} className="!h-7 !px-2 !text-[10px]">Reject</Button>
                </div>
              );
            })}
            {correctionRequests.filter((r) => r.status !== 'pending').map((req) => {
              const stu = (data.students || []).find((s) => s.id === req.studentId);
              return (
                <div key={req.id} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-canvas-soft/50 text-xs opacity-60">
                  <span className="font-semibold text-ink">{stu?.name || req.studentId}</span>
                  <StatusPill status={req.status} />
                  <span className="text-ink-muted">{req.date}</span>
                  <span className="text-ink-faint">by {(req.reviewedBy || '').replace('user_', '')}</span>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}

// Small inline component for the Notify Parent button with countdown
function NotifyButton({ r, batch, selectedDate, data, notifiedAbsences, setNotifiedAbsences }) {
  if (!batch) return null;
  const { open, minutesRemaining } = getNotificationWindow(batch?.startTime);
  const alreadyNotified = notifiedAbsences.has(r.studentId);

  if (alreadyNotified) {
    return <span className="text-[10px] text-ok ml-auto flex-shrink-0" onClick={(e) => e.stopPropagation()}>Notified</span>;
  }

  const student = (data.students || []).find((s) => s.id === r.studentId);
  if (!student || !student.guardianEmail) {
    return <span className="text-[10px] text-ink-faint ml-auto flex-shrink-0" title="No guardian email available" onClick={(e) => e.stopPropagation()}>No email</span>;
  }

  if (!open) {
    return (
      <span className="text-[10px] text-ink-faint ml-auto flex-shrink-0" onClick={(e) => e.stopPropagation()}>
        Available in {minutesRemaining}m
      </span>
    );
  }

  return (
    <button onClick={async (e) => {
      e.stopPropagation();
      try {
        await triggerWorkflow('absence.alert', {
          attendance: [{ studentId: r.studentId, batchId: batch.id, status: 'ABSENT' }],
          students: (data.students || []).filter(s => s.id === r.studentId),
          batches: [batch],
          date: selectedDate
        });
        toast.success('Absence notification sent via workflow for ' + r.name);
      } catch (wfErr) {
        console.warn('Workflow failed, falling back to mailto:', wfErr);
        const mailto = prepareAbsenceEmail({
          studentName: r.name, guardianEmail: student.guardianEmail,
          batchName: batch.program + ' ' + batch.dayPattern,
          batchDate: formatDateDDMMYY(selectedDate),
          startTime: batch.startTime, endTime: batch.endTime,
        });
        toast.success('Opening email draft for ' + r.name);
        window.open(mailto, '_blank');
      }
      await db.logAbsenceNotification({
        studentId: r.studentId, batchId: batch.id, date: selectedDate,
        guardianEmail: student.guardianEmail,
      });
      setNotifiedAbsences((prev) => new Set(prev).add(r.studentId));
    }} className="ml-auto flex-shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-brand-50 text-brand-600 hover:bg-brand-100 transition-colors">
      <Mail className="w-3 h-3" /> Notify
    </button>
  );
}
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useDb } from '../../../context/DbContext';
import { useAuth } from '../../../context/AuthContext';
import Card from '../../ui/Card';
import Button from '../../ui/Button';
import StatusPill from '../../ui/StatusPill';
import Modal from '../../ui/Modal';
import Dropdown from '../../ui/Dropdown';
import { toast } from 'sonner';
import {
  Clock,
  MapPin,
  CheckCircle,
  XCircle,
  FileText,
  AlertTriangle,
  Loader2,
  Calendar,
  MessageSquare
} from 'lucide-react';
import { formatDateDDMMYY, formatTime12h, getBatchDisplayName, getTodayPattern } from '../../../utils/formatters';

function getToday() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function CoachAttendance() {
  const { db, tick } = useDb();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const today = getToday();
  const coachId = user?.linkedCoachId;

  const state = useMemo(() => db.readAll(), [db, tick]);
  const [selectedDate, setSelectedDate] = useState(today);
  const isPastDate = selectedDate < today;

  const todayPattern = getTodayPattern();
  // Coach's assigned batches for today's pattern
  const coachBatches = useMemo(() => {
    if (!coachId) return [];
    return (state.batches || []).filter(
      (b) => (b.primaryCoachId === coachId || b.supportCoachId === coachId) &&
             b.status === 'ACTIVE' &&
             b.dayPattern === todayPattern
    );
  }, [state.batches, coachId, todayPattern]);

  const paramBatchId = searchParams.get('batchId');
  const [selectedBatchId, setSelectedBatchId] = useState(
    paramBatchId || (coachBatches.length > 0 ? coachBatches[0].id : '')
  );

  useEffect(() => {
    if (paramBatchId && paramBatchId !== selectedBatchId) {
      setSelectedBatchId(paramBatchId);
    }
  }, [paramBatchId]);

  const batch = (state.batches || []).find((b) => b.id === selectedBatchId);
  const court = (state.courts || []).find((c) => c.id === batch?.courtId);

  // Session remarks state
  const [sessionRemark, setSessionRemark] = useState('');
  const [remarkSaved, setRemarkSaved] = useState(false);

  // Load session remark
  useEffect(() => {
    if (!selectedBatchId || !selectedDate) return;
    db.getSessionRemark({ batchId: selectedBatchId, date: selectedDate }).then((r) => {
      setSessionRemark(r ? r.remark : '');
      setRemarkSaved(!!r);
    });
  }, [selectedBatchId, selectedDate, tick, db]);

  const handleSaveRemark = async () => {
    try {
      await db.saveSessionRemark({ batchId: selectedBatchId, date: selectedDate, remark: sessionRemark });
      setRemarkSaved(true);
      toast.success('Session remark saved');
    } catch (e) {
      toast.error(e.message);
    }
  };

  // Correction request modal for past dates
  const [showCorrectionModal, setShowCorrectionModal] = useState(false);
  const [correctionTarget, setCorrectionTarget] = useState(null);
  const [correctionReason, setCorrectionReason] = useState('');

  // Optimistic tracking
  const [optimistic, setOptimistic] = useState({});
  const [pending, setPending] = useState(new Set());

  // Roster generation
  const roster = useMemo(() => {
    if (!batch) return [];
    const marked = (state.attendance || []).filter(
      (a) => a.batchId === selectedBatchId && a.date === selectedDate
    );
    return (state.enrollments || [])
      .filter((e) => e.batchId === selectedBatchId && e.status === 'ACTIVE')
      .map((e) => {
        const student = (state.students || []).find((s) => s.id === e.studentId);
        const att = marked.find((a) => a.studentId === e.studentId);
        const key = `${e.studentId}|${selectedBatchId}|${selectedDate}`;
        const optStatus = optimistic[key];
        const status = optStatus || att?.status || null;

        // Player attendance notes (dated notes from player profile)
        const notes = (state.playerNotes || [])
          .filter((n) => n.studentId === e.studentId)
          .sort((a, b) => (b.date || '').localeCompare(a.date || ''));

        return {
          studentId: e.studentId,
          name: student?.name || 'Unknown Student',
          program: e.billingProgram || batch.program,
          ballLevel: e.ballLevel || batch.ballLevel,
          membershipType: student?.membershipType || 'Member',
          attendance: att,
          status,
          notes,
          latestNote: notes[0]?.note || student?.remarks || '',
        };
      });
  }, [state, batch, selectedBatchId, selectedDate, optimistic]);

  // Exemption Attendees (attended this session but enrolled in other batches)
  const exemptionAttendees = useMemo(() => {
    if (!batch) return [];
    return (state.attendance || []).filter(
      (a) => a.batchId === selectedBatchId && a.date === selectedDate && a.exemption
    );
  }, [state.attendance, selectedBatchId, selectedDate, batch]);

  // Toggle status for a student (One-handed courtside usability)
  const handleToggle = useCallback(
    async (r) => {
      const nextStatus = r.status === 'PRESENT' ? 'ABSENT' : 'PRESENT';

      // Past date check: Coaches cannot amend past attendance without admin approval
      if (isPastDate && r.attendance) {
        setCorrectionTarget({
          studentId: r.studentId,
          name: r.name,
          oldStatus: r.status,
          nextStatus,
          attendance: r.attendance,
        });
        setCorrectionReason('');
        setShowCorrectionModal(true);
        return;
      }

      // Live marking for today (or unrecorded date)
      const key = `${r.studentId}|${selectedBatchId}|${selectedDate}`;
      setOptimistic((prev) => ({ ...prev, [key]: nextStatus }));
      setPending((prev) => new Set(prev).add(r.studentId));

      try {
        await db.markAttendance({
          batchId: selectedBatchId,
          date: selectedDate,
          entries: [{ studentId: r.studentId, status: nextStatus }],
          markedBy: user?.userId || 'user_coach',
          markedByRole: 'COACH',
          source: 'COACH_APP',
        });
        toast.success(`${r.name} marked ${nextStatus}`);
        setOptimistic((prev) => {
          const n = { ...prev };
          delete n[key];
          return n;
        });
        setPending((prev) => {
          const s = new Set(prev);
          s.delete(r.studentId);
          return s;
        });
      } catch (e) {
        setOptimistic((prev) => {
          const n = { ...prev };
          delete n[key];
          return n;
        });
        setPending((prev) => {
          const s = new Set(prev);
          s.delete(r.studentId);
          return s;
        });
        toast.error(e.message || 'Failed to mark attendance');
      }
    },
    [isPastDate, selectedBatchId, selectedDate, db, user]
  );

  const handleSubmitCorrection = async () => {
    if (!correctionReason.trim()) {
      toast.error('Reason is required to request a correction');
      return;
    }
    try {
      await db.createCorrectionRequest({
        attendanceId: correctionTarget.attendance?.id || null,
        studentId: correctionTarget.studentId,
        batchId: selectedBatchId,
        date: selectedDate,
        oldStatus: correctionTarget.oldStatus || 'ABSENT',
        newStatus: correctionTarget.nextStatus,
        reason: correctionReason.trim(),
        requestedBy: user?.userId || 'user_coach',
      });
      toast.success('Correction request submitted for Admin review');
      setShowCorrectionModal(false);
      setCorrectionTarget(null);
      setCorrectionReason('');
    } catch (e) {
      toast.error(e.message);
    }
  };

  const presentCount = roster.filter((r) => r.status === 'PRESENT').length;
  const absentCount = roster.filter((r) => r.status === 'ABSENT').length;
  const unmarkedCount = roster.filter((r) => !r.status).length;

  return (
    <div className="space-y-4 max-w-xl mx-auto pb-10">
      {/* Batch & Date Selector (One-handed courtside controls) */}
      <Card>
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2.5">
            <div className="flex-1 min-w-0">
              <label className="block text-[10px] font-semibold text-ink-muted uppercase tracking-wider mb-1">
                Batch
              </label>
              <Dropdown
                value={selectedBatchId}
                onChange={(v) => {
                  const bId = typeof v === 'object' ? (v.value || v) : v;
                  setSelectedBatchId(bId);
                  setSearchParams({ batchId: bId });
                }}
                options={coachBatches.map((b) => ({
                  value: b.id,
                  label: getBatchDisplayName(b, state.courts),
                }))}
                getOptionLabel={(o) => o?.label || ''}
                getOptionValue={(o) => o?.value || ''}
              />
            </div>
            <div className="w-full sm:w-44">
              <label className="block text-[10px] font-semibold text-ink-muted uppercase tracking-wider mb-1">
                Date
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full h-[38px] px-3 rounded-lg border border-line bg-white text-xs outline-none focus:ring-2 focus:ring-brand/10"
              />
            </div>
          </div>

          {batch && (
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-line/60 text-xs text-ink-muted">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-ink-faint" />
                  {formatTime12h(batch.startTime)} - {formatTime12h(batch.endTime)}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-ink-faint" />
                  {court?.name || 'Court'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-ok font-semibold">{presentCount} P</span>
                <span>•</span>
                <span className="text-err font-semibold">{absentCount} A</span>
                <span>•</span>
                <span className="text-ink-faint">{unmarkedCount} Unmarked</span>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Past Date Notice */}
      {isPastDate && (
        <div className="flex items-center gap-2 p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-800">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>You are viewing a past session. Modifying past attendance requires admin approval.</span>
        </div>
      )}

      {/* Session Roster — Large Courtside Tap Targets */}
      <Card>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-ink">
            {batch?.name || `Roster (${roster.length})`} — {formatDateDDMMYY(selectedDate)}
          </h3>
          <span className="text-[11px] text-ink-faint">Tap button to toggle</span>
        </div>

        {roster.length === 0 ? (
          <p className="text-xs text-ink-faint py-4 text-center">No students enrolled in this batch.</p>
        ) : (
          <div className="space-y-2">
            {roster.map((r) => {
              const isPending = pending.has(r.studentId);
              const isReallocated = batch && r.program !== batch.program;
              return (
                <div
                  key={r.studentId}
                  className={`p-3 rounded-xl border transition-all ${
                    r.status === 'PRESENT'
                      ? 'bg-ok-bg/30 border-ok/30'
                      : r.status === 'ABSENT'
                      ? 'bg-err-bg/25 border-err/30'
                      : 'bg-canvas-soft border-line/60'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm text-ink">{r.name}</span>
                        {/* Distinct Program / Category Badge (e.g. JDP, HPP, ADV) */}
                        <span className={`px-2 py-0.5 rounded-md font-bold text-[11px] uppercase tracking-wider ${
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
                        {r.ballLevel && <span className="text-brand-600 text-xs font-semibold">{r.ballLevel}</span>}
                        {r.membershipType === 'Guest' ? (
                          <StatusPill status="guest" />
                        ) : r.membershipType === 'Non-member' ? (
                          <StatusPill status="Non-member" />
                        ) : null}
                      </div>


                      {/* Active Attendance Note */}
                      {r.latestNote && (
                        <div className="flex items-start gap-1 text-[11px] text-brand-700 bg-brand-50/70 px-2 py-1 rounded-md">
                          <MessageSquare className="w-3 h-3 mt-0.5 shrink-0" />
                          <span className="truncate">{r.latestNote}</span>
                        </div>
                      )}
                    </div>

                    {/* Courtside Tap Action Button (Min 44px touch target) */}
                    <button
                      onClick={() => handleToggle(r)}
                      disabled={isPending}
                      className={`h-11 min-w-[100px] px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs active:scale-95 transition-all select-none ${
                        r.status === 'PRESENT'
                          ? 'bg-ok text-white hover:bg-ok/90'
                          : r.status === 'ABSENT'
                          ? 'bg-err text-white hover:bg-err/90'
                          : 'bg-white border border-line text-ink hover:bg-canvas-soft'
                      }`}
                    >
                      {isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : r.status === 'PRESENT' ? (
                        <>
                          <CheckCircle className="w-4 h-4" /> Present
                        </>
                      ) : r.status === 'ABSENT' ? (
                        <>
                          <XCircle className="w-4 h-4" /> Absent
                        </>
                      ) : (
                        'Tap to Mark'
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Exemption Attendees Card */}
      {exemptionAttendees.length > 0 && (
        <Card>
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-sm font-semibold text-ink">Make-Up / Exemption Attendees</h3>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-brand-50 text-brand-600">
              {exemptionAttendees.length} out-of-pattern
            </span>
          </div>
          <p className="text-[11px] text-ink-faint mb-2">
            Attending outside regular schedule. Does not alter permanent batch enrollment.
          </p>
          <div className="space-y-1.5">
            {exemptionAttendees.map((att) => {
              const s = (state.students || []).find((stu) => stu.id === att.studentId);
              return (
                <div key={att.id} className="flex items-center justify-between p-2.5 rounded-lg bg-canvas-soft text-xs">
                  <div className="space-y-0.5">
                    <p className="font-semibold text-ink">{s?.name || att.studentId}</p>
                    {att.note && <p className="text-[11px] text-ink-faint">{att.note}</p>}
                  </div>
                  <StatusPill status={att.status || 'PRESENT'} />
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Session Remarks Card (Weather, court conditions, early finish) */}
      <Card>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <FileText className="w-4 h-4 text-ink-faint" />
            <h3 className="text-sm font-semibold text-ink">Session Remarks</h3>
          </div>
          {remarkSaved && <span className="text-[10px] font-semibold text-ok">Saved</span>}
        </div>
        <p className="text-[11px] text-ink-faint mb-2">
          Record court conditions, weather interruptions, or early finishes.
        </p>
        <div className="space-y-2">
          <textarea
            value={sessionRemark}
            onChange={(e) => {
              setSessionRemark(e.target.value);
              setRemarkSaved(false);
            }}
            placeholder="e.g. Court 3 floodlight flicker; session wrapped 10 mins early due to drizzle."
            className="w-full h-18 px-3 py-2 rounded-xl border border-line bg-white text-xs outline-none focus:ring-2 focus:ring-brand/10 resize-none"
          />
          <div className="flex justify-end">
            <Button size="sm" onClick={handleSaveRemark} disabled={remarkSaved || !sessionRemark.trim()}>
              Save Remark
            </Button>
          </div>
        </div>
      </Card>

      {/* Past Date Correction Request Modal */}
      <Modal
        open={showCorrectionModal}
        onClose={() => setShowCorrectionModal(false)}
        title="Request Attendance Correction"
        size="sm"
      >
        <div className="space-y-3">
          <p className="text-xs text-ink-muted">
            You are requesting to change <strong>{correctionTarget?.name}</strong>'s attendance for{' '}
            <strong>{formatDateDDMMYY(selectedDate)}</strong> from{' '}
            <span className="font-semibold">{correctionTarget?.oldStatus}</span> to{' '}
            <span className="font-semibold text-brand">{correctionTarget?.nextStatus}</span>.
          </p>
          <div className="space-y-1">
            <label className="block text-[10px] font-semibold text-ink-muted uppercase tracking-wider mb-1">
              Reason for correction *
            </label>
            <textarea
              value={correctionReason}
              onChange={(e) => setCorrectionReason(e.target.value)}
              placeholder="e.g. Student was present for drills but arrived late after initial roll call."
              className="w-full h-20 px-3 py-2 rounded-lg border border-line text-xs outline-none focus:ring-2 focus:ring-brand/10 resize-none"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowCorrectionModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmitCorrection}>Submit for Review</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
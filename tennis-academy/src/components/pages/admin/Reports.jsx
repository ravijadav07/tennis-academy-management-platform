import { useMemo, useState, useEffect } from 'react';
import { useDb } from '../../../context/DbContext';
import { useAuth } from '../../../context/AuthContext';
import { computeSlotAnalysis, findAmbiguousStudents } from '../../../mocks/rules';
import Card from '../../ui/Card';
import StatusPill from '../../ui/StatusPill';
import Button from '../../ui/Button';
import Modal from '../../ui/Modal';
import Dropdown from '../../ui/Dropdown';
import CapacityIndicator from '../../ui/CapacityIndicator';
import { formatTime12h, getBatchDisplayName } from '../../../utils/formatters';
import TimePicker12h from '../../ui/TimePicker12h';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import { Download, AlertTriangle, TrendingUp, Radio, ShieldCheck, Send, Settings, Mail, Clock, CheckCircle, Table, Grid } from 'lucide-react';

import { triggerWorkflow } from '../../../utils/api';
import { validateEmail } from '../../../utils/validators';

function timeAgo(ms) { const sec = Math.floor((Date.now() - ms) / 1000); if (sec < 5) return 'just now'; if (sec < 60) return sec + 's ago'; if (sec < 3600) return Math.floor(sec / 60) + 'm ago'; return Math.floor(sec / 3600) + 'h ago'; }

const CATEGORIES = ['ADV', 'INT', 'ADULT', 'GREEN', 'ORANGE', 'RED', 'JDP', 'HPP', 'WEEKEND', 'FITNESS'];
const PATTERNS = ['MWF', 'TTS'];

export default function Reports() {
  const { db, tick, lastUpdated } = useDb();
  const { user } = useAuth();
  const state = useMemo(() => db.readAll(), [db, tick]);
  const { batches, courts, enrollments, students, attendance, coaches } = state;

  // Current month for verification
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();
  const monthName = now.toLocaleString('default', { month: 'long' });

  // Filters
  const [dateFrom, setDateFrom] = useState(new Date().toISOString().split('T')[0]);
  const [dateTo, setDateTo] = useState(new Date().toISOString().split('T')[0]);
  const [filterPattern, setFilterPattern] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterCourt, setFilterCourt] = useState('');
  const [filterCoach, setFilterCoach] = useState('');
  const [filterMembership, setFilterMembership] = useState('');
  const [showNonMembers, setShowNonMembers] = useState(false);
  const [nonMemberList, setNonMemberList] = useState([]);
  const [reportView, setReportView] = useState('matrix'); // 'matrix' (Executive Program Matrix) or 'schedule' (Detailed Slot Schedule)

  // --- Verify-then-Send workflow state ---
  const [verification, setVerification] = useState(null);
  const [showVerifyConfirm, setShowVerifyConfirm] = useState(false);
  const [showTemplate, setShowTemplate] = useState(false);
  const [showRecipients, setShowRecipients] = useState(false);
  const [showDispatchLog, setShowDispatchLog] = useState(false);
  const [emailTemplate, setEmailTemplate] = useState({ subject: '', body: '' });
  const [recipients, setRecipients] = useState({ emails: [], preferredTime: '' });
  const [newEmail, setNewEmail] = useState('');
  const [dispatchLog, setDispatchLog] = useState([]);

  // Load verification + template + recipients + dispatch log
  useEffect(() => {
    db.getReportVerification({ month: currentMonth, year: currentYear }).then(setVerification);
    db.getEmailTemplate().then(setEmailTemplate);
    db.getReportRecipients().then(setRecipients);
    db.getDispatchLog().then(setDispatchLog);
  }, [tick]);

  // Handle Verify
  const handleVerify = async () => {
    try {
      const v = await db.verifyReport({ month: currentMonth, year: currentYear, verifiedBy: user?.userId || 'user_admin' });
      setVerification(v);
      setShowVerifyConfirm(false);
      toast.success('Report verified and locked for ' + monthName + ' ' + currentYear);
    } catch (e) { toast.error(e.message); }
  };

  // Handle Send — triggers backend workflow & manual mailto
  const handleSend = async () => {
    if (!verification) {
      toast.error('Verify the report first before sending');
      return;
    }
    try {
      await triggerWorkflow('report.send', {
        month: monthName,
        year: currentYear,
        recipients: recipients.emails,
      });
    } catch (e) {
      console.log('[api] report.send webhook fallback:', e.message);
    }
    const subj = emailTemplate.subject.replace('{month}', monthName).replace('{year}', currentYear);
    const body = emailTemplate.body
      .replace('{month}', monthName).replace('{year}', currentYear)
      .replace('{booked}', analysis.academy.booked).replace('{total}', analysis.academy.total)
      .replace('{occupancy}', analysis.academy.occupancyPct + '%');
    const mail = recipients.emails.join(',');
    const mailto = `mailto:${mail}?subject=${encodeURIComponent(subj)}&body=${encodeURIComponent(body)}`;

    // Log dispatch
    const d = await db.logDispatch({ recipients: recipients.emails, exportType: 'CSV', verifiedKey: verification.key, sentBy: user?.userId });
    setDispatchLog((prev) => [d, ...prev]);
    toast.success('Dispatch logged & report sent');
    window.open(mailto, '_blank');
  };

  // Handle save template
  const handleSaveTemplate = async () => {
    try {
      const t = await db.saveEmailTemplate({ subject: emailTemplate.subject, body: emailTemplate.body });
      setEmailTemplate(t);
      setShowTemplate(false);
      toast.success('Email template saved');
    } catch (e) { toast.error(e.message); }
  };

  // Handle save recipients
  const handleSaveRecipients = async () => {
    try {
      if (!recipients.emails.length) { toast.error('Add at least one recipient'); return; }
      for (const email of recipients.emails) {
        const err = validateEmail(email); if (err) { toast.error(`Invalid email: ${email}`); return; }
      }
      const r = await db.saveReportRecipients({ emails: recipients.emails, preferredTime: recipients.preferredTime });
      setRecipients(r);
      setShowRecipients(false);
      toast.success('Recipients saved');
    } catch (e) { toast.error(e.message); }
  };

  const addRecipient = () => {
    if (!newEmail.trim()) return;
    setRecipients((r) => ({ ...r, emails: [...r.emails, newEmail.trim()] }));
    setNewEmail('');
  };

  // Filtered batches
  const filteredBatches = useMemo(() => {
    let b = batches.filter((b) => b.status === 'ACTIVE');
    if (filterPattern) b = b.filter((b) => b.dayPattern === filterPattern);
    if (filterCategory) b = b.filter((b) => b.program === filterCategory);
    if (filterCourt) b = b.filter((b) => b.courtId === filterCourt);
    if (filterCoach) b = b.filter((b) => b.primaryCoachId === filterCoach);
    return b;
  }, [batches, filterPattern, filterCategory, filterCourt, filterCoach]);

  // Build rows
  const rows = useMemo(() => {
    return filteredBatches.map((b) => {
      const court = courts.find((c) => c.id === b.courtId);
      const enrolled = enrollments.filter((e) => e.batchId === b.id && e.status === 'ACTIVE');
      const att = attendance.filter((a) => a.batchId === b.id && a.date >= dateFrom && a.date <= dateTo);
      const attendedCount = att.length;
      const members = enrolled.filter((e) => {
        const s = students.find((st) => st.id === e.studentId);
        return s && (s.membershipType || 'Member') === 'Member';
      }).length;
      const nonMembers = enrolled.filter((e) => {
        const s = students.find((st) => st.id === e.studentId);
        return s && s.membershipType === 'Non-member';
      }).length;
      const guests = enrolled.filter((e) => {
        const s = students.find((st) => st.id === e.studentId);
        return s && s.membershipType === 'Guest';
      }).length;
      const exemptionAtt = att.filter((a) => a.exemption);
      const totalGuests = guests + exemptionAtt.filter((a) => {
        const s = students.find((st) => st.id === a.studentId);
        return !s || s.membershipType === 'Guest';
      }).length;
      const occupancy = b.capacity > 0 ? Math.round((attendedCount / b.capacity) * 100) : 0;

      if (filterMembership) {
        if (filterMembership === 'Member' && members === 0) return null;
        if (filterMembership === 'Non-member' && nonMembers === 0) return null;
        if (filterMembership === 'Guest' && totalGuests === 0) return null;
      }

      return {
        id: b.id, program: b.program, dayPattern: b.dayPattern,
        courtName: court?.name || 'Unknown', startTime: b.startTime, endTime: b.endTime,
        capacity: b.capacity, enrolled: enrolled.length, attended: attendedCount,
        members, nonMembers, totalGuests, occupancy,
        nonMemberNames: enrolled.filter((e) => { const s = students.find((st) => st.id === e.studentId); return s && s.membershipType === 'Non-member'; }).map((e) => { const s = students.find((st) => st.id === e.studentId); return { name: s?.name, phone: s?.guardianPhone }; }),
      };
    }).filter(Boolean);
  }, [filteredBatches, courts, enrollments, attendance, students, dateFrom, dateTo, filterMembership]);

  // Unique active players
  const uniquePlayers = useMemo(() => {
    const ids = new Set();
    enrollments.filter((e) => e.status === 'ACTIVE').forEach((e) => ids.add(e.studentId));
    return ids.size;
  }, [enrollments]);

  // Slot analysis (unchanged)
  const analysis = useMemo(() => computeSlotAnalysis(batches, enrollments), [batches, enrollments]);
  const ambiguous = useMemo(() => findAmbiguousStudents(enrollments), [enrollments]);
  const driftFlags = (state.driftFlags || []);
  const [ago, setAgo] = useState(timeAgo(lastUpdated || Date.now()));
  useEffect(() => { setAgo(timeAgo(lastUpdated || Date.now())); const i = setInterval(() => setAgo(timeAgo(lastUpdated || Date.now())), 5000); return () => clearInterval(i); }, [lastUpdated]);

  const auditLog = (state.auditLog || []);
  const recentActivity = auditLog.slice(0, 5).map((entry) => ({
    time: formatTime12h(entry.timestamp?.split('T')[1]?.slice(0, 5) || ''),
    who: entry.userId?.replace('user_', '') || 'system',
    action: entry.action?.replace(/_/g, ' ') || '',
    detail: entry.entityType + (entry.entityId ? ' #' + String(entry.entityId).slice(-4) : ''),
  }));

  // Generate and export Excel workbook matching exact client layout
  const handleExportExcel = () => {
    try {
      const wb = XLSX.utils.book_new();
      const m = analysis.matrix || {};
      const ac = analysis.academy || {};

      // 1. Sheet 1: Slot Analysis (Exact 11 Program Analysis blocks matching Basic Program Details for ATA.xlsx)
      const wsData = [
        ['Academy Analysis', '', '', 'Advance Class Analysis', '', '', 'Intermediate Class Analysis', '', '', 'Adults Class Analysis', ''],
        ['Total Slots MWF', ac.mwf?.total || 0, '', 'Total Advance Class MWF', m.ADV?.mwf?.total || 0, '', 'Total Intermediate Class MWF', m.INT?.mwf?.total || 0, '', 'Total Adults Class MWF', m.ADULT?.mwf?.total || 0],
        ['Total Slots TTS', ac.tts?.total || 0, '', 'Total Advance Class TTS', m.ADV?.tts?.total || 0, '', 'Total Intermediate Class TTS', m.INT?.tts?.total || 0, '', 'Total Adults Class TTS', m.ADULT?.tts?.total || 0],
        ['Total Slots Sat & Sun', ac.weekend?.total || 0, '', 'Total Slots Available All Days', m.ADV?.total?.total || 0, '', 'Total Slots Available All Days', m.INT?.total?.total || 0, '', 'Total Slots Available All Days', m.ADULT?.total?.total || 0],
        ['Total Slots Available All Days', ac.total || 0, '', '', '', '', '', '', '', '', ''],
        ['', '', '', 'Total Slots Booked MWF', m.ADV?.mwf?.booked || 0, '', 'Total Slots Booked MWF', m.INT?.mwf?.booked || 0, '', 'Total Slots Booked MWF', m.ADULT?.mwf?.booked || 0],
        ['Total Slots Booked MWF', ac.mwf?.booked || 0, '', 'Total Slots Booked TTS', m.ADV?.tts?.booked || 0, '', 'Total Slots Booked TTS', m.INT?.tts?.booked || 0, '', 'Total Slots Booked TTS', m.ADULT?.tts?.booked || 0],
        ['Total Slots Booked TTS', ac.tts?.booked || 0, '', 'Total Booked Slots', m.ADV?.total?.booked || 0, '', 'Total Booked Slots', m.INT?.total?.booked || 0, '', 'Total Booked Slots', m.ADULT?.total?.booked || 0],
        ['Total Slots Booked Sat & Sun', ac.weekend?.booked || 0, '', '', '', '', '', '', '', '', ''],
        ['Total Booked Slots', ac.booked || 0, '', 'Total Slots Open MWF', m.ADV?.mwf?.open || 0, '', 'Total Slots Open MWF', m.INT?.mwf?.open || 0, '', 'Total Slots Open MWF', m.ADULT?.mwf?.open || 0],
        ['', '', '', 'Total Slots Open TTS', m.ADV?.tts?.open || 0, '', 'Total Slots Open TTS', m.INT?.tts?.open || 0, '', 'Total Slots Open TTS', m.ADULT?.tts?.open || 0],
        ['Total Slots Open MWF', ac.mwf?.open || 0, '', 'Total Open Slots', m.ADV?.total?.open || 0, '', 'Total Open Slots', m.INT?.total?.open || 0, '', 'Total Open Slots', m.ADULT?.total?.open || 0],
        ['Total Slots Open TTS', ac.tts?.open || 0, '', '', '', '', '', '', '', '', ''],
        ['Total Slots Open Sat & Sun', ac.weekend?.open || 0, '', 'Occupancy %', `${m.ADV?.total?.occupancyPct || 0}%`, '', 'Occupancy %', `${m.INT?.total?.occupancyPct || 0}%`, '', 'Occupancy %', `${m.ADULT?.total?.occupancyPct || 0}%`],
        ['Total Open Slots', ac.open || 0, '', '', '', '', '', '', '', '', ''],
        ['Occupancy %', `${ac.occupancyPct || 0}%`, '', '', '', '', '', '', '', '', ''],
        [],
        ['Green Ball Class Analysis', '', '', 'Orange Ball Class Analysis', '', '', 'Red Ball Class Analysis', '', '', 'Junior Development Program Analysis (JDP)', ''],
        ['Total Green Ball Class MWF', m.GREEN?.mwf?.total || 0, '', 'Total Orange Ball Class MWF', m.ORANGE?.mwf?.total || 0, '', 'Total Red Ball Class MWF', m.RED?.mwf?.total || 0, '', 'Total JDP Class MWF', m.JDP?.mwf?.total || 0],
        ['Total Green Ball Class TTS', m.GREEN?.tts?.total || 0, '', 'Total Orange Ball Class TTS', m.ORANGE?.tts?.total || 0, '', 'Total Red Ball Class TTS', m.RED?.tts?.total || 0, '', 'Total JDP Class TTS', m.JDP?.tts?.total || 0],
        ['Total Slots Available All Days', m.GREEN?.total?.total || 0, '', 'Total Slots Available All Days', m.ORANGE?.total?.total || 0, '', 'Total Slots Available All Days', m.RED?.total?.total || 0, '', 'Total Slots Available All Days', m.JDP?.total?.total || 0],
        [],
        ['Total Slots Booked MWF', m.GREEN?.mwf?.booked || 0, '', 'Total Slots Booked MWF', m.ORANGE?.mwf?.booked || 0, '', 'Total Slots Booked MWF', m.RED?.mwf?.booked || 0, '', 'Total Slots Booked MWF', m.JDP?.mwf?.booked || 0],
        ['Total Slots Booked TTS', m.GREEN?.tts?.booked || 0, '', 'Total Slots Booked TTS', m.ORANGE?.tts?.booked || 0, '', 'Total Slots Booked TTS', m.RED?.tts?.booked || 0, '', 'Total Slots Booked TTS', m.JDP?.tts?.booked || 0],
        ['Total Booked Slots', m.GREEN?.total?.booked || 0, '', 'Total Booked Slots', m.ORANGE?.total?.booked || 0, '', 'Total Booked Slots', m.RED?.total?.booked || 0, '', 'Total Booked Slots', m.JDP?.total?.booked || 0],
        [],
        ['Total Slots Open MWF', m.GREEN?.mwf?.open || 0, '', 'Total Slots Open MWF', m.ORANGE?.mwf?.open || 0, '', 'Total Slots Open MWF', m.RED?.mwf?.open || 0, '', 'Total Slots Open MWF', m.JDP?.mwf?.open || 0],
        ['Total Slots Open TTS', m.GREEN?.tts?.open || 0, '', 'Total Slots Open TTS', m.ORANGE?.tts?.open || 0, '', 'Total Slots Open TTS', m.RED?.tts?.open || 0, '', 'Total Slots Open TTS', m.JDP?.tts?.open || 0],
        ['Total Open Slots', m.GREEN?.total?.open || 0, '', 'Total Open Slots', m.ORANGE?.total?.open || 0, '', 'Total Open Slots', m.RED?.total?.open || 0, '', 'Total Open Slots', m.JDP?.total?.open || 0],
        [],
        ['Occupancy %', `${m.GREEN?.total?.occupancyPct || 0}%`, '', 'Occupancy %', `${m.ORANGE?.total?.occupancyPct || 0}%`, '', 'Occupancy %', `${m.RED?.total?.occupancyPct || 0}%`, '', 'Occupancy %', `${m.JDP?.total?.occupancyPct || 0}%`],
        [],
        ['High Performance Program Analysis (HPP)', '', '', 'Weekend Coaching Program Analysis', '', '', 'Fitness Program Analysis', ''],
        ['Total HPP Class MWF', m.HPP?.mwf?.total || 0, '', 'Total Slots at 2:30pm', m.WEEKEND?.slot230?.total || 0, '', 'Total Slots on MWF', m.FITNESS?.mwf?.total || 0],
        ['Total HPP Class TTS', m.HPP?.tts?.total || 0, '', 'Total Slots at 3:30pm', m.WEEKEND?.slot330?.total || 0, '', 'Total Slots on TTS', m.FITNESS?.tts?.total || 0],
        ['Total Slots Available All Days', m.HPP?.total?.total || 0, '', 'Total Slots Available All Days', m.WEEKEND?.total?.total || 0, '', 'Total Slots Available All Days', m.FITNESS?.total?.total || 0],
        [],
        ['Total Slots Booked MWF', m.HPP?.mwf?.booked || 0, '', 'Total Slots at 2:30pm', m.WEEKEND?.slot230?.booked || 0, '', 'Total Slots Booked MWF', m.FITNESS?.mwf?.booked || 0],
        ['Total Slots Booked TTS', m.HPP?.tts?.booked || 0, '', 'Total Slots at 3:30pm', m.WEEKEND?.slot330?.booked || 0, '', 'Total Slots Booked TTS', m.FITNESS?.tts?.booked || 0],
        ['Total Booked Slots', m.HPP?.total?.booked || 0, '', 'Total Booked Slots', m.WEEKEND?.total?.booked || 0, '', 'Total Booked Slots', m.FITNESS?.total?.booked || 0],
        [],
        ['Total Slots Open MWF', m.HPP?.mwf?.open || 0, '', 'Total Slots at 2:30pm', m.WEEKEND?.slot230?.open || 0, '', 'Total Slots Open MWF', m.FITNESS?.mwf?.open || 0],
        ['Total Slots Open TTS', m.HPP?.tts?.open || 0, '', 'Total Slots at 3:30pm', m.WEEKEND?.slot330?.open || 0, '', 'Total Slots Open TTS', m.FITNESS?.tts?.open || 0],
        ['Total Open Slots', m.HPP?.total?.open || 0, '', 'Total Open Slots', m.WEEKEND?.total?.open || 0, '', 'Total Open Slots', m.FITNESS?.total?.open || 0],
        [],
        ['Occupancy %', `${m.HPP?.total?.occupancyPct || 0}%`, '', 'Occupancy %', `${m.WEEKEND?.total?.occupancyPct || 0}%`, '', 'Occupancy %', `${m.FITNESS?.total?.occupancyPct || 0}%`]
      ];

      const wsSlotAnalysis = XLSX.utils.aoa_to_sheet(wsData);
      XLSX.utils.book_append_sheet(wb, wsSlotAnalysis, 'Slot Analysis');

      // 2. Sheet 2: Detailed Batch Schedule Breakdown
      const scheduleData = [
        ['Day/Pattern', 'Court & Time', 'Batch Name', 'Category', 'Capacity', 'Enrolled', 'Attended', 'Members', 'Non-members', 'Guest/Trial', 'Occupancy %'],
        ...rows.map((r) => {
          const b = batches.find((x) => x.id === r.id);
          return [
            r.dayPattern,
            `${r.courtName} ${formatTime12h(r.startTime)}-${formatTime12h(r.endTime)}`,
            b ? getBatchDisplayName(b, courts) : `${r.program} ${r.dayPattern}`,
            r.program,
            r.capacity,
            r.enrolled,
            r.attended,
            r.members,
            r.nonMembers,
            r.totalGuests,
            `${r.occupancy}%`
          ];
        })
      ];
      const wsSchedule = XLSX.utils.aoa_to_sheet(scheduleData);
      XLSX.utils.book_append_sheet(wb, wsSchedule, 'Slot Schedule Details');

      XLSX.writeFile(wb, `Slot-Analysis-${monthName}-${currentYear}.xlsx`);
      toast.success('Excel workbook exported with Slot Analysis & Schedule sheets');
    } catch (err) {
      console.error('Excel export error:', err);
      toast.error('Failed to export Excel workbook');
    }
  };

  const handleExportCSV = handleExportExcel;


  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-ok opacity-75" /><span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-ok" /></span>
          <span className="text-[11px] font-semibold text-ok tracking-wide">LIVE</span>
          <span className="text-[11px] text-ink-faint ml-1">Updated {ago}</span>
        </div>
      </div>

      {/* Verify-then-Send Bar */}
      <Card>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h3 className="text-sm font-semibold text-ink">Report Verification — {monthName} {currentYear}</h3>
            <p className="text-xs text-ink-muted mt-0.5">
              {verification ? (
                <span className="flex items-center gap-1 text-ok">
                  <CheckCircle className="w-3.5 h-3.5" /> Verified by {(verification.verifiedBy || '').replace('user_', '') || 'Admin'} on {new Date(verification.verifiedAt).toLocaleDateString('en-IN')} — report locked
                </span>
              ) : (
                'Not yet verified. Verify to lock the report and enable sending.'
              )}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {!verification && (
              <Button size="sm" variant="secondary" icon={ShieldCheck} onClick={() => setShowVerifyConfirm(true)}>
                Verify Report
              </Button>
            )}
            <Button size="sm" variant="ghost" icon={Settings} onClick={() => setShowTemplate(true)}>Template</Button>
            <Button size="sm" variant="ghost" icon={Mail} onClick={() => setShowRecipients(true)}>Recipients</Button>
            <Button size="sm" variant="ghost" icon={Clock} onClick={() => { db.getDispatchLog().then(setDispatchLog); setShowDispatchLog(true); }}>Log</Button>
            <Button size="sm" variant="secondary" icon={Send} onClick={handleSend} disabled={!verification}>
              Send Now
            </Button>
          </div>
        </div>
      </Card>

      {/* Verify Confirmation Modal */}
      <Modal open={showVerifyConfirm} onClose={() => setShowVerifyConfirm(false)} title="Verify Report" size="sm">
        <div className="space-y-3">
          <p className="text-xs text-ink-muted">
            This will lock the Slot Analysis for <strong>{monthName} {currentYear}</strong>.
            You will not be able to edit this month's figures after verification.
            The verification is attributable to you and will be recorded.
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowVerifyConfirm(false)}>Cancel</Button>
            <Button onClick={handleVerify} icon={ShieldCheck}>Verify & Lock</Button>
          </div>
        </div>
      </Modal>

      {/* Email Template Modal */}
      <Modal open={showTemplate} onClose={() => setShowTemplate(false)} title="Email Template" size="md">
        <div className="space-y-3">
          <p className="text-xs text-ink-muted">Edit the email template used for report dispatch. Use {'{month}'}, {'{year}'}, {'{booked}'}, {'{total}'}, {'{occupancy}'} as placeholders.</p>
          <div className="space-y-1">
            <label className="block text-[10px] font-semibold text-ink-muted uppercase tracking-[0.04em] mb-1">Subject</label>
            <input value={emailTemplate.subject} onChange={(e) => setEmailTemplate((t) => ({ ...t, subject: e.target.value }))}
              className="w-full h-[38px] px-3 rounded-lg border border-line text-[13px] outline-none focus:ring-2 focus:ring-brand/10" />
          </div>
          <div className="space-y-1">
            <label className="block text-[10px] font-semibold text-ink-muted uppercase tracking-[0.04em] mb-1">Body</label>
            <textarea value={emailTemplate.body} onChange={(e) => setEmailTemplate((t) => ({ ...t, body: e.target.value }))}
              className="w-full h-32 px-3 py-2 rounded-lg border border-line text-[13px] outline-none focus:ring-2 focus:ring-brand/10 resize-none" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowTemplate(false)}>Cancel</Button>
            <Button onClick={handleSaveTemplate}>Save Template</Button>
          </div>
        </div>
      </Modal>

      {/* Recipients Modal */}
      <Modal open={showRecipients} onClose={() => setShowRecipients(false)} title="Report Recipients" size="md">
        <div className="space-y-3">
          <div className="flex gap-2">
            <input value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="Email address" onKeyDown={(e) => e.key === 'Enter' && addRecipient()}
              className="flex-1 h-[38px] px-3 rounded-lg border border-line text-[13px] outline-none focus:ring-2 focus:ring-brand/10" />
            <Button size="sm" onClick={addRecipient}>Add</Button>
          </div>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {recipients.emails.map((e, i) => (
              <div key={i} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-canvas-soft text-xs">
                <span className="flex-1 text-ink">{e}</span>
                <button onClick={() => setRecipients((r) => ({ ...r, emails: r.emails.filter((_, j) => j !== i) }))}
                  className="text-err hover:underline text-[10px]">Remove</button>
              </div>
            ))}
            {recipients.emails.length === 0 && <p className="text-xs text-ink-faint py-2">No recipients added yet.</p>}
          </div>
          <div className="space-y-1">
            <TimePicker12h label="Preferred Send Time" value={recipients.preferredTime} onChange={(v) => setRecipients((r) => ({ ...r, preferredTime: v }))} />
            <p className="text-[10px] text-ink-faint">Used to pre-fill the manual send action. Auto-dispatch is not yet available in this phase.</p>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowRecipients(false)}>Cancel</Button>
            <Button onClick={handleSaveRecipients}>Save Recipients</Button>
          </div>
        </div>
      </Modal>

      {/* Dispatch Log Modal */}
      <Modal open={showDispatchLog} onClose={() => setShowDispatchLog(false)} title="Dispatch Log" size="md">
        <div className="space-y-1 max-h-64 overflow-y-auto">
          {dispatchLog.length === 0 ? (
            <p className="text-xs text-ink-faint py-4">No dispatches recorded yet.</p>
          ) : (
            dispatchLog.map((d) => (
              <div key={d.id} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-canvas-soft text-xs">
                <span className="font-mono text-ink-faint">{new Date(d.sentAt).toLocaleDateString('en-IN')} {formatTime12h((d.sentAt || '').split('T')[1]?.slice(0, 5) || '')}</span>
                <span className="text-ink">To: {(d.recipients || []).join(', ')}</span>
                <span className="text-ink-muted">Via: {d.exportType}</span>
                <span className="text-ink-faint ml-auto">by {(d.sentBy || '').replace('user_', '') || 'Admin'}</span>
              </div>
            ))
          )}
        </div>
        <div className="flex justify-end mt-4"><Button variant="secondary" onClick={() => setShowDispatchLog(false)}>Close</Button></div>
      </Modal>

      {/* Filters */}
      <Card>
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1.5 w-full sm:w-auto">
            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="h-[34px] px-2.5 rounded-lg border border-line bg-white text-[12px] outline-none flex-1 sm:flex-initial" />
            <span className="text-xs text-ink-faint">to</span>
            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="h-[34px] px-2.5 rounded-lg border border-line bg-white text-[12px] outline-none flex-1 sm:flex-initial" />
          </div>
          <Dropdown value={filterPattern} onChange={(v) => setFilterPattern(typeof v === 'object' ? (v.value || '') : v)} placeholder="All Patterns"
            options={[{ value: '', label: 'All Patterns' }, ...PATTERNS.map((p) => ({ value: p, label: p === 'WEEKEND' ? 'Sat-Sun' : p }))]} getOptionLabel={(o) => o.label} getOptionValue={(o) => o.value} />
          <Dropdown value={filterCategory} onChange={(v) => setFilterCategory(typeof v === 'object' ? (v.value || '') : v)} placeholder="All Categories"
            options={[{ value: '', label: 'All Categories' }, ...CATEGORIES.map((c) => ({ value: c, label: c }))]} getOptionLabel={(o) => o.label} getOptionValue={(o) => o.value} />
          <Dropdown value={filterCourt} onChange={(v) => setFilterCourt(typeof v === 'object' ? (v.value || '') : v)} placeholder="All Courts"
            options={[{ value: '', label: 'All Courts' }, ...courts.map((c) => ({ value: c.id, label: c.name }))]} getOptionLabel={(o) => o.label} getOptionValue={(o) => o.value} />
          <Dropdown value={filterCoach} onChange={(v) => setFilterCoach(typeof v === 'object' ? (v.value || '') : v)} placeholder="All Coaches"
            options={[{ value: '', label: 'All Coaches' }, ...coaches.map((c) => ({ value: c.id, label: c.name }))]} getOptionLabel={(o) => o.label} getOptionValue={(o) => o.value} />
          <Dropdown value={filterMembership} onChange={(v) => setFilterMembership(typeof v === 'object' ? (v.value || '') : v)} placeholder="All Memberships"
            options={[{ value: '', label: 'All' }, { value: 'Member', label: 'Member' }, { value: 'Non-member', label: 'Non-member' }, { value: 'Guest', label: 'Guest/Trial' }]} getOptionLabel={(o) => o.label} getOptionValue={(o) => o.value} />
          <span className="text-xs text-ink-muted sm:ml-auto w-full sm:w-auto text-right">{rows.length} rows</span>
        </div>
      </Card>

      {/* Unique Active Players */}
      <Card>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-ink">Unique Active Players</h3>
            <p className="text-xs text-ink-muted">De-duplicated count — a player enrolled in multiple batches counts once.</p>
          </div>
          <span className="text-2xl font-bold text-brand">{uniquePlayers}</span>
        </div>
      </Card>

      {/* Month-over-Month Occupancy — hidden until real historical data exists (F4) */}
      <Card>
        <h3 className="text-sm font-semibold text-ink mb-3">Month-over-Month Occupancy</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="bg-canvas-soft rounded-lg p-3">
            <p className="text-ink-faint font-semibold uppercase text-[10px] mb-1">Current Month</p>
            <p className="text-lg font-bold text-ink">{analysis.academy.booked}/{analysis.academy.total}</p>
            <p className="text-ink-faint">{analysis.academy.occupancyPct}% occupied</p>
          </div>
          <div className="bg-canvas-soft rounded-lg p-3 flex items-center justify-center">
            <p className="text-ink-faint text-[11px] text-center">Comparison unavailable — single period of data. Historical month-over-month comparison requires the backend/historical data phase.</p>
          </div>
        </div>
      </Card>

      {/* Slot Analysis Section — Toggle between Executive Matrix (Excel Template) & Detailed Batch Schedule */}
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-line/60">
          <div className="space-y-1">
            <h3 className="text-base font-bold text-ink">Slot Analysis & Occupancy Report</h3>
            <p className="text-xs text-ink-muted">
              Referencing ATA Program Slot Matrix with MWF, TTS, and Weekend coaching breakdown.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {/* View Mode Toggle */}
            <div className="flex bg-canvas-soft p-1 rounded-xl border border-line text-xs">
              <button
                type="button"
                onClick={() => setReportView('matrix')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all ${
                  reportView === 'matrix' ? 'bg-white text-brand-700 shadow-xs' : 'text-ink-muted hover:text-ink'
                }`}
              >
                <Grid className="w-3.5 h-3.5" />
                Executive Matrix (Excel Format)
              </button>
              <button
                type="button"
                onClick={() => setReportView('schedule')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all ${
                  reportView === 'schedule' ? 'bg-white text-brand-700 shadow-xs' : 'text-ink-muted hover:text-ink'
                }`}
              >
                <Table className="w-3.5 h-3.5" />
                Detailed Schedule
              </button>
            </div>

            <Button size="sm" variant="secondary" icon={Download} onClick={() => window.print()}>PDF</Button>
            <Button size="sm" variant="primary" icon={Download} onClick={handleExportExcel}>Download Excel (.xlsx)</Button>
            <Button size="sm" variant="secondary" icon={Send} onClick={handleSend} disabled={!verification}>Send Excel Report</Button>
          </div>
        </div>

        {reportView === 'matrix' ? (
          <div className="space-y-6">
            {/* Academy Overall Analysis Block (Block 1) */}
            <div className="rounded-2xl border-2 border-brand/30 bg-gradient-to-br from-brand-50/40 via-white to-purple-50/30 p-4 sm:p-5 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-base font-bold text-ink">Academy Analysis</h4>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-brand text-white shadow-xs">
                      Primary Matrix
                    </span>
                  </div>
                  <p className="text-xs text-ink-muted mt-0.5">
                    Consolidated academy capacity across MWF, TTS, and Weekend coaching (Excludes Fitness).
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-semibold text-ink-muted uppercase">Overall Occupancy</span>
                  <div className="text-2xl font-black text-brand tracking-tight">
                    {analysis.academy?.occupancyPct}%
                  </div>
                </div>
              </div>

              {/* Academy Overview KPI row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                <div className="bg-white/90 p-3 rounded-xl border border-line/60">
                  <span className="text-[11px] font-semibold text-ink-muted uppercase">Total Available</span>
                  <div className="text-xl font-bold text-ink mt-0.5">{analysis.academy?.total} slots</div>
                </div>
                <div className="bg-white/90 p-3 rounded-xl border border-line/60">
                  <span className="text-[11px] font-semibold text-ok uppercase">Booked Slots</span>
                  <div className="text-xl font-bold text-ok mt-0.5">{analysis.academy?.booked} booked</div>
                </div>
                <div className="bg-white/90 p-3 rounded-xl border border-line/60">
                  <span className="text-[11px] font-semibold text-amber-600 uppercase">Open Slots</span>
                  <div className="text-xl font-bold text-amber-600 mt-0.5">{analysis.academy?.open} open</div>
                </div>
                <div className="bg-white/90 p-3 rounded-xl border border-line/60">
                  <span className="text-[11px] font-semibold text-brand-600 uppercase">Occupancy Rate</span>
                  <div className="text-xl font-bold text-brand-700 mt-0.5">{analysis.academy?.occupancyPct}%</div>
                </div>
              </div>

              {/* Academy Matrix Table */}
              <div className="overflow-x-auto rounded-xl border border-line/80 bg-white">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-line text-left text-ink-muted">
                      <th className="py-2.5 px-3.5 font-bold">Time Segment</th>
                      <th className="py-2.5 px-3.5 font-bold text-center">Total Capacity</th>
                      <th className="py-2.5 px-3.5 font-bold text-center text-ok">Booked Slots</th>
                      <th className="py-2.5 px-3.5 font-bold text-center text-amber-600">Open Slots</th>
                      <th className="py-2.5 px-3.5 font-bold text-center">Occupancy %</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line/40">
                    <tr>
                      <td className="py-2.5 px-3.5 font-semibold text-ink">Total Slots MWF</td>
                      <td className="py-2.5 px-3.5 text-center font-bold">{analysis.academy?.mwf?.total}</td>
                      <td className="py-2.5 px-3.5 text-center font-semibold text-ok">{analysis.academy?.mwf?.booked}</td>
                      <td className="py-2.5 px-3.5 text-center font-semibold text-amber-600">{analysis.academy?.mwf?.open}</td>
                      <td className="py-2.5 px-3.5 text-center font-bold">
                        {analysis.academy?.mwf?.total ? ((analysis.academy.mwf.booked / analysis.academy.mwf.total) * 100).toFixed(1) : 0}%
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3.5 font-semibold text-ink">Total Slots TTS</td>
                      <td className="py-2.5 px-3.5 text-center font-bold">{analysis.academy?.tts?.total}</td>
                      <td className="py-2.5 px-3.5 text-center font-semibold text-ok">{analysis.academy?.tts?.booked}</td>
                      <td className="py-2.5 px-3.5 text-center font-semibold text-amber-600">{analysis.academy?.tts?.open}</td>
                      <td className="py-2.5 px-3.5 text-center font-bold">
                        {analysis.academy?.tts?.total ? ((analysis.academy.tts.booked / analysis.academy.tts.total) * 100).toFixed(1) : 0}%
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3.5 font-semibold text-ink">Total Slots Sat & Sun</td>
                      <td className="py-2.5 px-3.5 text-center font-bold">{analysis.academy?.weekend?.total}</td>
                      <td className="py-2.5 px-3.5 text-center font-semibold text-ok">{analysis.academy?.weekend?.booked}</td>
                      <td className="py-2.5 px-3.5 text-center font-semibold text-amber-600">{analysis.academy?.weekend?.open}</td>
                      <td className="py-2.5 px-3.5 text-center font-bold">
                        {analysis.academy?.weekend?.total ? ((analysis.academy.weekend.booked / analysis.academy.weekend.total) * 100).toFixed(1) : 0}%
                      </td>
                    </tr>
                    <tr className="bg-brand-50/40 font-bold">
                      <td className="py-2.5 px-3.5 text-brand-900 font-extrabold">Total Available All Days</td>
                      <td className="py-2.5 px-3.5 text-center text-brand-900 font-extrabold">{analysis.academy?.total}</td>
                      <td className="py-2.5 px-3.5 text-center text-ok font-extrabold">{analysis.academy?.booked}</td>
                      <td className="py-2.5 px-3.5 text-center text-amber-600 font-extrabold">{analysis.academy?.open}</td>
                      <td className="py-2.5 px-3.5 text-center text-brand-900 font-extrabold">{analysis.academy?.occupancyPct}%</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* 10 Program Analysis Blocks Grid (Blocks 2 to 11) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* 1. Advance Class Analysis */}
              <ProgramAnalysisCard
                title="Advance Class Analysis"
                badge="ADV"
                mwf={analysis.matrix?.ADV?.mwf}
                tts={analysis.matrix?.ADV?.tts}
                total={analysis.matrix?.ADV?.total}
              />

              {/* 2. Intermediate Class Analysis */}
              <ProgramAnalysisCard
                title="Intermediate Class Analysis"
                badge="INT"
                mwf={analysis.matrix?.INT?.mwf}
                tts={analysis.matrix?.INT?.tts}
                total={analysis.matrix?.INT?.total}
              />

              {/* 3. Adults Class Analysis */}
              <ProgramAnalysisCard
                title="Adults Class Analysis"
                badge="ADULTS"
                mwf={analysis.matrix?.ADULT?.mwf}
                tts={analysis.matrix?.ADULT?.tts}
                total={analysis.matrix?.ADULT?.total}
              />

              {/* 4. Green Ball Class Analysis */}
              <ProgramAnalysisCard
                title="Green Ball Class Analysis"
                badge="GREEN"
                mwf={analysis.matrix?.GREEN?.mwf}
                tts={analysis.matrix?.GREEN?.tts}
                total={analysis.matrix?.GREEN?.total}
              />

              {/* 5. Orange Ball Class Analysis */}
              <ProgramAnalysisCard
                title="Orange Ball Class Analysis"
                badge="ORANGE"
                mwf={analysis.matrix?.ORANGE?.mwf}
                tts={analysis.matrix?.ORANGE?.tts}
                total={analysis.matrix?.ORANGE?.total}
              />

              {/* 6. Red Ball Class Analysis */}
              <ProgramAnalysisCard
                title="Red Ball Class Analysis"
                badge="RED"
                mwf={analysis.matrix?.RED?.mwf}
                tts={analysis.matrix?.RED?.tts}
                total={analysis.matrix?.RED?.total}
              />

              {/* 7. Junior Development Program (JDP) */}
              <ProgramAnalysisCard
                title="Junior Development Program (JDP)"
                badge="JDP"
                note="Capacity follows student (seated in ADV/INT/GREEN)"
                mwf={analysis.matrix?.JDP?.mwf}
                tts={analysis.matrix?.JDP?.tts}
                total={analysis.matrix?.JDP?.total}
                highlightBadge="Special Program"
              />

              {/* 8. High Performance Program (HPP) */}
              <ProgramAnalysisCard
                title="High Performance Program (HPP)"
                badge="HPP"
                note="Capacity follows student (seated in ADV)"
                mwf={analysis.matrix?.HPP?.mwf}
                tts={analysis.matrix?.HPP?.tts}
                total={analysis.matrix?.HPP?.total}
                highlightBadge="Special Program"
              />

              {/* 9. Weekend Coaching Program Analysis */}
              <div className="rounded-xl border border-line bg-white p-4 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <h5 className="font-bold text-xs text-ink">Weekend Coaching Program Analysis</h5>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-brand-50 text-brand-700">WEEKEND</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-line text-ink-muted text-left">
                          <th className="py-1.5 font-medium">Slot Time</th>
                          <th className="py-1.5 text-center font-medium">Avail</th>
                          <th className="py-1.5 text-center font-medium text-ok">Booked</th>
                          <th className="py-1.5 text-center font-medium text-amber-600">Open</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-line/40">
                        <tr>
                          <td className="py-1.5 font-medium">2:30pm Slots</td>
                          <td className="py-1.5 text-center">{analysis.matrix?.WEEKEND?.slot230?.total}</td>
                          <td className="py-1.5 text-center text-ok font-semibold">{analysis.matrix?.WEEKEND?.slot230?.booked}</td>
                          <td className="py-1.5 text-center text-amber-600 font-semibold">{analysis.matrix?.WEEKEND?.slot230?.open}</td>
                        </tr>
                        <tr>
                          <td className="py-1.5 font-medium">3:30pm Slots</td>
                          <td className="py-1.5 text-center">{analysis.matrix?.WEEKEND?.slot330?.total}</td>
                          <td className="py-1.5 text-center text-ok font-semibold">{analysis.matrix?.WEEKEND?.slot330?.booked}</td>
                          <td className="py-1.5 text-center text-amber-600 font-semibold">{analysis.matrix?.WEEKEND?.slot330?.open}</td>
                        </tr>
                        <tr className="bg-canvas-soft/60 font-bold">
                          <td className="py-1.5">All Days Total</td>
                          <td className="py-1.5 text-center">{analysis.matrix?.WEEKEND?.total?.total}</td>
                          <td className="py-1.5 text-center text-ok">{analysis.matrix?.WEEKEND?.total?.booked}</td>
                          <td className="py-1.5 text-center text-amber-600">{analysis.matrix?.WEEKEND?.total?.open}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
                <div className="mt-3 pt-2.5 border-t border-line/60 flex items-center justify-between text-xs">
                  <span className="font-medium text-ink-muted">Occupancy</span>
                  <span className="font-bold text-ink">{analysis.matrix?.WEEKEND?.total?.occupancyPct}%</span>
                </div>
              </div>

              {/* 10. Fitness Program Analysis */}
              <ProgramAnalysisCard
                title="Fitness Program Analysis"
                badge="FITNESS"
                note="Excluded from Academy total (Support program)"
                mwf={analysis.matrix?.FITNESS?.mwf}
                tts={analysis.matrix?.FITNESS?.tts}
                total={analysis.matrix?.FITNESS?.total}
              />
            </div>
          </div>
        ) : (
          /* Detailed Batch-Level Schedule Table */
          <div className="overflow-x-auto">
            <table className="w-full text-xs min-w-[780px]">
              <thead>
                <tr className="border-b border-line text-left text-ink-muted bg-canvas-soft/30">
                  <th className="py-2.5 px-3 font-semibold whitespace-nowrap">Day/Pattern</th>
                  <th className="py-2.5 px-3 font-semibold whitespace-nowrap">Court & Time</th>
                  <th className="py-2.5 px-3 font-semibold whitespace-nowrap">Category</th>
                  <th className="py-2.5 px-3 font-semibold whitespace-nowrap text-center">Capacity</th>
                  <th className="py-2.5 px-3 font-semibold whitespace-nowrap text-center">Enrolled</th>
                  <th className="py-2.5 px-3 font-semibold whitespace-nowrap text-center">Attended</th>
                  <th className="py-2.5 px-3 font-semibold whitespace-nowrap text-center">Members</th>
                  <th className="py-2.5 px-3 font-semibold whitespace-nowrap text-center">Non-members</th>
                  <th className="py-2.5 px-3 font-semibold whitespace-nowrap text-center">Guest/Trial</th>
                  <th className="py-2.5 px-3 font-semibold whitespace-nowrap text-center">Occupancy</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-b border-line/50 hover:bg-canvas-soft/40 transition-colors">
                    <td className="py-2.5 px-3 font-semibold text-ink whitespace-nowrap">{r.dayPattern}</td>
                    <td className="py-2.5 px-3 text-ink-muted whitespace-nowrap">{r.courtName} · {formatTime12h(r.startTime)}-{formatTime12h(r.endTime)}</td>
                    <td className="py-2.5 px-3 font-semibold text-ink whitespace-nowrap">{r.program}</td>
                    <td className="py-2.5 px-3 text-center whitespace-nowrap">{r.capacity}</td>
                    <td className="py-2.5 px-3 text-center whitespace-nowrap">{r.enrolled}</td>
                    <td className="py-2.5 px-3 text-center whitespace-nowrap">{r.attended}</td>
                    <td className="py-2.5 px-3 text-center whitespace-nowrap">{r.members}</td>
                    <td className="py-2.5 px-3 text-center whitespace-nowrap cursor-pointer hover:text-brand-600 font-medium" onClick={() => { setNonMemberList(r.nonMemberNames); setShowNonMembers(true); }}>
                      <span className="underline decoration-dotted">{r.nonMembers}</span>
                    </td>
                    <td className="py-2.5 px-3 text-center whitespace-nowrap">{r.totalGuests}</td>
                    <td className="py-2.5 px-3 text-center whitespace-nowrap">
                      <div className="inline-flex items-center justify-center gap-1.5">
                        <StatusPill status={r.occupancy >= 80 ? 'success' : r.occupancy >= 50 ? 'warning' : 'error'} />
                        <span className="font-semibold">{r.occupancy}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>


      {/* Non-member drill-down modal */}
      {showNonMembers && (
        <div className="fixed inset-0 z-[310] flex items-center justify-center bg-black/30" onClick={() => setShowNonMembers(false)}>
          <div className="bg-white rounded-2xl p-5 w-full max-w-sm m-4 shadow-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-base font-semibold text-ink mb-3">Non-members</h3>
            <div className="space-y-1 max-h-60 overflow-y-auto">
              {nonMemberList.map((n, i) => (
                <div key={i} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-canvas-soft text-xs">
                  <span className="font-semibold text-ink">{n.name}</span>
                  <span className="text-ink-muted">{n.phone}</span>
                </div>
              ))}
            </div>
            <div className="flex justify-end mt-4"><Button variant="secondary" onClick={() => setShowNonMembers(false)}>Close</Button></div>
          </div>
        </div>
      )}

      {/* Recent Activity */}
      {recentActivity.length > 0 && (
        <Card>
          <div className="flex items-center gap-2 mb-3"><Radio className="w-4 h-4 text-brand" /><h3 className="text-sm font-semibold text-ink">Recent Activity</h3></div>
          <div className="space-y-1">
            {recentActivity.map((a, i) => (
              <div key={i} className="flex flex-wrap items-center gap-2 sm:gap-3 px-3 py-2 rounded-lg bg-canvas-soft text-[11px] text-ink-muted">
                <span className="font-mono text-ink-faint w-14 shrink-0">{a.time}</span>
                <span className="font-semibold text-ink w-20 shrink-0 truncate">{a.who}</span>
                <span className="flex-1 min-w-[150px]">{a.action} · {a.detail}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Ambiguous Students */}
      {ambiguous.length > 0 && (
        <Card>
          <div className="flex items-center gap-2 mb-3"><AlertTriangle className="w-4 h-4 text-warn" /><h3 className="text-sm font-semibold text-ink">Ambiguous Students ({ambiguous.length})</h3></div>
          <div className="space-y-1">
            {ambiguous.map((a, i) => (
              <div key={i} className="flex flex-wrap items-center gap-2 sm:gap-3 px-3 py-2 rounded-lg bg-warn-bg text-xs">
                <span className="font-semibold text-ink min-w-[120px]">{a.studentName || a.studentId}</span>
                <span className="text-ink-muted">Categories: {a.programs?.join(', ')}</span>
                <span className="text-brand-600 sm:ml-auto font-medium">→ Resolves to: {a.resolvedProgram}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Drift Flags */}
      {driftFlags.length > 0 && (
        <Card>
          <div className="flex items-center gap-2 mb-3"><TrendingUp className="w-4 h-4 text-brand" /><h3 className="text-sm font-semibold text-ink">Needs Review — Drift Flags ({driftFlags.length})</h3></div>
          <div className="space-y-1">
            {driftFlags.map((d, i) => (
              <div key={i} className="flex flex-wrap items-center gap-2 sm:gap-3 px-3 py-2 rounded-lg bg-brand-50 text-xs">
                <span className="font-semibold text-brand-600 min-w-[90px]">{d.scope}</span>
                <span className="text-ink-muted">Stored: {d.sheetValue} | Actual: {d.actualValue}</span>
                <span className="text-ink-faint sm:ml-auto">{d.note}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Slot Analysis Summary — segment blocks (same visual language as Overview court cards) */}
      <Card>
        <h3 className="text-sm font-semibold text-ink mb-3">Slot Analysis Summary</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {Object.entries(analysis.scopes || {}).map(([scope, data]) => (
            <div key={scope} className="bg-canvas-soft rounded-lg p-3 min-w-0 flex flex-col justify-between gap-2.5">
              <p className="text-[10px] font-semibold text-ink-muted uppercase truncate">{scope}</p>
              <CapacityIndicator variant="segments" maxBlocks={20} filled={data.booked} total={data.total} className="w-full" />
            </div>
          ))}
          <div className="bg-brand-50 rounded-lg p-3 min-w-0 flex flex-col justify-between gap-2.5">
            <p className="text-[10px] font-semibold text-brand-600 uppercase truncate">ACADEMY</p>
            <CapacityIndicator variant="segments" maxBlocks={20} filled={analysis.academy.booked} total={analysis.academy.total} className="w-full" />
          </div>
        </div>
      </Card>


    </div>
  );
}


function ProgramAnalysisCard({ title, badge, note, mwf, tts, total, highlightBadge }) {
  return (
    <div className="rounded-xl border border-line bg-white p-4 shadow-xs flex flex-col justify-between">
      <div>
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="min-w-0 flex-1">
            <h5 className="font-bold text-xs text-ink truncate" title={title}>{title}</h5>
            {note && <p className="text-[10px] text-ink-faint truncate mt-0.5">{note}</p>}
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {highlightBadge && (
              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-purple-100 text-purple-800">
                {highlightBadge}
              </span>
            )}
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-brand-50 text-brand-700">
              {badge}
            </span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-line text-ink-muted text-left">
                <th className="py-1.5 font-medium">Segment</th>
                <th className="py-1.5 text-center font-medium">Avail</th>
                <th className="py-1.5 text-center font-medium text-ok">Booked</th>
                <th className="py-1.5 text-center font-medium text-amber-600">Open</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/40">
              <tr>
                <td className="py-1.5 font-medium">MWF</td>
                <td className="py-1.5 text-center">{mwf?.total || 0}</td>
                <td className="py-1.5 text-center text-ok font-semibold">{mwf?.booked || 0}</td>
                <td className="py-1.5 text-center text-amber-600 font-semibold">{mwf?.open || 0}</td>
              </tr>
              <tr>
                <td className="py-1.5 font-medium">TTS</td>
                <td className="py-1.5 text-center">{tts?.total || 0}</td>
                <td className="py-1.5 text-center text-ok font-semibold">{tts?.booked || 0}</td>
                <td className="py-1.5 text-center text-amber-600 font-semibold">{tts?.open || 0}</td>
              </tr>
              <tr className="bg-canvas-soft/60 font-bold">
                <td className="py-1.5">All Days</td>
                <td className="py-1.5 text-center">{total?.total || 0}</td>
                <td className="py-1.5 text-center text-ok">{total?.booked || 0}</td>
                <td className="py-1.5 text-center text-amber-600">{total?.open || 0}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <div className="mt-3 pt-2.5 border-t border-line/60 flex items-center justify-between text-xs">
        <span className="font-medium text-ink-muted">Occupancy</span>
        <span className="font-bold text-ink">{total?.occupancyPct || 0}%</span>
      </div>
    </div>
  );
}
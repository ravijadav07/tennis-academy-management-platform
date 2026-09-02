import { useMemo, useState, useEffect } from 'react';
import { useDb } from '../../../context/DbContext';
import { useAuth } from '../../../context/AuthContext';
import { computeSlotAnalysis, findAmbiguousStudents } from '../../../mocks/rules';
import Card from '../../ui/Card';
import StatusPill from '../../ui/StatusPill';
import Button from '../../ui/Button';
import Modal from '../../ui/Modal';
import Dropdown from '../../ui/Dropdown';
import { formatTime12h } from '../../../utils/formatters';
import TimePicker12h from '../../ui/TimePicker12h';
import { toast } from 'sonner';
import { Download, AlertTriangle, TrendingUp, Radio, ShieldCheck, Send, Settings, Mail, Clock, CheckCircle } from 'lucide-react';

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

  // Handle Send — manual mailto: with template
  const handleSend = async () => {
    if (!verification) {
      toast.error('Verify the report first before sending');
      return;
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
    toast.success('Dispatch logged. Opening mail client...');
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

  // Export CSV
  const handleExportCSV = () => {
    const header = 'Day/Pattern,Court & Time,Category,Capacity,Enrolled,Attended,Members,Non-members,Guest/Trial,Occupancy %';
    const csvRows = rows.map((r) => [
      r.dayPattern, r.courtName + ' ' + formatTime12h(r.startTime) + '-' + formatTime12h(r.endTime),
      r.program, r.capacity, r.enrolled, r.attended, r.members, r.nonMembers, r.totalGuests, r.occupancy + '%'
    ].join(','));
    const csv = [header, ...csvRows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'slot-analysis-' + dateFrom + '.csv'; a.click();
    URL.revokeObjectURL(url);
    toast.success('CSV exported');
  };

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

      {/* Slot Analysis Table */}
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <h3 className="text-sm font-semibold text-ink">Slot Analysis</h3>
          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" variant="secondary" icon={Download} onClick={() => window.print()}>PDF</Button>
            <Button size="sm" variant="secondary" icon={Download} onClick={handleExportCSV}>Excel</Button>
            <Button size="sm" variant="secondary" icon={Send} onClick={handleSend} disabled={!verification}>Send Excel Report</Button>
          </div>
        </div>
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

      {/* Slot Analysis Summary (classic table) */}
      <Card>
        <h3 className="text-sm font-semibold text-ink mb-3">Slot Analysis Summary</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs min-w-[500px]">
            <thead>
              <tr className="border-b border-line text-left text-ink-muted bg-canvas-soft/30">
                <th className="py-2.5 px-3 font-semibold whitespace-nowrap">Category</th>
                <th className="py-2.5 px-3 font-semibold whitespace-nowrap text-center">Total</th>
                <th className="py-2.5 px-3 font-semibold whitespace-nowrap text-center">Booked</th>
                <th className="py-2.5 px-3 font-semibold whitespace-nowrap text-center">Open</th>
                <th className="py-2.5 px-3 font-semibold whitespace-nowrap text-center">Occupancy</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(analysis.scopes || {}).filter(([s]) => s !== 'FITNESS').map(([scope, data]) => (
                <tr key={scope} className="border-b border-line/50 hover:bg-canvas-soft/40 transition-colors">
                  <td className="py-2.5 px-3 font-semibold text-ink whitespace-nowrap">{scope}</td>
                  <td className="py-2.5 px-3 text-center whitespace-nowrap">{data.total}</td>
                  <td className="py-2.5 px-3 text-center whitespace-nowrap">{data.booked}</td>
                  <td className="py-2.5 px-3 text-center whitespace-nowrap">{data.open}</td>
                  <td className="py-2.5 px-3 text-center whitespace-nowrap">
                    <div className="inline-flex items-center justify-center gap-1.5">
                      <StatusPill status={data.occupancyPct >= 80 ? 'success' : data.occupancyPct >= 50 ? 'warning' : 'error'} />
                      <span className="font-semibold">{data.occupancyPct}%</span>
                    </div>
                  </td>
                </tr>
              ))}
              {analysis.scopes?.FITNESS && (
                <tr className="border-b border-line/50 bg-canvas-soft">
                  <td className="py-2.5 px-3 font-semibold text-ink-muted whitespace-nowrap">FITNESS</td>
                  <td className="py-2.5 px-3 text-center text-ink-muted whitespace-nowrap">{analysis.scopes.FITNESS.total}</td>
                  <td className="py-2.5 px-3 text-center text-ink-muted whitespace-nowrap">{analysis.scopes.FITNESS.booked}</td>
                  <td className="py-2.5 px-3 text-center text-ink-muted whitespace-nowrap">{analysis.scopes.FITNESS.open}</td>
                  <td className="py-2.5 px-3 text-center text-ink-muted whitespace-nowrap">{analysis.scopes.FITNESS.occupancyPct}%</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
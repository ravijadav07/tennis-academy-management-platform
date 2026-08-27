import { useMemo, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useDb } from '../../../context/DbContext';
import { getEligibility } from '../../../mocks/rules';
import Card from '../../ui/Card';
import StatusPill from '../../ui/StatusPill';
import EligibilityStatusPill from '../../ui/EligibilityStatusPill';
import Button from '../../ui/Button';
import Modal from '../../ui/Modal';
import Dropdown from '../../ui/Dropdown';
import { toast } from 'sonner';
import { ArrowLeft, Clock, MapPin, Pencil, Archive } from 'lucide-react';

const FIELD = 'w-full h-[38px] px-3 rounded-lg border border-line bg-white text-[13px] text-ink outline-none focus:ring-2 focus:ring-brand/10 focus:border-brand transition-all';
const LBL = 'block text-[10px] font-semibold text-ink-muted uppercase tracking-[0.04em] mb-1';
const PATTERNS = ['MWF', 'TTS', 'WEEKEND'];
const CATEGORY_OPTIONS = [
  { value: 'ADV', label: 'Advance' },
  { value: 'INT', label: 'Intermediate' },
  { value: 'ADULT', label: 'Adults' },
  { value: 'JDP', label: 'JDP' },
  { value: 'HPP', label: 'HPP' },
  { value: 'WEEKEND', label: 'Weekend' },
  { value: 'FITNESS', label: 'Fitness' },
  { value: 'GREEN', label: 'Green' },
  { value: 'ORANGE', label: 'Orange' },
  { value: 'RED', label: 'Red' },
];
const BALL_COLORS = ['Yellow', 'Green', 'Orange', 'Red'];
const CATEGORIES_WITH_BALL = new Set(['ADV', 'INT']);
const CATEGORIES_AUTO_BALL = { GREEN: 'Green', ORANGE: 'Orange', RED: 'Red' };

function resolveBallColor(category, current) {
  if (CATEGORIES_WITH_BALL.has(category)) return current || '';
  if (CATEGORIES_AUTO_BALL[category]) return CATEGORIES_AUTO_BALL[category];
  return null;
}

export default function BatchDetail() {
  const { batchId } = useParams();
  const navigate = useNavigate();
  const loc = useLocation();
  const { db, tick } = useDb();
  const s = useMemo(() => db.readAll(), [db, tick]);
  const today = new Date().toISOString().split('T')[0];
  const batch = s.batches.find((b) => b.id === batchId);
  const [showEdit, setShowEdit] = useState(false);
  const [ef, setEf] = useState({});
  const [showArchive, setShowArchive] = useState(false);
  const [ar, setAr] = useState('');
  const parent = (loc.state && loc.state.from) || '/admin/schedule';
  const prefill = (loc.state && loc.state.prefill) || {};
  const coaches = s.coaches || [];
  const courts = s.courts || [];

  // Create-batch form state (always declared, only used when batchId === 'new')
  const [nf, setNf] = useState(() => ({
    program: '', ballLevel: '', courtId: prefill.courtId || (courts.length > 0 ? courts[0].id : ''),
    dayPattern: prefill.dayPattern || 'MWF', startTime: '', endTime: '',
    capacity: '', primaryCoachId: '', supportCoachId: '', isSemiBatch: false,
  }));

  const handleNfCategoryChange = (v) => {
    const prog = typeof v === 'object' ? (v?.value || '') : (v || '');
    let nextBall = '';
    if (CATEGORIES_WITH_BALL.has(prog)) {
      nextBall = '';
    } else if (CATEGORIES_AUTO_BALL[prog]) {
      nextBall = CATEGORIES_AUTO_BALL[prog];
    } else {
      nextBall = null;
    }
    setNf((f) => ({ ...f, program: prog, ballLevel: nextBall }));
  };

  const handleEfCategoryChange = (v) => {
    const prog = typeof v === 'object' ? (v?.value || '') : (v || '');
    let nextBall = '';
    if (CATEGORIES_WITH_BALL.has(prog)) {
      nextBall = '';
    } else if (CATEGORIES_AUTO_BALL[prog]) {
      nextBall = CATEGORIES_AUTO_BALL[prog];
    } else {
      nextBall = null;
    }
    setEf((f) => ({ ...f, program: prog, ballLevel: nextBall }));
  };

  const handleCreate = async () => {
    if (!nf.program || !nf.startTime) { toast.error('Category and start time are required'); return; }
    const ballForCreate = CATEGORIES_WITH_BALL.has(nf.program) && !nf.ballLevel ? null : resolveBallColor(nf.program, nf.ballLevel);
    if (CATEGORIES_WITH_BALL.has(nf.program) && !ballForCreate) { toast.error('Ball Color is required for this category'); return; }
    try {
      const newBatch = await db.upsertBatch({
        ...nf, ballLevel: ballForCreate, capacity: parseInt(nf.capacity) || 0,
        supportCoachId: nf.supportCoachId || null, isSemiBatch: nf.isSemiBatch || false,
        status: 'ACTIVE',
      });
      toast.success('Batch created');
      navigate('/admin/batches/' + newBatch.id, { state: { from: parent } });
    } catch (e) {
      toast.error(e.message === 'COURT_CONFLICT' ? 'Court conflict: another batch occupies this time slot' : e.message);
    }
  };

  // "new" batchId → render Create Batch form
  if (batchId === 'new') {
    return (
      <div className="space-y-4">
        <button onClick={() => navigate(parent)} className="inline-flex items-center gap-1.5 text-[13px] text-ink-muted hover:text-ink transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Schedule
        </button>
        <Card>
          <div className="space-y-3">
            {/* Connected Category & Ball Color Classification Group */}
            <div className="rounded-xl border border-line bg-canvas-soft/40 p-3">
              <div className={CATEGORIES_WITH_BALL.has(nf.program) ? "grid grid-cols-2 gap-3 items-center" : "space-y-1"}>
                <Sel label="Category *" value={nf.program} onChange={handleNfCategoryChange} options={CATEGORY_OPTIONS} emptyOption="Select Category..." />
                {CATEGORIES_WITH_BALL.has(nf.program) && (
                  <div className="space-y-1">
                    <div className="flex items-center gap-1 mb-1">
                      <span className="text-brand text-xs font-bold leading-none">›</span>
                      <label className={LBL + " !mb-0 text-brand-600 font-bold"}>Ball Color *</label>
                    </div>
                    <Dropdown
                      value={nf.ballLevel || ''}
                      onChange={(v) => setNf((f) => ({ ...f, ballLevel: typeof v === 'object' ? (v.value || v) : v }))}
                      placeholder="Select ball color..."
                      options={BALL_COLORS.map((b) => ({ value: b, label: b }))}
                      getOptionLabel={(o) => (o && o.label) || ''}
                      getOptionValue={(o) => (o && o.value) || ''}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Batch Details Group */}
            <div className="grid grid-cols-2 gap-3">
              <Sel label="Court" value={nf.courtId} onChange={(v) => setNf((f) => ({ ...f, courtId: v }))} options={courts.map((c) => ({ value: c.id, label: c.name }))} />
              <Sel label="Day Pattern" value={nf.dayPattern} onChange={(v) => setNf((f) => ({ ...f, dayPattern: v }))} options={PATTERNS.map((p) => ({ value: p, label: p === 'WEEKEND' ? 'Sat-Sun' : p }))} />
              <Field label="Capacity" type="number" value={nf.capacity} onChange={(v) => setNf((f) => ({ ...f, capacity: v }))} />
              <Field label="Start Time *" type="time" value={nf.startTime} onChange={(v) => setNf((f) => ({ ...f, startTime: v }))} />
              <Field label="End Time" type="time" value={nf.endTime} onChange={(v) => setNf((f) => ({ ...f, endTime: v }))} />
              <Sel label="Primary Coach" value={nf.primaryCoachId} onChange={(v) => setNf((f) => ({ ...f, primaryCoachId: v }))} options={coaches.map((c) => ({ value: c.id, label: c.name }))} emptyOption="Select..." />
              <Sel label="Support Coach" value={nf.supportCoachId} onChange={(v) => setNf((f) => ({ ...f, supportCoachId: v }))} options={coaches.map((c) => ({ value: c.id, label: c.name }))} emptyOption="None" />
            </div>
          </div>
          <label className="flex items-center gap-2 text-xs mt-3">
            <input type="checkbox" checked={nf.isSemiBatch || false} onChange={(e) => setNf((f) => ({ ...f, isSemiBatch: e.target.checked }))} />
            Semi-batch (paired)
          </label>
          <p className="text-[10px] text-ink-faint mt-2">Coach management coming in a later phase. Picker is read-only from existing coaches.</p>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="secondary" onClick={() => navigate(parent)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={!nf.program || !nf.startTime}>Create Batch</Button>
          </div>
        </Card>
      </div>
    );
  }

  if (!batch) return <div className="p-4 text-sm text-ink-muted">Batch not found.</div>;

  const roster = s.enrollments.filter((e) => e.batchId === batchId && e.status === 'ACTIVE');
  const pc = s.coaches.find((c) => c.id === batch.primaryCoachId);
  const sc = s.coaches.find((c) => c.id === batch.supportCoachId);
  const court = s.courts.find((c) => c.id === batch.courtId);
  const waitlist = batch.waitlist || [];

  const openEdit = () => {
    setEf({ program: batch.program, ballLevel: batch.ballLevel || '', courtId: batch.courtId, dayPattern: batch.dayPattern,
      startTime: batch.startTime || '', endTime: batch.endTime || '', capacity: batch.capacity,
      primaryCoachId: batch.primaryCoachId || '', supportCoachId: batch.supportCoachId || '',
      isSemiBatch: batch.isSemiBatch || false });
    setShowEdit(true);
  };

  const doEdit = async () => {
    try {
      const cap = parseInt(ef.capacity) || 0;
      if (cap < roster.length && !window.confirm('Capacity lower than roster (' + cap + ' vs ' + roster.length + '). Continue?')) return;
      await db.upsertBatch({ ...batch, ...ef, capacity: cap,
        supportCoachId: ef.supportCoachId || null, isSemiBatch: ef.isSemiBatch || false });
      toast.success('Batch updated'); setShowEdit(false);
    } catch (e) {
      toast.error(e.message === 'COURT_CONFLICT' ? 'Court conflict: another batch occupies this time slot' : e.message);
    }
  };

  const doArchive = async () => {
    if (!ar.trim()) { toast.error('Reason is required'); return; }
    try { await db.archiveBatch({ batchId, reason: ar }); toast.success('Batch archived'); setShowArchive(false); navigate(parent); }
    catch (e) { toast.error(e.message); }
  };

  return (
    <div className="space-y-4">
      <button onClick={() => navigate(parent)} className="inline-flex items-center gap-1.5 text-[13px] text-ink-muted hover:text-ink transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Schedule
      </button>

      <Card>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-ink">{batch.program} {batch.dayPattern}</h3>
            <p className="text-xs text-ink-muted mt-0.5">
              <Clock className="w-3 h-3 inline mr-1" />{batch.startTime} - {batch.endTime}
              <span className="mx-1">&middot;</span>
              <MapPin className="w-3 h-3 inline mr-1" />{court ? court.name : 'Unknown'}
            </p>
            <p className="text-xs text-ink-muted">
              Coach: {pc ? pc.name : 'Unassigned'}
              {sc ? <span className="text-brand-600"> &middot; Support: {sc.name}</span> : null}
            </p>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="secondary" icon={Pencil} onClick={openEdit}>Edit</Button>
            <Button size="sm" variant="danger" icon={Archive} onClick={() => setShowArchive(true)}>Archive</Button>
          </div>
        </div>
        <div className="mt-3 flex items-center gap-2">
          <span className="text-sm font-semibold text-ink">{roster.length}/{batch.capacity}</span>
          <div className="flex-1 h-2 bg-line rounded-full overflow-hidden">
            <div className="h-full bg-brand rounded-full" style={{ width: batch.capacity > 0 ? Math.round((roster.length / batch.capacity) * 100) + '%' : '0%' }} />
          </div>
        </div>
      </Card>

      <Card>
        <h3 className="text-sm font-semibold text-ink mb-3">Roster</h3>
        <div className="space-y-1">
          {roster.map((e) => {
            const st = s.students.find((x) => x.id === e.studentId);
            const pkg = s.packages.find((p) => p.studentId === e.studentId);
            const elig = getEligibility(pkg, today);
            const blocked = !elig.markable;
            return (
              <div key={e.id} className={'flex items-center gap-3 px-3 py-2 rounded-lg text-xs ' + (blocked ? 'bg-err-bg/30 opacity-60' : 'bg-canvas-soft')}>
                <span className="font-semibold text-ink">{st ? st.name : 'Unknown'}</span>
                <StatusPill status={e.billingProgram} />
                {st && st.isGuest ? <StatusPill status="guest" /> : null}
                {blocked ? <EligibilityStatusPill package={pkg} date={today} /> : null}
              </div>
            );
          })}
        </div>
        {waitlist.length > 0 ? (
          <div className="mt-4">
            <h4 className="text-xs font-semibold text-ink-muted mb-2">Waitlist ({waitlist.length})</h4>
            {waitlist.map((w, i) => (
              <div key={i} className="flex items-center gap-3 px-3 py-1.5 text-xs text-ink-muted">
                <span className="text-brand-600 font-mono">{'#' + (i + 1)}</span>
                <span>{w.studentName || w.studentId}</span>
              </div>
            ))}
          </div>
        ) : null}
      </Card>

      <Modal open={showEdit} onClose={() => setShowEdit(false)} title="Edit Batch" size="md">
        <div className="space-y-3">
          {/* Connected Category & Ball Color Classification Group */}
          <div className="rounded-xl border border-line bg-canvas-soft/40 p-3">
            <div className={CATEGORIES_WITH_BALL.has(ef.program) ? "grid grid-cols-2 gap-3 items-center" : "space-y-1"}>
              <Sel label="Category" value={ef.program || ''} onChange={handleEfCategoryChange} options={CATEGORY_OPTIONS} emptyOption="Select Category..." />
              {CATEGORIES_WITH_BALL.has(ef.program) && (
                <div className="space-y-1">
                  <div className="flex items-center gap-1 mb-1">
                    <span className="text-brand text-xs font-bold leading-none">›</span>
                    <label className={LBL + " !mb-0 text-brand-600 font-bold"}>Ball Color *</label>
                  </div>
                  <Dropdown
                    value={ef.ballLevel || ''}
                    onChange={(v) => setEf((f) => ({ ...f, ballLevel: typeof v === 'object' ? (v.value || v) : v }))}
                    placeholder="Select ball color..."
                    options={BALL_COLORS.map((b) => ({ value: b, label: b }))}
                    getOptionLabel={(o) => (o && o.label) || ''}
                    getOptionValue={(o) => (o && o.value) || ''}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Batch Details Group */}
          <div className="grid grid-cols-2 gap-3">
            <Sel label="Court" value={ef.courtId || ''} onChange={(v) => setEf((f) => ({ ...f, courtId: v }))} options={courts.map((c) => ({ value: c.id, label: c.name }))} />
            <Sel label="Day Pattern" value={ef.dayPattern || 'MWF'} onChange={(v) => setEf((f) => ({ ...f, dayPattern: v }))} options={PATTERNS.map((p) => ({ value: p, label: p === 'WEEKEND' ? 'Sat-Sun' : p }))} />
            <Field label="Capacity" type="number" value={ef.capacity || ''} onChange={(v) => setEf((f) => ({ ...f, capacity: v }))} />
            <Field label="Start Time" type="time" value={ef.startTime || ''} onChange={(v) => setEf((f) => ({ ...f, startTime: v }))} />
            <Field label="End Time" type="time" value={ef.endTime || ''} onChange={(v) => setEf((f) => ({ ...f, endTime: v }))} />
            <Sel label="Primary Coach" value={ef.primaryCoachId || ''} onChange={(v) => setEf((f) => ({ ...f, primaryCoachId: v }))} options={coaches.map((c) => ({ value: c.id, label: c.name }))} emptyOption="Select..." />
            <Sel label="Support Coach" value={ef.supportCoachId || ''} onChange={(v) => setEf((f) => ({ ...f, supportCoachId: v }))} options={coaches.map((c) => ({ value: c.id, label: c.name }))} emptyOption="None" />
          </div>
        </div>
        <label className="flex items-center gap-2 text-xs mt-3">
          <input type="checkbox" checked={ef.isSemiBatch || false} onChange={(e) => setEf((f) => ({ ...f, isSemiBatch: e.target.checked }))} />
          Semi-batch (paired)
        </label>
        <p className="text-[10px] text-ink-faint mt-2">Coach management coming in a later phase. Picker is read-only from existing coaches.</p>
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="secondary" onClick={() => setShowEdit(false)}>Cancel</Button>
          <Button onClick={doEdit}>Save Changes</Button>
        </div>
      </Modal>

      <Modal open={showArchive} onClose={() => setShowArchive(false)} title="Archive Batch" size="sm">
        <div className="space-y-3">
          <p className="text-xs text-ink-muted">This batch will be removed from the active Schedule grid but preserved in history.</p>
          <div className="space-y-1">
            <label className={LBL}>Reason *</label>
            <textarea value={ar} onChange={(e) => setAr(e.target.value)}
              className="w-full h-20 px-3 py-2 rounded-lg border border-line text-[13px] outline-none focus:ring-2 focus:ring-brand/10 resize-none"
              placeholder="Why is this batch being archived?" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowArchive(false)}>Cancel</Button>
            <Button variant="danger" onClick={doArchive}>Archive Batch</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function Field({ label, type, value, onChange }) {
  return (<div className="space-y-1"><label className={LBL}>{label}</label>
    <input type={type || 'text'} value={value} onChange={(e) => onChange(e.target.value)} className={FIELD} /></div>);
}

function Sel({ label, value, onChange, options, emptyOption }) {
  const rawValue = value || '';
  return (<div className="space-y-1"><label className={LBL}>{label}</label>
    <Dropdown
      value={rawValue}
      onChange={(v) => onChange(typeof v === 'object' ? (v.value || v) : v)}
      placeholder={emptyOption || 'Select...'}
      options={options}
      getOptionLabel={(o) => (o && o.label) || ''}
      getOptionValue={(o) => (o && o.value) || ''}
    /></div>);
}
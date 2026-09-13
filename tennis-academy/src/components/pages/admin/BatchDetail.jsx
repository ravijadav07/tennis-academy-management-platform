import { useMemo, useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useSupabase } from '../../../context/SupabaseContext';
import { getEligibility } from '../../../mocks/rules';
import Card from '../../ui/Card';
import StatusPill from '../../ui/StatusPill';
import EligibilityStatusPill from '../../ui/EligibilityStatusPill';
import CapacityIndicator from '../../ui/CapacityIndicator';
import Button from '../../ui/Button';
import Modal from '../../ui/Modal';
import Dropdown from '../../ui/Dropdown';
import { toast } from 'sonner';
import { formatTime12h, formatDateDDMMYY } from '../../../utils/formatters';
import { ArrowLeft, Clock, MapPin, Pencil, Archive } from 'lucide-react';
import TimePicker12h from '../../ui/TimePicker12h';
import { db } from '../../../mocks/localDb';

const FIELD = 'w-full h-[38px] px-3 rounded-lg border border-line bg-white text-[13px] text-ink outline-none focus:ring-2 focus:ring-brand/10 focus:border-brand transition-all';
const LBL = 'block text-[10px] font-semibold text-ink-muted uppercase tracking-[0.04em] mb-1';
const PATTERNS = ['MWF', 'TTS'];
const CATEGORY_OPTIONS = [
  { value: 'ADV', label: 'Advance' },
  { value: 'INT', label: 'Intermediate' },
  { value: 'BEG', label: 'Beginner' },
  { value: 'JDP', label: 'JDP (Junior Development Program)' },
  { value: 'HPP', label: 'HPP (High Performance Program)' },
  { value: 'ADULT', label: 'Adults' },
  { value: 'WEEKEND', label: 'Weekend Coaching' },
  { value: 'FITNESS', label: 'Fitness' },
];
const BALL_COLORS = ['Yellow', 'Green', 'Orange', 'Red'];
const CATEGORIES_WITH_BALL = new Set(['ADV', 'INT', 'BEG', 'WEEKEND', 'JDP', 'HPP']);

function computeBatchName({ program, ballLevel, courtId, startTime, endTime }, courts) {
  const courtObj = (courts || []).find((c) => c.id === courtId);
  const courtName = courtObj ? courtObj.name : 'Court';

  const progMap = {
    ADV: 'Advance',
    INT: 'Intermediate',
    BEG: 'Beginner',
    ADULT: 'Adults',
    JDP: 'JDP',
    HPP: 'HPP',
    WEEKEND: 'Weekend',
    FITNESS: 'Fitness',
  };
  const progLabel = progMap[program] || program || '';

  let ballText = '';
  if (ballLevel) {
    ballText = `${ballLevel} Ball`;
  }

  const timeText = startTime && endTime
    ? `${formatTime12h(startTime)} to ${formatTime12h(endTime)}`
    : startTime ? formatTime12h(startTime) : '';

  const mid = [progLabel, ballText].filter(Boolean).join(' ');
  return [courtName, mid, timeText].filter(Boolean).join(' - ');
}

export default function BatchDetail() {
  const { batchId } = useParams();
  const navigate = useNavigate();
  const loc = useLocation();
  const { services, entity } = useSupabase();

  const [data, setData] = useState({
    batches: [],
    courts: [],
    coaches: [],
    enrollments: [],
    students: [],
    packages: [],
  });
  const [loading, setLoading] = useState(true);

  const today = new Date().toISOString().split('T')[0];
  const parent = (loc.state && loc.state.from) || '/admin/schedule';
  const prefill = (loc.state && loc.state.prefill) || {};

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const entityOpt = entity === 'all' ? undefined : entity;
      const [batchesRes, courtsRes, coachesRes, enrollmentsRes, studentsRes, packagesRes] = await Promise.all([
        services.batches.list({ entity: entityOpt, pageSize: 500 }),
        services.courts.list({ entity: entityOpt, pageSize: 100 }),
        services.coaches.list({ entity: entityOpt, pageSize: 200 }),
        services.enrollments.list({ entity: entityOpt, pageSize: 1000 }),
        services.students.list({ entity: entityOpt, pageSize: 1000 }),
        services.packages.list({ entity: entityOpt, pageSize: 1000 }),
      ]);

      if (!batchesRes.data || batchesRes.data.length === 0) {
        const local = db.readAll();
        setData({
          batches: local.batches || [],
          courts: local.courts || [],
          coaches: local.coaches || [],
          enrollments: local.enrollments || [],
          students: local.students || [],
          packages: local.packages || [],
        });
      } else {
        setData({
          batches: batchesRes.data || [],
          courts: courtsRes.data || [],
          coaches: coachesRes.data || [],
          enrollments: enrollmentsRes.data || [],
          students: studentsRes.data || [],
          packages: packagesRes.data || [],
        });
      }
    } catch (err) {
      console.warn('[BatchDetail] load error, using localDb fallback:', err);
      const local = db.readAll();
      setData({
        batches: local.batches || [],
        courts: local.courts || [],
        coaches: local.coaches || [],
        enrollments: local.enrollments || [],
        students: local.students || [],
        packages: local.packages || [],
      });
    } finally {
      setLoading(false);
    }
  }, [services, entity]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const { batches, courts, coaches, enrollments, students, packages } = data;
  const batch = batches.find((b) => b.id === batchId);

  const [showEdit, setShowEdit] = useState(false);
  const [ef, setEf] = useState({});
  const [showArchive, setShowArchive] = useState(false);
  const [ar, setAr] = useState('');

  const [nf, setNf] = useState(() => ({
    program: '', ballLevel: '', courtId: prefill.courtId || (courts.length > 0 ? courts[0].id : ''),
    dayPattern: prefill.dayPattern || 'MWF', startTime: '', endTime: '',
    capacity: '', primaryCoachId: '', supportCoachId: '', isSemiBatch: false,
  }));

  const handleNfCategoryChange = (v) => {
    const prog = typeof v === 'object' ? (v?.value || '') : (v || '');
    setNf((f) => ({ ...f, program: prog, ballLevel: CATEGORIES_WITH_BALL.has(prog) ? f.ballLevel : '' }));
  };

  const handleEfCategoryChange = (v) => {
    const prog = typeof v === 'object' ? (v?.value || '') : (v || '');
    setEf((f) => ({ ...f, program: prog, ballLevel: CATEGORIES_WITH_BALL.has(prog) ? f.ballLevel : '' }));
  };

  const handleCreate = async () => {
    if (!nf.program || !nf.startTime) { toast.error('Category and start time are required'); return; }
    const ballForCreate = CATEGORIES_WITH_BALL.has(nf.program) ? (nf.ballLevel || null) : null;
    if (CATEGORIES_WITH_BALL.has(nf.program) && !ballForCreate && !['JDP', 'HPP', 'ADULT'].includes(nf.program)) {
      toast.error('Ball Color is required for this category');
      return;
    }
    const autoName = computeBatchName({ ...nf, ballLevel: ballForCreate }, courts);
    try {
      const res = await services.batches.upsert({
        ...nf,
        name: autoName,
        ballLevel: ballForCreate,
        capacity: parseInt(nf.capacity) || 0,
        supportCoachId: nf.supportCoachId || null,
        isSemiBatch: nf.isSemiBatch || false,
        status: 'ACTIVE',
      });
      toast.success('Batch created: ' + autoName);
      navigate('/admin/batches/' + (res.data?.id || 'new'), { state: { from: parent } });
    } catch (e) {
      toast.error(e.message || 'Failed to create batch');
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
            {/* Category & Ball Color */}
            <div className="rounded-xl border border-line bg-canvas-soft/40 p-3 space-y-3">
              <div className={CATEGORIES_WITH_BALL.has(nf.program) ? "grid grid-cols-2 gap-3 items-center" : "space-y-1"}>
                <Sel label="Category *" value={nf.program} onChange={handleNfCategoryChange} options={CATEGORY_OPTIONS} emptyOption="Select Category..." />
                {CATEGORIES_WITH_BALL.has(nf.program) && (
                  <div className="space-y-1">
                    <label className={LBL + " text-brand-600 font-bold"}>Ball Color *</label>
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

              {/* Live Name Preview */}
              <div className="p-2.5 rounded-lg bg-brand-50/70 border border-brand/20 flex items-center justify-between gap-2">
                <span className="text-[10px] font-bold text-brand-700 uppercase tracking-wider">Batch Name:</span>
                <span className="font-bold text-xs text-brand-900 truncate">{computeBatchName(nf, courts)}</span>
              </div>
            </div>

            {/* Court → Day Pattern → Timing → Capacity → Coaches */}
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <Sel
                  label="Court *"
                  value={nf.courtId}
                  onChange={(v) => setNf((f) => ({ ...f, courtId: v }))}
                  options={courts.map((c) => ({ value: c.id, label: c.name }))}
                  emptyOption="Select Court..."
                />
                <Sel
                  label="Day Pattern *"
                  value={nf.dayPattern}
                  onChange={(v) => setNf((f) => ({ ...f, dayPattern: v }))}
                  options={PATTERNS.map((p) => ({ value: p, label: p === 'WEEKEND' ? 'Sat-Sun' : p }))}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Start Time *" type="time" value={nf.startTime} onChange={(v) => setNf((f) => ({ ...f, startTime: v }))} />
                <Field label="End Time *" type="time" value={nf.endTime} onChange={(v) => setNf((f) => ({ ...f, endTime: v }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Capacity" type="number" value={nf.capacity} onChange={(v) => setNf((f) => ({ ...f, capacity: v }))} />
                <Sel label="Primary Coach" value={nf.primaryCoachId} onChange={(v) => setNf((f) => ({ ...f, primaryCoachId: v }))} options={coaches.map((c) => ({ value: c.id, label: c.name }))} emptyOption="Select..." />
              </div>
              <Sel label="Support Coach" value={nf.supportCoachId} onChange={(v) => setNf((f) => ({ ...f, supportCoachId: v }))} options={coaches.map((c) => ({ value: c.id, label: c.name }))} emptyOption="None" />
            </div>
          </div>

          <label className="flex items-center gap-2 text-xs mt-3">
            <input type="checkbox" checked={nf.isSemiBatch || false} onChange={(e) => setNf((f) => ({ ...f, isSemiBatch: e.target.checked }))} />
            Semi-batch (paired)
          </label>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="secondary" onClick={() => navigate(parent)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={!nf.program || !nf.startTime}>Create Batch</Button>
          </div>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="w-8 h-8 rounded-full border-2 border-brand border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!batch) return <div className="p-4 text-sm text-ink-muted">Batch not found.</div>;

  const roster = enrollments.filter((e) => e.batchId === batchId && (e.status === 'ACTIVE' || e.status === 'active'));
  const pc = coaches.find((c) => c.id === batch.primaryCoachId);
  const sc = coaches.find((c) => c.id === batch.supportCoachId);
  const court = courts.find((c) => c.id === batch.courtId);
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
      const ballForEdit = CATEGORIES_WITH_BALL.has(ef.program) ? (ef.ballLevel || null) : null;
      const autoName = computeBatchName({ ...ef, ballLevel: ballForEdit }, courts);
      await services.batches.upsert({
        ...batch,
        ...ef,
        name: autoName,
        ballLevel: ballForEdit,
        capacity: cap,
        supportCoachId: ef.supportCoachId || null,
        isSemiBatch: ef.isSemiBatch || false,
      });
      toast.success('Batch updated: ' + autoName);
      setShowEdit(false);
      loadData();
    } catch (e) {
      toast.error(e.message || 'Failed to update batch');
    }
  };

  const doArchive = async () => {
    if (!ar.trim()) { toast.error('Reason is required'); return; }
    try {
      await services.batches.upsert({ id: batchId, status: 'INACTIVE', archivedReason: ar });
      toast.success('Batch archived');
      setShowArchive(false);
      navigate(parent);
    } catch (e) { toast.error(e.message || 'Failed to archive batch'); }
  };

  return (
    <div className="space-y-4">
      <button onClick={() => navigate(parent)} className="inline-flex items-center gap-1.5 text-[13px] text-ink-muted hover:text-ink transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Schedule
      </button>

      <Card>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-ink">{batch.name || `${batch.program} ${batch.dayPattern}`}</h3>
            <p className="text-xs text-ink-muted mt-0.5">
              <Clock className="w-3 h-3 inline mr-1" />{formatTime12h(batch.startTime)} - {formatTime12h(batch.endTime)}
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
          <span className="text-sm font-semibold text-ink">
            <CapacityIndicator filled={roster.length} total={batch.capacity} />
          </span>
        </div>
      </Card>

      <Card>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-bold text-ink">Enrolled Students ({roster.length} / {batch.capacity})</h3>
            <p className="text-[11px] text-ink-muted mt-0.5">
              Player categories are displayed side-by-side with student names as per academy scheduling format.
            </p>
          </div>
          <CapacityIndicator filled={roster.length} total={batch.capacity} />
        </div>

        {roster.length === 0 ? (
          <p className="text-xs text-ink-faint py-4 text-center">No students currently enrolled in this batch.</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-line bg-white">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-canvas-soft/60 border-b border-line text-left text-ink-muted">
                  <th className="py-2.5 px-3 font-semibold w-12 text-center">Sr No</th>
                  <th className="py-2.5 px-3 font-semibold">Name</th>
                  <th className="py-2.5 px-3 font-semibold">Category</th>
                  <th className="py-2.5 px-3 font-semibold">Membership</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Fee Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/40">
                {roster.map((e, idx) => {
                  const st = students.find((x) => x.id === e.studentId);
                  const pkg = packages.find((p) => p.studentId === e.studentId);
                  const elig = getEligibility(pkg, today);
                  const blocked = !elig.markable;
                  const isReallocated = e.billingProgram && e.billingProgram !== batch.program;
                  return (
                    <tr key={e.id} className={blocked ? 'bg-err-bg/20' : 'hover:bg-canvas-soft/30 transition-colors'}>
                      <td className="py-2.5 px-3 text-center font-mono font-semibold text-ink-muted">{idx + 1}</td>
                      <td className="py-2.5 px-3 font-semibold text-ink text-sm">
                        {st ? st.name : 'Unknown'}
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="inline-flex items-center gap-1.5 flex-wrap">
                          <span className={`px-2 py-0.5 rounded-md font-bold text-[11px] uppercase tracking-wider ${
                            e.billingProgram === 'JDP'
                              ? 'bg-purple-100 text-purple-800 border border-purple-300'
                              : e.billingProgram === 'HPP'
                              ? 'bg-rose-100 text-rose-800 border border-rose-300'
                              : 'bg-brand-50 text-brand-700 border border-brand/20'
                          }`}>
                            {e.billingProgram || e.program}
                          </span>
                          {isReallocated && (
                            <span className="text-[10px] text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded font-medium border border-purple-200">
                              (Capacity follows student · Seated in {batch.program})
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-ink-muted">
                        {st?.membershipType === 'Guest' ? <StatusPill status="guest" /> : st?.membershipType || 'Member'}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        {blocked ? (
                          <EligibilityStatusPill package={pkg} date={today} />
                        ) : (
                          <span className="text-ok font-semibold">Active · Paid</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

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
          {/* Category & Ball Color */}
          <div className="rounded-xl border border-line bg-canvas-soft/40 p-3 space-y-3">
            <div className={CATEGORIES_WITH_BALL.has(ef.program) ? "grid grid-cols-2 gap-3 items-center" : "space-y-1"}>
              <Sel label="Category *" value={ef.program || ''} onChange={handleEfCategoryChange} options={CATEGORY_OPTIONS} emptyOption="Select Category..." />
              {CATEGORIES_WITH_BALL.has(ef.program) && (
                <div className="space-y-1">
                  <label className={LBL + " text-brand-600 font-bold"}>Ball Color *</label>
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

            {/* Live Name Preview */}
            <div className="p-2.5 rounded-lg bg-brand-50/70 border border-brand/20 flex items-center justify-between gap-2">
              <span className="text-[10px] font-bold text-brand-700 uppercase tracking-wider">Batch Name:</span>
              <span className="font-bold text-xs text-brand-900 truncate">{computeBatchName(ef, courts)}</span>
            </div>
          </div>

          {/* Court → Day Pattern → Timing → Capacity → Coaches */}
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Sel
                label="Court *"
                value={ef.courtId || ''}
                onChange={(v) => setEf((f) => ({ ...f, courtId: v }))}
                options={courts.map((c) => ({ value: c.id, label: c.name }))}
                emptyOption="Select Court..."
              />
              <Sel label="Day Pattern *" value={ef.dayPattern || 'MWF'} onChange={(v) => setEf((f) => ({ ...f, dayPattern: v }))} options={PATTERNS.map((p) => ({ value: p, label: p === 'WEEKEND' ? 'Sat-Sun' : p }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Start Time *" type="time" value={ef.startTime || ''} onChange={(v) => setEf((f) => ({ ...f, startTime: v }))} />
              <Field label="End Time *" type="time" value={ef.endTime || ''} onChange={(v) => setEf((f) => ({ ...f, endTime: v }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Capacity" type="number" value={ef.capacity || ''} onChange={(v) => setEf((f) => ({ ...f, capacity: v }))} />
              <Sel label="Primary Coach" value={ef.primaryCoachId || ''} onChange={(v) => setEf((f) => ({ ...f, primaryCoachId: v }))} options={coaches.map((c) => ({ value: c.id, label: c.name }))} emptyOption="Select..." />
            </div>
            <Sel label="Support Coach" value={ef.supportCoachId || ''} onChange={(v) => setEf((f) => ({ ...f, supportCoachId: v }))} options={coaches.map((c) => ({ value: c.id, label: c.name }))} emptyOption="None" />
          </div>
        </div>
        <label className="flex items-center gap-2 text-xs mt-3">
          <input type="checkbox" checked={ef.isSemiBatch || false} onChange={(e) => setEf((f) => ({ ...f, isSemiBatch: e.target.checked }))} />
          Semi-batch (paired)
        </label>
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

function Field({ label, type, value, onChange, disabled }) {
  if (type === 'time') {
    return <TimePicker12h label={label} value={value} onChange={onChange} disabled={disabled} />;
  }
  return (<div className="space-y-1"><label className={LBL}>{label}</label>
    <input type={type || 'text'} value={value} onChange={(e) => onChange(e.target.value)} className={FIELD} disabled={disabled} /></div>);
}

function Sel({ label, value, onChange, options, emptyOption, disabled }) {
  const rawValue = value || '';
  return (<div className="space-y-1"><label className={LBL}>{label}</label>
    <Dropdown
      value={rawValue}
      onChange={(v) => onChange(typeof v === 'object' ? (v.value || v) : v)}
      placeholder={emptyOption || 'Select...'}
      options={options}
      disabled={disabled}
      getOptionLabel={(o) => (o && o.label) || ''}
      getOptionValue={(o) => (o && o.value) || ''}
    /></div>);
}

const catResolved = (nf) => nf.program && (!CATEGORIES_WITH_BALL.has(nf.program) || nf.ballLevel);
const catResolvedEf = (ef) => ef.program && (!CATEGORIES_WITH_BALL.has(ef.program) || ef.ballLevel);

// Filter courts to only those hosting this Category
function courtsForCategory(allCourts, batches, program) {
  if (!program) return allCourts;
  const courtIds = new Set(batches.filter(b => b.program === program && (b.status || '').toLowerCase() === 'active').map(b => b.courtId));
  if (courtIds.size === 0) return allCourts; // no batches yet → show all
  return allCourts.filter(c => courtIds.has(c.id));
}
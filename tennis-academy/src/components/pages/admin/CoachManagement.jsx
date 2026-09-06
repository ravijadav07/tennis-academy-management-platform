import { useState, useMemo } from 'react';
import { useDb } from '../../../context/DbContext';
import Card from '../../ui/Card';
import Button from '../../ui/Button';
import Modal from '../../ui/Modal';
import Dropdown from '../../ui/Dropdown';
import StatusPill from '../../ui/StatusPill';
import { toast } from 'sonner';
import { validatePhone, validateName, validateRequired, sanitizePhone } from '../../../utils/validators';
import { Plus, Pencil, Archive, RotateCcw } from 'lucide-react';

const FIELD = 'w-full h-[38px] px-3 rounded-lg border border-line bg-white text-[13px] text-ink outline-none focus:ring-2 focus:ring-brand/10 focus:border-brand transition-all';
const LBL = 'block text-[10px] font-semibold text-ink-muted uppercase tracking-[0.04em] mb-1';
const DUTY_TYPES = ['FULL_TIME', 'EVENING_ONLY', 'MORNING_ONLY', 'PART_TIME'];
const DESIGNATIONS = ['Senior Tennis Coach', 'Junior Tennis Coach', 'Fitness Team', 'Head of Sports Operations'];

export default function CoachManagement() {
  const { db, tick } = useDb();
  const state = useMemo(() => db.readAll(), [db, tick]);
  const coaches = (state.coaches || []).filter((c) => c.status !== 'INACTIVE');
  const inactiveCoaches = (state.coaches || []).filter((c) => c.status === 'INACTIVE');

  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showArchive, setShowArchive] = useState(false);
  const [editId, setEditId] = useState('');
  const [archiveId, setArchiveId] = useState('');
  const [archiveReason, setArchiveReason] = useState('');
  const [form, setForm] = useState({ name: '', phone: '', designation: '', dutyType: 'FULL_TIME', baseSalary: '', rate1on1PerHour: '', rateOvertimePerHour: '', paidHolidaysPerMonth: '1' });
  const [formErrors, setFormErrors] = useState({ name: '', phone: '' });

  const validateForm = () => {
    const nameErr = validateName(form.name, 'Coach name');
    const phoneErr = validatePhone(form.phone);
    const desigErr = validateRequired(form.designation, 'Designation');
    const dutyErr = validateRequired(form.dutyType, 'Duty type');
    setFormErrors({ name: nameErr, phone: phoneErr });
    if (nameErr) { toast.error(nameErr); return false; }
    if (phoneErr) { toast.error(phoneErr); return false; }
    if (desigErr) { toast.error(desigErr); return false; }
    if (dutyErr) { toast.error(dutyErr); return false; }
    return true;
  };

  const handleAdd = async () => {
    if (!validateForm()) return;
    try {
      await db.upsertCoach({
        name: form.name, phone: form.phone, designation: form.designation,
        dutyType: form.dutyType, baseSalary: parseInt(form.baseSalary) || 0,
        rate1on1PerHour: parseInt(form.rate1on1PerHour) || 0,
        rateOvertimePerHour: parseInt(form.rateOvertimePerHour) || 0,
        paidHolidaysPerMonth: parseInt(form.paidHolidaysPerMonth) || 0,
        status: 'ACTIVE',
      });
      toast.success('Coach added');
      setShowAdd(false); setForm({ name: '', phone: '', designation: '', dutyType: 'FULL_TIME', baseSalary: '', rate1on1PerHour: '', rateOvertimePerHour: '', paidHolidaysPerMonth: '1' });
    } catch (e) { toast.error(e.message); }
  };

  const handleEdit = async () => {
    if (!validateForm()) return;
    try {
      await db.upsertCoach({
        id: editId, name: form.name, phone: form.phone, designation: form.designation,
        dutyType: form.dutyType, baseSalary: parseInt(form.baseSalary) || 0,
        rate1on1PerHour: parseInt(form.rate1on1PerHour) || 0,
        rateOvertimePerHour: parseInt(form.rateOvertimePerHour) || 0,
        paidHolidaysPerMonth: parseInt(form.paidHolidaysPerMonth) || 0,
        status: 'ACTIVE',
      });
      toast.success('Coach updated');
      setShowEdit(false);
    } catch (e) { toast.error(e.message); }
  };

  const handleArchive = async () => {
    if (!archiveReason.trim()) { toast.error('Reason is required'); return; }
    try {
      await db.archiveCoach({ coachId: archiveId, reason: archiveReason });
      toast.success('Coach archived');
      setShowArchive(false); setArchiveReason('');
    } catch (e) { toast.error(e.message); }
  };

  const handleRestore = async (coach) => {
    try {
      await db.upsertCoach({ ...coach, status: 'ACTIVE' });
      toast.success(`"${coach.name}" restored`);
    } catch (e) { toast.error(e.message); }
  };

  const openEdit = (c) => {
    setEditId(c.id);
    setForm({ name: c.name, phone: c.phone || '', designation: c.designation || '', dutyType: c.dutyType || 'FULL_TIME', baseSalary: String(c.baseSalary || 0), rate1on1PerHour: String(c.rate1on1PerHour || 0), rateOvertimePerHour: String(c.rateOvertimePerHour || 0), paidHolidaysPerMonth: String(c.paidHolidaysPerMonth || 0) });
    setShowEdit(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-ink">Coach Management</h3>
          <p className="text-xs text-ink-muted mt-0.5">Add, edit, and manage coach profiles. Coaches appear in the Batch editor coach picker.</p>
        </div>
        <Button size="sm" icon={Plus} onClick={() => { setForm({ name: '', phone: '', designation: '', dutyType: 'FULL_TIME', baseSalary: '', rate1on1PerHour: '', rateOvertimePerHour: '', paidHolidaysPerMonth: '1' }); setShowAdd(true); }}>Add Coach</Button>
      </div>

      <Card>
        <div className="space-y-1">
          {coaches.length === 0 ? (
            <p className="text-xs text-ink-faint py-4 text-center">No coaches configured.</p>
          ) : (
            coaches.map((c) => (
              <div key={c.id} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-canvas-soft text-xs">
                <div className="w-8 h-8 rounded-full bg-brand-50 flex items-center justify-center text-brand-600 text-xs font-bold flex-shrink-0">{c.name.charAt(0)}</div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-ink truncate">{c.name}</p>
                  <p className="text-ink-faint truncate">{c.designation || ''} · {c.dutyType?.replace('_', ' ') || ''}</p>
                </div>
                <span className="text-ink-muted">₹{(c.baseSalary || 0).toLocaleString('en-IN')}</span>
                <StatusPill status={c.status === 'ACTIVE' ? 'active' : 'inactive'} />
                <Button size="sm" variant="ghost" icon={Pencil} onClick={() => openEdit(c)}>Edit</Button>
                <Button size="sm" variant="ghost" icon={Archive} onClick={() => { setArchiveId(c.id); setArchiveReason(''); setShowArchive(true); }}>Archive</Button>
              </div>
            ))
          )}
        </div>
      </Card>

      {inactiveCoaches.length > 0 && (
        <Card>
          <h3 className="text-xs font-semibold text-ink-muted mb-2">Archived Coaches</h3>
          <div className="space-y-1">
            {inactiveCoaches.map((c) => (
              <div key={c.id} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-canvas-soft/50 text-xs opacity-60">
                <span className="font-semibold text-ink flex-1">{c.name}</span>
                <span className="text-ink-faint">{c.designation}</span>
                <Button size="sm" variant="ghost" icon={RotateCcw} onClick={() => handleRestore(c)} className="!h-7 !px-2 !text-[10px]">Restore</Button>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add Coach" size="md">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className={LBL}>Name *</label>
            <input value={form.name} onChange={(e) => { const v = e.target.value; setForm((f) => ({ ...f, name: v })); setFormErrors((errs) => ({ ...errs, name: validateName(v, 'Coach name') })); }} className={`${FIELD} ${formErrors.name ? 'border-red-400' : ''}`} placeholder="Coach name" />
            {formErrors.name && <p className="text-[10px] text-err mt-0.5">{formErrors.name}</p>}
          </div>
          <div className="space-y-1">
            <label className={LBL}>Phone *</label>
            <input value={form.phone} onChange={(e) => { const v = e.target.value; setForm((f) => ({ ...f, phone: v })); setFormErrors((errs) => ({ ...errs, phone: validatePhone(v) })); }} className={`${FIELD} ${formErrors.phone ? 'border-red-400' : ''}`} placeholder="10-digit mobile number" />
            {formErrors.phone && <p className="text-[10px] text-err mt-0.5">{formErrors.phone}</p>}
          </div>
          <div className="space-y-1"><label className={LBL}>Designation *</label><Dropdown value={form.designation} onChange={(v) => setForm((f) => ({ ...f, designation: typeof v === 'object' ? (v.value || v) : v }))} placeholder="Select designation..." options={DESIGNATIONS.map((d) => ({ value: d, label: d }))} getOptionLabel={(o) => o.label} getOptionValue={(o) => o.value} /></div>
          <div className="space-y-1"><label className={LBL}>Duty Type *</label><Dropdown value={form.dutyType} onChange={(v) => setForm((f) => ({ ...f, dutyType: typeof v === 'object' ? (v.value || v) : v }))} options={DUTY_TYPES.map((d) => ({ value: d, label: d.replace('_', ' ') }))} getOptionLabel={(o) => o.label} getOptionValue={(o) => o.value} /></div>
          <div className="space-y-1"><label className={LBL}>Base Salary (Rs.)</label><input type="number" value={form.baseSalary} onChange={(e) => setForm((f) => ({ ...f, baseSalary: e.target.value }))} className={FIELD} placeholder="25000" /></div>
          <div className="space-y-1"><label className={LBL}>1-on-1 Rate (per hr)</label><input type="number" value={form.rate1on1PerHour} onChange={(e) => setForm((f) => ({ ...f, rate1on1PerHour: e.target.value }))} className={FIELD} placeholder="800" /></div>
          <div className="space-y-1"><label className={LBL}>Overtime Rate (per hr)</label><input type="number" value={form.rateOvertimePerHour} onChange={(e) => setForm((f) => ({ ...f, rateOvertimePerHour: e.target.value }))} className={FIELD} placeholder="250" /></div>
          <div className="space-y-1"><label className={LBL}>Paid Holidays/Month</label><input type="number" value={form.paidHolidaysPerMonth} onChange={(e) => setForm((f) => ({ ...f, paidHolidaysPerMonth: e.target.value }))} className={FIELD} placeholder="1" /></div>
        </div>
        <div className="flex justify-end gap-2 mt-4"><Button variant="secondary" onClick={() => setShowAdd(false)}>Cancel</Button><Button onClick={handleAdd}>Add Coach</Button></div>
      </Modal>

      <Modal open={showEdit} onClose={() => setShowEdit(false)} title="Edit Coach" size="md">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className={LBL}>Name *</label>
            <input value={form.name} onChange={(e) => { const v = e.target.value; setForm((f) => ({ ...f, name: v })); setFormErrors((errs) => ({ ...errs, name: validateName(v, 'Coach name') })); }} className={`${FIELD} ${formErrors.name ? 'border-red-400' : ''}`} />
            {formErrors.name && <p className="text-[10px] text-err mt-0.5">{formErrors.name}</p>}
          </div>
          <div className="space-y-1">
            <label className={LBL}>Phone *</label>
            <input value={form.phone} onChange={(e) => { const v = e.target.value; setForm((f) => ({ ...f, phone: v })); setFormErrors((errs) => ({ ...errs, phone: validatePhone(v) })); }} className={`${FIELD} ${formErrors.phone ? 'border-red-400' : ''}`} />
            {formErrors.phone && <p className="text-[10px] text-err mt-0.5">{formErrors.phone}</p>}
          </div>
          <div className="space-y-1"><label className={LBL}>Designation *</label><Dropdown value={form.designation} onChange={(v) => setForm((f) => ({ ...f, designation: typeof v === 'object' ? (v.value || v) : v }))} options={DESIGNATIONS.map((d) => ({ value: d, label: d }))} getOptionLabel={(o) => o.label} getOptionValue={(o) => o.value} /></div>
          <div className="space-y-1"><label className={LBL}>Duty Type *</label><Dropdown value={form.dutyType} onChange={(v) => setForm((f) => ({ ...f, dutyType: typeof v === 'object' ? (v.value || v) : v }))} options={DUTY_TYPES.map((d) => ({ value: d, label: d.replace('_', ' ') }))} getOptionLabel={(o) => o.label} getOptionValue={(o) => o.value} /></div>
          <div className="space-y-1"><label className={LBL}>Base Salary</label><input type="number" value={form.baseSalary} onChange={(e) => setForm((f) => ({ ...f, baseSalary: e.target.value }))} className={FIELD} /></div>
          <div className="space-y-1"><label className={LBL}>1-on-1 Rate</label><input type="number" value={form.rate1on1PerHour} onChange={(e) => setForm((f) => ({ ...f, rate1on1PerHour: e.target.value }))} className={FIELD} /></div>
          <div className="space-y-1"><label className={LBL}>Overtime Rate</label><input type="number" value={form.rateOvertimePerHour} onChange={(e) => setForm((f) => ({ ...f, rateOvertimePerHour: e.target.value }))} className={FIELD} /></div>
          <div className="space-y-1"><label className={LBL}>Paid Holidays</label><input type="number" value={form.paidHolidaysPerMonth} onChange={(e) => setForm((f) => ({ ...f, paidHolidaysPerMonth: e.target.value }))} className={FIELD} /></div>
        </div>
        <div className="flex justify-end gap-2 mt-4"><Button variant="secondary" onClick={() => setShowEdit(false)}>Cancel</Button><Button onClick={handleEdit}>Save</Button></div>
      </Modal>

      <Modal open={showArchive} onClose={() => setShowArchive(false)} title="Archive Coach" size="sm">
        <div className="space-y-3">
          <p className="text-xs text-ink-muted">This coach will be removed from active lists but preserved in history. Existing batch assignments will not be affected.</p>
          <div className="space-y-1"><label className={LBL}>Reason *</label><textarea value={archiveReason} onChange={(e) => setArchiveReason(e.target.value)} className="w-full h-20 px-3 py-2 rounded-lg border border-line text-[13px] outline-none focus:ring-2 focus:ring-brand/10 resize-none" placeholder="Why is this coach being archived?" /></div>
          <div className="flex justify-end gap-2 pt-2"><Button variant="secondary" onClick={() => setShowArchive(false)}>Cancel</Button><Button variant="danger" onClick={handleArchive}>Archive Coach</Button></div>
        </div>
      </Modal>
    </div>
  );
}
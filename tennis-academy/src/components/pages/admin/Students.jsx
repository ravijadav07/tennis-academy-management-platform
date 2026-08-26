import { useState } from 'react';
import { useStudents } from '../../../hooks/useStudents';
import { useDebounce } from '../../../hooks/useDebounce';
import { useDb } from '../../../context/DbContext';
import Card from '../../ui/Card';
import StatusPill from '../../ui/StatusPill';
import Modal from '../../ui/Modal';
import Button from '../../ui/Button';
import EligibilityStatusPill from '../../ui/EligibilityStatusPill';
import Dropdown from '../../ui/Dropdown';
import { toast } from 'sonner';
import { Search, Plus, Pencil, Archive, UserPlus } from 'lucide-react';

const fieldBase = 'w-full h-[38px] px-3 rounded-lg border border-line bg-white text-[13px] text-ink outline-none focus:ring-2 focus:ring-brand/10 focus:border-brand transition-all';
const labelCls = 'block text-[10px] font-semibold text-ink-muted uppercase tracking-[0.04em] mb-1';

export default function AdminStudents() {
  const { db, tick } = useDb();
  const [rawQuery, setRawQuery] = useState('');
  const query = useDebounce(rawQuery, 300);
  const [status, setStatus] = useState('all');
  const [selected, setSelected] = useState(null);
  const { students, total } = useStudents({ query, status });

  // Add Student modal
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState({ name: '', guardianName: '', guardianPhone: '', isGuest: false, program: '', batchId: '', sessionsPurchased: '', amount: '', paymentStatus: 'PAID' });
  const [addErrors, setAddErrors] = useState({});
  const [dupCheck, setDupCheck] = useState(null);

  // Edit Student modal
  const [showEdit, setShowEdit] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', guardianName: '', guardianPhone: '', isGuest: false });

  // Add Enrollment modal
  const [showEnroll, setShowEnroll] = useState(false);
  const [enrollForm, setEnrollForm] = useState({ program: '', batchId: '' });

  // Archive modal
  const [showArchive, setShowArchive] = useState(false);
  const [archiveReason, setArchiveReason] = useState('');

  const state = (() => { try { return db.readAll(); } catch { return { batches: [], coaches: [] }; } })();
  const batchOptions = state.batches?.filter((b) => b.status === 'ACTIVE') || [];
  const CATEGORIES = ['ADV', 'INT', 'ADULT', 'GREEN', 'ORANGE', 'RED', 'JDP', 'HPP', 'WEEKEND', 'FITNESS'];

  // Duplicate check
  const checkDup = async () => {
    if (!addForm.name || !addForm.guardianPhone) return;
    const dup = await db.checkDuplicateStudent({ name: addForm.name, guardianPhone: addForm.guardianPhone });
    setDupCheck(dup);
  };

  const handleAddStudent = async () => {
    const errors = {};
    if (!addForm.name.trim()) errors.name = 'Name is required';
    if (addErrors && Object.keys(errors).length > 0) { setAddErrors(errors); return; }
    try {
      const student = await db.upsertStudent({
        name: addForm.name, guardianName: addForm.guardianName || addForm.name + "'s Guardian",
        guardianPhone: addForm.guardianPhone, isGuest: addForm.isGuest, status: 'ACTIVE',
        enrolledFrom: new Date().toISOString().split('T')[0],
      });
      if (addForm.program && addForm.batchId) {
        await db.upsertEnrollment({ studentId: student.id, batchId: addForm.batchId, billingProgram: addForm.program, status: 'ACTIVE' });
      }
      if (addForm.sessionsPurchased) {
        await db.upsertPackage({
          studentId: student.id, program: addForm.program || 'ADV',
          sessionsPurchased: parseInt(addForm.sessionsPurchased) || 0, sessionsUsed: 0,
          amount: parseInt(addForm.amount) || 0, paymentStatus: addForm.paymentStatus,
          validTo: new Date(new Date().setMonth(new Date().getMonth() + 3)).toISOString().split('T')[0],
        });
      }
      toast.success(`Student "${addForm.name}" created`);
      setShowAdd(false);
      setAddForm({ name: '', guardianName: '', guardianPhone: '', isGuest: false, program: '', batchId: '', sessionsPurchased: '', amount: '', paymentStatus: 'PAID' });
      setAddErrors({}); setDupCheck(null);
    } catch (e) { toast.error(e.message); }
  };

  const handleEdit = async () => {
    if (!selected) return;
    try {
      await db.upsertStudent({ ...selected, name: editForm.name, guardianName: editForm.guardianName, guardianPhone: editForm.guardianPhone, isGuest: editForm.isGuest });
      toast.success('Student updated');
      setShowEdit(false);
    } catch (e) { toast.error(e.message); }
  };

  const handleArchive = async () => {
    if (!archiveReason.trim()) { toast.error('Reason is required to archive'); return; }
    try {
      await db.archiveStudent({ studentId: selected.id, reason: archiveReason });
      toast.success(`"${selected.name}" archived`);
      setShowArchive(false); setSelected(null); setArchiveReason('');
    } catch (e) { toast.error(e.message); }
  };

  const handleAddEnrollment = async () => {
    if (!enrollForm.program || !enrollForm.batchId) { toast.error('Select a category and batch'); return; }
    try {
      await db.upsertEnrollment({ studentId: selected.id, batchId: enrollForm.batchId, billingProgram: enrollForm.program, status: 'ACTIVE' });
      toast.success('Enrollment added');
      setShowEnroll(false); setEnrollForm({ program: '', batchId: '' });
    } catch (e) { toast.error(e.message); }
  };

  const openEdit = () => {
    if (!selected) return;
    setEditForm({ name: selected.name, guardianName: selected.guardianName, guardianPhone: selected.guardianPhone, isGuest: selected.isGuest || false });
    setShowEdit(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-faint" />
          <input value={rawQuery} onChange={(e) => setRawQuery(e.target.value)} placeholder="Search students..."
            className="w-full pl-9 pr-4 h-[38px] rounded-lg bg-canvas-soft border border-line text-[13px] outline-none focus:ring-2 focus:ring-brand/10" />
        </div>
        <Dropdown
          className="w-40 flex-shrink-0"
          value={status}
          onChange={(v) => setStatus(typeof v === 'object' ? (v.value || v) : v)}
          options={[{ value: 'all', label: 'All Status' }, { value: 'ACTIVE', label: 'Active' }, { value: 'INACTIVE', label: 'Inactive' }]}
          getOptionLabel={(o) => o.label}
          getOptionValue={(o) => o.value}
        />
        <Button size="sm" icon={Plus} onClick={() => setShowAdd(true)}>Add Student</Button>
        <span className="text-xs text-ink-muted">{total} students</span>
      </div>

      <Card className="p-0 overflow-hidden">
        <div className="divide-y divide-line">
          {students.map((s) => {
            const blocked = !s.eligibility.markable;
            const isInactive = s.status === 'INACTIVE' || s.status === 'TRIAL';
            return (
              <div key={s.id} onClick={() => setSelected(s)}
                className={`flex items-center gap-3 px-4 py-3 hover:bg-canvas-soft cursor-pointer transition-colors ${blocked && !isInactive ? 'opacity-50' : ''} ${isInactive ? 'opacity-40' : ''}`}>
                <div className="w-8 h-8 rounded-full bg-brand-50 flex items-center justify-center text-brand-600 text-xs font-bold flex-shrink-0">{s.name.charAt(0)}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-ink truncate">{s.name}</p>
                  <p className="text-[11px] text-ink-muted truncate">{s.programs?.join(', ') || 'No program'} · {s.batch?.name || s.batch?.program || 'No batch'}</p>
                </div>
                {s.isGuest && <StatusPill status="guest" />}
                {s.status === 'TRIAL' && <StatusPill status="trial" />}
                {s.programs?.map((p) => <StatusPill key={p} status={p} />)}
                {blocked && !isInactive && <EligibilityStatusPill package={s.package} />}
              </div>
            );
          })}
        </div>
      </Card>

      {/* Student Detail Modal */}
      <Modal open={!!selected} onClose={() => setSelected(null)} title={selected?.name} size="md">
        {selected && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div><p className="text-ink-faint">Name</p><p className="font-semibold">{selected.name}</p></div>
              <div><p className="text-ink-faint">Guardian</p><p className="font-semibold">{selected.guardianName}</p></div>
              <div><p className="text-ink-faint">Phone</p><p className="font-semibold">{selected.guardianPhone}</p></div>
              <div><p className="text-ink-faint">Status</p><StatusPill status={selected.status} /></div>
            </div>
            {selected.package && (
              <div>
                <h4 className="text-xs font-semibold text-ink-muted mb-1">Package</h4>
                <div className="grid grid-cols-3 gap-2 text-xs bg-canvas-soft rounded-lg p-3">
                  <div><p className="text-ink-faint">Plan</p><p className="font-semibold">{selected.package.program}</p></div>
                  <div><p className="text-ink-faint">Sessions</p><p className="font-semibold">{selected.package.sessionsUsed}/{selected.package.sessionsPurchased}</p></div>
                  <div><p className="text-ink-faint">Status</p><EligibilityStatusPill package={selected.package} /></div>
                </div>
              </div>
            )}
            {selected.isAmbiguous && (
              <div className="px-3 py-2 rounded-lg bg-brand-50 text-xs text-brand-600">
                This student has multiple active categories ({selected.programs.join(', ')}). The lowest-rank category takes precedence.
              </div>
            )}
            <div className="flex gap-2 pt-2 border-t border-line">
              <Button size="sm" variant="secondary" icon={Pencil} onClick={openEdit}>Edit</Button>
              <Button size="sm" variant="secondary" icon={UserPlus} onClick={() => setShowEnroll(true)}>Add Enrollment</Button>
              <Button size="sm" variant="danger" icon={Archive} onClick={() => setShowArchive(true)}>Archive</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Add Student Modal */}
      <Modal open={showAdd} onClose={() => { setShowAdd(false); setDupCheck(null); }} title="Add Student" size="md">
        <div className="space-y-4">
          <div className="space-y-1">
            <label className={labelCls}>Name *</label>
            <input value={addForm.name} onChange={(e) => setAddForm((f) => ({ ...f, name: e.target.value }))} onBlur={checkDup}
              className={`${fieldBase} ${addErrors.name ? 'border-red-300' : ''}`} placeholder="Student name" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className={labelCls}>Guardian Name</label>
              <input value={addForm.guardianName} onChange={(e) => setAddForm((f) => ({ ...f, guardianName: e.target.value }))}
                className={fieldBase} placeholder="Guardian" />
            </div>
            <div className="space-y-1">
              <label className={labelCls}>Guardian Phone</label>
              <input value={addForm.guardianPhone} onChange={(e) => setAddForm((f) => ({ ...f, guardianPhone: e.target.value }))} onBlur={checkDup}
                className={fieldBase} placeholder="Phone" />
            </div>
          </div>
          <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={addForm.isGuest} onChange={(e) => setAddForm((f) => ({ ...f, isGuest: e.target.checked }))} /> Guest / Trial</label>

          {dupCheck && <div className="px-3 py-2 rounded-lg bg-warn-bg text-xs text-warn">Possible duplicate: "{dupCheck.name}" with phone {dupCheck.guardianPhone} already exists (ID: {dupCheck.id}).</div>}

          <div className="border-t border-line pt-3">
            <p className="text-[10px] font-semibold text-ink-muted uppercase mb-2">Optional: Initial Enrollment</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className={labelCls}>Category</label>
                <Dropdown
                  value={addForm.program}
                  onChange={(v) => setAddForm((f) => ({ ...f, program: typeof v === 'object' ? (v.value || v) : v }))}
                  placeholder="Skip"
                  options={CATEGORIES.map((p) => ({ value: p, label: p }))}
                  getOptionLabel={(o) => o.label}
                  getOptionValue={(o) => o.value}
                />
              </div>
              <div className="space-y-1">
                <label className={labelCls}>Batch</label>
                <Dropdown
                  value={addForm.batchId}
                  onChange={(v) => setAddForm((f) => ({ ...f, batchId: typeof v === 'object' ? (v.value || v) : v }))}
                  placeholder="Skip"
                  options={batchOptions.map((b) => ({ value: b.id, label: b.program + ' ' + b.dayPattern + ' (' + b.startTime + ')' }))}
                  getOptionLabel={(o) => o.label}
                  getOptionValue={(o) => o.value}
                />
              </div>
            </div>
          </div>

          <div className="border-t border-line pt-3">
            <p className="text-[10px] font-semibold text-ink-muted uppercase mb-2">Optional: Initial Package</p>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className={labelCls}>Sessions</label>
                <input type="number" value={addForm.sessionsPurchased} onChange={(e) => setAddForm((f) => ({ ...f, sessionsPurchased: e.target.value }))}
                  className={fieldBase} placeholder="36" />
              </div>
              <div className="space-y-1">
                <label className={labelCls}>Amount (Rs.)</label>
                <input type="number" value={addForm.amount} onChange={(e) => setAddForm((f) => ({ ...f, amount: e.target.value }))}
                  className={fieldBase} placeholder="8000" />
              </div>
              <div className="space-y-1">
                <label className={labelCls}>Payment</label>
                <Dropdown
                  value={addForm.paymentStatus}
                  onChange={(v) => setAddForm((f) => ({ ...f, paymentStatus: typeof v === 'object' ? (v.value || v) : v }))}
                  options={[{ value: 'PAID', label: 'Paid' }, { value: 'PENDING', label: 'Pending' }, { value: 'PARTIAL', label: 'Partial' }]}
                  getOptionLabel={(o) => o.label}
                  getOptionValue={(o) => o.value}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => { setShowAdd(false); setDupCheck(null); }}>Cancel</Button>
            <Button onClick={handleAddStudent}>Create Student</Button>
          </div>
        </div>
      </Modal>

      {/* Edit Student Modal */}
      <Modal open={showEdit} onClose={() => setShowEdit(false)} title="Edit Student" size="sm">
        <div className="space-y-3">
          <div className="space-y-1">
            <label className={labelCls}>Name</label>
            <input value={editForm.name} onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))} className={fieldBase} />
          </div>
          <div className="space-y-1">
            <label className={labelCls}>Guardian Name</label>
            <input value={editForm.guardianName} onChange={(e) => setEditForm((f) => ({ ...f, guardianName: e.target.value }))} className={fieldBase} />
          </div>
          <div className="space-y-1">
            <label className={labelCls}>Guardian Phone</label>
            <input value={editForm.guardianPhone} onChange={(e) => setEditForm((f) => ({ ...f, guardianPhone: e.target.value }))} className={fieldBase} />
          </div>
          <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={editForm.isGuest} onChange={(e) => setEditForm((f) => ({ ...f, isGuest: e.target.checked }))} /> Guest</label>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowEdit(false)}>Cancel</Button>
            <Button onClick={handleEdit}>Save</Button>
          </div>
        </div>
      </Modal>

      {/* Add Enrollment Modal */}
      <Modal open={showEnroll} onClose={() => setShowEnroll(false)} title="Add Enrollment" size="sm">
        <div className="space-y-3">
          <div className="space-y-1">
            <label className={labelCls}>Category</label>
            <Dropdown
              value={enrollForm.program}
              onChange={(v) => setEnrollForm((f) => ({ ...f, program: typeof v === 'object' ? (v.value || v) : v }))}
              placeholder="Select..."
              options={CATEGORIES.map((p) => ({ value: p, label: p }))}
              getOptionLabel={(o) => o.label}
              getOptionValue={(o) => o.value}
            />
          </div>
          <div className="space-y-1">
            <label className={labelCls}>Batch</label>
            <Dropdown
              value={enrollForm.batchId}
              onChange={(v) => setEnrollForm((f) => ({ ...f, batchId: typeof v === 'object' ? (v.value || v) : v }))}
              placeholder="Select..."
              options={batchOptions.map((b) => ({ value: b.id, label: b.program + ' ' + b.dayPattern + ' (' + b.startTime + ')' }))}
              getOptionLabel={(o) => o.label}
              getOptionValue={(o) => o.value}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowEnroll(false)}>Cancel</Button>
            <Button onClick={handleAddEnrollment}>Add Enrollment</Button>
          </div>
        </div>
      </Modal>

      {/* Archive Modal */}
      <Modal open={showArchive} onClose={() => setShowArchive(false)} title={`Archive "${selected?.name}"`} size="sm">
        <div className="space-y-3">
          <p className="text-xs text-ink-muted">This will set the student to inactive. They will remain visible in history but won't appear in active lists.</p>
          <div className="space-y-1">
            <label className={labelCls}>Reason *</label>
            <textarea value={archiveReason} onChange={(e) => setArchiveReason(e.target.value)}
              className="w-full h-20 px-3 py-2 rounded-lg border border-line text-[13px] outline-none focus:ring-2 focus:ring-brand/10 resize-none" placeholder="Why is this student being archived?" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowArchive(false)}>Cancel</Button>
            <Button variant="danger" onClick={handleArchive}>Archive Student</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
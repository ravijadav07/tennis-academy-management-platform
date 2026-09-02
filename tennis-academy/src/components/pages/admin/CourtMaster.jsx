import React, { useState, useEffect, useMemo } from 'react';
import { useDb } from '../../../context/DbContext';
import Card from '../../ui/Card';
import Button from '../../ui/Button';
import Modal from '../../ui/Modal';
import Dropdown from '../../ui/Dropdown';
import { toast } from 'sonner';
import { Plus, Pencil, Archive, MapPin, RotateCcw } from 'lucide-react';

const FIELD = 'w-full h-[38px] px-3 rounded-lg border border-line bg-white text-[13px] text-ink outline-none focus:ring-2 focus:ring-brand/10 focus:border-brand transition-all';
const LBL = 'block text-[10px] font-semibold text-ink-muted uppercase tracking-[0.04em] mb-1';

export default function CourtMaster() {
  const { db, tick } = useDb();
  const state = useMemo(() => db.readAll(), [db, tick]);
  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showArchive, setShowArchive] = useState(false);
  const [form, setForm] = useState({ name: '', status: 'ACTIVE' });
  const [editId, setEditId] = useState('');
  const [archiveReason, setArchiveReason] = useState('');
  const [archiveId, setArchiveId] = useState('');

  const courts = (state.courts || []).filter((c) => c.status !== 'INACTIVE');
  const inactive = (state.courts || []).filter((c) => c.status === 'INACTIVE');

  const handleAdd = async () => {
    if (!form.name.trim()) { toast.error('Court name is required'); return; }
    try {
      await db.upsertCourt({ name: form.name, status: 'ACTIVE' });
      toast.success('Court created');
      setShowAdd(false); setForm({ name: '', status: 'ACTIVE' });
    } catch (e) { toast.error(e.message); }
  };

  const handleEdit = async () => {
    if (!form.name.trim()) { toast.error('Court name is required'); return; }
    try {
      await db.upsertCourt({ id: editId, name: form.name, status: form.status });
      toast.success('Court updated');
      setShowEdit(false);
    } catch (e) { toast.error(e.message); }
  };

  const handleArchive = async () => {
    if (!archiveReason.trim()) { toast.error('Reason is required'); return; }
    try {
      await db.archiveCourt({ courtId: archiveId, reason: archiveReason });
      toast.success('Court archived');
      setShowArchive(false); setArchiveReason('');
    } catch (e) { toast.error(e.message); }
  };

  const openEdit = (c) => {
    setEditId(c.id); setForm({ name: c.name, status: c.status || 'ACTIVE' }); setShowEdit(true);
  };

  const openArchive = (c) => {
    setArchiveId(c.id); setArchiveReason(''); setShowArchive(true);
  };

  const handleRestore = async (court) => {
    try {
      await db.upsertCourt({ ...court, status: 'ACTIVE', archivedReason: null });
      toast.success(`"${court.name}" restored`);
    } catch (e) { toast.error(e.message); }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold text-ink">Court Master</h3>
          <p className="text-xs text-ink-muted mt-0.5">Configure courts 2–6 and academy-wide standard time slots. Schedule, batches, and slot analysis read from this configuration.</p>
        </div>
        <Button size="sm" icon={Plus} className="whitespace-nowrap flex-shrink-0 self-start sm:self-auto" onClick={() => { setForm({ name: '', status: 'ACTIVE' }); setShowAdd(true); }}>Add Court</Button>
      </div>

      {/* Active Courts */}
      <Card>
        <div className="space-y-1">
          {courts.length === 0 ? (
            <p className="text-xs text-ink-faint py-4 text-center">No courts configured. Add courts 2–6 to begin.</p>
          ) : (
            courts.map((c) => (
              <div key={c.id} className="flex items-center gap-2 sm:gap-3 px-3 py-2 rounded-lg bg-canvas-soft text-xs">
                <MapPin className="w-3.5 h-3.5 text-ink-faint flex-shrink-0" />
                <span className="font-semibold text-ink flex-1 truncate">{c.name}</span>
                <span className="text-ink-muted flex-shrink-0">{c.id}</span>
                <Button size="sm" variant="ghost" icon={Pencil} className="flex-shrink-0" onClick={() => openEdit(c)}>Edit</Button>
                <Button size="sm" variant="ghost" icon={Archive} className="flex-shrink-0" onClick={() => openArchive(c)}>Archive</Button>
              </div>
            ))
          )}
        </div>
      </Card>

      {/* Archived Courts placed right with other courts */}
      {inactive.length > 0 && (
        <Card>
          <h3 className="text-xs font-semibold text-ink-muted mb-2">Archived Courts</h3>
          <div className="space-y-1">
            {inactive.map((c) => (
              <div key={c.id} className="flex items-center gap-2 sm:gap-3 px-3 py-2 rounded-lg bg-canvas-soft/50 text-xs">
                <MapPin className="w-3.5 h-3.5 text-ink-faint flex-shrink-0" />
                <span className="font-semibold text-ink flex-1 truncate">{c.name}</span>
                <span className="text-ink-faint flex-shrink-0 hidden sm:inline">{c.archivedReason || 'Archived'}</span>
                <Button size="sm" variant="ghost" icon={RotateCcw} onClick={() => handleRestore(c)} className="!h-7 !px-2 !text-[10px] flex-shrink-0">Restore</Button>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Standard Time Slots */}
      <TimeSlotCard db={db} state={state} />

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add Court" size="sm">
        <div className="space-y-3">
          <div className="space-y-1"><label className={LBL}>Court Name</label><input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className={FIELD} placeholder="e.g. Court 2" /></div>
          <div className="flex justify-end gap-2 pt-2"><Button variant="secondary" onClick={() => setShowAdd(false)}>Cancel</Button><Button onClick={handleAdd}>Create Court</Button></div>
        </div>
      </Modal>

      <Modal open={showEdit} onClose={() => setShowEdit(false)} title="Edit Court" size="sm">
        <div className="space-y-3">
          <div className="space-y-1"><label className={LBL}>Court Name</label><input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className={FIELD} /></div>
          <div className="space-y-1"><label className={LBL}>Status</label><Dropdown value={form.status} onChange={(v) => setForm((f) => ({ ...f, status: typeof v === 'object' ? (v.value || v) : v }))} options={[{ value: 'ACTIVE', label: 'Active' }, { value: 'INACTIVE', label: 'Inactive' }]} getOptionLabel={(o) => o.label} getOptionValue={(o) => o.value} /></div>
          <div className="flex justify-end gap-2 pt-2"><Button variant="secondary" onClick={() => setShowEdit(false)}>Cancel</Button><Button onClick={handleEdit}>Save</Button></div>
        </div>
      </Modal>

      <Modal open={showArchive} onClose={() => setShowArchive(false)} title="Archive Court" size="sm">
        <div className="space-y-3">
          <p className="text-xs text-ink-muted">This court will be removed from active scheduling but preserved in history.</p>
          <div className="space-y-1"><label className={LBL}>Reason *</label><textarea value={archiveReason} onChange={(e) => setArchiveReason(e.target.value)} className="w-full h-20 px-3 py-2 rounded-lg border border-line text-[13px] outline-none focus:ring-2 focus:ring-brand/10 resize-none" placeholder="Why is this court being archived?" /></div>
          <div className="flex justify-end gap-2 pt-2"><Button variant="secondary" onClick={() => setShowArchive(false)}>Cancel</Button><Button variant="danger" onClick={handleArchive}>Archive</Button></div>
        </div>
      </Modal>
    </div>
  );
}

// F1: Academy-wide standard time slots — convenience defaults, not hard constraints on batch creation.
function TimeSlotCard({ db, state }) {
  const [slots, setSlots] = useState(() => (state.standardTimeSlots || []));
  const [newSlot, setNewSlot] = useState('');
  const timeSlots = state.standardTimeSlots || [];
  const addSlot = async () => {
    if (!newSlot.trim()) return;
    const updated = [...timeSlots, newSlot];
    try { await db.upsertCourt({ id: '__time_slots__', name: '__time_slots__', standardTimeSlots: updated }); setSlots(updated); setNewSlot(''); toast.success('Time slot added'); } catch (e) { toast.error(e.message); }
  };
  const removeSlot = async (idx) => {
    const updated = timeSlots.filter((_, i) => i !== idx);
    try { await db.upsertCourt({ id: '__time_slots__', name: '__time_slots__', standardTimeSlots: updated }); setSlots(updated); } catch (e) { toast.error(e.message); }
  };
  return (
    <Card>
      <h3 className="text-sm font-semibold text-ink mb-3">Standard Time Slots</h3>
      <p className="text-xs text-ink-muted mb-3">Academy-wide convenience defaults for batch creation. Individual batches can use custom times.</p>
      <div className="flex flex-col sm:flex-row gap-2 mb-3">
        <input type="time" value={newSlot} onChange={(e) => setNewSlot(e.target.value)} className={FIELD} placeholder="e.g. 15:30" />
        <Button size="sm" className="whitespace-nowrap flex-shrink-0" onClick={addSlot}>Add</Button>
      </div>
      {timeSlots.length === 0 ? (
        <p className="text-xs text-ink-faint py-2">No standard time slots configured. Add common start times like 15:30, 17:00, etc.</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {timeSlots.map((s, i) => (
            <span key={i} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-canvas-soft text-xs">
              <span>{s}</span>
              <button onClick={() => removeSlot(i)} className="text-err hover:underline text-[10px]">Remove</button>
            </span>
          ))}
        </div>
      )}
    </Card>
  );
}
import { useState, useMemo, useEffect, useCallback } from 'react';
import { Eye, User, Phone, Mail, Pencil } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../../../utils/supabase';
import StatusPill from '../../ui/StatusPill';
import Modal from '../../ui/Modal';
import Input from '../../ui/Input';
import Dropdown from '../../ui/Dropdown';
import Button from '../../ui/Button';
import AdaptiveTable from '../../data/AdaptiveTable';
import RowActionsMenu from '../../data/RowActionsMenu';
import Skeleton from '../../ui/Skeleton';
import { formatDate } from '../../../utils/formatters';
import { db } from '../../../mocks/localDb';

const entityLabel = (e) => e === 'the-club' ? 'The Club' : "TOTS Tennis";

const statusOptions = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
];

const commTypeLabel = {
  welcome: 'Admission Confirmation',
  reminder: 'Reminder',
  confirmation: 'Confirmation',
  progress_report: 'Progress Report',
  certificate: 'Certificate',
  invoice: 'Invoice',
};

const INITIAL_FORM = { name: '', phone: '', email: '', accountStatus: 'active' };

export default function Parents() {
  const [selected, setSelected] = useState(null);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState(INITIAL_FORM);
  const [parents, setParents] = useState([]);
  const [detailChildren, setDetailChildren] = useState([]);
  const [detailComm, setDetailComm] = useState([]);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      const { data, error } = await supabase
        .from('parents')
        .select('*, student_parents(student_id)');
      if (cancelled) return;
      if (error || !data || data.length === 0) {
        console.warn('[Parents] Supabase error/empty, using localDb fallback');
        const local = db.readAll();
        const parentsMap = {};
        (local.students || []).forEach(s => {
          const key = s.guardianPhone || s.name;
          if (!parentsMap[key]) {
            parentsMap[key] = {
              id: 'p_' + (s.guardianPhone || s.id),
              name: s.guardianName || (s.name + "'s Guardian"),
              phone: s.guardianPhone || '9876543210',
              email: s.guardianEmail || `parent.${s.name.toLowerCase().replace(/[^a-z0-9]/g, '.')}@gmail.com`,
              business_entity: s.entity || 'the-club',
              accountStatus: 'active',
              children: [{ student_id: s.id }],
              paymentStatus: 'paid',
              renewalStatus: 'renewed',
            };
          } else {
            parentsMap[key].children.push({ student_id: s.id });
          }
        });
        setParents(Object.values(parentsMap));
        setLoading(false);
        return;
      }
      const raw = data || [];
      const parentIds = raw.map(p => p.id);

      const [{ data: pkgs }, { data: pmts }] = await Promise.all([
        supabase.from('packages').select('student_id, status, payment_status').in('student_id', raw.flatMap(p => (p.student_parents || []).map(sp => sp.student_id))),
        supabase.from('payments').select('parent_id, status').in('parent_id', parentIds).order('date', { ascending: false }),
      ]);

      const pkgByStudent = {};
      if (pkgs) for (const p of pkgs) pkgByStudent[p.student_id] = p;

      const pymtByParent = {};
      if (pmts) for (const p of pmts) {
        if (!pymtByParent[p.parent_id]) pymtByParent[p.parent_id] = p.status;
      }

      setParents(raw.map(p => {
        const children = p.student_parents || [];
        let payStatus = 'paid';
        let renewStatus = 'renewed';
        if (children.length > 0) {
          const allPaid = children.every(sp => {
            const pkg = pkgByStudent[sp.student_id];
            return pkg?.payment_status === 'paid';
          });
          const anyExpired = children.some(sp => pkgByStudent[sp.student_id]?.status === 'expired' || pkgByStudent[sp.student_id]?.status === 'lapsed');
          payStatus = allPaid ? 'paid' : (pymtByParent[p.id] || 'pending');
          renewStatus = anyExpired ? 'expired' : 'renewed';
        }
        return {
          id: p.id,
          name: p.name,
          phone: p.phone,
          email: p.email ?? '',
          business_entity: p.entity,
          accountStatus: p.account_status,
          children,
          paymentStatus: payStatus,
          renewalStatus: renewStatus,
        };
      }));
      setLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const loadParentDetail = useCallback(async (parent) => {
    setDetailLoading(true);
    setSelected(parent);
    try {
      const [childRes, commRes] = await Promise.all([
        supabase
          .from('student_parents')
          .select('student_id, students(id, name, age_group, level, batch_id, batches(name))')
          .eq('parent_id', parent.id),
        supabase
          .from('communications_log')
          .select('*')
          .eq('parent_id', parent.id)
          .order('date', { ascending: false })
          .limit(10),
      ]);
      const children = ((childRes.data || []).map(sp => {
        const s = sp.students || {};
        return {
          id: s.id || sp.student_id,
          name: s.name || 'Unknown',
          ageGroup: s.age_group || '',
          batch: s.batches?.name || '',
          level: s.level || '',
        };
      }));
      setDetailChildren(children);
      setDetailComm(commRes.data || []);
    } catch (err) {
      console.error('[Parents] Failed to load parent detail:', err);
      toast.error('Failed to load parent details');
    } finally {
      setDetailLoading(false);
    }
  }, []);

  const filtered = parents;

  const openEdit = (parent) => {
    setEditItem(parent);
    setForm({
      name: parent.name,
      phone: parent.phone,
      email: parent.email,
      accountStatus: parent.accountStatus,
    });
  };

  const handleSave = async () => {
    try {
      const { error } = await supabase
        .from('parents')
        .update({
          name: form.name,
          phone: form.phone,
          email: form.email,
          account_status: form.accountStatus,
        })
        .eq('id', editItem.id);
      if (error) throw error;
      toast.success(`Parent "${form.name}" updated successfully`);
      setEditItem(null);
      setParents(prev => prev.map(p => p.id === editItem.id ? { ...p, name: form.name, phone: form.phone, email: form.email, accountStatus: form.accountStatus } : p));
    } catch (err) {
      console.error('[Parents] Save error:', err);
      toast.error('Failed to update parent');
    }
  };

  const columns = useMemo(() => [
    { header: 'Name', accessorKey: 'name' },
    { header: 'Phone', accessorKey: 'phone' },
    { header: 'Email', accessorKey: 'email' },
    { header: 'Children', accessorKey: 'children', cell: ({ getValue }) => getValue().length },
    { header: 'Payment', accessorKey: 'paymentStatus', cell: ({ getValue }) => <StatusPill status={getValue()} /> },
    { header: 'Renewal', accessorKey: 'renewalStatus', cell: ({ getValue }) => <StatusPill status={getValue()} /> },
    { header: 'Entity', accessorKey: 'business_entity', cell: ({ getValue }) => <StatusPill status={entityLabel(getValue())} /> },
    { header: 'Status', accessorKey: 'accountStatus', cell: ({ getValue }) => <StatusPill status={getValue()} /> },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <RowActionsMenu
          actions={[
            { label: 'Edit', icon: Pencil, onClick: () => openEdit(row.original) },
            { label: 'View Details', icon: Eye, onClick: () => loadParentDetail(row.original) },
          ]}
          itemLabel={row.original.name}
        />
      ),
      enableSorting: false,
      size: 48,
    },
  ], [loadParentDetail]);

  const renderCard = (p) => (
    <div className="space-y-2" onClick={() => loadParentDetail(p)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-brand-50 flex items-center justify-center">
            <User className="w-4 h-4 text-brand" />
          </div>
          <div>
            <span className="font-medium text-ink text-sm">{p.name}</span>
            <p className="text-xs text-ink-muted">{p.email}</p>
          </div>
        </div>
        <Eye className="w-4 h-4 text-ink-faint" />
      </div>
      <div className="flex flex-wrap gap-1.5">
        <span className="text-xs text-ink-muted">{p.phone}</span>
        <StatusPill status={p.paymentStatus} />
        <StatusPill status={p.accountStatus} />
      </div>
      <div className="flex items-center justify-between text-xs text-ink-muted">
        <span>{p.children.length} child{p.children.length !== 1 ? 'ren' : ''}</span>
        <StatusPill status={entityLabel(p.business_entity)} />
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton.SkeletonTable />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AdaptiveTable
        data={filtered}
        columns={columns}
        renderCard={renderCard}
        searchPlaceholder="Search parents..."
      />

      <Modal
        open={!!selected}
        onClose={() => setSelected(null)}
        title="Parent Details"
        size="lg"
      >
        {selected && (
<div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-brand-50 flex items-center justify-center shrink-0">
                <User className="w-7 h-7 text-brand" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-ink">{selected.name}</h3>
                <div className="flex items-center gap-3 mt-1 text-sm text-ink-muted">
                  <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {selected.phone}</span>
                  <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {selected.email}</span>
                </div>
                <div className="flex gap-1.5 mt-1.5">
                  <StatusPill status={selected.accountStatus} />
                  <StatusPill status={entityLabel(selected.business_entity)} />
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-ink mb-2">Children</h4>
              <div className="space-y-2">
                {detailLoading && <p className="text-sm text-ink-muted py-2">Loading...</p>}
                {!detailLoading && detailChildren.length === 0 && (
                  <p className="text-sm text-ink-muted py-2">No children found</p>
                )}
                {!detailLoading && detailChildren.map(child => (
                  <div key={child.id} className="flex items-center justify-between p-3 rounded-xl bg-canvas-soft">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-brand-50 flex items-center justify-center">
                        <User className="w-3.5 h-3.5 text-brand" />
                      </div>
                      <span className="text-sm font-medium text-ink">{child.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusPill status={child.ageGroup} />
                      <StatusPill status={child.batch} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-ink mb-2">Communication History</h4>
              <div className="space-y-2">
                {detailLoading && <p className="text-sm text-ink-muted py-2">Loading...</p>}
                {!detailLoading && detailComm.length === 0 && (
                  <p className="text-sm text-ink-muted py-2">No communications yet</p>
                )}
                {!detailLoading && detailComm.map((comm) => (
                  <div key={comm.id} className="flex items-center justify-between py-2 px-3 rounded-xl bg-canvas-soft">
                    <div>
                      <p className="text-sm text-ink">{commTypeLabel[comm.type] || comm.type}</p>
                      <p className="text-xs text-ink-muted">{comm.date && formatDate(comm.date)} / via {comm.channel}</p>
                    </div>
                    <StatusPill status={comm.status} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>

      <Modal open={!!editItem} onClose={() => setEditItem(null)} title="Edit Parent" size="sm">
        {editItem && (
          <div className="space-y-4">
            <Input label="Name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            <Input label="Phone" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
            <Input label="Email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
            <Dropdown label="Account Status" options={statusOptions} value={form.accountStatus} onChange={(v) => setForm((f) => ({ ...f, accountStatus: v }))} getOptionLabel={(o) => o.label} getOptionValue={(o) => o.value} />
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="secondary" onClick={() => setEditItem(null)}>Cancel</Button>
              <Button onClick={handleSave}>Save Changes</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
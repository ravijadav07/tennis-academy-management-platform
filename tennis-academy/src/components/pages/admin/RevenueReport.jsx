import { useState, useEffect, useMemo, useCallback } from 'react';
import { useSupabase } from '../../../context/SupabaseContext';
import Card from '../../ui/Card';
import Button from '../../ui/Button';
import Dropdown from '../../ui/Dropdown';
import StatusPill from '../../ui/StatusPill';
import { toast } from 'sonner';
import { Download, IndianRupee, Printer, Mail, AlertCircle, CheckSquare, Square } from 'lucide-react';
import { preparePaymentReminder } from '../../../utils/notificationEngine';
import { triggerWorkflow } from '../../../utils/api';
import { formatDateDDMMYY, getBatchDisplayName } from '../../../utils/formatters';
import { db } from '../../../mocks/localDb';

export default function RevenueReport() {
  const { services, entity } = useSupabase();
  const [state, setState] = useState({
    packages: [],
    students: [],
    enrollments: [],
    batches: [],
    courts: [],
  });

  const loadData = useCallback(async () => {
    try {
      const entityOpt = entity === 'all' ? undefined : entity;
      const [packagesRes, studentsRes, enrollmentsRes, batchesRes, courtsRes] = await Promise.all([
        services.packages.list({ entity: entityOpt, pageSize: 1000 }),
        services.students.list({ entity: entityOpt, pageSize: 1000 }),
        services.enrollments.list({ entity: entityOpt, pageSize: 1000 }),
        services.batches.list({ entity: entityOpt, pageSize: 500 }),
        services.courts.list({ entity: entityOpt, pageSize: 100 }),
      ]);
      if (!packagesRes.data || packagesRes.data.length === 0) {
        const local = db.readAll();
        setState({
          packages: local.packages || [],
          students: local.students || [],
          enrollments: local.enrollments || [],
          batches: local.batches || [],
          courts: local.courts || [],
        });
      } else {
        setState({
          packages: packagesRes.data || [],
          students: studentsRes.data || [],
          enrollments: enrollmentsRes.data || [],
          batches: batchesRes.data || [],
          courts: courtsRes.data || [],
        });
      }
    } catch (err) {
      console.warn('[RevenueReport] load error, using localDb fallback:', err);
      const local = db.readAll();
      setState({
        packages: local.packages || [],
        students: local.students || [],
        enrollments: local.enrollments || [],
        batches: local.batches || [],
        courts: local.courts || [],
      });
    }
  }, [services, entity]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [activeTab, setActiveTab] = useState('category');
  const [selectedDues, setSelectedDues] = useState(new Set());

  const packages = state.packages || [];
  const students = state.students || [];
  const enrollments = state.enrollments || [];
  const batches = state.batches || [];

  // Filter packages by month/year (using paymentDate, validTo, or creation date)
  const monthPackages = useMemo(() => {
    return packages.filter((p) => {
      const d = p.paymentDate || p.validTo || '';
      return d.startsWith(year + '-' + String(month).padStart(2, '0'));
    });
  }, [packages, month, year]);

  const totals = useMemo(() => {
    return monthPackages.reduce((acc, p) => {
      const amt = parseFloat(p.amount || p.finalAmount || 0) || 0;
      const paid = parseFloat(p.amountReceived || 0) || 0;
      const base = parseFloat(p.baseAmount) || Math.round(amt / 1.18);
      const tax = parseFloat(p.taxAmount) || (amt - base);
      return {
        base: acc.base + base,
        tax: acc.tax + tax,
        total: acc.total + amt,
        paid: acc.paid + paid,
        pending: acc.pending + Math.max(0, amt - paid)
      };
    }, { base: 0, tax: 0, total: 0, paid: 0, pending: 0 });
  }, [monthPackages]);

  // 1. By Category
  const byCategory = useMemo(() => {
    const map = {};
    monthPackages.forEach((p) => {
      const cat = p.program || 'Unknown';
      if (!map[cat]) map[cat] = { count: 0, base: 0, tax: 0, total: 0, paid: 0, pending: 0 };
      const amt = parseFloat(p.amount || p.finalAmount || 0) || 0;
      const paid = parseFloat(p.amountReceived || 0) || 0;
      const base = parseFloat(p.baseAmount) || Math.round(amt / 1.18);
      map[cat].count += 1;
      map[cat].base += base;
      map[cat].tax += (amt - base);
      map[cat].total += amt;
      map[cat].paid += paid;
      map[cat].pending += Math.max(0, amt - paid);
    });
    return map;
  }, [monthPackages]);

  // 2. By Entity (TOTS Tennis vs The Club)
  const byEntity = useMemo(() => {
    const map = {};
    monthPackages.forEach((p) => {
      const stu = students.find((s) => s.id === p.studentId);
      const enr = enrollments.find((e) => e.studentId === p.studentId);
      const ent = stu?.membershipType === 'Non-member' ? 'TOTS Tennis' : (stu?.entity || enr?.entity || 'The Club');
      if (!map[ent]) map[ent] = { count: 0, base: 0, tax: 0, total: 0, paid: 0, pending: 0 };
      const amt = parseFloat(p.amount || p.finalAmount || 0) || 0;
      const paid = parseFloat(p.amountReceived || 0) || 0;
      const base = parseFloat(p.baseAmount) || Math.round(amt / 1.18);
      map[ent].count += 1;
      map[ent].base += base;
      map[ent].tax += (amt - base);
      map[ent].total += amt;
      map[ent].paid += paid;
      map[ent].pending += Math.max(0, amt - paid);
    });
    return map;
  }, [monthPackages, students, enrollments]);

  // 3. By Service Type (Group, Private, Add-on, Customised)
  const byServiceType = useMemo(() => {
    const map = {};
    monthPackages.forEach((p) => {
      const enr = enrollments.find((e) => e.studentId === p.studentId);
      const sType = p.enrollmentType || enr?.enrollmentType || (p.program === 'PRIVATE' ? 'Private' : 'Group');
      if (!map[sType]) map[sType] = { count: 0, base: 0, tax: 0, total: 0, paid: 0, pending: 0 };
      const amt = parseFloat(p.amount || p.finalAmount || 0) || 0;
      const paid = parseFloat(p.amountReceived || 0) || 0;
      const base = parseFloat(p.baseAmount) || Math.round(amt / 1.18);
      map[sType].count += 1;
      map[sType].base += base;
      map[sType].tax += (amt - base);
      map[sType].total += amt;
      map[sType].paid += paid;
      map[sType].pending += Math.max(0, amt - paid);
    });
    return map;
  }, [monthPackages, enrollments]);

  // 4. Outstanding Dues List by player, batch and category
  const outstandingDues = useMemo(() => {
    return monthPackages
      .map((p) => {
        const amt = parseFloat(p.amount || p.finalAmount || 0) || 0;
        const paid = parseFloat(p.amountReceived || 0) || 0;
        const pending = Math.max(0, amt - paid);
        if (pending <= 0) return null;
        const stu = students.find((s) => s.id === p.studentId);
        const enr = enrollments.find((e) => e.studentId === p.studentId && e.status === 'ACTIVE');
        const batch = batches.find((b) => b.id === enr?.batchId);
        return {
          packageId: p.id,
          studentId: p.studentId,
          studentName: stu?.name || p.studentId,
          guardianName: stu?.guardianName || '—',
          guardianPhone: stu?.guardianPhone || '',
          guardianEmail: stu?.guardianEmail || '',
          category: p.program || 'Unknown',
          batchName: batch ? `${getBatchDisplayName(batch, state.courts)} (${batch.dayPattern})` : '—',
          totalAmount: amt,
          amountPaid: paid,
          pendingAmount: pending,
          paymentStatus: p.paymentStatus || 'PENDING',
          nextPaymentDue: p.nextPaymentDue || p.validTo || '',
        };
      })
      .filter(Boolean)
      .sort((a, b) => b.pendingAmount - a.pendingAmount);
  }, [monthPackages, students, enrollments, batches]);

  // Send Payment Reminder Email (Workflow + mailto fallback)
  const handleSendReminder = async (due) => {
    const email = due.guardianEmail || (due.studentName ? `parent.${due.studentName.toLowerCase().replace(/[^a-z0-9]/g, '.')}@gmail.com` : '');
    if (!email) {
      toast.error(`Guardian email is not available for ${due.studentName}`);
      return;
    }
    try {
      await triggerWorkflow('payment.reminder', {
        packages: [{
          id: due.packageId, amount: due.totalAmount, amount_received: due.amountPaid,
          program: due.category, student_id: due.studentId, payment_status: due.paymentStatus
        }],
        students: [{ id: due.studentId, name: due.studentName, guardianEmail: email }],
        alreadyReminded: []
      });
      toast.success(`Payment reminder sent via workflow for ${due.studentName}`);
    } catch (wfErr) {
      console.warn('Workflow failed, falling back to mailto:', wfErr);
      const mailto = preparePaymentReminder({
        studentName: due.studentName,
        guardianEmail: email,
        program: due.category,
        pendingAmount: due.pendingAmount,
        hasPaymentUrl: false,
        paymentUrl: '',
      });
      toast.success(`Opening payment reminder email for ${due.studentName}`);
      window.open(mailto, '_blank');
    }
    await db.logPaymentReminder({
      studentId: due.studentId,
      packageId: due.packageId,
      guardianEmail: email,
      pendingAmount: due.pendingAmount,
    });
  };

  // Bulk send — handles selection toggles
  const toggleSelectDue = (packageId, isComplimentary) => {
    if (isComplimentary) return;
    setSelectedDues((prev) => {
      const next = new Set(prev);
      next.has(packageId) ? next.delete(packageId) : next.add(packageId);
      return next;
    });
  };
  const toggleSelectAll = () => {
    const selectable = outstandingDues.filter((d) => d.paymentStatus !== 'complimentary');
    if (selectedDues.size === selectable.length) {
      setSelectedDues(new Set());
    } else {
      setSelectedDues(new Set(selectable.map((d) => d.packageId)));
    }
  };

  // Bulk payment reminder — one email per parent, failure tracking
  const handleBulkSendReminders = async () => {
    if (selectedDues.size === 0) return;
    const failures = [];
    let successCount = 0;
    for (const packageId of selectedDues) {
      const due = outstandingDues.find((d) => d.packageId === packageId);
      if (!due || due.paymentStatus === 'complimentary') continue;
      const email = due.guardianEmail || (due.studentName ? `parent.${due.studentName.toLowerCase().replace(/[^a-z0-9]/g, '.')}@gmail.com` : '');
      if (!email) {
        failures.push(`${due.studentName} (no email)`);
        continue;
      }
      try {
        await triggerWorkflow('payment.reminder', {
          packages: [{
            id: due.packageId, amount: due.totalAmount, amount_received: due.amountPaid,
            program: due.category, student_id: due.studentId, payment_status: due.paymentStatus
          }],
          students: [{ id: due.studentId, name: due.studentName, guardianEmail: email }],
          alreadyReminded: []
        });
        await db.logPaymentReminder({ studentId: due.studentId, packageId: due.packageId, guardianEmail: email, pendingAmount: due.pendingAmount });
        successCount++;
      } catch (e) { failures.push(due.studentName); }
    }
    if (successCount === 0 && failures.length > 0) {
      toast.error(`Failed to send reminders: ${failures.join(', ')}`);
    } else if (failures.length > 0) {
      toast.error(`${successCount} of ${selectedDues.size} sent. ${failures.length} failed: ${failures.join(', ')}`);
    } else {
      toast.success(`All ${successCount} payment reminders sent successfully`);
    }
    setSelectedDues(new Set());
  };

  const handleExportCSV = () => {
    const rows = monthPackages.map((p) => {
      const stu = students.find((s) => s.id === p.studentId);
      const enr = enrollments.find((e) => e.studentId === p.studentId);
      const amt = parseFloat(p.amount || p.finalAmount || 0) || 0;
      const paid = parseFloat(p.amountReceived || 0) || 0;
      const base = parseFloat(p.baseAmount) || Math.round(amt / 1.18);
      const sType = p.enrollmentType || enr?.enrollmentType || (p.program === 'PRIVATE' ? 'Private' : 'Group');
      const ent = stu?.membershipType === 'Non-member' ? 'TOTS Tennis' : (stu?.entity || enr?.entity || 'The Club');
      return [
        `"${stu?.name || p.studentId}"`,
        `"${ent}"`,
        `"${p.program || ''}"`,
        `"${sType}"`,
        base,
        amt - base,
        amt,
        paid,
        Math.max(0, amt - paid)
      ].join(',');
    });
    const csv = ['Player,Entity,Category,Service Type,Base Amount,GST,Total Amount,Paid,Pending', ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `revenue-report-${year}-${String(month).padStart(2, '0')}.csv`;
    a.click();
    toast.success('CSV exported');
  };

  return (
    <div className="space-y-4">
      {/* Filters & Export Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <Dropdown
            className="w-36"
            value={String(month)}
            onChange={(v) => setMonth(parseInt(typeof v === 'object' ? (v.value || '1') : (v || '1')))}
            placeholder="Month"
            options={Array.from({ length: 12 }, (_, i) => ({
              value: String(i + 1),
              label: new Date(2026, i, 1).toLocaleString('default', { month: 'long' })
            }))}
            getOptionLabel={(o) => o.label}
            getOptionValue={(o) => o.value}
          />
          <Dropdown
            className="w-28"
            value={String(year)}
            onChange={(v) => setYear(parseInt(typeof v === 'object' ? (v.value || '2026') : (v || '2026')))}
            options={[2025, 2026, 2027].map((y) => ({ value: String(y), label: String(y) }))}
            getOptionLabel={(o) => o.label}
            getOptionValue={(o) => o.value}
          />
          <Button size="sm" variant="secondary" icon={Download} onClick={handleExportCSV}>Export CSV</Button>
          <Button size="sm" variant="secondary" icon={Printer} onClick={() => window.print()}>Print / PDF</Button>
        </div>
        <span className="text-xs text-ink-muted">{monthPackages.length} package lines</span>
      </div>

      {/* Financial KPI Summary Cards (Base + Tax = Total) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {[
          { label: 'Pre-Tax Base', value: totals.base, color: 'text-ink' },
          { label: 'GST (18%)', value: totals.tax, color: 'text-ink-muted' },
          { label: 'Gross Total', value: totals.total, color: 'text-ink font-bold' },
          { label: 'Collected (Paid)', value: totals.paid, color: 'text-ok font-bold' },
          { label: 'Outstanding (Pending)', value: totals.pending, color: totals.pending > 0 ? 'text-err font-bold' : 'text-ink-muted' },
        ].map((k) => (
          <Card key={k.label} className="text-center p-3 sm:p-4">
            <p className="text-[10px] font-semibold text-ink-muted uppercase tracking-wider mb-1">{k.label}</p>
            <p className={`text-base sm:text-lg ${k.color} flex items-center justify-center`}>
              <IndianRupee className="w-3.5 h-3.5 mr-0.5" />
              {(k.value || 0).toLocaleString('en-IN')}
            </p>
          </Card>
        ))}
      </div>

      {/* Navigation Tabs for Breakdowns */}
      <div className="flex items-center gap-1.5 p-1 bg-canvas-soft rounded-xl border border-line w-fit flex-wrap">
        {[
          { id: 'category', label: 'By Category' },
          { id: 'entity', label: 'By Entity (TOTS vs Club)' },
          { id: 'service', label: 'By Service Type' },
          { id: 'dues', label: `Outstanding Dues (${outstandingDues.length})` },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === tab.id
                ? 'bg-white text-brand shadow-sm font-bold'
                : 'text-ink-muted hover:text-ink hover:bg-white/50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 1. By Category Table */}
      {activeTab === 'category' && (
        <Card>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-ink">Revenue by Category</h3>
            <span className="text-xs text-ink-faint">Product lines reconciled to total</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs min-w-[560px]">
              <thead>
                <tr className="border-b border-line text-left text-ink-muted bg-canvas-soft/40">
                  <th className="py-2.5 px-3 font-semibold whitespace-nowrap">Category</th>
                  <th className="py-2.5 px-3 font-semibold whitespace-nowrap text-center">Packages</th>
                  <th className="py-2.5 px-3 font-semibold whitespace-nowrap text-right">Pre-Tax Base</th>
                  <th className="py-2.5 px-3 font-semibold whitespace-nowrap text-right">GST</th>
                  <th className="py-2.5 px-3 font-semibold whitespace-nowrap text-right">Total</th>
                  <th className="py-2.5 px-3 font-semibold whitespace-nowrap text-right">Collected</th>
                  <th className="py-2.5 px-3 font-semibold whitespace-nowrap text-right">Pending</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(byCategory).map(([cat, d]) => (
                  <tr key={cat} className="border-b border-line/40 hover:bg-canvas-soft/50 transition-colors">
                    <td className="py-2.5 px-3 font-semibold text-ink whitespace-nowrap">{cat}</td>
                    <td className="py-2.5 px-3 text-center text-ink-muted">{d.count}</td>
                    <td className="py-2.5 px-3 text-right whitespace-nowrap">₹{d.base.toLocaleString('en-IN')}</td>
                    <td className="py-2.5 px-3 text-right text-ink-muted whitespace-nowrap">₹{d.tax.toLocaleString('en-IN')}</td>
                    <td className="py-2.5 px-3 text-right font-semibold text-ink whitespace-nowrap">₹{d.total.toLocaleString('en-IN')}</td>
                    <td className="py-2.5 px-3 text-right text-ok font-medium whitespace-nowrap">₹{d.paid.toLocaleString('en-IN')}</td>
                    <td className="py-2.5 px-3 text-right text-err font-medium whitespace-nowrap">₹{d.pending.toLocaleString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* 2. By Entity Table */}
      {activeTab === 'entity' && (
        <Card>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-ink">Revenue by Business Entity</h3>
            <span className="text-xs text-ink-faint">TOTS Programme vs Dirt Club</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs min-w-[560px]">
              <thead>
                <tr className="border-b border-line text-left text-ink-muted bg-canvas-soft/40">
                  <th className="py-2.5 px-3 font-semibold whitespace-nowrap">Entity</th>
                  <th className="py-2.5 px-3 font-semibold whitespace-nowrap text-center">Packages</th>
                  <th className="py-2.5 px-3 font-semibold whitespace-nowrap text-right">Pre-Tax Base</th>
                  <th className="py-2.5 px-3 font-semibold whitespace-nowrap text-right">GST</th>
                  <th className="py-2.5 px-3 font-semibold whitespace-nowrap text-right">Total</th>
                  <th className="py-2.5 px-3 font-semibold whitespace-nowrap text-right">Collected</th>
                  <th className="py-2.5 px-3 font-semibold whitespace-nowrap text-right">Pending</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(byEntity).map(([ent, d]) => (
                  <tr key={ent} className="border-b border-line/40 hover:bg-canvas-soft/50 transition-colors">
                    <td className="py-2.5 px-3 font-semibold text-ink whitespace-nowrap">{ent}</td>
                    <td className="py-2.5 px-3 text-center text-ink-muted">{d.count}</td>
                    <td className="py-2.5 px-3 text-right whitespace-nowrap">₹{d.base.toLocaleString('en-IN')}</td>
                    <td className="py-2.5 px-3 text-right text-ink-muted whitespace-nowrap">₹{d.tax.toLocaleString('en-IN')}</td>
                    <td className="py-2.5 px-3 text-right font-semibold text-ink whitespace-nowrap">₹{d.total.toLocaleString('en-IN')}</td>
                    <td className="py-2.5 px-3 text-right text-ok font-medium whitespace-nowrap">₹{d.paid.toLocaleString('en-IN')}</td>
                    <td className="py-2.5 px-3 text-right text-err font-medium whitespace-nowrap">₹{d.pending.toLocaleString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* 3. By Service Type Table */}
      {activeTab === 'service' && (
        <Card>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-ink">Revenue by Service Type</h3>
            <span className="text-xs text-ink-faint">Group, Private, Add-on, Customised</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs min-w-[560px]">
              <thead>
                <tr className="border-b border-line text-left text-ink-muted bg-canvas-soft/40">
                  <th className="py-2.5 px-3 font-semibold whitespace-nowrap">Service Type</th>
                  <th className="py-2.5 px-3 font-semibold whitespace-nowrap text-center">Lines</th>
                  <th className="py-2.5 px-3 font-semibold whitespace-nowrap text-right">Pre-Tax Base</th>
                  <th className="py-2.5 px-3 font-semibold whitespace-nowrap text-right">GST</th>
                  <th className="py-2.5 px-3 font-semibold whitespace-nowrap text-right">Total</th>
                  <th className="py-2.5 px-3 font-semibold whitespace-nowrap text-right">Collected</th>
                  <th className="py-2.5 px-3 font-semibold whitespace-nowrap text-right">Pending</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(byServiceType).map(([sType, d]) => (
                  <tr key={sType} className="border-b border-line/40 hover:bg-canvas-soft/50 transition-colors">
                    <td className="py-2.5 px-3 font-semibold text-ink whitespace-nowrap">{sType}</td>
                    <td className="py-2.5 px-3 text-center text-ink-muted">{d.count}</td>
                    <td className="py-2.5 px-3 text-right whitespace-nowrap">₹{d.base.toLocaleString('en-IN')}</td>
                    <td className="py-2.5 px-3 text-right text-ink-muted whitespace-nowrap">₹{d.tax.toLocaleString('en-IN')}</td>
                    <td className="py-2.5 px-3 text-right font-semibold text-ink whitespace-nowrap">₹{d.total.toLocaleString('en-IN')}</td>
                    <td className="py-2.5 px-3 text-right text-ok font-medium whitespace-nowrap">₹{d.paid.toLocaleString('en-IN')}</td>
                    <td className="py-2.5 px-3 text-right text-err font-medium whitespace-nowrap">₹{d.pending.toLocaleString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* 4. Outstanding Dues List */}
      {activeTab === 'dues' && (
        <Card>
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-semibold text-ink">Outstanding Dues</h3>
              <p className="text-xs text-ink-muted">Uncollected balances by player, batch and category</p>
            </div>
            <div className="flex items-center gap-3">
              {selectedDues.size > 0 && (
                <Button size="sm" variant="primary" icon={Mail} onClick={handleBulkSendReminders}>
                  Send Payment Reminder ({selectedDues.size})
                </Button>
              )}
              <span className="text-xs font-bold text-err">Total Due: ₹{totals.pending.toLocaleString('en-IN')}</span>
            </div>
          </div>

          {outstandingDues.length === 0 ? (
            <div className="text-center py-8 text-xs text-ink-faint">
              No outstanding dues for this period. All packages fully paid!
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs min-w-[720px]">
                <thead>
                  <tr className="border-b border-line text-left text-ink-muted bg-canvas-soft/40">
                    <th className="py-2.5 px-2 font-semibold w-8">
                      <button onClick={toggleSelectAll} className="text-ink-faint hover:text-ink transition-colors">
                        {selectedDues.size === outstandingDues.filter((d) => d.paymentStatus !== 'complimentary').length && selectedDues.size > 0 ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                      </button>
                    </th>
                    <th className="py-2.5 px-3 font-semibold whitespace-nowrap">Player</th>
                    <th className="py-2.5 px-3 font-semibold whitespace-nowrap">Category / Batch</th>
                    <th className="py-2.5 px-3 font-semibold whitespace-nowrap">Guardian / Phone</th>
                    <th className="py-2.5 px-3 font-semibold whitespace-nowrap text-right">Total</th>
                    <th className="py-2.5 px-3 font-semibold whitespace-nowrap text-right">Paid</th>
                    <th className="py-2.5 px-3 font-semibold whitespace-nowrap text-right">Due</th>
                    <th className="py-2.5 px-3 font-semibold whitespace-nowrap text-center">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {outstandingDues.map((due) => {
                    const isComplimentary = due.paymentStatus === 'complimentary';
                    return (
                    <tr key={due.packageId} className="border-b border-line/40 hover:bg-canvas-soft/50 transition-colors">
                      <td className="py-2.5 px-2">
                        <button onClick={() => toggleSelectDue(due.packageId, isComplimentary)} disabled={isComplimentary}
                          className={`${isComplimentary ? 'text-ink-faint/30 cursor-not-allowed' : 'text-ink-faint hover:text-ink cursor-pointer'} transition-colors`}>
                          {selectedDues.has(due.packageId) ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                        </button>
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-ink whitespace-nowrap">{due.studentName}</td>
                      <td className="py-2.5 px-3 text-ink-muted whitespace-nowrap">
                        <span className="font-medium text-ink">{due.category}</span>
                        {due.batchName !== '—' && <span className="text-ink-faint"> · {due.batchName}</span>}
                      </td>
                      <td className="py-2.5 px-3 text-ink-muted whitespace-nowrap">
                        <p>{due.guardianName}</p>
                        <p className="text-[10px] text-ink-faint">{due.guardianPhone || due.guardianEmail || '—'}</p>
                      </td>
                      <td className="py-2.5 px-3 text-right whitespace-nowrap">₹{due.totalAmount.toLocaleString('en-IN')}</td>
                      <td className="py-2.5 px-3 text-right text-ok whitespace-nowrap">₹{due.amountPaid.toLocaleString('en-IN')}</td>
                      <td className="py-2.5 px-3 text-right text-err font-bold whitespace-nowrap">₹{due.pendingAmount.toLocaleString('en-IN')}</td>
                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        <Button size="sm" variant="ghost" icon={Mail}
                          className="!h-7 !px-2.5 !text-[11px] text-brand hover:bg-brand-50"
                          onClick={() => handleSendReminder(due)}>
                          Email Reminder
                        </Button>
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
import { useState, useMemo } from 'react';
import { useDb } from '../../../context/DbContext';
import Card from '../../ui/Card';
import Button from '../../ui/Button';
import Dropdown from '../../ui/Dropdown';
import { toast } from 'sonner';
import { Download, IndianRupee } from 'lucide-react';

const LBL = 'block text-[10px] font-semibold text-ink-muted uppercase tracking-[0.04em] mb-1';

function getMonthLabel(m, y) {
  return new Date(y, m - 1, 1).toLocaleString('default', { month: 'long' }) + ' ' + y;
}

export default function RevenueReport() {
  const { db, tick } = useDb();
  const state = useMemo(() => db.readAll(), [db, tick]);
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());

  const packages = state.packages || [];
  const students = state.students || [];
  const enrollments = state.enrollments || [];

  // Filter packages by month/year (using validTo or paymentDate)
  const monthPackages = packages.filter((p) => {
    const d = p.paymentDate || p.validTo || '';
    return d.startsWith(year + '-' + String(month).padStart(2, '0'));
  });

  const totals = monthPackages.reduce((acc, p) => {
    const amt = p.amount || p.finalAmount || 0;
    const paid = p.amountReceived || 0;
    const base = p.baseAmount || Math.round(amt / 1.18);
    const tax = p.taxAmount || (amt - base);
    return { base: acc.base + base, tax: acc.tax + tax, total: acc.total + amt, paid: acc.paid + paid, pending: acc.pending + (amt - paid) };
  }, { base: 0, tax: 0, total: 0, paid: 0, pending: 0 });

  // By category
  const byCategory = {};
  monthPackages.forEach((p) => {
    const cat = p.program || 'Unknown';
    if (!byCategory[cat]) byCategory[cat] = { base: 0, tax: 0, total: 0, paid: 0, pending: 0 };
    const amt = p.amount || p.finalAmount || 0;
    const paid = p.amountReceived || 0;
    const base = p.baseAmount || Math.round(amt / 1.18);
    byCategory[cat].base += base;
    byCategory[cat].tax += amt - base;
    byCategory[cat].total += amt;
    byCategory[cat].paid += paid;
    byCategory[cat].pending += amt - paid;
  });

  // By entity
  const byEntity = {};
  monthPackages.forEach((p) => {
    const enr = enrollments.find((e) => e.studentId === p.studentId);
    const stu = students.find((s) => s.id === p.studentId);
    const entity = stu?.entity || enr?.entity || 'Unknown';
    if (!byEntity[entity]) byEntity[entity] = { base: 0, tax: 0, total: 0, paid: 0, pending: 0 };
    const amt = p.amount || p.finalAmount || 0;
    const paid = p.amountReceived || 0;
    const base = p.baseAmount || Math.round(amt / 1.18);
    byEntity[entity].base += base;
    byEntity[entity].tax += amt - base;
    byEntity[entity].total += amt;
    byEntity[entity].paid += paid;
    byEntity[entity].pending += amt - paid;
  });

  const handleExportCSV = () => {
    const rows = monthPackages.map((p) => {
      const stu = students.find((s) => s.id === p.studentId);
      const amt = p.amount || p.finalAmount || 0;
      const paid = p.amountReceived || 0;
      const base = p.baseAmount || Math.round(amt / 1.18);
      return [stu?.name || p.studentId, stu?.entity || '', p.program || '', 'Group', base, amt - base, amt, paid, amt - paid].join(',');
    });
    const csv = ['Player,Entity,Category,Service Type,Base,GST,Total,Paid,Pending', ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = 'revenue-' + year + '-' + String(month).padStart(2, '0') + '.csv'; a.click();
    toast.success('CSV exported');
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        <Dropdown value={String(month)} onChange={(v) => setMonth(parseInt(typeof v === 'object' ? (v.value || '1') : (v || '1')))} placeholder="Month"
          options={Array.from({ length: 12 }, (_, i) => ({ value: String(i + 1), label: new Date(2026, i, 1).toLocaleString('default', { month: 'long' }) }))}
          getOptionLabel={(o) => o.label} getOptionValue={(o) => o.value} />
        <Dropdown value={String(year)} onChange={(v) => setYear(parseInt(typeof v === 'object' ? (v.value || '2026') : (v || '2026')))}
          options={[2025, 2026, 2027].map((y) => ({ value: String(y), label: String(y) }))}
          getOptionLabel={(o) => o.label} getOptionValue={(o) => o.value} />
        <Button size="sm" variant="secondary" icon={Download} onClick={handleExportCSV}>Export CSV</Button>
        <span className="text-xs text-ink-muted sm:ml-auto w-full sm:w-auto text-right">{monthPackages.length} packages</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {[
          { label: 'Base', value: totals.base, color: 'text-ink' },
          { label: 'GST', value: totals.tax, color: 'text-ink-muted' },
          { label: 'Total', value: totals.total, color: 'text-ok' },
          { label: 'Paid', value: totals.paid, color: 'text-ok' },
          { label: 'Pending', value: totals.pending, color: 'text-err' },
        ].map((k) => (
          <Card key={k.label} className="text-center">
            <p className="text-[10px] font-semibold text-ink-muted uppercase">{k.label}</p>
            <p className={'text-lg font-bold ' + k.color}><IndianRupee className="w-3.5 h-3.5 inline mr-0.5" />{(k.value || 0).toLocaleString('en-IN')}</p>
          </Card>
        ))}
      </div>

      <Card>
        <h3 className="text-sm font-semibold text-ink mb-3">By Category</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs min-w-[500px]">
            <thead>
              <tr className="border-b border-line text-left text-ink-muted bg-canvas-soft/30">
                <th className="py-2.5 px-3 font-semibold whitespace-nowrap">Category</th>
                <th className="py-2.5 px-3 font-semibold whitespace-nowrap text-right">Base</th>
                <th className="py-2.5 px-3 font-semibold whitespace-nowrap text-right">GST</th>
                <th className="py-2.5 px-3 font-semibold whitespace-nowrap text-right">Total</th>
                <th className="py-2.5 px-3 font-semibold whitespace-nowrap text-right">Paid</th>
                <th className="py-2.5 px-3 font-semibold whitespace-nowrap text-right">Pending</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(byCategory).map(([cat, d]) => (
                <tr key={cat} className="border-b border-line/50 hover:bg-canvas-soft/40 transition-colors">
                  <td className="py-2.5 px-3 font-semibold text-ink whitespace-nowrap">{cat}</td>
                  <td className="py-2.5 px-3 text-right whitespace-nowrap">{d.base.toLocaleString('en-IN')}</td>
                  <td className="py-2.5 px-3 text-right whitespace-nowrap">{d.tax.toLocaleString('en-IN')}</td>
                  <td className="py-2.5 px-3 text-right whitespace-nowrap font-medium">{d.total.toLocaleString('en-IN')}</td>
                  <td className="py-2.5 px-3 text-right text-ok whitespace-nowrap">{d.paid.toLocaleString('en-IN')}</td>
                  <td className="py-2.5 px-3 text-right text-err whitespace-nowrap">{d.pending.toLocaleString('en-IN')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card>
        <h3 className="text-sm font-semibold text-ink mb-3">By Entity</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs min-w-[500px]">
            <thead>
              <tr className="border-b border-line text-left text-ink-muted bg-canvas-soft/30">
                <th className="py-2.5 px-3 font-semibold whitespace-nowrap">Entity</th>
                <th className="py-2.5 px-3 font-semibold whitespace-nowrap text-right">Base</th>
                <th className="py-2.5 px-3 font-semibold whitespace-nowrap text-right">GST</th>
                <th className="py-2.5 px-3 font-semibold whitespace-nowrap text-right">Total</th>
                <th className="py-2.5 px-3 font-semibold whitespace-nowrap text-right">Paid</th>
                <th className="py-2.5 px-3 font-semibold whitespace-nowrap text-right">Pending</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(byEntity).map(([ent, d]) => (
                <tr key={ent} className="border-b border-line/50 hover:bg-canvas-soft/40 transition-colors">
                  <td className="py-2.5 px-3 font-semibold text-ink whitespace-nowrap">{ent}</td>
                  <td className="py-2.5 px-3 text-right whitespace-nowrap">{d.base.toLocaleString('en-IN')}</td>
                  <td className="py-2.5 px-3 text-right whitespace-nowrap">{d.tax.toLocaleString('en-IN')}</td>
                  <td className="py-2.5 px-3 text-right whitespace-nowrap font-medium">{d.total.toLocaleString('en-IN')}</td>
                  <td className="py-2.5 px-3 text-right text-ok whitespace-nowrap">{d.paid.toLocaleString('en-IN')}</td>
                  <td className="py-2.5 px-3 text-right text-err whitespace-nowrap">{d.pending.toLocaleString('en-IN')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
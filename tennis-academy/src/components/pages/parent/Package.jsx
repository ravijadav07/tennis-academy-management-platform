import { useState, useEffect, useCallback } from 'react';
import { Calendar, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../../context/AuthContext';
import Card from '../../ui/Card';
import StatusPill from '../../ui/StatusPill';
import { formatCurrency, formatDate, daysUntil } from '../../../utils/formatters';
import { cn } from '../../../utils/cn';

export default function Package() {
  const { user } = useAuth();
  const [packageData, setPackageData] = useState(null);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { fetchTableData } = await import('../../../utils/googleSheets');
      const [allStudents, allPackages, allPayments] = await Promise.all([
        fetchTableData('students'),
        fetchTableData('packages'),
        fetchTableData('payments'),
      ]);

      const phone = user?.guardianPhone || user?.phone;
      const cleanPhone = (phone || '').replace(/\D/g, '');
      const userChildIds = user?.childrenIds || [];

      const matchedChildren = allStudents.filter((s) => {
        if (userChildIds.includes(s.id)) return true;
        const gPhone = (s.guardianPhone || s.guardian_phone || s.phone || '').replace(/\D/g, '');
        return Boolean(cleanPhone && gPhone && (gPhone.includes(cleanPhone) || cleanPhone.includes(gPhone)));
      });

      const matchedChildIds = matchedChildren.map((c) => c.id);

      const pkgs = allPackages.filter((p) => matchedChildIds.includes(p.studentId || p.student_id));
      
      let pkgInfo = null;
      if (pkgs && pkgs.length > 0) {
        const p = pkgs[0];
        const now = new Date();
        const start = new Date(p.startDate || p.start_date || Date.now());
        const exp = new Date(p.expiryDate || p.expiry_date || Date.now());
        const totalDays = Math.max(1, Math.ceil((exp.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
        const elapsedDays = Math.ceil((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
        const daysUsed = Math.max(0, Math.min(elapsedDays, totalDays));

        const student = matchedChildren.find((c) => c.id === (p.studentId || p.student_id));

        pkgInfo = {
          id: p.id,
          planType: p.planType || p.plan_type || p.program || 'Standard Package',
          amount: parseFloat(p.amount || 0),
          startDate: p.startDate || p.start_date,
          expiryDate: p.expiryDate || p.expiry_date,
          status: p.status || 'active',
          paymentStatus: p.paymentStatus || p.payment_status || 'paid',
          overdueDays: parseInt(p.overdueDays || 0, 10),
          studentName: student ? student.name : 'Your child',
          daysUsed,
          totalDays,
        };
      }
      setPackageData(pkgInfo);

      const payRows = allPayments.filter((p) => 
        matchedChildIds.includes(p.studentId || p.student_id) || 
        (p.parentId && p.parentId === user?.linkedParentId)
      );
      setPayments(payRows || []);
    } catch (err) {
      console.error('Failed to fetch package data:', err);
      toast.error('Failed to load package data');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-48 bg-canvas-soft rounded-xl animate-pulse" />
        <div className="h-24 bg-canvas-soft rounded-xl animate-pulse" />
        <div className="h-32 bg-canvas-soft rounded-xl animate-pulse" />
      </div>
    );
  }

  if (!packageData) {
    return (
      <div className="space-y-4">
        <Card>
          <div className="py-8 text-center">
            <p className="text-sm font-semibold text-ink-muted">No active package found</p>
            <p className="text-xs text-ink-faint mt-1">Contact the academy for enrollment</p>
          </div>
        </Card>
      </div>
    );
  }

  const daysLeft = daysUntil(packageData.expiryDate);
  const pctUsed = (packageData.daysUsed / packageData.totalDays) * 100;
  const isExpired = packageData.status === 'expired' || packageData.status === 'lapsed' || daysLeft <= 0;
  const isWarning = !isExpired && daysLeft <= 10;

  const barColor = isExpired ? 'bg-err' : isWarning ? 'bg-warn' : 'bg-ok';

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-ink">Current Package</h3>
          <StatusPill status={isExpired ? 'expired' : 'active'} />
        </div>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-xs text-ink-faint">Plan</p>
            <p className="text-sm font-semibold text-ink">{packageData.planType}</p>
          </div>
          <div>
            <p className="text-xs text-ink-faint">Amount</p>
            <p className="text-sm font-semibold text-ink">{formatCurrency(packageData.amount)}</p>
          </div>
          <div>
            <p className="text-xs text-ink-faint flex items-center gap-1"><Calendar className="w-3 h-3" /> Start</p>
            <p className="text-sm font-semibold text-ink">{formatDate(packageData.startDate)}</p>
          </div>
          <div>
            <p className="text-xs text-ink-faint flex items-center gap-1"><Clock className="w-3 h-3" /> Expiry</p>
            <p className="text-sm font-semibold text-ink">{formatDate(packageData.expiryDate)}</p>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between text-xs text-ink-muted mb-2">
            <span>{packageData.daysUsed} of {packageData.totalDays} days used</span>
            <span className={cn(isExpired ? 'text-err' : isWarning ? 'text-warn' : 'text-ok')}>
              {isExpired ? 'Expired' : `${daysLeft} days remaining`}
            </span>
          </div>
          <div className="w-full h-2 bg-canvas-soft rounded-full overflow-hidden">
            <div
              className={cn('h-full rounded-full transition-all', barColor)}
              style={{ width: `${Math.min(pctUsed, 100)}%` }}
            />
          </div>
          {isExpired && (
            <p className="text-xs text-err mt-2">Package has expired. Please renew to continue.</p>
          )}
        </div>
      </Card>

      <Card>
        <h3 className="text-sm font-semibold text-ink mb-2.5">Renewal Details</h3>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-ink-muted">Next payment</p>
            <p className="text-base font-semibold text-ink">{formatCurrency(packageData.amount)}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-ink-muted">Due date</p>
            <p className="text-base font-semibold text-ink">{formatDate(packageData.expiryDate)}</p>
          </div>
        </div>
      </Card>

      <Card>
        <h3 className="text-sm font-semibold text-ink mb-3">Previous Payments</h3>
        <div className="divide-y divide-line">
          {payments.map(p => (
            <div key={p.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
              <div className="min-w-0">
                <p className="text-sm font-medium text-ink">{p.type || 'Payment'}</p>
                <p className="text-xs text-ink-muted">{formatDate(p.date)} &middot; {p.invoice_id || '--'}</p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className="text-sm font-semibold text-ink">{formatCurrency(p.amount)}</span>
                <StatusPill status={p.status} />
              </div>
            </div>
          ))}
          {payments.length === 0 && (
            <p className="py-3 text-sm text-ink-muted text-center">No payment history</p>
          )}
        </div>
      </Card>
    </div>
  );
}
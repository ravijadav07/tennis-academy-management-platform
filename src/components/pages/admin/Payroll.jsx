import { usePayrollData } from '../../../hooks/useCoach';
import Card from '../../ui/Card';
import { IndianRupee } from 'lucide-react';

export default function Payroll() {
  const payroll = usePayrollData({});

  return (
    <div className="space-y-4">
      {payroll.map((c) => {
        const privPay = c.privatePay || 0;
        const gross = c.gross || c.baseSalary || 0;
        return (
          <Card key={c.id}>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-semibold text-ink">{c.name}</h3>
                <p className="text-[10px] text-ink-muted">{c.designation || ''}</p>
              </div>
              <p className="text-lg font-bold text-ink flex items-center"><IndianRupee className="w-4 h-4" />{gross.toLocaleString('en-IN')}</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div><p className="text-ink-faint">Base Salary</p><p className="font-semibold">₹{c.baseSalary?.toLocaleString('en-IN') || 0}</p></div>
              <div><p className="text-ink-faint">Private Sessions</p><p className="font-semibold">₹{privPay.toLocaleString('en-IN')} ({c.privateCount} × ₹{c.rate1on1PerHour})</p></div>
              <div><p className="text-ink-faint">OT Rate</p><p className="font-semibold">₹{c.rateOvertimePerHour}/hr</p></div>
              <div><p className="text-ink-faint">Paid Holidays</p><p className="font-semibold">{c.paidHolidaysPerMonth}/mo</p></div>
            </div>
            {c.supportCoachId && (
              <p className="text-[10px] text-ink-faint mt-2">Note: Support coach payroll attribution not yet defined — flag for client confirmation.</p>
            )}
          </Card>
        );
      })}
    </div>
  );
}
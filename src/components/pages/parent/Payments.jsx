import { CheckCircle, Calendar, CreditCard } from 'lucide-react';
import { parentPayments, paymentSummary } from '../../../data/parent/paymentData';
import StatCard from '../../ui/StatCard';
import StatusPill from '../../ui/StatusPill';
import AdaptiveTable from '../../data/AdaptiveTable';
import { formatCurrency, formatDate } from '../../../utils/formatters';

const columns = [
  { accessorKey: 'date', header: 'Date', cell: info => <span className="font-medium">{formatDate(info.getValue())}</span> },
  { accessorKey: 'amount', header: 'Amount', cell: info => <span className="font-medium">{formatCurrency(info.getValue())}</span> },
  { accessorKey: 'type', header: 'Type', cell: info => info.getValue() },
  { accessorKey: 'gateway', header: 'Gateway', cell: info => <span className="capitalize">{String(info.getValue()).replace(/_/g, ' ')}</span> },
  { accessorKey: 'status', header: 'Status', cell: info => <StatusPill status={info.getValue()} /> },
  { accessorKey: 'invoiceId', header: 'Invoice ID', cell: info => <span className="text-xs font-mono text-ink-muted">{info.getValue()}</span> },
];

export default function Payments() {
  return (
    <div className="space-y-4">

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          icon={CheckCircle}
          label="Total Paid"
          value={formatCurrency(paymentSummary.totalPaid)}
        />
        <StatCard
          icon={Calendar}
          label="Next Due"
          value={formatCurrency(paymentSummary.nextAmount)}
          sublabel={`Due ${formatDate(paymentSummary.nextDue)}`}
        />
        <StatCard
          icon={CreditCard}
          label="Payment Method"
          value={paymentSummary.paymentMethod}
        />
      </div>

      <AdaptiveTable
        data={parentPayments}
        columns={columns}
        searchPlaceholder="Search payments..."
        renderCard={(item) => (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-ink">{formatDate(item.date)}</span>
              <StatusPill status={item.status} />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-base font-bold text-ink">{formatCurrency(item.amount)}</span>
              <span className="text-xs text-ink-muted">{item.type}</span>
            </div>
            <div className="flex items-center gap-3 text-xs text-ink-faint">
              <span className="capitalize">{String(item.gateway).replace(/_/g, ' ')}</span>
              <span className="font-mono">{item.invoiceId}</span>
            </div>
          </div>
        )}
      />
    </div>
  );
}

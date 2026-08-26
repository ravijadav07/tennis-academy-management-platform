import { cn } from '../../utils/cn';

const colorMap = {
  success: 'bg-ok-bg text-ok',
  completed: 'bg-ok-bg text-ok',
  running: 'bg-ok-bg text-ok',
  active: 'bg-ok-bg text-ok',
  paid: 'bg-ok-bg text-ok',
  converted: 'bg-ok-bg text-ok',
  sent: 'bg-ok-bg text-ok',
  confirmed_yes: 'bg-ok-bg text-ok',

  error: 'bg-err-bg text-err',
  failed: 'bg-err-bg text-err',
  lost: 'bg-err-bg text-err',
  expired: 'bg-err-bg text-err',
  declined_no: 'bg-err-bg text-err',

  warning: 'bg-warn-bg text-warn',
  pending: 'bg-warn-bg text-warn',
  queued: 'bg-warn-bg text-warn',
  trial_booked: 'bg-warn-bg text-warn',
  enrollment_pending: 'bg-warn-bg text-warn',
  overdue: 'bg-warn-bg text-warn',
  sent_no_reply: 'bg-warn-bg text-warn',

  new: 'bg-blue-50 text-blue-600',
  not_sent: 'bg-off-bg text-off',
  unmarked: 'bg-off-bg text-off',
  cancelled_charged: 'bg-err-bg text-err',

  inactive: 'bg-off-bg text-off',
  idle: 'bg-off-bg text-off',
  cancelled: 'bg-off-bg text-off',
  draft: 'bg-off-bg text-off',
};

export default function StatusPill({ status, className = '' }) {
  const k = String(status).toLowerCase().replace(/\s+/g, '_');
  return (
    <span className={cn(
      'inline-flex items-center px-2 py-1 rounded-full text-[10px] font-semibold',
      colorMap[k] || 'bg-off-bg text-off',
      className
    )}>
      {status}
    </span>
  );
}
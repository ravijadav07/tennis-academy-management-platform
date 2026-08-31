// src/components/ui/EligibilityStatusPill.jsx
// Single shared component driven by getEligibility() return value.
// Same colors, tooltip pattern, and disabled behavior everywhere.
import { getEligibility } from '../../mocks/rules';

const STATUS_STYLES = {
  markable: 'bg-ok-bg/50 text-ok',
  blocked_pending: 'bg-err-bg/30 text-err',
  blocked_expired: 'bg-err-bg/30 text-err',
  blocked_exhausted: 'bg-err-bg/30 text-err',
  warning: 'bg-warn-bg/50 text-warn',
};

export default function EligibilityStatusPill({ package: pkg, date, className = '' }) {
  if (!pkg) return null;
  const elig = getEligibility(pkg, date || new Date().toISOString().split('T')[0]);

  if (elig.markable) {
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${STATUS_STYLES.markable} ${className}`}
        title={`${pkg.sessionsUsed}/${pkg.sessionsPurchased} sessions used`}>
        ✓ Active
      </span>
    );
  }

  const isExpired = pkg.validTo < (date || new Date().toISOString().split('T')[0]) && pkg.paymentStatus !== 'PENDING';
  const isExhausted = pkg.sessionsUsed >= (pkg.sessionsPurchased + (pkg.makeupCredit || 0));

  const style = isExpired ? STATUS_STYLES.blocked_expired : isExhausted ? STATUS_STYLES.blocked_exhausted : STATUS_STYLES.blocked_pending;
  const label = isExpired ? `Expired ${pkg.validTo}` : isExhausted ? `Sessions used (${pkg.sessionsUsed}/${pkg.sessionsPurchased})` : 'Payment pending';

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${style} ${className}`}
      title={elig.reason || label}>
      {label}
    </span>
  );
}
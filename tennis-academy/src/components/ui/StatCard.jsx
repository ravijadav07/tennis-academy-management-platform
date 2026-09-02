import Card from './Card';
import { cn } from '../../utils/cn';

const colorStyles = {
  brand: { bg: 'bg-brand-50', text: 'text-brand' },
  ok: { bg: 'bg-ok-bg', text: 'text-ok' },
  warn: { bg: 'bg-warn-bg', text: 'text-warn' },
  err: { bg: 'bg-err-bg', text: 'text-err' },
};

export default function StatCard({ icon: Icon, label, value, delta, sublabel, className = '', color = 'brand' }) {
  const cs = colorStyles[color] || colorStyles.brand;

  return (
    <Card className={cn('flex flex-col min-h-[142px]', className)}>
      <div className="flex items-start justify-between">
        <div className={cn('w-[38px] h-[38px] rounded-[11px] flex items-center justify-center', cs.bg, cs.text)}>
          <Icon className="w-[18px] h-[18px]" />
        </div>
        {delta != null && (
          <span className={cn(
            'text-[11px] font-semibold',
            delta >= 0 ? 'text-ok' : 'text-err'
          )}>
            {delta >= 0 ? '+' : ''}{delta}%
          </span>
        )}
      </div>
      <div className="mt-auto">
        <h3 className="text-[28px] font-bold text-ink leading-none tracking-[-0.035em]">{value}</h3>
        <p className="text-xs font-medium text-ink-muted mt-1.5">{label}</p>
        {sublabel && <p className="text-[11px] text-ink-faint mt-0.5">{sublabel}</p>}
      </div>
    </Card>
  );
}
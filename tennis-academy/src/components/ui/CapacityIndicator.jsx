// CapacityIndicator — segmented bar or progress indicator showing filled vs total capacity
import { cn } from '../../utils/cn';

export default function CapacityIndicator({
  filled = 0,
  total = 0,
  variant = 'auto', // 'auto' | 'bar' | 'segments'
  className = '',
  showPercent = false,
}) {
  const safeTotal = Math.max(Number(total) || 0, 0);
  const safeFilled = Math.max(Number(filled) || 0, 0);
  const pct = safeTotal > 0 ? Math.min(100, Math.round((safeFilled / safeTotal) * 100)) : 0;

  const isSegmented =
    variant === 'segments' ||
    (variant === 'auto' && safeTotal > 0 && safeTotal <= 12);

  return (
    <div className={cn('inline-flex flex-col items-start gap-1.5 min-w-0 max-w-full', className)}>
      {isSegmented ? (
        <div className="flex gap-[3px] items-center flex-wrap max-w-full">
          {Array.from({ length: safeTotal }).map((_, i) => (
            <div
              key={i}
              className={cn(
                'w-2.5 h-[11px] rounded-[2.5px] transition-colors shrink-0',
                i < safeFilled ? 'bg-brand' : 'bg-line'
              )}
            />
          ))}
        </div>
      ) : (
        <div className="w-full min-w-[60px] h-2 bg-line rounded-full overflow-hidden">
          <div
            className="h-full bg-brand rounded-full transition-all duration-300"
            style={{ width: `${pct}%` }}
          />
        </div>
      )}
      <div className="flex items-center justify-between gap-2 w-full text-[10px] text-ink-faint font-mono leading-none">
        <span>{safeFilled}/{safeTotal}</span>
        {(!isSegmented || showPercent || variant === 'bar') && (
          <span className="text-[10px] font-medium text-ink-muted">{pct}%</span>
        )}
      </div>
    </div>
  );
}
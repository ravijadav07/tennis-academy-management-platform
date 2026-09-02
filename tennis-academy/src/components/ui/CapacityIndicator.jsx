// CapacityIndicator — segmented block or progress bar showing filled vs total capacity
import { cn } from '../../utils/cn';

export default function CapacityIndicator({
  filled = 0,
  total = 0,
  variant = 'auto', // 'auto' | 'bar' | 'segments'
  className = '',
  showPercent = false,
  // maxBlocks: when set and total > maxBlocks, scale blocks proportionally
  // so we never render an unmanageable number of squares (e.g. 130 blocks).
  maxBlocks = null,
}) {
  const safeTotal  = Math.max(Number(total)  || 0, 0);
  const safeFilled = Math.max(Number(filled) || 0, 0);
  const pct = safeTotal > 0 ? Math.min(100, Math.round((safeFilled / safeTotal) * 100)) : 0;

  const isSegmented =
    variant === 'segments' ||
    (variant === 'auto' && safeTotal > 0 && safeTotal <= 12);

  // --- Scaled block logic (for variant="segments" with large totals) ---
  // If maxBlocks is supplied and total exceeds it, we render exactly maxBlocks
  // squares, colouring `scaledFilled` of them purple so the ratio is preserved.
  const needsScale = isSegmented && maxBlocks != null && safeTotal > maxBlocks;
  const renderTotal  = needsScale ? maxBlocks : safeTotal;
  const renderFilled = needsScale
    ? Math.round((safeFilled / safeTotal) * maxBlocks)
    : safeFilled;

  // Block dimensions: use compact size when there are many blocks so they
  // wrap neatly into 2–3 rows instead of spreading across the full width.
  const blockCls = renderTotal > 16
    ? 'w-[7px] h-[8px] rounded-[2px]'    // compact — ≈ 10px pitch with gap
    : 'w-2.5 h-[11px] rounded-[2.5px]';  // standard — matches Overview cards

  return (
    <div className={cn('inline-flex flex-col items-start gap-1.5 min-w-0 max-w-full', className)}>
      {isSegmented ? (
        <div className="flex gap-[3px] items-start flex-wrap max-w-full">
          {Array.from({ length: renderTotal }).map((_, i) => (
            <div
              key={i}
              className={cn(
                blockCls,
                'transition-colors shrink-0',
                i < renderFilled ? 'bg-brand' : 'bg-line'
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
        {(!isSegmented || showPercent || variant === 'bar' || isSegmented) && (
          <span className="text-[10px] font-medium text-ink-muted">{pct}%</span>
        )}
      </div>
    </div>
  );
}
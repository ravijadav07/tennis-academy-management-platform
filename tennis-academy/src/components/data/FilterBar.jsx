import { useState } from 'react';
import { Filter, X, Search, RotateCcw } from 'lucide-react';
import { useIsMobile } from '../../hooks/useMediaQuery';
import Button from '../ui/Button';
import { cn } from '../../utils/cn';

const triggerClass = 'h-[38px] px-3 rounded-lg border border-line bg-white text-[13px] text-ink outline-none focus:ring-2 focus:ring-brand/10 focus:border-brand transition-all max-w-full min-w-0';

export default function FilterBar({
  filters = [],
  searchValue = '',
  onSearchChange,
  searchPlaceholder = 'Search...',
  onClearAll,
  children,
  className = '',
}) {
  const [open, setOpen] = useState(false);
  const isMobile = useIsMobile();

  const activeFilters = filters.filter(f => {
    if (f.value == null || f.value === '' || f.value === 'all') return false;
    return true;
  });

  const hasActiveFilters = activeFilters.length > 0 || (searchValue && searchValue.trim() !== '');

  const handleClearAll = () => {
    filters.forEach(f => f.onChange(f.defaultValue ?? 'all'));
    onSearchChange?.('');
    onClearAll?.();
  };

  const filterContent = (
    <div className="space-y-3">
      {onSearchChange !== undefined && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-faint" />
          <input
            value={searchValue}
            onChange={e => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full pl-9 pr-3 h-[38px] bg-canvas-soft border border-line rounded-lg text-[13px] outline-none focus:ring-2 focus:ring-brand/10 focus:border-brand transition-all"
          />
        </div>
      )}
      {filters.map(f => (
        <div key={f.key} className="space-y-1">
          {f.label && <label className="text-[11px] font-medium text-ink-faint">{f.label}</label>}
          <select
            value={f.value ?? 'all'}
            onChange={e => f.onChange(e.target.value)}
            className={cn(triggerClass, 'w-full')}
          >
            <option value="all">All {f.label || 'Options'}</option>
            {f.options.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      ))}
      {children}
    </div>
  );

  if (isMobile) {
    return (
      <div className={cn('space-y-2.5 overflow-x-hidden', className)}>
        {onSearchChange !== undefined && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-faint" />
            <input
              value={searchValue}
              onChange={e => onSearchChange(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full pl-9 pr-3 h-[38px] bg-canvas-soft border border-line rounded-lg text-[13px] outline-none focus:ring-2 focus:ring-brand/10 focus:border-brand transition-all"
            />
          </div>
        )}
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="secondary" size="sm" icon={Filter} onClick={() => setOpen(!open)}>
            Filters{activeFilters.length > 0 ? ` (${activeFilters.length})` : ''}
          </Button>
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" icon={RotateCcw} onClick={handleClearAll}>
              Clear
            </Button>
          )}
        </div>
        {hasActiveFilters && (
          <div className="flex items-center gap-1.5 flex-wrap">
            {activeFilters.map(f => (
              <span key={f.key} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-brand-50 text-brand-600 text-[11px] font-medium">
                {f.label}: {f.options.find(o => o.value === f.value)?.label || f.value}
                <button
                  type="button"
                  onClick={() => f.onChange(f.defaultValue ?? 'all')}
                  className="p-0.5 rounded hover:bg-brand-100 transition-colors"
                  aria-label={`Remove ${f.label} filter`}
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              </span>
            ))}
            {searchValue && searchValue.trim() !== '' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-brand-50 text-brand-600 text-[11px] font-medium">
                Search: {searchValue}
                <button
                  type="button"
                  onClick={() => onSearchChange?.('')}
                  className="p-0.5 rounded hover:bg-brand-100 transition-colors"
                  aria-label="Clear search"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              </span>
            )}
          </div>
        )}
        {open && (
          <div className="fixed inset-0 z-[310] flex flex-col justify-end">
            <div className="absolute inset-0 bg-black/30" onClick={() => setOpen(false)} />
            <div className="relative bg-white rounded-t-2xl p-5 space-y-4 max-h-[70vh] overflow-y-auto overflow-x-hidden">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-ink">Filters</h3>
                <button onClick={() => setOpen(false)} className="p-1.5 rounded-lg hover:bg-canvas-soft transition-colors">
                  <X className="w-[18px] h-[18px] text-ink-muted" />
                </button>
              </div>
              {filterContent}
              <div className="flex items-center gap-2 pt-1">
                <Button variant="primary" size="sm" className="flex-1" onClick={() => setOpen(false)}>
                  Apply Filters
                </Button>
                {hasActiveFilters && (
                  <Button variant="ghost" size="sm" onClick={handleClearAll}>
                    Clear All
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={cn('space-y-2.5 overflow-x-hidden', className)}>
      <div className="flex items-center gap-2 flex-wrap">
        {onSearchChange !== undefined && (
          <div className="relative w-56 max-w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-faint" />
            <input
              value={searchValue}
              onChange={e => onSearchChange(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full pl-9 pr-3 h-[38px] bg-canvas-soft border border-line rounded-lg text-[13px] outline-none focus:ring-2 focus:ring-brand/10 focus:border-brand transition-all"
            />
          </div>
        )}
        {filters.map(f => (
          <select
            key={f.key}
            value={f.value ?? 'all'}
            onChange={e => f.onChange(e.target.value)}
            className={cn(triggerClass, 'w-auto sm:w-auto')}
          >
            <option value="all">All {f.label || 'Options'}</option>
            {f.options.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        ))}
        {children}
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" icon={RotateCcw} onClick={handleClearAll}>
            Clear All
          </Button>
        )}
      </div>
      {hasActiveFilters && (
        <div className="flex items-center gap-1.5 flex-wrap">
          {activeFilters.map(f => (
            <span key={f.key} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-brand-50 text-brand-600 text-[11px] font-medium">
              {f.label}: {f.options.find(o => o.value === f.value)?.label || f.value}
              <button
                type="button"
                onClick={() => f.onChange(f.defaultValue ?? 'all')}
                className="p-0.5 rounded hover:bg-brand-100 transition-colors"
                aria-label={`Remove ${f.label} filter`}
              >
                <X className="w-2.5 h-2.5" />
              </button>
            </span>
          ))}
          {searchValue && searchValue.trim() !== '' && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-brand-50 text-brand-600 text-[11px] font-medium">
              Search: &ldquo;{searchValue}&rdquo;
              <button
                type="button"
                onClick={() => onSearchChange?.('')}
                className="p-0.5 rounded hover:bg-brand-100 transition-colors"
                aria-label="Clear search"
              >
                <X className="w-2.5 h-2.5" />
              </button>
            </span>
          )}
        </div>
      )}
    </div>
  );
}
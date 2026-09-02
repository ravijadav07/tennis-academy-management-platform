import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Search, Check, X } from 'lucide-react';
import { cn } from '../../utils/cn';

const GAP = 4;
const MAX_HEIGHT = 240;

function fitWithinViewport(menuEl, triggerEl) {
  if (!menuEl || !triggerEl) return;
  const trigger = triggerEl.getBoundingClientRect();
  const spaceBelow = window.innerHeight - trigger.bottom - GAP;
  const spaceAbove = trigger.top - GAP;
  const minHeight = 80;
  const shouldOpenAbove = spaceBelow < minHeight && spaceAbove > spaceBelow;

  if (shouldOpenAbove) {
    menuEl.style.top = 'auto';
    menuEl.style.maxHeight = Math.min(spaceAbove, MAX_HEIGHT) + 'px';
    menuEl.style.bottom = 'calc(100% + ' + GAP + 'px)';
  } else {
    menuEl.style.bottom = 'auto';
    menuEl.style.maxHeight = Math.min(spaceBelow, MAX_HEIGHT) + 'px';
    menuEl.style.top = 'calc(100% + ' + GAP + 'px)';
  }

  const rightOverflow = menuEl.getBoundingClientRect().right - window.innerWidth + 8;
  if (rightOverflow > 0) {
    menuEl.style.left = 'auto';
    menuEl.style.right = '0';
    menuEl.style.maxWidth = Math.min(trigger.width, window.innerWidth - 16) + 'px';
  } else {
    menuEl.style.left = '0';
    menuEl.style.right = '0';
    menuEl.style.maxWidth = '';
  }
}

export default function Dropdown({
  options = [],
  value,
  onChange,
  placeholder = 'Select...',
  searchPlaceholder = 'Search...',
  searchable = false,
  multi = false,
  disabled = false,
  error,
  label,
  className = '',
  renderOption,
  renderValue,
  getOptionLabel,
  getOptionValue,
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [activeIdx, setActiveIdx] = useState(-1);
  const containerRef = useRef(null);
  const menuRef = useRef(null);
  const searchRef = useRef(null);
  const triggerRef = useRef(null);

  const getId = (opt) => {
    if (opt == null) return '';
    if (getOptionValue) return getOptionValue(opt);
    if (typeof opt === 'object') return opt.value ?? opt.id ?? opt.name ?? '';
    return opt;
  };

  const findOption = (val) => {
    if (val == null || val === '') return null;
    return options.find(opt => {
      const optId = getId(opt);
      const valId = typeof val === 'object' ? getId(val) : val;
      return optId === valId || opt === val || optId === val || opt?.value === val || opt?.id === val;
    }) || null;
  };

  const getLabel = (opt) => {
    if (opt == null || opt === '') return '';
    if (typeof opt === 'object') {
      if (getOptionLabel) {
        const custom = getOptionLabel(opt);
        if (custom != null && custom !== '') return String(custom);
      }
      return opt.label ?? opt.name ?? opt.value ?? String(opt);
    }
    const matched = findOption(opt);
    if (matched) {
      if (getOptionLabel) {
        const custom = getOptionLabel(matched);
        if (custom != null && custom !== '') return String(custom);
      }
      if (typeof matched === 'object') return matched.label ?? matched.name ?? matched.value ?? String(matched);
      return String(matched);
    }
    return String(opt);
  };

  const isSelected = (opt) => {
    const optId = getId(opt);
    if (multi) return Array.isArray(value) ? value.some(v => getId(v) === optId || v === optId) : false;
    if (value == null || value === '') return false;
    const valId = typeof value === 'object' ? getId(value) : value;
    return valId === optId || value === optId || value === opt;
  };

  const filtered = searchable && search
    ? options.filter(opt => getLabel(opt).toLowerCase().includes(search.toLowerCase()))
    : options;

  const handleSelect = useCallback((opt) => {
    if (multi) {
      const current = Array.isArray(value) ? value : [];
      const optId = getId(opt);
      if (current.some(v => (typeof v === 'object' ? getId(v) : v) === optId)) {
        onChange(current.filter(v => (typeof v === 'object' ? getId(v) : v) !== optId));
      } else {
        onChange([...current, opt]);
      }
      setSearch('');
      setActiveIdx(-1);
    } else {
      onChange(opt);
      setOpen(false);
      setSearch('');
      setActiveIdx(-1);
    }
  }, [multi, onChange, value, getOptionValue]);

  const handleRemove = useCallback((e, opt) => {
    e.stopPropagation();
    if (multi && Array.isArray(value)) {
      const optId = getId(opt);
      onChange(value.filter(v => (typeof v === 'object' ? getId(v) : v) !== optId));
    }
  }, [multi, onChange, value, getOptionValue]);

  useEffect(() => {
    if (!open) { setSearch(''); setActiveIdx(-1); return; }
    setActiveIdx(-1);
    setTimeout(() => searchRef.current?.focus(), 50);
  }, [open]);

  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (!open || !menuRef.current || !triggerRef.current) return;
    const position = () => fitWithinViewport(menuRef.current, triggerRef.current);
    position();
    window.addEventListener('scroll', position, true);
    window.addEventListener('resize', position);
    return () => {
      window.removeEventListener('scroll', position, true);
      window.removeEventListener('resize', position);
    };
  }, [open, filtered.length]);

  const handleKeyDown = (e) => {
    if (!open) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
        e.preventDefault();
        setOpen(true);
      }
      return;
    }
    switch (e.key) {
      case 'ArrowDown': e.preventDefault(); setActiveIdx(prev => Math.min(prev + 1, filtered.length - 1)); break;
      case 'ArrowUp': e.preventDefault(); setActiveIdx(prev => Math.max(prev - 1, -1)); break;
      case 'Enter':
        e.preventDefault();
        if (activeIdx >= 0 && activeIdx < filtered.length) handleSelect(filtered[activeIdx]);
        break;
      case 'Escape': e.preventDefault(); setOpen(false); triggerRef.current?.focus(); break;
      case 'Tab': setOpen(false); break;
    }
  };

  const displayValue = () => {
    if (multi && Array.isArray(value) && value.length > 0) {
      if (renderValue) return renderValue(value);
      return (
        <div className="flex items-center gap-1 flex-1 min-w-0 overflow-hidden">
          {value.slice(0, 3).map((v, i) => (
            <span key={i} className="inline-flex items-center gap-0.5 px-1.5 py-px rounded-md bg-brand-50 text-brand-600 text-[11px] font-medium max-w-[80px] truncate">
              {getLabel(v)}
              <button type="button" onClick={(e) => handleRemove(e, v)}
                className="p-0.5 rounded hover:bg-brand-100 transition-colors flex-shrink-0" aria-label={'Remove ' + getLabel(v)}>
                <X className="w-2.5 h-2.5" />
              </button>
            </span>
          ))}
          {value.length > 3 && <span className="text-[11px] text-ink-faint flex-shrink-0">+{value.length - 3}</span>}
        </div>
      );
    }
    if (!multi && value != null && value !== '') {
      if (renderValue) return renderValue(value);
      const text = getLabel(value);
      if (text) {
        return <span className="text-[13px] text-ink truncate block text-left">{text}</span>;
      }
    }
    return <span className="text-[13px] text-ink-faint truncate block text-left">{placeholder}</span>;
  };

  return (
    <div className={cn('space-y-1.5', className)}>
      {label && <label className="block text-xs font-medium text-ink-muted">{label}</label>}
      <div ref={containerRef} className="relative">
        <button
          ref={triggerRef}
          type="button"
          disabled={disabled}
          onClick={() => setOpen(o => !o)}
          onKeyDown={handleKeyDown}
          aria-haspopup="listbox"
          aria-expanded={open}
          className={cn(
            'flex items-center justify-between gap-2 w-full h-[38px] px-3 rounded-lg bg-white border transition-all duration-150 text-left cursor-pointer select-none',
            error ? 'border-red-300 focus-within:border-red-400 shadow-[0_0_0_3px_rgba(239,68,68,0.08)]'
              : 'border-line hover:border-brand/40 focus-within:border-brand focus-within:shadow-focus',
            open && !error && 'border-brand shadow-focus',
            disabled && 'opacity-50 cursor-not-allowed bg-canvas-soft'
          )}
        >
          <div className="flex-1 min-w-0 truncate">
            {displayValue()}
          </div>
          <ChevronDown className={cn('w-4 h-4 text-ink-faint flex-shrink-0 ml-auto transition-transform duration-180', open && 'rotate-180')} />
        </button>

        <AnimatePresence>
          {open && (
            <motion.div
              ref={menuRef}
              role="listbox"
              aria-multiselectable={multi}
              initial={{ opacity: 0, y: -4, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4, scale: 0.98 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
              className="absolute left-0 right-0 z-[100] bg-white rounded-xl border border-line shadow-dropdown overflow-hidden"
              style={{ top: 'calc(100% + 4px)', maxHeight: MAX_HEIGHT + 'px' }}
            >
              {searchable && (
                <div className="flex items-center gap-2 px-3 py-2 border-b border-line">
                  <Search className="w-3.5 h-3.5 text-ink-faint flex-shrink-0" />
                  <input ref={searchRef} type="text" value={search}
                    onChange={e => { setSearch(e.target.value); setActiveIdx(-1); }}
                    placeholder={searchPlaceholder}
                    className="flex-1 bg-transparent border-none outline-none text-[13px] text-ink placeholder:text-ink-faint" />
                </div>
              )}
              <div className="overflow-y-auto overscroll-contain py-1" style={{ maxHeight: 'inherit' }}>
                {filtered.length === 0 ? (
                  <p className="px-3 py-4 text-center text-[12px] text-ink-faint">No results found</p>
                ) : (
                  filtered.map((opt, idx) => {
                    const selected = isSelected(opt);
                    const active = idx === activeIdx;
                    return (
                      <button key={getId(opt)} type="button" role="option" aria-selected={selected}
                        onClick={() => handleSelect(opt)} onMouseEnter={() => setActiveIdx(idx)}
                        className={cn('flex items-center gap-2.5 w-full px-3 h-[36px] text-left text-[13px] transition-colors duration-100',
                          active && 'bg-canvas-soft', selected && 'text-brand font-medium')}>
                        {renderOption ? renderOption(opt, selected) : (
                          <span className={cn('flex-1 truncate', selected ? 'text-brand' : 'text-ink')}>{getLabel(opt)}</span>
                        )}
                        {multi && (
                          <span className={cn('w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors',
                            selected ? 'bg-brand border-brand' : 'border-line')}>
                            {selected && <Check className="w-3 h-3 text-white" />}
                          </span>
                        )}
                        {!multi && selected && <Check className="w-4 h-4 text-brand flex-shrink-0" />}
                      </button>
                    );
                  })
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        {error && <p className="text-[11px] text-err mt-1">{error}</p>}
      </div>
    </div>
  );
}
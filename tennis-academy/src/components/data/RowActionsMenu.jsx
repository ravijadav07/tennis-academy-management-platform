import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '../../utils/cn';

function partitionActions(actions) {
  const sections = [];
  let current = [];
  for (const action of actions) {
    if (action.separator) {
      if (current.length) sections.push(current);
      current = [];
    } else {
      current.push(action);
    }
  }
  if (current.length) sections.push(current);
  return sections;
}

export default function RowActionsMenu({ actions = [], className = '', itemLabel }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);
  const triggerRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleAction = (action) => {
    setOpen(false);
    if (action.onClick) {
      action.onClick();
    } else {
      toast.success(`${action.label}${itemLabel ? ` for ${itemLabel}` : ''}`);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      setOpen(false);
      triggerRef.current?.focus();
    }
  };

  const sections = partitionActions(actions);

  return (
    <div ref={containerRef} className={cn('relative inline-block', className)}>
      <button
        ref={triggerRef}
        type="button"
        onClick={(e) => { e.stopPropagation(); setOpen(o => !o); }}
        onKeyDown={handleKeyDown}
        aria-label="Actions"
        aria-haspopup="menu"
        aria-expanded={open}
        className={cn(
          'inline-flex items-center justify-center w-8 h-8 rounded-lg transition-colors duration-150 group',
          'text-ink-faint hover:text-ink hover:bg-canvas-soft',
          open && 'bg-canvas-soft text-ink',
          '[&_svg]:size-4 [&_svg]:stroke-[2.25px]'
        )}
      >
        <ChevronDown />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            role="menu"
            initial={{ opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -4 }}
            transition={{ duration: 0.12, ease: 'easeOut' }}
            className="absolute right-0 top-full mt-1 z-[100] min-w-[160px] bg-white rounded-xl border border-line shadow-dropdown py-1"
          >
            {sections.map((section, sIdx) => (
              <div key={sIdx}>
                {sIdx > 0 && <div className="h-px bg-line mx-2 my-1" />}
                {section.map((action, aIdx) => (
                  <button
                    key={aIdx}
                    role="menuitem"
                    type="button"
                    onClick={() => handleAction(action)}
                    className={cn(
                      'flex items-center justify-between w-full gap-2.5 px-3 h-[36px] text-left text-[13px] transition-colors duration-100',
                      action.variant === 'danger'
                        ? 'text-err hover:bg-err-bg'
                        : 'text-ink hover:bg-canvas-soft'
                    )}
                  >
                    <span className="flex items-center gap-2.5 min-w-0">
                      {action.icon && <action.icon className="w-4 h-4 flex-shrink-0" />}
                      <span className="truncate">{action.label}</span>
                    </span>
                    {action.addon && (
                      <span className="text-[11px] text-ink-faint flex-shrink-0">{action.addon}</span>
                    )}
                  </button>
                ))}
              </div>
            ))}
            {actions.length === 0 && (
              <p className="px-3 py-2 text-[12px] text-ink-faint text-center">No actions available</p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export const withActions = ({ actions, itemLabel }) => ({
  id: 'actions',
  header: '',
  cell: ({ row }) => (
    <RowActionsMenu actions={actions} itemLabel={itemLabel?.(row.original)} />
  ),
  enableSorting: false,
  size: 48,
});
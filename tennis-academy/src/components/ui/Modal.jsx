import { X } from 'lucide-react';
import { cn } from '../../utils/cn';

export default function Modal({ open, onClose, title, children, className = '', size = 'md' }) {
  if (!open) return null;

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-full mx-4',
  };

  return (
    <div className="fixed inset-0 z-[310] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className={cn(
        'relative bg-white rounded-2xl shadow-modal border border-line w-full',
        'max-h-[90vh] overflow-y-auto',
        'm-4 sm:m-0',
        sizeClasses[size],
        className
      )}>
        {title && (
          <div className="flex items-center justify-between px-5 py-4 border-b border-line">
            <h2 className="text-base font-semibold text-ink">{title}</h2>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-canvas-soft text-ink-muted transition-colors">
              <X className="w-[18px] h-[18px]" />
            </button>
          </div>
        )}
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}
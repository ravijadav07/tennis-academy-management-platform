import { cn } from '../../utils/cn';

export default function EmptyState({ icon: Icon, title, description, action, className = '' }) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-16 px-4 text-center', className)}>
      {Icon && <Icon className="w-12 h-12 text-ink-faint mb-4" />}
      <h3 className="text-base font-semibold text-ink">{title}</h3>
      {description && <p className="text-sm text-ink-muted mt-1 max-w-sm">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
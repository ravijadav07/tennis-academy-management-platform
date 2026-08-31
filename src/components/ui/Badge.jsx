import { cn } from '../../utils/cn';

export default function Badge({ children, variant = 'mock', className = '' }) {
  const variants = {
    mock: 'bg-warn-bg text-warn border border-[#F6DDAA]',
    info: 'bg-blue-50 text-blue-600 border border-blue-100',
    entity: 'bg-brand-50 text-brand-600 border border-brand-100',
  };

  return (
    <span className={cn(
      'inline-flex items-center h-[22px] px-2 rounded-full text-[10px] font-semibold tracking-[0.04em]',
      variants[variant],
      className
    )}>
      {children}
    </span>
  );
}
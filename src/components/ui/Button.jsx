import { cn } from '../../utils/cn';

const base = 'inline-flex items-center justify-center gap-2 rounded-lg text-xs font-semibold transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed';

const styles = {
  primary: 'text-white',
  secondary: 'bg-white border border-line text-ink hover:bg-canvas-soft',
  ghost: 'text-ink-muted hover:bg-canvas-soft',
  danger: 'text-white bg-err hover:brightness-110',
};

const primaryStyle = {
  background: 'linear-gradient(180deg, #7C4DFF 0%, #6437E8 100%)',
  boxShadow: '0 1px 3px rgba(100,55,232,0.20)',
};

export default function Button({ children, variant = 'primary', icon: Icon, className = '', size = 'md', ...p }) {
  const sizes = { sm: 'h-8 px-3 text-[11px]', md: 'h-9 px-3.5', lg: 'h-11 px-5 text-[13px]' };
  const style = variant === 'primary' ? primaryStyle : undefined;
  return (
    <button className={cn(base, sizes[size], styles[variant], className)} style={style} {...p}>
      {Icon && <Icon className="w-4 h-4" />}{children}
    </button>
  );
}
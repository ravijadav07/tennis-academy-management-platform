import { cn } from '../../utils/cn';

export default function Card({ children, className = '', onClick, padding = true }) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'bg-white rounded-xl border border-line shadow-card transition-all duration-180',
        padding && 'p-[18px]',
        onClick && 'cursor-pointer hover:shadow-card-hover hover:-translate-y-px hover:border-[#DDDCE8]',
        className
      )}
    >
      {children}
    </div>
  );
}
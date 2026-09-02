import { cn } from '../../utils/cn';

export default function Skeleton({ className = '' }) {
  return (
    <div className={cn('animate-pulse bg-canvas-soft rounded-2xl', className)} />
  );
}

export function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl border border-line shadow-card p-5 space-y-4">
      <Skeleton className="w-11 h-11 rounded-xl" />
      <Skeleton className="h-8 w-2/3" />
      <Skeleton className="h-4 w-1/2" />
    </div>
  );
}

export function SkeletonRow() {
  return (
    <div className="flex items-center gap-3 py-3">
      <Skeleton className="w-8 h-8 rounded-full" />
      <Skeleton className="h-4 flex-1" />
      <Skeleton className="h-4 w-20" />
    </div>
  );
}

export function SkeletonTable({ rows = 5 }) {
  return (
    <div className="bg-white rounded-2xl border border-line shadow-card p-5 space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <SkeletonRow key={i} />
      ))}
    </div>
  );
}

Skeleton.SkeletonCard = SkeletonCard;
Skeleton.SkeletonRow = SkeletonRow;
Skeleton.SkeletonTable = SkeletonTable;
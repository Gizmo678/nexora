export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div
      className={`bg-[var(--bg-surface-hover)] animate-pulse rounded-lg ${className}`}
    />
  );
}

export function TableSkeleton({ rows = 5, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="w-full space-y-3 p-4">
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-4 items-center">
          {Array.from({ length: cols }).map((_, c) => (
            <Skeleton key={c} className="h-4 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}

export function StatCardSkeleton() {
  return (
    <div className="stat-card">
      <div className="flex justify-between items-center">
        <Skeleton className="w-9 h-9 rounded-xl" />
        <Skeleton className="w-16 h-4 rounded-full" />
      </div>
      <Skeleton className="w-24 h-8 mt-2" />
      <Skeleton className="w-32 h-3 mt-1" />
    </div>
  );
}

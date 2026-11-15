import { Skeleton } from '@/components/ui/skeleton';

export function TableLoadingSkeleton({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="w-full space-y-3 bg-white dark:bg-[#14171d] p-4 rounded-xl border border-gray-100 dark:border-neutral-800">
      <div className="flex gap-4 border-b border-gray-100 dark:border-neutral-800 pb-3">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} className="h-5 flex-1 bg-gray-200 dark:bg-neutral-800" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-4 py-2">
          {Array.from({ length: cols }).map((_, c) => (
            <Skeleton key={c} className="h-4 flex-1 bg-gray-100 dark:bg-neutral-800/60" />
          ))}
        </div>
      ))}
    </div>
  );
}

export function CardLoadingSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="p-5 bg-white dark:bg-[#14171d] rounded-xl border border-gray-100 dark:border-neutral-800 space-y-3">
          <Skeleton className="h-5 w-2/3 bg-gray-200 dark:bg-neutral-800" />
          <Skeleton className="h-4 w-full bg-gray-100 dark:bg-neutral-800/60" />
          <Skeleton className="h-4 w-4/5 bg-gray-100 dark:bg-neutral-800/60" />
          <div className="flex justify-between pt-2">
            <Skeleton className="h-4 w-20 bg-gray-100 dark:bg-neutral-800/60" />
            <Skeleton className="h-4 w-16 bg-gray-100 dark:bg-neutral-800/60" />
          </div>
        </div>
      ))}
    </div>
  );
}

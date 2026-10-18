import { Skeleton } from "./Skeleton";

export function ListingSkeleton() {
  return (
    <div className="container animate-pulse py-4 md:py-6">
      <Skeleton className="h-4 w-40" />
      <Skeleton className="mt-3 h-28 rounded-[28px] md:h-36" />
      <div className="mt-6 grid gap-6 lg:grid-cols-[260px_1fr]">
        <Skeleton className="hidden h-96 lg:block" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-5 xl:grid-cols-4">
          {Array.from({ length: 8 }, (_, i) => (
            <div key={i} className="overflow-hidden rounded-3xl bg-surface shadow-card">
              <div className="skeleton aspect-[4/5] rounded-none" />
              <div className="space-y-2 p-3.5">
                <div className="skeleton h-3 w-16" />
                <div className="skeleton h-4" />
                <div className="skeleton h-4 w-2/3" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function ProductSkeleton() {
  return (
    <div className="container py-4">
      <Skeleton className="h-4 w-56" />
      <div className="mt-4 grid gap-6 md:gap-10 lg:grid-cols-[1.05fr_1fr]">
        <Skeleton className="aspect-square rounded-[32px]" />
        <div className="space-y-4">
          <Skeleton className="h-6 w-28 rounded-full" />
          <Skeleton className="h-9 w-4/5" />
          <Skeleton className="h-5 w-1/3" />
          <Skeleton className="h-64 rounded-3xl" />
          <Skeleton className="h-24 rounded-3xl" />
        </div>
      </div>
    </div>
  );
}

export function PageSkeleton() {
  return (
    <div className="container space-y-6 py-6">
      <Skeleton className="h-4 w-40" />
      <Skeleton className="h-36 rounded-[28px]" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <Skeleton key={i} className="h-48 rounded-3xl" />
        ))}
      </div>
    </div>
  );
}

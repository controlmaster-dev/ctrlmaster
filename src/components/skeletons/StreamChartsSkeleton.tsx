import { Skeleton } from "@/components/ui/skeleton";

export function StreamChartsSkeleton() {
  return (
    <div className="mt-8 w-full rounded-xl border border-border/50 bg-card p-6 shadow-sm">
      <div className="mb-6 space-y-2">
        <Skeleton className="h-5 w-48" />
        <Skeleton className="h-3 w-64 max-w-full" />
      </div>
      <div className="flex h-[280px] items-end justify-between gap-2 px-2">
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton
            key={i}
            className="w-full max-w-[48px] rounded-t-sm"
            style={{ height: `${40 + (i % 4) * 28}%` }}
          />
        ))}
      </div>
    </div>
  );
}

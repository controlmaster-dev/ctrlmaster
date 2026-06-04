import { Skeleton } from "@/components/ui/skeleton";

export function ActivityFeedSkeleton({ lines = 4 }: { lines?: number }) {
  return (
    <div className="space-y-4 px-1 py-2">
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="flex gap-3">
          <Skeleton className="h-8 w-8 shrink-0 rounded-full" />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-3 w-full max-w-md" />
            <Skeleton className="h-2.5 w-20" />
          </div>
        </div>
      ))}
    </div>
  );
}

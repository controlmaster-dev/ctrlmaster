import { Skeleton } from "@/components/ui/skeleton";

export function EmailHistorySkeleton() {
  return (
    <div className="overflow-hidden rounded-md border border-border">
      <Skeleton className="h-10 w-full rounded-none" />
      <div className="divide-y divide-border/40">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 px-4 py-3">
            <Skeleton className="h-3.5 flex-1 max-w-[45%]" />
            <Skeleton className="h-3 w-[28%]" />
            <Skeleton className="h-3 w-16" />
            <Skeleton className="ml-auto h-5 w-14 rounded-sm" />
          </div>
        ))}
      </div>
    </div>
  );
}

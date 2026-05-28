import { Skeleton } from "@/components/ui/skeleton";
import { OperadoresCardsSkeleton } from "@/components/skeletons/OperadoresCardsSkeleton";

export function OperadoresPageSkeleton() {
  return (
    <div className="space-y-5">
      <div className="border border-border bg-card rounded-[6px] overflow-hidden">
        <div className="space-y-3 border-b border-border px-4 py-4 md:px-5">
          <Skeleton className="h-3 w-28" />
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-80" />
        </div>
        <div className="flex gap-2 border-t border-border p-4 bg-muted/5">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-14 flex-1 rounded-[6px]" />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-4 lg:gap-6">
        <Skeleton className="h-72 rounded-[6px] lg:col-span-1" />
        <div className="lg:col-span-3">
          <OperadoresCardsSkeleton />
        </div>
      </div>
    </div>
  );
}

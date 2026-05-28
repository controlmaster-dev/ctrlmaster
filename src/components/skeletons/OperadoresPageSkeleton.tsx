import { Skeleton } from "@/components/ui/skeleton";
import { OperadoresCardsSkeleton } from "@/components/skeletons/OperadoresCardsSkeleton";

export function OperadoresPageSkeleton() {
  return (
    <div className="space-y-5">
      <div className="border border-border/60 bg-card">
        <div className="space-y-3 border-b border-border/50 px-4 py-4 md:px-5">
          <Skeleton className="h-3 w-28" />
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-80" />
        </div>
        <div className="flex gap-px border-t border-border/50 p-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-14 flex-1 rounded-sm" />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-4 lg:gap-6">
        <Skeleton className="h-72 rounded-sm lg:col-span-1" />
        <div className="lg:col-span-3">
          <OperadoresCardsSkeleton />
        </div>
      </div>
    </div>
  );
}

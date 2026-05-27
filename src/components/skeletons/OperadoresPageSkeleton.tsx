import { Skeleton } from "@/components/ui/skeleton";
import { OperadoresCardsSkeleton } from "@/components/skeletons/OperadoresCardsSkeleton";

export function OperadoresPageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-3 border-b border-border/60 pb-6">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-9 w-72" />
        <Skeleton className="h-4 w-96" />
        <div className="flex gap-2 pt-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-44 shrink-0 rounded-lg" />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4 lg:gap-8">
        <Skeleton className="h-64 rounded-xl lg:col-span-1" />
        <div className="lg:col-span-3">
          <OperadoresCardsSkeleton />
        </div>
      </div>
    </div>
  );
}

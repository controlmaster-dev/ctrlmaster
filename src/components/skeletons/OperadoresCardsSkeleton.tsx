import { Skeleton } from "@/components/ui/skeleton";

export function OperadoresCardsSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="border border-border/60 bg-card">
          <div className="flex items-center gap-3 border-b border-border/50 px-4 py-3">
            <Skeleton className="h-10 w-10 rounded-sm" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
          <Skeleton className="m-4 h-24 w-[calc(100%-2rem)] rounded-sm" />
        </div>
      ))}
    </div>
  );
}

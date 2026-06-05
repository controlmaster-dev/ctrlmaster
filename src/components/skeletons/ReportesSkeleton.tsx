import { Skeleton } from "@/components/ui/skeleton";
import { pageContainerClass } from "@/lib/page-layout";

export function ReportesSkeleton() {
  return (
    <div className={`reportes-ui ${pageContainerClass} min-h-screen space-y-5 overflow-hidden`}>
      <div className="border border-border/60 bg-card p-4">
        <Skeleton className="h-3 w-32" />
        <Skeleton className="mt-3 h-8 w-56" />
        <Skeleton className="mt-2 h-4 w-72 max-w-full" />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-28 rounded-sm border border-border/60" />
        ))}
      </div>

      <Skeleton className="h-24 w-full rounded-sm border border-border/60" />

      <div className="overflow-hidden border border-border/60">
        <Skeleton className="h-11 w-full rounded-none" />
        <div className="divide-y divide-border/40">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-4 py-3.5">
              <div className="flex-1 space-y-2">
                <Skeleton className="h-3.5 w-[70%]" />
                <Skeleton className="h-2.5 w-[40%]" />
              </div>
              <Skeleton className="h-5 w-16 rounded-sm" />
              <Skeleton className="h-5 w-20 rounded-sm" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

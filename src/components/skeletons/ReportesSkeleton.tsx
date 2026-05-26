import { Skeleton } from "@/components/ui/skeleton";

export function ReportesSkeleton() {
  return (
    <div className="relative mx-auto min-h-screen max-w-[1600px] space-y-6 overflow-hidden p-4 pb-20 pt-20 md:space-y-8 md:p-8 md:pt-8">
      <div className="flex flex-col justify-between gap-5 border-b border-border/60 pb-6 lg:flex-row lg:items-center">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64 rounded-lg md:h-9" />
          <Skeleton className="h-4 w-72 max-w-full rounded-md" />
        </div>
        <Skeleton className="h-9 w-36 rounded-lg" />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-32 rounded-xl md:h-36" />
        ))}
      </div>

      <Skeleton className="h-14 w-full rounded-xl" />

      <div className="overflow-hidden rounded-xl border border-border/60">
        <Skeleton className="h-12 w-full rounded-none rounded-t-xl" />
        <div className="divide-y divide-border/40">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-4 py-4">
              <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-3.5 w-[75%]" />
                <Skeleton className="h-2.5 w-[45%]" />
              </div>
              <Skeleton className="h-6 w-20 rounded-md" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

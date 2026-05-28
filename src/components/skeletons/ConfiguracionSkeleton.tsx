import { Skeleton } from "@/components/ui/skeleton";
import { pageContainerClass } from "@/lib/page-layout";

export function ConfiguracionSkeleton() {
  return (
    <div className={`configuracion-ui ${pageContainerClass} min-h-screen space-y-5`}>
      <Skeleton className="h-28 w-full rounded-sm" />
      <div className="flex gap-2 overflow-hidden">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-24 shrink-0 rounded-sm" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-sm" />
        ))}
      </div>
      <Skeleton className="h-[360px] w-full rounded-sm" />
    </div>
  );
}

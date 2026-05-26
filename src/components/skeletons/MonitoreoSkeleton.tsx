import { Skeleton } from "@/components/ui/skeleton";

export function MonitoreoSkeleton() {
  return (
    <div className="relative min-h-screen bg-background pt-14 text-foreground md:pt-0">
      <header className="sticky top-0 z-40 border-b border-border bg-card">
        <div className="h-0.5 bg-[#FF0C60]" aria-hidden />
        <div className="flex h-14 items-stretch">
          <div className="flex shrink-0 items-center gap-2 border-r border-border px-3 md:px-4">
            <Skeleton className="h-8 w-8 rounded-lg" />
            <Skeleton className="hidden h-4 w-56 md:block" />
          </div>
          <div className="flex min-w-0 flex-1 divide-x divide-border">
            <div className="flex min-w-0 flex-1 items-center gap-3 border-l-[3px] border-l-green-500 bg-green-500/[0.05] px-3 md:px-5">
              <Skeleton className="h-4 w-28 rounded-md" />
              <Skeleton className="h-4 w-40 max-w-[40%] rounded-md" />
            </div>
            <div className="flex min-w-0 flex-1 items-center gap-3 border-l-[3px] border-l-red-500 bg-red-500/[0.05] px-3 md:px-5">
              <Skeleton className="h-4 w-28 rounded-md" />
              <Skeleton className="h-4 w-40 max-w-[40%] rounded-md" />
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-3 border-l border-border px-3 md:px-4">
            <Skeleton className="h-4 w-20 rounded-md" />
            <Skeleton className="h-8 w-8 rounded-lg" />
          </div>
        </div>
      </header>

      <div className="grid shrink-0 grid-cols-1 gap-2 p-2 md:grid-cols-2">
        <div className="aspect-video overflow-hidden rounded-lg bg-black ring-1 ring-border">
          <Skeleton className="h-full w-full rounded-lg bg-zinc-800" />
        </div>
        <div className="aspect-video overflow-hidden rounded-lg bg-black ring-2 ring-emerald-500/50 ring-offset-2 ring-offset-background">
          <Skeleton className="h-full w-full rounded-lg bg-zinc-800" />
        </div>
      </div>

      <div className="grid min-h-0 w-full flex-1 grid-cols-1 gap-3 bg-background px-3 pb-3 pt-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="relative aspect-video min-h-[120px] overflow-hidden rounded-lg bg-black ring-1 ring-border"
          >
            <Skeleton className="h-full w-full rounded-lg bg-zinc-800" />
          </div>
        ))}
      </div>
    </div>
  );
}

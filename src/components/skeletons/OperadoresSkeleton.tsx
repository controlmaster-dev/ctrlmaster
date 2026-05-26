import { Skeleton } from "@/components/ui/skeleton";

export function OperadoresSkeleton() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-background pb-20">
      <div className="sticky top-0 z-40 border-b border-border bg-background/90">
        <div className="h-0.5 bg-[#FF0C60]" />
        <div className="mx-auto flex h-14 max-w-[1600px] items-center justify-between px-4 md:px-8">
          <Skeleton className="h-7 w-36 rounded-lg" />
          <div className="flex gap-2">
            <Skeleton className="h-9 w-9 rounded-lg" />
            <Skeleton className="h-9 w-24 rounded-lg" />
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[1600px] space-y-6 px-4 py-6 md:space-y-8 md:px-8 md:py-8">
        <div className="space-y-4 border-b border-border/60 pb-6">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-9 w-64 max-w-full rounded-lg" />
          <Skeleton className="h-4 w-80 max-w-full" />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-4 lg:gap-8">
          <Skeleton className="h-80 rounded-xl lg:col-span-1" />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:col-span-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-52 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

import { Skeleton } from "@/components/ui/skeleton";

export function ClavesSkeleton() {
  return (
    <div className="flex min-h-[calc(100dvh-3.5rem)] flex-col md:flex-row">
      <aside className="w-full border-b border-border/60 p-5 md:w-72 md:border-b-0 md:border-r lg:w-80">
        <Skeleton className="mb-2 h-7 w-40 rounded-lg" />
        <Skeleton className="mb-6 h-4 w-32 rounded-md" />
        <div className="mb-4 grid grid-cols-3 gap-2 md:grid-cols-1 md:gap-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-16 rounded-lg" />
          ))}
        </div>
        <Skeleton className="h-10 w-full rounded-lg" />
        <div className="mt-4 space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-full rounded-lg" />
          ))}
        </div>
      </aside>
      <main className="flex-1 p-4">
        <Skeleton className="mb-4 h-5 w-28 rounded-md" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-48 rounded-xl" />
          ))}
        </div>
      </main>
    </div>
  );
}

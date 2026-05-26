import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";

export function DashboardSkeleton() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.45 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="rounded-xl border border-border/60 bg-card/40 p-5 backdrop-blur-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-8 w-56" />
            <Skeleton className="h-4 w-[280px]" />
          </div>

          <div className="flex flex-wrap gap-2">
            <Skeleton className="h-9 w-[120px] rounded-lg" />
            <Skeleton className="h-9 w-[120px] rounded-lg" />
            <Skeleton className="h-9 w-[120px] rounded-lg" />
            <Skeleton className="h-9 w-[160px] rounded-lg" />
          </div>
        </div>
      </div>

      {/* Stats row + birthday */}
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="rounded-xl border border-border/60 bg-card/40 p-5 shadow-sm"
            >
              <Skeleton className="h-7 w-7 rounded-md" />
              <div className="mt-4 space-y-3">
                <Skeleton className="h-3 w-28" />
                <Skeleton className="h-9 w-24" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-xl border border-border/60 bg-card/40 p-4">
          <Skeleton className="h-4 w-32" />
          <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-lg border border-border/40 p-2.5">
                <Skeleton className="h-8 w-8 rounded-md" />
                <Skeleton className="mt-2 h-3 w-16" />
                <Skeleton className="mt-1 h-3 w-10" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-3 xl:gap-8">
        {/* Left: weekly trend + reports */}
        <div className="flex flex-col gap-4 xl:col-span-2">
          <div className="overflow-hidden rounded-xl border border-border/60 bg-card/40 shadow-sm">
            <div className="p-5 border-b border-border/60">
              <Skeleton className="h-5 w-56" />
              <div className="mt-2">
                <Skeleton className="h-3 w-72" />
              </div>
            </div>
            <div className="p-5">
              <Skeleton className="h-[220px] w-full rounded-lg" />
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-border/60 bg-card/40 shadow-sm">
            <div className="flex items-start justify-between gap-3 border-b border-border/60 px-5 py-3">
              <div className="space-y-2">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-64" />
              </div>
              <Skeleton className="h-8 w-24 rounded-lg" />
            </div>
            <div className="p-0">
              <div className="divide-y divide-border/40">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 px-5 py-4"
                  >
                    <Skeleton className="h-9 w-9 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-3 w-[70%]" />
                      <Skeleton className="h-2.5 w-[45%]" />
                    </div>
                    <Skeleton className="h-6 w-16 rounded-md" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right: widgets */}
        <div className="flex flex-col gap-4 xl:col-span-1">
          <div className="rounded-2xl border border-border/60 bg-card/40 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-border/60 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Skeleton className="h-8 w-8 rounded-md" />
                <Skeleton className="h-4 w-32" />
              </div>
            </div>
            <div className="p-4 space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="h-7 w-20 rounded-md" />
                  <Skeleton className="h-5 w-10 rounded-md" />
                  <Skeleton className="h-5 w-24 rounded-md" />
                </div>
              ))}
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-border/60 bg-card/40 shadow-sm">
            <div className="p-5">
              <div className="flex items-start gap-3">
                <Skeleton className="h-9 w-9 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-3 w-44" />
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <Skeleton className="h-20 col-span-2 rounded-lg" />
              </div>
              <div className="mt-4">
                <Skeleton className="h-9 w-full rounded-lg" />
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-border/60 bg-card/40 shadow-sm">
            <div className="flex items-start justify-between gap-3 border-b border-border/60 px-5 py-3">
              <div className="space-y-2">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-56" />
              </div>
              <Skeleton className="h-8 w-24 rounded-lg" />
            </div>
            <div className="p-5">
              <div className="space-y-3">
                {Array.from({ length: 2 }).map((_, i) => (
                  <div
                    key={i}
                    className="rounded-lg border border-border/40 bg-muted/20 p-4"
                  >
                    <Skeleton className="h-7 w-7 rounded-full" />
                    <Skeleton className="mt-2 h-4 w-48" />
                    <Skeleton className="mt-3 h-3 w-56" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

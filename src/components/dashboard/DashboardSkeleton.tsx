import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";

export function DashboardSkeleton() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.45 }}
      className="space-y-5 md:space-y-6"
    >
      <div className="overflow-hidden rounded-sm border border-border/60 bg-card p-4 shadow-sm">
        <div className="flex flex-wrap gap-2">
          <Skeleton className="h-5 w-28 rounded-sm" />
          <Skeleton className="h-5 w-40 rounded-sm" />
        </div>
        <div className="mt-3 space-y-2">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-8 w-56 md:w-72" />
          <Skeleton className="h-3 w-full max-w-md" />
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Skeleton className="h-9 w-24 rounded-sm" />
          <Skeleton className="h-9 w-24 rounded-sm" />
          <Skeleton className="h-11 w-36 rounded-sm" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="overflow-hidden rounded-sm border border-border/60 bg-card p-5 shadow-sm"
          >
            <Skeleton className="h-12 w-12 rounded-sm" />
            <div className="mt-4 space-y-3">
              <Skeleton className="h-3 w-28" />
              <Skeleton className="h-10 w-20" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
        ))}
      </div>

      <div className="overflow-hidden rounded-sm border border-border/60 bg-card p-4">
        <Skeleton className="h-4 w-32" />
        <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-sm" />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-3 xl:gap-5">
        <div className="flex flex-col gap-4 xl:col-span-2">
          <div className="overflow-hidden rounded-sm border border-border/60 bg-card shadow-sm">
            <Skeleton className="h-1 w-full" />
            <div className="border-b border-border/40 p-4">
              <Skeleton className="h-5 w-48" />
            </div>
            <div className="divide-y divide-border/30 p-0">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 px-5 py-4">
                  <Skeleton className="h-10 w-10 rounded-sm" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-3.5 w-4/5" />
                    <Skeleton className="h-2.5 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4 xl:col-span-1">
          <Skeleton className="h-64 rounded-sm" />
          <Skeleton className="h-48 rounded-sm" />
          <Skeleton className="h-40 rounded-sm" />
        </div>
      </div>
    </motion.div>
  );
}

import React from "react";
import { motion } from "framer-motion";

export function DashboardSkeleton() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-10 animate-pulse"
    >
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end w-full gap-8 py-12 border-b border-border bg-muted/5 rounded-md p-6 md:p-12">
        <div className="space-y-4 max-w-3xl w-full">
          <div className="h-16 w-3/4 bg-muted rounded-md" />
          <div className="h-4 w-1/2 bg-muted rounded-md" />
        </div>
        <div className="flex flex-col gap-4 w-full md:w-auto">
          <div className="flex gap-4">
            <div className="h-12 w-32 bg-muted rounded-md" />
            <div className="h-12 w-32 bg-muted rounded-md" />
          </div>
          <div className="flex gap-3">
            <div className="h-14 flex-1 bg-muted rounded-md" />
            <div className="h-14 w-14 bg-muted rounded-md" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {Array(3).fill(0).map((_, i) => (
          <div key={i} className="h-[140px] rounded-md bg-card/40 border border-border p-5 space-y-4">
            <div className="h-8 w-8 rounded-md bg-muted" />
            <div className="space-y-2">
              <div className="h-3 w-20 bg-muted rounded" />
              <div className="h-8 w-12 bg-muted rounded" />
            </div>
          </div>
        ))}
        <div className="h-[140px] rounded-md bg-card/40 border border-border p-5 flex flex-col justify-between">
          <div className="h-8 w-8 rounded-md bg-muted" />
          <div className="space-y-2">
            <div className="h-2 w-24 bg-muted rounded" />
            <div className="h-6 w-full bg-muted rounded-md" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-10">
          <div className="rounded-md border border-border bg-card/40 backdrop-blur-sm overflow-hidden">
            <div className="p-6 border-b border-border space-y-2">
              <div className="h-6 w-48 bg-muted rounded" />
              <div className="h-3 w-64 bg-muted rounded opacity-50" />
            </div>
            <div className="p-0">
              {Array(5).fill(0).map((_, i) => (
                <div key={i} className="flex items-center gap-6 p-6 border-b border-border last:border-0">
                  <div className="w-16 h-4 bg-muted rounded opacity-50" />
                  <div className="flex-1 space-y-3">
                    <div className="h-5 w-3/4 bg-muted rounded" />
                    <div className="flex items-center gap-3">
                      <div className="h-5 w-5 rounded-full bg-muted" />
                      <div className="h-3 w-20 bg-muted rounded opacity-50" />
                      <div className="h-4 w-12 rounded bg-muted opacity-30" />
                    </div>
                  </div>
                  <div className="w-24 h-6 rounded-md bg-muted opacity-40" />
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="lg:col-span-1 h-[600px] rounded-md bg-card/40 border border-border" />
      </div>
    </motion.div>
  );
}

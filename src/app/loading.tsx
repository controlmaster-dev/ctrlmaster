"use client";

import { DashboardSkeleton } from "@/components/dashboard/DashboardSkeleton";
import { pageContainerClass } from "@/lib/page-layout";

export default function Loading() {
  return (
    <div className={`${pageContainerClass} min-h-screen bg-background`}>
      <DashboardSkeleton />
    </div>
  );
}


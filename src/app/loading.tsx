"use client";

import { DashboardSkeleton } from "@/components/dashboard/DashboardSkeleton";

export default function Loading() {
  return (
    <div className="min-h-screen bg-background">
      <DashboardSkeleton />
    </div>
  );
}


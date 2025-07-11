// FILE: apps/web/components/views/overview/OverviewSkeleton.tsx
// This is the loading skeleton for the new legacy layout.
'use client';
import { Skeleton } from '@/components/ui/skeleton';

export function OverviewSkeleton() {
  return (
    <div className="w-full h-full p-4 flex flex-col gap-4">
      {/* KPI Skeletons */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
      </div>

      {/* Map Skeleton */}
      <Skeleton className="flex-grow" />

      {/* Bottom Row Skeletons */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Skeleton className="lg:col-span-2 h-64" />
          <Skeleton className="h-64" />
      </div>
    </div>
  );
}
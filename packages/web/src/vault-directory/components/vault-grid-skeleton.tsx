import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

const VaultCardSkeleton = () => (
  <div className="bg-white rounded-lg border border-border shadow-sm">
    <div className="p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <Skeleton className="h-6 w-3/4 mb-2" />
          <Skeleton className="h-4 w-1/2" />
        </div>
        <div className="ml-4">
          <Skeleton className="w-10 h-10 rounded-full" />
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        {/* TVL */}
        <div>
          <Skeleton className="h-3 w-full mb-2" />
          <Skeleton className="h-6 w-3/4" />
        </div>

        {/* Depositors */}
        <div>
          <Skeleton className="h-3 w-full mb-2" />
          <Skeleton className="h-6 w-1/2" />
        </div>
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        {/* Net Flow */}
        <div>
          <Skeleton className="h-3 w-full mb-2" />
          <Skeleton className="h-5 w-2/3" />
        </div>

        {/* Share Price */}
        <div>
          <Skeleton className="h-3 w-full mb-2" />
          <Skeleton className="h-5 w-3/4" />
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-border">
        <Skeleton className="h-6 w-16 rounded-full" />
        <Skeleton className="h-3 w-24" />
      </div>
    </div>
  </div>
);

export const VaultGridSkeleton = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {Array.from({ length: 20 }).map((_, index) => (
        <VaultCardSkeleton key={index} />
      ))}
    </div>
  );
};

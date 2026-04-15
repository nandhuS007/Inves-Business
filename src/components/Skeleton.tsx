import React from "react";
import { cn } from "../lib/utils";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {}

export const Skeleton: React.FC<SkeletonProps> = ({ className, ...props }) => {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-gray-200", className)}
      {...props}
    />
  );
};

export const BusinessCardSkeleton = () => (
  <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
    <Skeleton className="h-48 w-full rounded-none" />
    <div className="p-6 space-y-4">
      <div className="flex justify-between items-start">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-6 w-24" />
      </div>
      <Skeleton className="h-6 w-3/4" />
      <div className="flex items-center gap-2">
        <Skeleton className="h-4 w-4 rounded-full" />
        <Skeleton className="h-4 w-32" />
      </div>
      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-50">
        <div className="space-y-2">
          <Skeleton className="h-3 w-12" />
          <Skeleton className="h-4 w-16" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-3 w-12" />
          <Skeleton className="h-4 w-16" />
        </div>
      </div>
      <Skeleton className="h-12 w-full rounded-xl mt-4" />
    </div>
  </div>
);

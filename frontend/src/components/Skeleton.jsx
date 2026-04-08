import React from 'react';

export const SkeletonLine = ({ className = "" }) => (
  <div className={`skeleton h-4 w-full rounded-md ${className}`}></div>
);

export const SkeletonCircle = ({ size = "10", className = "" }) => (
  <div className={`skeleton rounded-full w-${size} h-${size} ${className}`}></div>
);

export const SkeletonCard = () => (
  <div className="premium-card p-6 space-y-4">
    <div className="flex items-center gap-4">
      <SkeletonCircle size="12" />
      <div className="space-y-2 flex-1">
        <SkeletonLine className="w-1/3" />
        <SkeletonLine className="w-1/4 h-3" />
      </div>
    </div>
    <div className="space-y-2 pt-4">
      <SkeletonLine />
      <SkeletonLine />
      <SkeletonLine className="w-2/3" />
    </div>
  </div>
);

export const SkeletonStat = () => (
  <div className="premium-card p-6 flex flex-col justify-between h-32">
    <div className="flex justify-between items-start">
      <SkeletonCircle size="10" />
      <div className="w-12 h-5 skeleton rounded-full" />
    </div>
    <div className="space-y-2 mt-4">
      <SkeletonLine className="w-1/2 h-2" />
      <SkeletonLine className="w-3/4 h-6" />
    </div>
  </div>
);

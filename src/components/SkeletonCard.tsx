import React from "react";

const SkeletonCard: React.FC = () => {
  return (
    <div className="bg-surface rounded-xl p-5 animate-pulse">
      <div className="flex items-center justify-between mb-4">
        <div className="h-5 w-32 bg-air-force/20 rounded-md" />
        <div className="h-5 w-16 bg-air-force/20 rounded-full" />
      </div>
      <div className="space-y-3">
        <div className="h-3 w-full bg-air-force/15 rounded" />
        <div className="h-3 w-3/4 bg-air-force/15 rounded" />
        <div className="h-3 w-1/2 bg-air-force/15 rounded" />
      </div>
      <div className="mt-5 flex gap-2">
        <div className="h-8 w-20 bg-air-force/15 rounded-lg" />
        <div className="h-8 w-20 bg-air-force/15 rounded-lg" />
      </div>
    </div>
  );
};

export default SkeletonCard;

import React from 'react';

export const LoadingSkeleton: React.FC = () => {
  return (
    <div className="space-y-3 animate-pulse">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="bg-white/10 rounded-xl p-4 flex items-center gap-3">
          {/* Avatar skeleton */}
          <div className="w-14 h-14 bg-white/20 rounded-full" />
          
          {/* Content skeleton */}
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-white/20 rounded w-3/4" />
            <div className="h-5 bg-white/20 rounded w-1/2" />
          </div>
          
          {/* Badge skeleton */}
          <div className="w-16 h-6 bg-white/20 rounded-full" />
        </div>
      ))}
    </div>
  );
};
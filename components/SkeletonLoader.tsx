import React from 'react';

export const SkeletonLoader: React.FC = () => {
  return (
    <div className="space-y-5 pt-2">
      <div className="space-y-3">
        <div className="h-4 bg-gray-700 rounded w-full animate-pulse"></div>
        <div className="h-4 bg-gray-700 rounded w-5/6 animate-pulse"></div>
        <div className="h-4 bg-gray-700 rounded w-full animate-pulse"></div>
      </div>
      <div className="space-y-3">
        <div className="h-4 bg-gray-700 rounded w-full animate-pulse"></div>
        <div className="h-4 bg-gray-700 rounded w-4/6 animate-pulse"></div>
      </div>
      <div className="space-y-3">
        <div className="h-4 bg-gray-700 rounded w-full animate-pulse"></div>
        <div className="h-4 bg-gray-700 rounded w-3/4 animate-pulse"></div>
        <div className="h-4 bg-gray-700 rounded w-5/6 animate-pulse"></div>
      </div>
    </div>
  );
};
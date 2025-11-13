
import React from 'react';

export const LoadingSpinner: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center space-y-4">
      <div className="relative w-24 h-24">
        <div className="absolute inset-0 border-4 border-cyan-500/20 rounded-full"></div>
        <div className="absolute inset-0 border-t-4 border-cyan-500 rounded-full animate-spin"></div>
      </div>
      <p className="text-lg text-gray-300">Generating knowledge...</p>
    </div>
  );
};

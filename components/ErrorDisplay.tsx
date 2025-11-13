
import React from 'react';

interface ErrorDisplayProps {
  message: string;
}

const AlertTriangleIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
);


export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ message }) => {
  return (
    <div className="bg-red-900/30 border border-red-500/50 text-red-300 px-6 py-4 rounded-lg flex items-center space-x-4 max-w-2xl">
      <AlertTriangleIcon className="h-8 w-8 text-red-400 flex-shrink-0" />
      <div>
        <h3 className="font-bold text-lg">An Error Occurred</h3>
        <p>{message}</p>
      </div>
    </div>
  );
};

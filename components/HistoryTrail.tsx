
import React from 'react';

interface HistoryTrailProps {
  history: string[];
  onNavigate: (index: number) => void;
}

const ChevronRightIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
);


export const HistoryTrail: React.FC<HistoryTrailProps> = ({ history, onNavigate }) => {
  return (
    <nav className="flex items-center text-sm text-gray-400 overflow-x-auto pb-2">
      {history.map((item, index) => (
        <React.Fragment key={index}>
          <button
            onClick={() => onNavigate(index)}
            className={`whitespace-nowrap ${index === history.length - 1 ? 'text-white font-semibold' : 'hover:text-cyan-400'}`}
          >
            {item}
          </button>
          {index < history.length - 1 && (
            <ChevronRightIcon className="h-4 w-4 mx-1 text-gray-500 flex-shrink-0" />
          )}
        </React.Fragment>
      ))}
    </nav>
  );
};

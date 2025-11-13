import React, { useState, useEffect, useMemo } from 'react';
import { SearchIcon, HistoryIcon } from './icons';

interface CommandKModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSearch: (query: string) => void;
  onJump: (topic: string) => void;
  history: string[];
}

export const CommandKModal: React.FC<CommandKModalProps> = ({ isOpen, onClose, onSearch, onJump, history }) => {
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setActiveIndex(0);
    }
  }, [isOpen]);

  const filteredHistory = useMemo(() => 
    query ? history.filter(item => item.toLowerCase().includes(query.toLowerCase())).reverse() : history.reverse(),
    [query, history]
  );
  
  const results = useMemo(() => {
    const historyResults = filteredHistory.map(item => ({ type: 'history', value: item }));
    if (query.trim() !== '' && !history.some(h => h.toLowerCase() === query.toLowerCase())) {
      return [{ type: 'search', value: query }, ...historyResults];
    }
    return historyResults;
  }, [query, filteredHistory, history]);

  useEffect(() => {
    setActiveIndex(0);
  }, [results.length]);
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((prev) => (prev + 1) % results.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((prev) => (prev - 1 + results.length) % results.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (results[activeIndex]) {
        const selected = results[activeIndex];
        if (selected.type === 'search') {
          onSearch(selected.value);
        } else {
          onJump(selected.value);
        }
        onClose();
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-start justify-center pt-20" onClick={onClose}>
      <div className="w-full max-w-2xl bg-gray-800 rounded-lg shadow-2xl overflow-hidden border border-gray-700" onClick={(e) => e.stopPropagation()}>
        <div className="relative">
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search for a topic or jump to..."
            className="w-full p-4 pl-12 bg-transparent text-lg text-white placeholder-gray-400 focus:outline-none"
          />
          <div className="absolute inset-y-0 left-0 flex items-center pl-4">
            <SearchIcon className="h-6 w-6 text-gray-400" />
          </div>
        </div>
        <div className="border-t border-gray-700">
          <ul className="max-h-96 overflow-y-auto p-2">
            {results.length > 0 ? results.map((item, index) => (
              <li
                key={`${item.type}-${item.value}`}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => {
                  if (item.type === 'search') onSearch(item.value);
                  else onJump(item.value);
                  onClose();
                }}
                className={`flex items-center space-x-3 p-3 rounded-md cursor-pointer ${activeIndex === index ? 'bg-gray-700' : ''}`}
              >
                {item.type === 'search' ? (
                  <SearchIcon className="h-5 w-5 text-cyan-400 flex-shrink-0" />
                ) : (
                  <HistoryIcon className="h-5 w-5 text-gray-400 flex-shrink-0" />
                )}
                <span className="truncate">{item.value}</span>
              </li>
            )) : (
                <li className="p-4 text-center text-gray-500">No results found.</li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
};
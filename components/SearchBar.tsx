
import React, { useState } from 'react';
import { SearchIcon } from './icons';

interface SearchBarProps {
  onSearch: (query: string) => void;
  isLoading?: boolean;
  isProminent?: boolean;
}

export const SearchBar: React.FC<SearchBarProps> = ({ onSearch, isLoading = false, isProminent = false }) => {
  const [query, setQuery] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim() && !isLoading) {
      onSearch(query);
      setQuery('');
    }
  };

  const sizeClasses = isProminent 
    ? "py-3 text-lg pl-12 pr-6"
    : "py-2 pl-10 pr-4";

  const iconWrapperClasses = isProminent
    ? "pl-4"
    : "pl-3";

  const iconClasses = isProminent
    ? "h-6 w-6"
    : "h-5 w-5";

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Explore a topic..."
          disabled={isLoading}
          className={`w-full bg-gray-800 border border-gray-600 rounded-full text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition duration-200 ${sizeClasses} ${isLoading ? 'cursor-not-allowed' : ''}`}
        />
        <div className={`absolute inset-y-0 left-0 flex items-center pointer-events-none ${iconWrapperClasses}`}>
          <SearchIcon className={`${iconClasses} text-gray-400`} />
        </div>
      </div>
    </form>
  );
};

import React, { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';

const SearchBar = ({
  placeholder = 'Search by title, subject, tags, or topic (e.g., Operating Systems, Discrete Math)...',
  value = '',
  onChange,
  onSearch,
  className = '',
  size = 'md',
}) => {
  const [query, setQuery] = useState(value);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSearch) {
      onSearch(query);
    }
  };

  const handleClear = () => {
    setQuery('');
    if (onChange) onChange('');
    if (onSearch) onSearch('');
  };

  const handleChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    if (onChange) onChange(val);
  };

  const sizeClasses = {
    sm: 'py-2 pl-9 pr-20 text-sm rounded-xl',
    md: 'py-3.5 pl-11 pr-24 text-base rounded-2xl',
    lg: 'py-4 pl-12 pr-28 text-lg rounded-2xl',
  };

  const iconSizes = {
    sm: 'w-4 h-4 left-3',
    md: 'w-5 h-5 left-4',
    lg: 'w-6 h-6 left-4',
  };

  return (
    <form onSubmit={handleSubmit} className={`relative flex items-center w-full ${className}`}>
      <Search
        className={`absolute text-slate-400 pointer-events-none ${iconSizes[size]}`}
      />
      <input
        type="text"
        value={query}
        onChange={handleChange}
        placeholder={placeholder}
        className={`w-full bg-white border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 shadow-sm transition-all ${sizeClasses[size]}`}
      />
      <div className="absolute right-2.5 flex items-center gap-1.5">
        {query && (
          <button
            type="button"
            onClick={handleClear}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
            title="Clear search"
          >
            <X className="w-4 h-4" />
          </button>
        )}
        <button
          type="submit"
          className="px-3.5 py-1.5 bg-brand-600 hover:bg-brand-700 text-white text-xs md:text-sm font-semibold rounded-lg shadow-sm transition-colors"
        >
          Search
        </button>
      </div>
    </form>
  );
};

export default SearchBar;

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Sparkles, Filter, Layers, BookOpen } from 'lucide-react';
import { resourceService } from '../../services/resourceService';
import ResourceCard from '../../components/common/ResourceCard';
import SearchBar from '../../components/common/SearchBar';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import { RESOURCE_TYPES, DEPARTMENTS } from '../../utils/constants';

const SearchPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';

  const [query, setQuery] = useState(initialQuery);
  const [selectedType, setSelectedType] = useState('All');
  const [selectedDept, setSelectedDept] = useState('All');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const performSearch = async (searchKeyword, type, dept) => {
    try {
      setLoading(true);
      setSearched(true);
      const params = {
        search: searchKeyword || undefined,
        resourceType: type !== 'All' ? type : undefined,
        department: dept !== 'All' ? dept : undefined,
        limit: 20,
      };

      const data = await resourceService.getResources(params);
      if (data.success) {
        setResults(data.resources || []);
      }
    } catch (err) {
      console.warn('Search error:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialQuery) {
      performSearch(initialQuery, selectedType, selectedDept);
    }
  }, [initialQuery]);

  const handleSearchSubmit = (searchTerm) => {
    setQuery(searchTerm);
    setSearchParams(searchTerm ? { q: searchTerm } : {});
    performSearch(searchTerm, selectedType, selectedDept);
  };

  const handleTypeSelect = (type) => {
    setSelectedType(type);
    performSearch(query, type, selectedDept);
  };

  const handleDeptSelect = (dept) => {
    setSelectedDept(dept);
    performSearch(query, selectedType, dept);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Search Header */}
      <div className="max-w-3xl mx-auto text-center space-y-3">
        <h1 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
          Search Academic Materials
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Search across title, subject course codes, descriptions, and tags.
        </p>

        {/* Large Search Input */}
        <div className="pt-2">
          <SearchBar
            size="lg"
            value={query}
            onSearch={handleSearchSubmit}
            placeholder="Type subject, topic, or document title (e.g., Computer Networks, OS Lab)..."
          />
        </div>

        {/* Type Category Chips */}
        <div className="flex flex-wrap items-center justify-center gap-1.5 pt-2">
          <button
            onClick={() => handleTypeSelect('All')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
              selectedType === 'All'
                ? 'bg-brand-600 text-white shadow-sm'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            All Types
          </button>
          {RESOURCE_TYPES.map((type) => (
            <button
              key={type}
              onClick={() => handleTypeSelect(type)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                selectedType === type
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Info notice about Keyword vs Future AI Semantic Search */}
      <div className="max-w-3xl mx-auto p-4 bg-blue-50/70 border border-blue-200 rounded-2xl flex items-start gap-3 text-xs text-blue-900">
        <Sparkles className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
        <div>
          <span className="font-bold">Keyword Search Mode:</span> Matched against database titles, subjects, descriptions, and topic tags. The system is built with microservice hooks ready for Python vector semantic search in Phase 2.
        </div>
      </div>

      {/* Results Section */}
      <div>
        {loading ? (
          <LoadingSpinner text="Searching through academic database..." />
        ) : searched ? (
          <div>
            <div className="flex items-center justify-between mb-6 pb-2 border-b border-slate-200">
              <h2 className="text-sm font-bold text-slate-700">
                {results.length} result{results.length === 1 ? '' : 's'} found
                {query ? ` for "${query}"` : ''}
              </h2>
              {selectedType !== 'All' && (
                <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-medium">
                  Type: {selectedType}
                </span>
              )}
            </div>

            {results.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {results.map((resource) => (
                  <ResourceCard key={resource._id} resource={resource} />
                ))}
              </div>
            ) : (
              <EmptyState
                title="No matching academic resources"
                description={`No resources found matching "${query}". Try searching for broader terms like "Math", "Algorithm", "Physics", or "Database".`}
                actionText="Explore All Resources"
                actionLink="/browse"
              />
            )}
          </div>
        ) : (
          <div className="text-center py-12 text-slate-400">
            <Search className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p className="text-sm font-medium">Enter a search keyword above to discover study materials.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchPage;

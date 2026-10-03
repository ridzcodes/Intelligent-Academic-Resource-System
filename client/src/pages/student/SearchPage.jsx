import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Sparkles, Filter, Layers, BookOpen, AlertCircle, HelpCircle, ArrowRight } from 'lucide-react';
import { resourceService } from '../../services/resourceService';
import ResourceCard from '../../components/common/ResourceCard';
import SemanticResultCard from '../../components/common/SemanticResultCard';
import SearchBar from '../../components/common/SearchBar';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import { RESOURCE_TYPES, DEPARTMENTS } from '../../utils/constants';

const SearchPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const initialMode = searchParams.get('mode') || 'semantic'; // Default to semantic or keyword based on URL

  const [searchMode, setSearchMode] = useState(initialMode); // 'keyword' | 'semantic'
  const [query, setQuery] = useState(initialQuery);
  const [selectedType, setSelectedType] = useState('All');
  const [selectedDept, setSelectedDept] = useState('All');
  const [results, setResults] = useState([]);
  const [semanticResults, setSemanticResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [aiError, setAiError] = useState(null);

  // Keyword Database Search
  const performKeywordSearch = async (searchKeyword, type, dept) => {
    try {
      setLoading(true);
      setSearched(true);
      setAiError(null);
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
      console.warn('Keyword search error:', err.message);
    } finally {
      setLoading(false);
    }
  };

  // AI Semantic Vector Search
  const performSemanticSearch = async (searchQuery) => {
    if (!searchQuery || searchQuery.trim().length === 0) {
      setSemanticResults([]);
      setSearched(false);
      return;
    }

    try {
      setLoading(true);
      setSearched(true);
      setAiError(null);

      const data = await resourceService.semanticSearch(searchQuery.trim(), 8);
      if (data.success) {
        setSemanticResults(data.results || []);
      } else {
        setSemanticResults([]);
      }
    } catch (err) {
      console.error('Semantic search error:', err.message);
      setAiError(
        err.message ||
          'Could not complete semantic vector search. Please ensure the Python AI microservice is running.'
      );
      setSemanticResults([]);
    } finally {
      setLoading(false);
    }
  };

  // Trigger search on mount or query param change
  useEffect(() => {
    if (initialQuery) {
      if (searchMode === 'semantic') {
        performSemanticSearch(initialQuery);
      } else {
        performKeywordSearch(initialQuery, selectedType, selectedDept);
      }
    }
  }, [initialQuery, searchMode]);

  const handleSearchSubmit = (searchTerm) => {
    setQuery(searchTerm);
    setSearchParams(searchTerm ? { q: searchTerm, mode: searchMode } : { mode: searchMode });

    if (searchMode === 'semantic') {
      performSemanticSearch(searchTerm);
    } else {
      performKeywordSearch(searchTerm, selectedType, selectedDept);
    }
  };

  const handleModeChange = (newMode) => {
    setSearchMode(newMode);
    setSearchParams(query ? { q: query, mode: newMode } : { mode: newMode });
    setSearched(false);
    setAiError(null);

    if (query) {
      if (newMode === 'semantic') {
        performSemanticSearch(query);
      } else {
        performKeywordSearch(query, selectedType, selectedDept);
      }
    }
  };

  const handleTypeSelect = (type) => {
    setSelectedType(type);
    if (searchMode === 'keyword') {
      performKeywordSearch(query, type, selectedDept);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Search Header */}
      <div className="max-w-3xl mx-auto text-center space-y-4">
        <h1 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
          Academic Resource Search
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Find study materials, lecture notes, and question papers using traditional keywords or AI semantic understanding.
        </p>

        {/* Search Mode Toggle Tabs */}
        <div className="inline-flex p-1 rounded-2xl bg-slate-100 border border-slate-200/80 shadow-inner">
          <button
            type="button"
            onClick={() => handleModeChange('semantic')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 ${
              searchMode === 'semantic'
                ? 'bg-white text-brand-700 shadow-sm border border-slate-200/60'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sparkles className={`w-4 h-4 ${searchMode === 'semantic' ? 'text-brand-600' : 'text-slate-400'}`} />
            <span>AI Semantic Search</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-brand-100 text-brand-800 font-semibold">
              Neural
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleModeChange('keyword')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 ${
              searchMode === 'keyword'
                ? 'bg-white text-slate-900 shadow-sm border border-slate-200/60'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Search className="w-4 h-4 text-slate-400" />
            <span>Keyword Search</span>
          </button>
        </div>

        {/* Large Search Input */}
        <div className="pt-2">
          <SearchBar
            size="lg"
            value={query}
            onSearch={handleSearchSubmit}
            placeholder={
              searchMode === 'semantic'
                ? "Ask a concept, question, or topic (e.g., 'How do AVL tree rotations work?', 'Deadlock avoidance')..."
                : 'Search by title, subject code, or tag (e.g., CS301, Operating Systems, Networks)...'
            }
          />
        </div>

        {/* Mode-Specific Filters / Badges */}
        {searchMode === 'keyword' && (
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
        )}
      </div>

      {/* Mode Explanation Notice Banner */}
      <div className="max-w-3xl mx-auto">
        {searchMode === 'semantic' ? (
          <div className="p-4 bg-gradient-to-r from-brand-50/80 via-indigo-50/60 to-purple-50/60 border border-brand-200/70 rounded-2xl flex items-start gap-3 text-xs text-brand-950">
            <Sparkles className="w-4 h-4 text-brand-600 mt-0.5 flex-shrink-0" />
            <div className="space-y-1">
              <span className="font-bold text-brand-900">AI Semantic Search Active:</span>
              <p className="text-slate-600 leading-relaxed">
                Queries are encoded into 384-dimensional dense vectors using{' '}
                <span className="font-semibold text-slate-800">Sentence-Transformers (all-MiniLM-L6-v2)</span> and
                matched against indexed PDF passages in <span className="font-semibold text-slate-800">ChromaDB</span>{' '}
                using cosine similarity.
              </p>
            </div>
          </div>
        ) : (
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-start gap-3 text-xs text-slate-700">
            <Search className="w-4 h-4 text-slate-500 mt-0.5 flex-shrink-0" />
            <div>
              <span className="font-bold text-slate-900">Keyword Search Mode:</span> Matched directly against resource titles, course codes, subjects, descriptions, and tags in MongoDB.
            </div>
          </div>
        )}
      </div>

      {/* AI Error Alert */}
      {aiError && (
        <div className="max-w-3xl mx-auto p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3 text-xs text-rose-800">
          <AlertCircle className="w-4 h-4 text-rose-600 mt-0.5 flex-shrink-0" />
          <div className="space-y-1 flex-1">
            <span className="font-bold">AI Microservice Connection Notice</span>
            <p className="text-rose-700">{aiError}</p>
            <div className="pt-2">
              <button
                onClick={() => handleModeChange('keyword')}
                className="inline-flex items-center gap-1 font-bold text-brand-700 hover:text-brand-800 underline"
              >
                Switch to Keyword Search <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Results Section */}
      <div>
        {loading ? (
          <LoadingSpinner
            text={
              searchMode === 'semantic'
                ? 'Generating vector embeddings & searching ChromaDB...'
                : 'Searching academic database...'
            }
          />
        ) : searched ? (
          <div>
            {/* Semantic Search Results */}
            {searchMode === 'semantic' ? (
              <div>
                <div className="flex items-center justify-between mb-6 pb-2 border-b border-slate-200">
                  <h2 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-brand-600" />
                    <span>
                      {semanticResults.length} relevant excerpt
                      {semanticResults.length === 1 ? '' : 's'} found
                      {query ? ` for "${query}"` : ''}
                    </span>
                  </h2>
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-lg bg-brand-50 text-brand-700 border border-brand-200">
                    ChromaDB Vector Match
                  </span>
                </div>

                {semanticResults.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {semanticResults.map((item) => (
                      <SemanticResultCard key={item.id} result={item} />
                    ))}
                  </div>
                ) : !aiError ? (
                  <EmptyState
                    title="No semantic vector matches found"
                    description={`No passages closely matching "${query}" were found in the indexed documents. Try asking in different words or switch to Keyword Search.`}
                    actionText="Switch to Keyword Search"
                    onAction={() => handleModeChange('keyword')}
                  />
                ) : null}
              </div>
            ) : (
              /* Keyword Search Results */
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
                    description={`No resources found matching "${query}". Try searching for broader terms or switch to AI Semantic Search.`}
                    actionText="Try AI Semantic Search"
                    onAction={() => handleModeChange('semantic')}
                  />
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-12 text-slate-400 space-y-3">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400">
              {searchMode === 'semantic' ? (
                <Sparkles className="w-7 h-7 text-brand-500 opacity-70" />
              ) : (
                <Search className="w-7 h-7 opacity-50" />
              )}
            </div>
            <p className="text-sm font-medium text-slate-600">
              {searchMode === 'semantic'
                ? 'Type any question or concept above to find exact PDF page citations.'
                : 'Enter a search keyword or course code above to discover study materials.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchPage;

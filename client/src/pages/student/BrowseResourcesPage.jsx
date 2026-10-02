import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { BookOpen, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { resourceService } from '../../services/resourceService';
import ResourceCard from '../../components/common/ResourceCard';
import FilterBar from '../../components/common/FilterBar';
import SearchBar from '../../components/common/SearchBar';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';

const BrowseResourcesPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const [filters, setFilters] = useState({
    search: searchParams.get('q') || '',
    department: searchParams.get('department') || 'All',
    semester: searchParams.get('semester') || 'All',
    resourceType: searchParams.get('type') || 'All',
    sort: searchParams.get('sort') || 'latest',
  });

  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    totalCount: 0,
  });

  // Fetch resources when filters or page changes
  const fetchResources = async (page = 1) => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: 9,
        search: filters.search || undefined,
        department: filters.department !== 'All' ? filters.department : undefined,
        semester: filters.semester !== 'All' ? filters.semester : undefined,
        resourceType:
          filters.resourceType !== 'All' ? filters.resourceType : undefined,
        sort: filters.sort,
      };

      const data = await resourceService.getResources(params);
      if (data.success) {
        setResources(data.resources || []);
        setPagination({
          page: data.currentPage,
          totalPages: data.totalPages,
          totalCount: data.totalCount,
        });
      }
    } catch (err) {
      console.warn('Error fetching resources:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResources(1);
  }, [filters]);

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    // Sync with URL query params
    const updated = {};
    if (newFilters.search) updated.q = newFilters.search;
    if (newFilters.department !== 'All') updated.department = newFilters.department;
    if (newFilters.semester !== 'All') updated.semester = newFilters.semester;
    if (newFilters.resourceType !== 'All') updated.type = newFilters.resourceType;
    if (newFilters.sort !== 'latest') updated.sort = newFilters.sort;
    setSearchParams(updated);
  };

  const handleResetFilters = () => {
    setFilters({
      search: '',
      department: 'All',
      semester: 'All',
      resourceType: 'All',
      sort: 'latest',
    });
    setSearchParams({});
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      fetchResources(newPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Academic Resource Catalog
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Browse verified study materials, lecture slides, question papers, and lab manuals
          </p>
        </div>
        <div className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-brand-50 text-brand-700 border border-brand-200 self-start md:self-auto">
          {pagination.totalCount} Materials Available
        </div>
      </div>

      {/* Quick Search */}
      <div className="max-w-3xl">
        <SearchBar
          value={filters.search}
          onChange={(val) => handleFilterChange({ ...filters, search: val })}
          placeholder="Filter by subject or topic keywords..."
        />
      </div>

      {/* Faceted Filters */}
      <FilterBar
        filters={filters}
        onChange={handleFilterChange}
        onReset={handleResetFilters}
      />

      {/* Resources Content Grid */}
      {loading ? (
        <LoadingSpinner text="Searching academic resources..." />
      ) : resources.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {resources.map((resource) => (
              <ResourceCard key={resource._id} resource={resource} />
            ))}
          </div>

          {/* Pagination Controls */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-8">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="flex items-center gap-1 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 transition"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Prev</span>
              </button>

              <span className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 rounded-xl">
                Page {pagination.page} of {pagination.totalPages}
              </span>

              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.totalPages}
                className="flex items-center gap-1 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 transition"
              >
                <span>Next</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </>
      ) : (
        <EmptyState
          title="No resources matched your criteria"
          description="Try broadening your department, semester, or keyword filters."
          actionText="Reset All Filters"
          onAction={handleResetFilters}
        />
      )}
    </div>
  );
};

export default BrowseResourcesPage;

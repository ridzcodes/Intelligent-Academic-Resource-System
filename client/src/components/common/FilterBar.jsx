import React from 'react';
import { Filter, RotateCcw } from 'lucide-react';
import { DEPARTMENTS, RESOURCE_TYPES, SEMESTERS } from '../../utils/constants';

const FilterBar = ({
  filters,
  onChange,
  onReset,
  showDepartment = true,
  showSemester = true,
  showType = true,
  showSort = true,
}) => {
  const handleChange = (key, value) => {
    onChange({ ...filters, [key]: value });
  };

  const hasActiveFilters =
    (filters.department && filters.department !== 'All') ||
    (filters.semester && filters.semester !== 'All') ||
    (filters.resourceType && filters.resourceType !== 'All') ||
    (filters.sort && filters.sort !== 'latest');

  return (
    <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm mb-6">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2 text-slate-700 font-semibold text-sm">
          <Filter className="w-4 h-4 text-brand-600" />
          <span>Filter Resources</span>
        </div>
        {hasActiveFilters && (
          <button
            onClick={onReset}
            className="flex items-center gap-1.5 text-xs text-brand-600 hover:text-brand-800 font-medium px-2.5 py-1 rounded-lg hover:bg-brand-50 transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Filters
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-3">
        {/* Department Filter */}
        {showDepartment && (
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">
              Department
            </label>
            <select
              value={filters.department || 'All'}
              onChange={(e) => handleChange('department', e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-xl p-2.5 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition"
            >
              <option value="All">All Departments</option>
              {DEPARTMENTS.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Semester Filter */}
        {showSemester && (
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">
              Semester
            </label>
            <select
              value={filters.semester || 'All'}
              onChange={(e) => handleChange('semester', e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-xl p-2.5 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition"
            >
              <option value="All">All Semesters</option>
              {SEMESTERS.map((sem) => (
                <option key={sem} value={sem}>
                  Semester {sem}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Resource Type Filter */}
        {showType && (
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">
              Resource Type
            </label>
            <select
              value={filters.resourceType || 'All'}
              onChange={(e) => handleChange('resourceType', e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-xl p-2.5 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition"
            >
              <option value="All">All Types</option>
              {RESOURCE_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Sort Filter */}
        {showSort && (
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">
              Sort By
            </label>
            <select
              value={filters.sort || 'latest'}
              onChange={(e) => handleChange('sort', e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-xl p-2.5 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition"
            >
              <option value="latest">Newest Uploads</option>
              <option value="popular">Most Downloaded</option>
              <option value="views">Most Viewed</option>
              <option value="oldest">Oldest First</option>
              <option value="title">Title (A-Z)</option>
            </select>
          </div>
        )}
      </div>
    </div>
  );
};

export default FilterBar;

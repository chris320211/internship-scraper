import { Search, SlidersHorizontal, X } from 'lucide-react';
import { JOB_TYPES } from '../lib/jobTypes';

interface SearchFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedJobTypes: string[];
  onJobTypeToggle: (type: string) => void;
  selectedYears: string[];
  onYearToggle: (year: string) => void;
  showRemoteOnly: boolean;
  onRemoteOnlyToggle: () => void;
  showActiveFilters: boolean;
  onToggleFilters: () => void;
}

const CLASS_YEARS = ['Freshman', 'Sophomore', 'Junior', 'Senior', 'Graduate'];

export default function SearchFilters({
  searchQuery,
  onSearchChange,
  selectedJobTypes,
  onJobTypeToggle,
  selectedYears,
  onYearToggle,
  showRemoteOnly,
  onRemoteOnlyToggle,
  showActiveFilters,
  onToggleFilters,
}: SearchFiltersProps) {
  const activeFilterCount =
    selectedJobTypes.length + selectedYears.length + (showRemoteOnly ? 1 : 0);

  return (
    <div className="bg-white rounded-xl shadow-md p-6 space-y-4">
      <div className="flex items-center gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search by company, position, or keyword..."
            className="w-full pl-10 pr-4 py-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900 placeholder-slate-400"
          />
        </div>
        <button
          onClick={onToggleFilters}
          className={`flex items-center gap-2 px-4 py-3 rounded-lg font-medium transition-all ${
            showActiveFilters
              ? 'bg-blue-600 text-white'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <SlidersHorizontal className="w-5 h-5" />
          <span className="hidden sm:inline">Filters</span>
          {activeFilterCount > 0 && (
            <span className="bg-white text-blue-600 px-2 py-0.5 rounded-full text-xs font-bold">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {showActiveFilters && (
        <div className="pt-4 border-t border-slate-200 space-y-4 animate-in slide-in-from-top-2">
          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-2">
              Job Type
            </label>
            <div className="flex flex-wrap gap-2">
              {JOB_TYPES.map((type) => (
                <button
                  key={type}
                  onClick={() => onJobTypeToggle(type)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    selectedJobTypes.includes(type)
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-2">
              Eligible Class Year
            </label>
            <div className="flex flex-wrap gap-2">
              {CLASS_YEARS.map((year) => (
                <button
                  key={year}
                  onClick={() => onYearToggle(year)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    selectedYears.includes(year)
                      ? 'bg-green-600 text-white shadow-md'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {year}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showRemoteOnly}
                onChange={onRemoteOnlyToggle}
                className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-slate-700">Remote only</span>
            </label>

            {activeFilterCount > 0 && (
              <button
                onClick={() => {
                  selectedJobTypes.forEach((type) => onJobTypeToggle(type));
                  selectedYears.forEach((year) => onYearToggle(year));
                  if (showRemoteOnly) onRemoteOnlyToggle();
                }}
                className="text-sm text-slate-600 hover:text-slate-900 font-medium flex items-center gap-1"
              >
                <X className="w-4 h-4" />
                Clear all
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

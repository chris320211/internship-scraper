import { useState, useEffect, useRef, useCallback } from 'react';
import { Bookmark, RefreshCw, Sparkles, AlertCircle, LogOut } from 'lucide-react';
import PromptSetup from './PromptSetup';
import InternshipCard from './InternshipCard';
import SearchFilters from './SearchFilters';
import { Internship } from '../lib/mockData';
import { localStorageDB } from '../lib/localStorage';
import { api } from '../lib/api';
import { JOB_TYPE_KEYWORDS } from '../lib/jobTypes';
import { useAuth } from '../contexts/AuthContext';

const ITEMS_PER_PAGE = 12; // Show 12 internships at a time (4 rows of 3)

function InternshipSearch() {
  const { user, logout } = useAuth();
  const [showSetup, setShowSetup] = useState(true);
  const [userPrompt, setUserPrompt] = useState('');
  const [internships, setInternships] = useState<Internship[]>([]);
  const [filteredInternships, setFilteredInternships] = useState<Internship[]>([]);
  const [displayedCount, setDisplayedCount] = useState(ITEMS_PER_PAGE);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [sessionId] = useState(() => `session_${Date.now()}_${Math.random()}`);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedJobTypes, setSelectedJobTypes] = useState<string[]>([]);
  const [selectedYears, setSelectedYears] = useState<string[]>([]);
  const [showRemoteOnly, setShowRemoteOnly] = useState(false);
  const [showActiveFilters, setShowActiveFilters] = useState(false);
  const [showSavedOnly, setShowSavedOnly] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!showSetup) {
      fetchInternships();
      fetchSavedInternships();
    }
  }, [showSetup]);

  useEffect(() => {
    applyFilters();
    setDisplayedCount(ITEMS_PER_PAGE); // Reset to first page when filters change
  }, [internships, searchQuery, selectedJobTypes, selectedYears, showRemoteOnly, showSavedOnly, savedIds]);

  const fetchInternships = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.fetchInternships();
      setInternships(data);
    } catch (error) {
      console.error('Error fetching internships:', error);
      setError('Failed to load internships. Please check if the backend server is running.');
    } finally {
      setLoading(false);
    }
  };

  const fetchSavedInternships = async () => {
    if (!user) return;

    try {
      const savedInternshipIds = await api.getSavedInternships(user.id);
      setSavedIds(new Set(savedInternshipIds));
    } catch (error) {
      console.error('Error fetching saved internships:', error);
    }
  };

  const parsePromptForFilters = (prompt: string) => {
    const lowerPrompt = prompt.toLowerCase();

    const jobTypes = new Set<string>();

    Object.entries(JOB_TYPE_KEYWORDS).forEach(([jobType, keywords]) => {
      const matches = keywords.some((keyword) => {
        if (keyword instanceof RegExp) {
          return keyword.test(prompt);
        }
        return lowerPrompt.includes(keyword.toLowerCase());
      });

      if (matches) {
        jobTypes.add(jobType);
      }
    });

    const years = [];
    if (lowerPrompt.includes('freshman') || lowerPrompt.includes('freshmen')) {
      years.push('Freshman');
    }
    if (lowerPrompt.includes('sophomore')) {
      years.push('Sophomore');
    }
    if (lowerPrompt.includes('junior')) {
      years.push('Junior');
    }
    if (lowerPrompt.includes('senior')) {
      years.push('Senior');
    }
    if (lowerPrompt.includes('graduate') || lowerPrompt.includes('grad student')) {
      years.push('Graduate');
    }

    const remote = lowerPrompt.includes('remote');

    return { jobTypes: Array.from(jobTypes), years, remote };
  };

  const handlePromptComplete = (prompt: string) => {
    setUserPrompt(prompt);

    const filters = parsePromptForFilters(prompt);
    setSelectedJobTypes(filters.jobTypes);
    setSelectedYears(filters.years);
    setShowRemoteOnly(filters.remote);
    setSearchQuery(prompt);

    try {
      localStorageDB.saveUserPreferences({
        session_id: sessionId,
        preferred_job_types: filters.jobTypes,
        eligible_year: filters.years[0] || null,
        preferred_locations: filters.remote ? ['Remote'] : [],
        remote_only: filters.remote,
        saved_searches: [{ prompt, timestamp: new Date().toISOString() }],
      });
    } catch (error) {
      console.error('Error saving preferences:', error);
    }

    setShowSetup(false);
  };

  const toggleSaveInternship = async (internshipId: string) => {
    if (!user) return;

    const isSaved = savedIds.has(internshipId);

    try {
      if (isSaved) {
        await api.unsaveInternship(user.id, internshipId);
        setSavedIds((prev) => {
          const newSet = new Set(prev);
          newSet.delete(internshipId);
          return newSet;
        });
      } else {
        await api.saveInternship(user.id, internshipId);
        setSavedIds((prev) => new Set([...prev, internshipId]));
      }
    } catch (error) {
      console.error('Error toggling save:', error);
    }
  };

  const applyFilters = () => {
    let filtered = [...internships];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (internship) =>
          internship.company_name.toLowerCase().includes(query) ||
          internship.position_title.toLowerCase().includes(query) ||
          internship.job_type.toLowerCase().includes(query)
      );
    }

    if (selectedJobTypes.length > 0) {
      filtered = filtered.filter((internship) =>
        selectedJobTypes.includes(internship.job_type)
      );
    }

    if (selectedYears.length > 0) {
      filtered = filtered.filter((internship) =>
        internship.eligible_years.some((year) => selectedYears.includes(year))
      );
    }

    if (showRemoteOnly) {
      filtered = filtered.filter((internship) =>
        internship.location.toLowerCase().includes('remote')
      );
    }

    if (showSavedOnly) {
      filtered = filtered.filter((internship) => savedIds.has(internship.id));
    }

    setFilteredInternships(filtered);
  };

  const toggleJobType = (type: string) => {
    setSelectedJobTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const toggleYear = (year: string) => {
    setSelectedYears((prev) =>
      prev.includes(year) ? prev.filter((y) => y !== year) : [...prev, year]
    );
  };

  const handleNewSearch = () => {
    setShowSetup(true);
    setSearchQuery('');
    setSelectedJobTypes([]);
    setSelectedYears([]);
    setShowRemoteOnly(false);
    setShowSavedOnly(false);
    setDisplayedCount(ITEMS_PER_PAGE);
  };

  // Infinite scroll observer
  const observer = useRef<IntersectionObserver | null>(null);

  const lastInternshipRef = useCallback((node: HTMLDivElement | null) => {
    if (loading) return;
    if (observer.current) observer.current.disconnect();

    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && displayedCount < filteredInternships.length) {
        setDisplayedCount(prev => Math.min(prev + ITEMS_PER_PAGE, filteredInternships.length));
      }
    });

    if (node) observer.current.observe(node);
  }, [loading, displayedCount, filteredInternships.length]);

  const displayedInternships = filteredInternships.slice(0, displayedCount);
  const hasMore = displayedCount < filteredInternships.length;

  if (showSetup) {
    return <PromptSetup onComplete={handlePromptComplete} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-600 rounded-xl shadow-md">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-900">Internship Finder</h1>
                {userPrompt && (
                  <p className="text-sm text-slate-500 italic mt-0.5">"{userPrompt}"</p>
                )}
              </div>
            </div>
            <p className="text-slate-600">
              Showing <span className="font-semibold text-blue-600">{displayedInternships.length}</span> of{' '}
              <span className="font-semibold">{filteredInternships.length}</span> opportunities
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowSavedOnly(!showSavedOnly)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                showSavedOnly
                  ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                  : 'bg-white text-slate-700 hover:bg-slate-100 shadow-md'
              }`}
            >
              <Bookmark className={`w-5 h-5 ${showSavedOnly ? 'fill-current' : ''}`} />
              <span className="hidden sm:inline">Saved</span>
              {savedIds.size > 0 && (
                <span className="bg-yellow-600 text-white px-2 py-0.5 rounded-full text-xs font-bold">
                  {savedIds.size}
                </span>
              )}
            </button>
            <button
              onClick={handleNewSearch}
              className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg font-medium text-slate-700 hover:bg-slate-100 transition-all shadow-md"
            >
              <RefreshCw className="w-5 h-5" />
              <span className="hidden sm:inline">New Search</span>
            </button>
            <button
              onClick={logout}
              className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg font-medium text-slate-700 hover:bg-slate-100 transition-all shadow-md"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>

        <div className="mb-6">
          <SearchFilters
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            selectedJobTypes={selectedJobTypes}
            onJobTypeToggle={toggleJobType}
            selectedYears={selectedYears}
            onYearToggle={toggleYear}
            showRemoteOnly={showRemoteOnly}
            onRemoteOnlyToggle={() => setShowRemoteOnly(!showRemoteOnly)}
            showActiveFilters={showActiveFilters}
            onToggleFilters={() => setShowActiveFilters(!showActiveFilters)}
          />
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
              <div>
                <p className="text-red-800 font-medium">Error loading internships</p>
                <p className="text-red-600 text-sm">{error}</p>
                <button
                  onClick={fetchInternships}
                  className="mt-2 text-sm text-red-700 hover:text-red-900 underline"
                >
                  Try again
                </button>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
          </div>
        ) : filteredInternships.length === 0 ? (
          <div className="text-center py-20">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-200 rounded-full mb-4">
              <Bookmark className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-xl font-semibold text-slate-900 mb-2">No internships found</h3>
            <p className="text-slate-600 mb-4">Try adjusting your filters or search query</p>
            <button
              onClick={handleNewSearch}
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-all shadow-md hover:shadow-lg"
            >
              <RefreshCw className="w-5 h-5" />
              Start New Search
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {displayedInternships.map((internship, index) => {
                // Attach observer to the 3rd-to-last item to trigger loading before reaching the end
                if (index === displayedInternships.length - 3) {
                  return (
                    <div key={internship.id} ref={lastInternshipRef}>
                      <InternshipCard
                        internship={internship}
                        isSaved={savedIds.has(internship.id)}
                        onToggleSave={toggleSaveInternship}
                      />
                    </div>
                  );
                }
                return (
                  <InternshipCard
                    key={internship.id}
                    internship={internship}
                    isSaved={savedIds.has(internship.id)}
                    onToggleSave={toggleSaveInternship}
                  />
                );
              })}
            </div>

            {hasMore && (
              <div className="mt-8 flex justify-center">
                <div className="animate-pulse flex items-center gap-2 text-slate-600">
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-600 border-t-transparent"></div>
                  <span className="text-sm">Loading more...</span>
                </div>
              </div>
            )}

            {!hasMore && filteredInternships.length > ITEMS_PER_PAGE && (
              <div className="mt-8 text-center">
                <p className="text-sm text-slate-600">
                  You've reached the end! Showing all {filteredInternships.length} internships.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default InternshipSearch;

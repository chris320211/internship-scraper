import { useState, useEffect } from 'react';
import { Bookmark, RefreshCw, Sparkles } from 'lucide-react';
import PromptSetup from './components/PromptSetup';
import InternshipCard from './components/InternshipCard';
import SearchFilters from './components/SearchFilters';
import { supabase, Internship } from './lib/supabase';

function App() {
  const [showSetup, setShowSetup] = useState(true);
  const [userPrompt, setUserPrompt] = useState('');
  const [internships, setInternships] = useState<Internship[]>([]);
  const [filteredInternships, setFilteredInternships] = useState<Internship[]>([]);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [sessionId] = useState(() => `session_${Date.now()}_${Math.random()}`);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedJobTypes, setSelectedJobTypes] = useState<string[]>([]);
  const [selectedYears, setSelectedYears] = useState<string[]>([]);
  const [showRemoteOnly, setShowRemoteOnly] = useState(false);
  const [showActiveFilters, setShowActiveFilters] = useState(false);
  const [showSavedOnly, setShowSavedOnly] = useState(false);

  useEffect(() => {
    if (!showSetup) {
      fetchInternships();
      fetchSavedInternships();
    }
  }, [showSetup]);

  useEffect(() => {
    applyFilters();
  }, [internships, searchQuery, selectedJobTypes, selectedYears, showRemoteOnly, showSavedOnly, savedIds]);

  const fetchInternships = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('internships')
        .select('*')
        .eq('is_active', true)
        .order('posted_date', { ascending: false });

      if (error) throw error;
      setInternships(data || []);
    } catch (error) {
      console.error('Error fetching internships:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSavedInternships = async () => {
    try {
      const { data, error } = await supabase
        .from('saved_internships')
        .select('internship_id')
        .eq('session_id', sessionId);

      if (error) throw error;
      const ids = new Set(data?.map((item) => item.internship_id) || []);
      setSavedIds(ids);
    } catch (error) {
      console.error('Error fetching saved internships:', error);
    }
  };

  const parsePromptForFilters = (prompt: string) => {
    const lowerPrompt = prompt.toLowerCase();

    const jobTypes = [];
    if (lowerPrompt.includes('swe') || lowerPrompt.includes('software engineering')) {
      jobTypes.push('Software Engineering');
    }
    if (lowerPrompt.includes('data science')) {
      jobTypes.push('Data Science');
    }
    if (lowerPrompt.includes('machine learning') || lowerPrompt.includes('ml')) {
      jobTypes.push('Machine Learning');
    }
    if (lowerPrompt.includes('product management') || lowerPrompt.includes('pm')) {
      jobTypes.push('Product Management');
    }
    if (lowerPrompt.includes('mobile')) {
      jobTypes.push('Mobile Development');
    }
    if (lowerPrompt.includes('security')) {
      jobTypes.push('Security Engineering');
    }
    if (lowerPrompt.includes('devops')) {
      jobTypes.push('DevOps');
    }
    if (lowerPrompt.includes('design') || lowerPrompt.includes('ui') || lowerPrompt.includes('ux')) {
      jobTypes.push('UI/UX Design');
    }

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

    return { jobTypes, years, remote };
  };

  const handlePromptComplete = async (prompt: string) => {
    setUserPrompt(prompt);

    const filters = parsePromptForFilters(prompt);
    setSelectedJobTypes(filters.jobTypes);
    setSelectedYears(filters.years);
    setShowRemoteOnly(filters.remote);
    setSearchQuery(prompt);

    try {
      await supabase.from('user_preferences').insert({
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
    const isSaved = savedIds.has(internshipId);

    try {
      if (isSaved) {
        const { error } = await supabase
          .from('saved_internships')
          .delete()
          .eq('session_id', sessionId)
          .eq('internship_id', internshipId);

        if (error) throw error;

        setSavedIds((prev) => {
          const newSet = new Set(prev);
          newSet.delete(internshipId);
          return newSet;
        });
      } else {
        const { error } = await supabase.from('saved_internships').insert({
          session_id: sessionId,
          internship_id: internshipId,
          status: 'saved',
        });

        if (error) throw error;

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
          internship.description.toLowerCase().includes(query) ||
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
  };

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
              {filteredInternships.length} opportunities matching your search
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredInternships.map((internship) => (
              <InternshipCard
                key={internship.id}
                internship={internship}
                isSaved={savedIds.has(internship.id)}
                onToggleSave={toggleSaveInternship}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;

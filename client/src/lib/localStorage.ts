import { api } from './api';

interface SavedInternship {
  internship_id: string;
  saved_at: string;
}

export interface UserPreferences {
  session_id: string;
  preferred_job_types: string[];
  eligible_year: string | null;
  preferred_locations: string[];
  remote_only: boolean;
  saved_searches: Array<{ prompt: string; timestamp: string }>;
}

const STORAGE_KEYS = {
  SAVED_INTERNSHIPS: 'internship_scraper_saved',
  USER_PREFERENCES: 'internship_scraper_preferences',
};

export const localStorageDB = {
  // Saved internships - keeping localStorage only for now since it's tied to user auth
  getSavedInternships: (sessionId: string): string[] => {
    const saved = localStorage.getItem(STORAGE_KEYS.SAVED_INTERNSHIPS);
    if (!saved) return [];
    const allSaved: SavedInternship[] = JSON.parse(saved);
    return allSaved.map(item => item.internship_id);
  },

  saveInternship: (sessionId: string, internshipId: string): void => {
    const saved = localStorage.getItem(STORAGE_KEYS.SAVED_INTERNSHIPS);
    const allSaved: SavedInternship[] = saved ? JSON.parse(saved) : [];

    if (!allSaved.find(item => item.internship_id === internshipId)) {
      allSaved.push({
        internship_id: internshipId,
        saved_at: new Date().toISOString(),
      });
      localStorage.setItem(STORAGE_KEYS.SAVED_INTERNSHIPS, JSON.stringify(allSaved));
    }
  },

  unsaveInternship: (sessionId: string, internshipId: string): void => {
    const saved = localStorage.getItem(STORAGE_KEYS.SAVED_INTERNSHIPS);
    if (!saved) return;

    const allSaved: SavedInternship[] = JSON.parse(saved);
    const filtered = allSaved.filter(item => item.internship_id !== internshipId);
    localStorage.setItem(STORAGE_KEYS.SAVED_INTERNSHIPS, JSON.stringify(filtered));
  },

  // User preferences - NOW SAVES TO SUPABASE VIA API!
  saveUserPreferences: async (preferences: UserPreferences): Promise<void> => {
    try {
      // Save to backend/Supabase
      await api.saveUserPreferences(preferences.session_id, {
        preferredJobTypes: preferences.preferred_job_types,
        eligibleYear: preferences.eligible_year,
        preferredLocations: preferences.preferred_locations,
        remoteOnly: preferences.remote_only,
        savedSearches: preferences.saved_searches,
      });

      // Also save to localStorage as backup
      localStorage.setItem(STORAGE_KEYS.USER_PREFERENCES, JSON.stringify(preferences));
    } catch (error) {
      console.error('Failed to save preferences to backend, using localStorage only:', error);
      // Fallback to localStorage only
      localStorage.setItem(STORAGE_KEYS.USER_PREFERENCES, JSON.stringify(preferences));
    }
  },

  getUserPreferences: async (sessionId: string): Promise<UserPreferences | null> => {
    try {
      // Try to get from backend/Supabase first
      const serverPrefs = await api.getUserPreferences(sessionId);

      if (serverPrefs) {
        const prefs: UserPreferences = {
          session_id: serverPrefs.session_id,
          preferred_job_types: serverPrefs.preferred_job_types || [],
          eligible_year: serverPrefs.eligible_year,
          preferred_locations: serverPrefs.preferred_locations || [],
          remote_only: serverPrefs.remote_only || false,
          saved_searches: serverPrefs.saved_searches || [],
        };

        // Update localStorage with server data
        localStorage.setItem(STORAGE_KEYS.USER_PREFERENCES, JSON.stringify(prefs));
        return prefs;
      }
    } catch (error) {
      console.error('Failed to fetch preferences from backend, using localStorage:', error);
    }

    // Fallback to localStorage
    const prefs = localStorage.getItem(STORAGE_KEYS.USER_PREFERENCES);
    return prefs ? JSON.parse(prefs) : null;
  },
};

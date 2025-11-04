import { Internship } from './mockData';

interface SavedInternship {
  internship_id: string;
  saved_at: string;
}

interface UserPreferences {
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
  // Saved internships
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

  // User preferences
  saveUserPreferences: (preferences: UserPreferences): void => {
    localStorage.setItem(STORAGE_KEYS.USER_PREFERENCES, JSON.stringify(preferences));
  },

  getUserPreferences: (): UserPreferences | null => {
    const prefs = localStorage.getItem(STORAGE_KEYS.USER_PREFERENCES);
    return prefs ? JSON.parse(prefs) : null;
  },
};

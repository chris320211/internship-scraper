import { Internship } from './mockData';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export interface FetchInternshipsParams {
  query?: string;
  jobTypes?: string[];
  years?: string[];
  remoteOnly?: boolean;
}

export const api = {
  /**
   * Fetch internships from the backend API
   */
  async fetchInternships(params: FetchInternshipsParams = {}): Promise<Internship[]> {
    const queryParams = new URLSearchParams();

    if (params.query) {
      queryParams.append('q', params.query);
    }
    if (params.jobTypes && params.jobTypes.length > 0) {
      queryParams.append('jobTypes', params.jobTypes.join(','));
    }
    if (params.years && params.years.length > 0) {
      queryParams.append('years', params.years.join(','));
    }
    if (params.remoteOnly) {
      queryParams.append('remoteOnly', 'true');
    }

    const url = `${API_BASE_URL}/api/internships${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

    try {
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const data = await response.json();
      return data.internships || [];
    } catch (error) {
      console.error('Error fetching internships from API:', error);
      throw error;
    }
  },

  /**
   * Refresh internships (force backend to refetch from Greenhouse)
   */
  async refreshInternships(): Promise<{ total: number }> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/internships/refresh`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error(`Refresh failed: ${response.status}`);
      }

      const data = await response.json();
      return { total: data.total };
    } catch (error) {
      console.error('Error refreshing internships:', error);
      throw error;
    }
  },

  /**
   * Check API health
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/health`);
      return response.ok;
    } catch (error) {
      return false;
    }
  },
};

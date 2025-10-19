import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface Internship {
  id: string;
  company_name: string;
  position_title: string;
  location: string;
  description: string;
  requirements: string[];
  eligible_years: string[];
  application_deadline: string | null;
  application_url: string;
  job_type: string;
  pay_range: string | null;
  duration: string | null;
  is_active: boolean;
  posted_date: string;
  created_at: string;
  updated_at: string;
}

export interface UserPreferences {
  id?: string;
  user_id?: string;
  session_id?: string;
  preferred_job_types: string[];
  eligible_year: string | null;
  preferred_locations: string[];
  remote_only: boolean;
  saved_searches: any[];
  created_at?: string;
  updated_at?: string;
}

export interface SavedInternship {
  id?: string;
  user_id?: string;
  session_id?: string;
  internship_id: string;
  notes: string | null;
  status: string;
  created_at?: string;
}

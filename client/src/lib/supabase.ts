import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Missing Supabase environment variables - some features may not work')
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '')

// Types
export interface UserPreferences {
  id?: number
  session_id: string
  preferred_job_types: string[]
  eligible_year: string | null
  preferred_locations: string[]
  remote_only: boolean
  saved_searches: Array<{ prompt: string; timestamp: string }>
  has_completed_onboarding: boolean
  created_at?: string
  updated_at?: string
}

export interface SavedInternship {
  id?: number
  session_id: string
  internship_id: string
  status: 'saved' | 'applied' | 'interviewing' | 'rejected' | 'accepted'
  notes?: string
  saved_at?: string
}

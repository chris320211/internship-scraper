-- Clean Supabase Schema for Internship Scraper
-- This drops everything and recreates from scratch

-- Drop tables in correct order (child tables first due to foreign keys)
DROP TABLE IF EXISTS saved_internships CASCADE;
DROP TABLE IF EXISTS user_profiles CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS scraping_logs CASCADE;
DROP TABLE IF EXISTS source_polling_metadata CASCADE;
DROP TABLE IF EXISTS internships CASCADE;

-- Drop function
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- Now create everything fresh

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create internships table
CREATE TABLE internships (
    id TEXT PRIMARY KEY,
    company_name TEXT NOT NULL,
    position_title TEXT NOT NULL,
    job_type TEXT NOT NULL,
    location TEXT NOT NULL,
    eligible_years TEXT[] DEFAULT '{}',
    student_status TEXT DEFAULT 'any',
    visa_requirements TEXT DEFAULT 'unknown',
    degree_level TEXT[] DEFAULT '{any}',
    major_requirements TEXT[] DEFAULT '{any}',
    posted_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    application_deadline TIMESTAMP WITH TIME ZONE,
    application_url TEXT,
    is_active BOOLEAN DEFAULT true,
    source TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_internships_company ON internships(company_name);
CREATE INDEX idx_internships_job_type ON internships(job_type);
CREATE INDEX idx_internships_location ON internships(location);
CREATE INDEX idx_internships_source ON internships(source);
CREATE INDEX idx_internships_active ON internships(is_active);
CREATE INDEX idx_internships_posted_date ON internships(posted_date DESC);
CREATE INDEX idx_internships_student_status ON internships(student_status);
CREATE INDEX idx_internships_visa_requirements ON internships(visa_requirements);

-- Trigger for internships
CREATE TRIGGER update_internships_updated_at
    BEFORE UPDATE ON internships
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);

CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create user profiles table
CREATE TABLE user_profiles (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    college_year TEXT,
    career_interests TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);

CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create saved internships table
CREATE TABLE saved_internships (
    id SERIAL PRIMARY KEY,
    session_id TEXT NOT NULL DEFAULT '',
    internship_id TEXT REFERENCES internships(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'saved',
    saved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    notes TEXT,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(session_id, internship_id)
);

CREATE INDEX idx_saved_session ON saved_internships(session_id);
CREATE INDEX idx_saved_user ON saved_internships(user_id);

-- Create session-based user preferences table
CREATE TABLE user_preferences_session (
    id SERIAL PRIMARY KEY,
    session_id TEXT UNIQUE NOT NULL,
    preferred_job_types TEXT[] DEFAULT '{}',
    eligible_year TEXT,
    preferred_locations TEXT[] DEFAULT '{}',
    remote_only BOOLEAN DEFAULT false,
    saved_searches JSONB DEFAULT '[]'::jsonb,
    has_completed_onboarding BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_preferences_session_id ON user_preferences_session(session_id);

CREATE TRIGGER update_user_preferences_session_updated_at
    BEFORE UPDATE ON user_preferences_session
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create scraping logs table
CREATE TABLE scraping_logs (
    id SERIAL PRIMARY KEY,
    source TEXT NOT NULL,
    total_jobs_found INTEGER DEFAULT 0,
    internships_found INTEGER DEFAULT 0,
    new_internships INTEGER DEFAULT 0,
    updated_internships INTEGER DEFAULT 0,
    status TEXT DEFAULT 'success',
    error_message TEXT,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_scraping_logs_source ON scraping_logs(source);
CREATE INDEX idx_scraping_logs_started ON scraping_logs(started_at DESC);

-- Create source polling metadata table
CREATE TABLE source_polling_metadata (
    id SERIAL PRIMARY KEY,
    source_url TEXT NOT NULL UNIQUE,
    source_name TEXT NOT NULL,
    etag TEXT,
    last_modified TEXT,
    last_poll_at TIMESTAMP WITH TIME ZONE,
    last_change_at TIMESTAMP WITH TIME ZONE,
    consecutive_unchanged_polls INTEGER DEFAULT 0,
    total_polls INTEGER DEFAULT 0,
    total_changes INTEGER DEFAULT 0,
    current_poll_interval_minutes INTEGER DEFAULT 30,
    min_poll_interval_minutes INTEGER DEFAULT 5,
    max_poll_interval_minutes INTEGER DEFAULT 360,
    last_status_code INTEGER,
    last_response_time_ms INTEGER,
    content_hash TEXT,
    last_job_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_polling_metadata_source_url ON source_polling_metadata(source_url);
CREATE INDEX idx_polling_metadata_last_poll ON source_polling_metadata(last_poll_at);
CREATE INDEX idx_polling_metadata_source_name ON source_polling_metadata(source_name);

CREATE TRIGGER update_source_polling_metadata_updated_at
    BEFORE UPDATE ON source_polling_metadata
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE internships ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_internships ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences_session ENABLE ROW LEVEL SECURITY;

-- RLS Policies (simple - allow everything for now)

-- Internships
CREATE POLICY "Internships are viewable by everyone"
    ON internships FOR SELECT
    USING (true);

CREATE POLICY "Backend can manage internships"
    ON internships FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Backend can update internships"
    ON internships FOR UPDATE
    USING (true);

CREATE POLICY "Backend can delete internships"
    ON internships FOR DELETE
    USING (true);

-- Saved internships
CREATE POLICY "Anyone can view saved internships"
    ON saved_internships FOR SELECT
    USING (true);

CREATE POLICY "Anyone can insert saved internships"
    ON saved_internships FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Anyone can update saved internships"
    ON saved_internships FOR UPDATE
    USING (true);

CREATE POLICY "Anyone can delete saved internships"
    ON saved_internships FOR DELETE
    USING (true);

-- Users
CREATE POLICY "Anyone can view users"
    ON users FOR SELECT
    USING (true);

CREATE POLICY "Anyone can manage users"
    ON users FOR ALL
    USING (true);

-- User profiles
CREATE POLICY "Anyone can view user_profiles"
    ON user_profiles FOR SELECT
    USING (true);

CREATE POLICY "Anyone can manage user_profiles"
    ON user_profiles FOR ALL
    USING (true);

-- User preferences session
CREATE POLICY "Anyone can view preferences"
    ON user_preferences_session FOR SELECT
    USING (true);

CREATE POLICY "Anyone can insert preferences"
    ON user_preferences_session FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Anyone can update preferences"
    ON user_preferences_session FOR UPDATE
    USING (true);

CREATE POLICY "Anyone can delete preferences"
    ON user_preferences_session FOR DELETE
    USING (true);

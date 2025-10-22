-- Database schema for internship scraper

-- Create internships table
CREATE TABLE IF NOT EXISTS internships (
    id TEXT PRIMARY KEY,
    company_name TEXT NOT NULL,
    position_title TEXT NOT NULL,
    job_type TEXT NOT NULL,
    location TEXT NOT NULL,
    eligible_years TEXT[] DEFAULT '{}',
    posted_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    application_deadline TIMESTAMP WITH TIME ZONE,
    application_url TEXT,
    is_active BOOLEAN DEFAULT true,
    source TEXT NOT NULL, -- 'greenhouse', 'levels', 'simplify', etc.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Drop graduation_years column if it exists
ALTER TABLE internships DROP COLUMN IF EXISTS graduation_years;

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_internships_company ON internships(company_name);
CREATE INDEX IF NOT EXISTS idx_internships_job_type ON internships(job_type);
CREATE INDEX IF NOT EXISTS idx_internships_location ON internships(location);
CREATE INDEX IF NOT EXISTS idx_internships_source ON internships(source);
CREATE INDEX IF NOT EXISTS idx_internships_active ON internships(is_active);
CREATE INDEX IF NOT EXISTS idx_internships_posted_date ON internships(posted_date DESC);

-- Create user saved internships table
CREATE TABLE IF NOT EXISTS saved_internships (
    id SERIAL PRIMARY KEY,
    session_id TEXT NOT NULL DEFAULT '',
    internship_id TEXT REFERENCES internships(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'saved',
    saved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    notes TEXT,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(session_id, internship_id)
);

CREATE INDEX IF NOT EXISTS idx_saved_session ON saved_internships(session_id);
CREATE INDEX IF NOT EXISTS idx_saved_user ON saved_internships(user_id);

-- Add unique constraint for user_id and internship_id combination
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'unique_user_internship'
    ) THEN
        ALTER TABLE saved_internships
        ADD CONSTRAINT unique_user_internship UNIQUE (user_id, internship_id);
    END IF;
END$$;

-- Create scraping logs table
CREATE TABLE IF NOT EXISTS scraping_logs (
    id SERIAL PRIMARY KEY,
    source TEXT NOT NULL,
    total_jobs_found INTEGER DEFAULT 0,
    internships_found INTEGER DEFAULT 0,
    new_internships INTEGER DEFAULT 0,
    updated_internships INTEGER DEFAULT 0,
    status TEXT DEFAULT 'success', -- 'success', 'failed', 'partial'
    error_message TEXT,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_scraping_logs_source ON scraping_logs(source);
CREATE INDEX IF NOT EXISTS idx_scraping_logs_started ON scraping_logs(started_at DESC);

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Create user profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    college_year TEXT, -- 'Freshman', 'Sophomore', 'Junior', 'Senior', 'Graduate'
    career_interests TEXT[] DEFAULT '{}', -- Array of career interests
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);

-- Trigger to auto-update updated_at for users
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger to auto-update updated_at for user_profiles
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
DROP TRIGGER IF EXISTS update_internships_updated_at ON internships;
CREATE TRIGGER update_internships_updated_at
    BEFORE UPDATE ON internships
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

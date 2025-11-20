-- Add user preferences table for session-based storage
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS user_preferences_session (
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

-- Enable RLS
ALTER TABLE user_preferences_session ENABLE ROW LEVEL SECURITY;

-- Allow anyone to manage their session preferences
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

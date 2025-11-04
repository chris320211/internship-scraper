-- Clean job titles by removing metadata and redundant information

-- Helper function to clean titles
CREATE OR REPLACE FUNCTION clean_job_title(title TEXT) RETURNS TEXT AS $$
DECLARE
    cleaned TEXT;
    parts TEXT[];
BEGIN
    IF title IS NULL OR LENGTH(title) < 10 THEN
        RETURN title;
    END IF;

    cleaned := title;

    -- For overly long titles, keep only first 1-2 meaningful segments
    IF LENGTH(title) > 100 OR (LENGTH(title) - LENGTH(REPLACE(title, ' - ', ''))) / 3 > 4 THEN
        parts := string_to_array(title, ' - ');
        -- Keep first segment with "intern" or first 2 segments
        IF parts[1] ~* 'intern' THEN
            cleaned := parts[1];
        ELSIF array_length(parts, 1) >= 2 THEN
            cleaned := parts[1] || ' - ' || parts[2];
        ELSE
            cleaned := parts[1];
        END IF;
    END IF;

    -- Remove duration patterns (greedy)
    cleaned := regexp_replace(cleaned, '\s*-\s*\d+\s*-\s*\d+\s*months?\s*.*$', '', 'i');
    cleaned := regexp_replace(cleaned, '\s*-\s*\d+\s*months?\s*.*$', '', 'i');

    -- Remove job codes
    cleaned := regexp_replace(cleaned, '\s*-\s*\d{5,}.*$', '', 'i');

    -- Remove interim intern metadata
    cleaned := regexp_replace(cleaned, '\s*-\s*Interim\s+(Engineering\s+)?Intern\s*.*$', '', 'i');

    -- Remove trailing metadata
    cleaned := regexp_replace(cleaned, '\s*-\s*Systems?\s*$', '', 'i');
    cleaned := regexp_replace(cleaned, '\s*-\s*SW\s*$', '', 'i');
    cleaned := regexp_replace(cleaned, '\s*-\s*Months?\s*$', '', 'i');

    -- Clean up spacing
    cleaned := regexp_replace(cleaned, '\s*-\s*-\s*', ' - ', 'g');
    cleaned := regexp_replace(cleaned, '\s+', ' ', 'g');
    cleaned := trim(both ' -' from cleaned);

    -- If result is too short, return original
    IF LENGTH(cleaned) < 15 AND LENGTH(title) > 30 THEN
        parts := string_to_array(title, ' - ');
        IF array_length(parts, 1) > 2 THEN
            cleaned := parts[1] || ' - ' || parts[2];
        ELSE
            RETURN title;
        END IF;
    END IF;

    IF LENGTH(cleaned) > 5 THEN
        RETURN cleaned;
    ELSE
        RETURN title;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Update all position titles
UPDATE internships
SET position_title = clean_job_title(position_title)
WHERE LENGTH(position_title) > 60
   OR position_title LIKE '%Interim%Intern%'
   OR position_title LIKE '%months%'
   OR position_title ~ '\d{5,}';

-- Report on changes
SELECT
    COUNT(*) as total_cleaned,
    COUNT(DISTINCT company_name) as companies_affected
FROM internships
WHERE LENGTH(position_title) > 60
   OR position_title LIKE '%Interim%Intern%';

-- Drop the helper function (optional, keep it for future use)
-- DROP FUNCTION IF EXISTS clean_job_title(TEXT);

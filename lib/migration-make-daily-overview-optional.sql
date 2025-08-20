-- Migration: Make daily_overview column optional
-- This allows the system to work without generating daily overview summaries

ALTER TABLE daily_summaries 
ALTER COLUMN daily_overview DROP NOT NULL;

-- Update existing records to have empty daily_overview if they don't have one
UPDATE daily_summaries 
SET daily_overview = '' 
WHERE daily_overview IS NULL;

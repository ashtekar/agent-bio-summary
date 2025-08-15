-- Migration: Add relevance_threshold column to search_settings table
-- Run this in Supabase SQL Editor if the column doesn't exist

-- Add the relevance_threshold column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'search_settings' 
        AND column_name = 'relevance_threshold'
    ) THEN
        ALTER TABLE search_settings ADD COLUMN relevance_threshold FLOAT DEFAULT 6.0;
    END IF;
END $$;

-- Update existing records to have the default value
UPDATE search_settings 
SET relevance_threshold = 6.0 
WHERE relevance_threshold IS NULL;

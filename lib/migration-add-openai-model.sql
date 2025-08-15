-- Migration: Add openai_model column to system_settings table
-- Run this in Supabase SQL Editor if the column doesn't exist

-- Add the openai_model column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'system_settings' 
        AND column_name = 'openai_model'
    ) THEN
        ALTER TABLE system_settings ADD COLUMN openai_model TEXT DEFAULT 'gpt-4o-mini';
    END IF;
END $$;

-- Update existing records to have the default value
UPDATE system_settings 
SET openai_model = 'gpt-4o-mini' 
WHERE openai_model IS NULL;

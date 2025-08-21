-- Migration: Add article_ids column to daily_summaries table
-- This enables analytics while maintaining performance with featured_articles

-- Add the new article_ids column
ALTER TABLE daily_summaries 
ADD COLUMN IF NOT EXISTS article_ids UUID[];

-- Add a comment explaining the purpose
COMMENT ON COLUMN daily_summaries.article_ids IS 'Array of article UUIDs used for summarization. Enables analytics while featured_articles maintains performance.';

-- Verify the change
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'daily_summaries' 
AND column_name = 'article_ids';

-- Migration: Add summary_article_ids column to feedback table
-- This enables analytics of which articles were used in summaries that received feedback

-- Add the new summary_article_ids column
ALTER TABLE feedback 
ADD COLUMN IF NOT EXISTS summary_article_ids UUID[];

-- Add a comment explaining the purpose
COMMENT ON COLUMN feedback.summary_article_ids IS 'Array of article UUIDs that were used to generate the summary that received this feedback. Enables analytics of summarization effectiveness.';

-- Verify the change
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'feedback' 
AND column_name = 'summary_article_ids';

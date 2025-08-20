-- Migration: Add 'top10' as a valid feedback_type
-- This allows separate feedback for Top 10 Articles Summary vs other summary types

-- First, drop the existing check constraint
ALTER TABLE feedback 
DROP CONSTRAINT IF EXISTS feedback_feedback_type_check;

-- Add the new check constraint that includes 'top10'
ALTER TABLE feedback 
ADD CONSTRAINT feedback_feedback_type_check 
CHECK (feedback_type IN ('summary', 'article', 'top10'));

-- Verify the change
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'feedback'::regclass 
AND conname = 'feedback_feedback_type_check';

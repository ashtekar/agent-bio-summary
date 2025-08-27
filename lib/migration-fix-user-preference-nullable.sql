-- Migration: Fix user_preference column to be nullable
-- The user_preference should only be set when user makes a choice, not when creating records

-- Make user_preference column nullable
ALTER TABLE feedback_comparisons 
ALTER COLUMN user_preference DROP NOT NULL;

-- Update the check constraint to allow NULL values
ALTER TABLE feedback_comparisons 
DROP CONSTRAINT IF EXISTS feedback_comparisons_user_preference_check;

ALTER TABLE feedback_comparisons 
ADD CONSTRAINT feedback_comparisons_user_preference_check 
CHECK (user_preference IS NULL OR user_preference IN ('A', 'B'));

-- Verify the change
SELECT column_name, is_nullable, data_type 
FROM information_schema.columns 
WHERE table_name = 'feedback_comparisons' 
AND column_name = 'user_preference';

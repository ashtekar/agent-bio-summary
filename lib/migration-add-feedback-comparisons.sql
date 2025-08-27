-- Migration: Add Feedback Comparison System
-- Run this in Supabase SQL Editor

-- Add new columns to system_settings table
ALTER TABLE system_settings 
ADD COLUMN IF NOT EXISTS comparison_model VARCHAR(50) DEFAULT 'gpt-5',
ADD COLUMN IF NOT EXISTS comparison_temperature FLOAT DEFAULT 0.5,
ADD COLUMN IF NOT EXISTS comparison_max_tokens INTEGER DEFAULT 300;

-- Create feedback_comparisons table
CREATE TABLE IF NOT EXISTS feedback_comparisons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL, -- Groups 3 comparisons together
    recipient_id UUID REFERENCES email_recipients(id) ON DELETE CASCADE,
    summary_id UUID REFERENCES daily_summaries(id) ON DELETE CASCADE,
    article_id UUID REFERENCES articles(id) ON DELETE CASCADE,
    
    -- Summary content for comparison
    current_summary TEXT NOT NULL, -- Current model output
    advanced_summary TEXT NOT NULL, -- Advanced model output
    current_model VARCHAR(50) NOT NULL, -- e.g., 'gpt-4o-mini'
    advanced_model VARCHAR(50) NOT NULL, -- e.g., 'gpt-5'
    
    -- User preference
    user_preference VARCHAR(1) NOT NULL CHECK (user_preference IN ('A', 'B')),
    
    -- Metadata
    comparison_order INTEGER NOT NULL, -- 1, 2, or 3
    extraction_method VARCHAR(20) NOT NULL, -- 'extracted' or 'generated'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure one comparison per article per session
    UNIQUE(session_id, article_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_feedback_comparisons_session_id ON feedback_comparisons(session_id);
CREATE INDEX IF NOT EXISTS idx_feedback_comparisons_recipient_id ON feedback_comparisons(recipient_id);
CREATE INDEX IF NOT EXISTS idx_feedback_comparisons_summary_id ON feedback_comparisons(summary_id);
CREATE INDEX IF NOT EXISTS idx_feedback_comparisons_created_at ON feedback_comparisons(created_at);

-- Disable RLS for the new table
ALTER TABLE feedback_comparisons DISABLE ROW LEVEL SECURITY;

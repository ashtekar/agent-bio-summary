-- Extend retention to 30 days for articles and summaries
-- Update cleanup functions
CREATE OR REPLACE FUNCTION cleanup_old_articles()
RETURNS void AS $$
BEGIN
    DELETE FROM articles 
    WHERE created_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION cleanup_old_summaries()
RETURNS void AS $$
BEGIN
    DELETE FROM daily_summaries 
    WHERE created_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- Feedback Table (30-day retention, no auto-cleanup)
CREATE TABLE IF NOT EXISTS feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    recipient_id UUID REFERENCES email_recipients(id) ON DELETE CASCADE,
    summary_id UUID REFERENCES daily_summaries(id) ON DELETE CASCADE,
    article_id UUID REFERENCES articles(id) ON DELETE CASCADE,
    feedback_type TEXT CHECK (feedback_type IN ('summary', 'article')) NOT NULL,
    feedback_value TEXT CHECK (feedback_value IN ('up', 'down')) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

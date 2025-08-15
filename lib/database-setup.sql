-- Database schema for AgentBioSummary
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Email Recipients Table (permanent)
CREATE TABLE IF NOT EXISTS email_recipients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Search Settings Table (permanent)
CREATE TABLE IF NOT EXISTS search_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    time_window_hours INTEGER DEFAULT 24,
    sources TEXT[] DEFAULT ARRAY['pubmed', 'arxiv', 'sciencedaily'],
    keywords TEXT[] DEFAULT ARRAY['synthetic biology', 'biotechnology', 'genetic engineering'],
    max_articles INTEGER DEFAULT 50,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- System Settings Table (permanent)
CREATE TABLE IF NOT EXISTS system_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    schedule_time TEXT DEFAULT '08:00',
    summary_length TEXT DEFAULT 'medium',
    include_images BOOLEAN DEFAULT false,
    openai_model TEXT DEFAULT 'gpt-4o-mini',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Articles Table (2-day retention)
CREATE TABLE IF NOT EXISTS articles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    url TEXT UNIQUE NOT NULL,
    source TEXT NOT NULL,
    published_date TIMESTAMP WITH TIME ZONE,
    relevance_score FLOAT DEFAULT 0.0,
    content TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Daily Summaries Table (7-day retention)
CREATE TABLE IF NOT EXISTS daily_summaries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date DATE UNIQUE NOT NULL,
    daily_overview TEXT NOT NULL,
    top_10_summary TEXT NOT NULL,
    featured_articles TEXT[] NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_articles_created_at ON articles(created_at);
CREATE INDEX IF NOT EXISTS idx_articles_source ON articles(source);
CREATE INDEX IF NOT EXISTS idx_articles_relevance ON articles(relevance_score DESC);
CREATE INDEX IF NOT EXISTS idx_daily_summaries_date ON daily_summaries(date);
CREATE INDEX IF NOT EXISTS idx_email_recipients_email ON email_recipients(email);
CREATE INDEX IF NOT EXISTS idx_email_recipients_active ON email_recipients(is_active);

-- Row Level Security (RLS) - Disable for now since we're using service role
ALTER TABLE email_recipients DISABLE ROW LEVEL SECURITY;
ALTER TABLE search_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE articles DISABLE ROW LEVEL SECURITY;
ALTER TABLE daily_summaries DISABLE ROW LEVEL SECURITY;

-- Cleanup function for old articles (2 days)
CREATE OR REPLACE FUNCTION cleanup_old_articles()
RETURNS void AS $$
BEGIN
    DELETE FROM articles 
    WHERE created_at < NOW() - INTERVAL '2 days';
END;
$$ LANGUAGE plpgsql;

-- Cleanup function for old summaries (7 days)
CREATE OR REPLACE FUNCTION cleanup_old_summaries()
RETURNS void AS $$
BEGIN
    DELETE FROM daily_summaries 
    WHERE created_at < NOW() - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql;

-- Insert default data
INSERT INTO search_settings (time_window_hours, sources, keywords, max_articles)
VALUES (24, ARRAY['pubmed', 'arxiv', 'sciencedaily'], ARRAY['synthetic biology', 'biotechnology', 'genetic engineering'], 50)
ON CONFLICT DO NOTHING;

INSERT INTO system_settings (schedule_time, summary_length, include_images, openai_model)
VALUES ('08:00', 'medium', false, 'gpt-4o-mini')
ON CONFLICT DO NOTHING;

-- Insert default email recipients (replace with your actual emails)
INSERT INTO email_recipients (name, email)
VALUES 
    ('Admin', 'admin@example.com'),
    ('Researcher', 'researcher@example.com')
ON CONFLICT (email) DO NOTHING;

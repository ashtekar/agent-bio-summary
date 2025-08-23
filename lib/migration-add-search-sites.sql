-- Migration: Add search_sites table for configurable search
-- Run this in Supabase SQL Editor

-- Create search_sites table
CREATE TABLE IF NOT EXISTS search_sites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    domain TEXT UNIQUE NOT NULL,
    display_name TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_search_sites_domain ON search_sites(domain);
CREATE INDEX IF NOT EXISTS idx_search_sites_active ON search_sites(is_active);

-- Disable RLS for search_sites table
ALTER TABLE search_sites DISABLE ROW LEVEL SECURITY;

-- Insert default search sites based on current implementation
INSERT INTO search_sites (domain, display_name, is_active) VALUES
    ('pubmed.ncbi.nlm.nih.gov', 'PubMed', true),
    ('arxiv.org', 'arXiv', true),
    ('sciencedaily.com', 'Science Daily', true)
ON CONFLICT (domain) DO NOTHING;

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_search_sites_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_search_sites_updated_at
    BEFORE UPDATE ON search_sites
    FOR EACH ROW
    EXECUTE FUNCTION update_search_sites_updated_at();

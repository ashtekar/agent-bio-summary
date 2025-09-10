-- Migration: Extend Data Retention to 90 Days
-- Description: Update all cleanup functions to use 90-day retention instead of 30 days
-- Date: 2025-01-08

-- Update cleanup function for old articles (90 days)
CREATE OR REPLACE FUNCTION cleanup_old_articles()
RETURNS void AS $$
BEGIN
    DELETE FROM articles 
    WHERE created_at < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql;

-- Update cleanup function for old summaries (90 days)
CREATE OR REPLACE FUNCTION cleanup_old_summaries()
RETURNS void AS $$
BEGIN
    DELETE FROM daily_summaries 
    WHERE created_at < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql;

-- Update cleanup function for expired magic link tokens (keep existing logic)
CREATE OR REPLACE FUNCTION cleanup_expired_magic_tokens()
RETURNS void AS $$
BEGIN
    DELETE FROM magic_link_tokens 
    WHERE expires_at < NOW() OR used_at IS NOT NULL;
END;
$$ LANGUAGE plpgsql;

-- Update cleanup function for expired user sessions (90 days)
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS void AS $$
BEGIN
    DELETE FROM user_sessions 
    WHERE expires_at < NOW() OR created_at < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql;

-- Add cleanup function for old feedback (90 days)
CREATE OR REPLACE FUNCTION cleanup_old_feedback()
RETURNS void AS $$
BEGIN
    DELETE FROM feedback 
    WHERE created_at < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql;

-- Add cleanup function for old feedback comparisons (90 days)
CREATE OR REPLACE FUNCTION cleanup_old_feedback_comparisons()
RETURNS void AS $$
BEGIN
    DELETE FROM feedback_comparisons 
    WHERE created_at < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql;

-- Create a master cleanup function that calls all cleanup functions
CREATE OR REPLACE FUNCTION cleanup_all_old_data()
RETURNS TABLE(
    operation TEXT,
    deleted_count BIGINT
) AS $$
DECLARE
    articles_count BIGINT;
    summaries_count BIGINT;
    magic_tokens_count BIGINT;
    sessions_count BIGINT;
    feedback_count BIGINT;
    comparisons_count BIGINT;
BEGIN
    -- Get counts before deletion
    SELECT COUNT(*) INTO articles_count FROM articles WHERE created_at < NOW() - INTERVAL '90 days';
    SELECT COUNT(*) INTO summaries_count FROM daily_summaries WHERE created_at < NOW() - INTERVAL '90 days';
    SELECT COUNT(*) INTO magic_tokens_count FROM magic_link_tokens WHERE expires_at < NOW() OR used_at IS NOT NULL;
    SELECT COUNT(*) INTO sessions_count FROM user_sessions WHERE expires_at < NOW() OR created_at < NOW() - INTERVAL '90 days';
    SELECT COUNT(*) INTO feedback_count FROM feedback WHERE created_at < NOW() - INTERVAL '90 days';
    SELECT COUNT(*) INTO comparisons_count FROM feedback_comparisons WHERE created_at < NOW() - INTERVAL '90 days';
    
    -- Execute cleanup functions
    PERFORM cleanup_old_articles();
    PERFORM cleanup_old_summaries();
    PERFORM cleanup_expired_magic_tokens();
    PERFORM cleanup_expired_sessions();
    PERFORM cleanup_old_feedback();
    PERFORM cleanup_old_feedback_comparisons();
    
    -- Return results
    RETURN QUERY SELECT 'articles'::TEXT, articles_count;
    RETURN QUERY SELECT 'summaries'::TEXT, summaries_count;
    RETURN QUERY SELECT 'magic_tokens'::TEXT, magic_tokens_count;
    RETURN QUERY SELECT 'sessions'::TEXT, sessions_count;
    RETURN QUERY SELECT 'feedback'::TEXT, feedback_count;
    RETURN QUERY SELECT 'comparisons'::TEXT, comparisons_count;
END;
$$ LANGUAGE plpgsql;

-- Add comments to document the new retention policy
COMMENT ON FUNCTION cleanup_old_articles() IS 'Deletes articles older than 90 days';
COMMENT ON FUNCTION cleanup_old_summaries() IS 'Deletes daily summaries older than 90 days';
COMMENT ON FUNCTION cleanup_expired_magic_tokens() IS 'Deletes expired or used magic link tokens';
COMMENT ON FUNCTION cleanup_expired_sessions() IS 'Deletes expired user sessions or sessions older than 90 days';
COMMENT ON FUNCTION cleanup_old_feedback() IS 'Deletes feedback older than 90 days';
COMMENT ON FUNCTION cleanup_old_feedback_comparisons() IS 'Deletes feedback comparisons older than 90 days';
COMMENT ON FUNCTION cleanup_all_old_data() IS 'Master cleanup function that removes all data older than 90 days';

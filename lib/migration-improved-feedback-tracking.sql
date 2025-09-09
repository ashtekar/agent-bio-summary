-- Migration: Improved Feedback Tracking v1.3.1
-- Description: Add magic link authentication and user session management
-- Date: 2025-09-08

-- Magic Link Tokens Table
CREATE TABLE IF NOT EXISTS magic_link_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT NOT NULL,
    token TEXT UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    feedback_context JSONB -- Store pending feedback if any
);

-- User Sessions Table
CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    recipient_id UUID REFERENCES email_recipients(id) ON DELETE CASCADE,
    session_token TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_magic_link_tokens_token ON magic_link_tokens(token);
CREATE INDEX IF NOT EXISTS idx_magic_link_tokens_email ON magic_link_tokens(email);
CREATE INDEX IF NOT EXISTS idx_magic_link_tokens_expires ON magic_link_tokens(expires_at);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_recipient ON user_sessions(recipient_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires ON user_sessions(expires_at);

-- Cleanup function for expired magic link tokens
CREATE OR REPLACE FUNCTION cleanup_expired_magic_tokens()
RETURNS void AS $$
BEGIN
    DELETE FROM magic_link_tokens 
    WHERE expires_at < NOW() OR used_at IS NOT NULL;
END;
$$ LANGUAGE plpgsql;

-- Cleanup function for expired user sessions
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS void AS $$
BEGIN
    DELETE FROM user_sessions 
    WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Function to create or find recipient by email
CREATE OR REPLACE FUNCTION find_or_create_recipient(user_email TEXT, user_name TEXT DEFAULT NULL)
RETURNS UUID AS $$
DECLARE
    recipient_id UUID;
BEGIN
    -- Try to find existing recipient
    SELECT id INTO recipient_id 
    FROM email_recipients 
    WHERE email = user_email;
    
    -- If not found, create new recipient
    IF recipient_id IS NULL THEN
        INSERT INTO email_recipients (email, name, is_active)
        VALUES (user_email, COALESCE(user_name, 'New User'), true)
        RETURNING id INTO recipient_id;
    END IF;
    
    RETURN recipient_id;
END;
$$ LANGUAGE plpgsql;

-- Function to generate secure session token
CREATE OR REPLACE FUNCTION generate_session_token()
RETURNS TEXT AS $$
BEGIN
    RETURN encode(gen_random_bytes(32), 'hex');
END;
$$ LANGUAGE plpgsql;

-- Function to create user session
CREATE OR REPLACE FUNCTION create_user_session(recipient_uuid UUID, session_duration_hours INTEGER DEFAULT 720)
RETURNS TEXT AS $$
DECLARE
    session_token TEXT;
    expires_at TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Generate secure token
    session_token := generate_session_token();
    
    -- Calculate expiration time (default 30 days)
    expires_at := NOW() + (session_duration_hours || ' hours')::INTERVAL;
    
    -- Insert session
    INSERT INTO user_sessions (recipient_id, session_token, expires_at)
    VALUES (recipient_uuid, session_token, expires_at);
    
    RETURN session_token;
END;
$$ LANGUAGE plpgsql;

-- Function to validate and extend session
CREATE OR REPLACE FUNCTION validate_session(session_tok TEXT)
RETURNS TABLE(recipient_id UUID, is_valid BOOLEAN) AS $$
DECLARE
    session_record RECORD;
BEGIN
    -- Find session
    SELECT us.recipient_id, us.expires_at INTO session_record
    FROM user_sessions us
    WHERE us.session_token = session_tok;
    
    -- Check if session exists and is not expired
    IF session_record.recipient_id IS NOT NULL AND session_record.expires_at > NOW() THEN
        -- Update last activity
        UPDATE user_sessions 
        SET last_activity = NOW()
        WHERE session_token = session_tok;
        
        -- Return valid session
        RETURN QUERY SELECT session_record.recipient_id, true;
    ELSE
        -- Return invalid session
        RETURN QUERY SELECT NULL::UUID, false;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Add feedback_context column to feedback table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'feedback' AND column_name = 'feedback_context'
    ) THEN
        ALTER TABLE feedback ADD COLUMN feedback_context JSONB;
    END IF;
END $$;

-- Disable RLS for new tables
ALTER TABLE magic_link_tokens DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions DISABLE ROW LEVEL SECURITY;

-- Grant permissions (adjust as needed for your setup)
-- GRANT SELECT, INSERT, UPDATE, DELETE ON magic_link_tokens TO your_app_user;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON user_sessions TO your_app_user;
-- GRANT USAGE ON SEQUENCE magic_link_tokens_id_seq TO your_app_user;
-- GRANT USAGE ON SEQUENCE user_sessions_id_seq TO your_app_user;

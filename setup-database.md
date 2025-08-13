# Database Setup Guide

## Step 1: Set up Supabase Database

1. **Go to your Supabase project dashboard**
   - Navigate to https://supabase.com/dashboard
   - Select your "agent-bio-summary" project

2. **Open the SQL Editor**
   - Click on "SQL Editor" in the left sidebar
   - Click "New query"

3. **Run the database schema**
   - Copy the contents of `lib/database-setup.sql`
   - Paste it into the SQL Editor
   - Click "Run" to execute the schema

## Step 2: Verify Setup

After running the schema, you should see:
- 5 tables created: `email_recipients`, `search_settings`, `system_settings`, `articles`, `daily_summaries`
- Default data inserted for settings and recipients
- Cleanup functions created for data retention

## Step 3: Test the Application

1. **Deploy to Vercel** (if not already done):
   ```bash
   vercel --prod
   ```

2. **Visit your application** and go to the Settings page
3. **Add your email recipients** - they will now persist in the database
4. **Update search settings** - they will be saved and used by the cron job

## Step 4: Monitor Data Retention

The system will automatically:
- **Clean up articles** older than 2 days (daily at 2 AM UTC)
- **Clean up summaries** older than 7 days (daily at 2 AM UTC)
- **Keep recipients and settings** permanently

## Database Tables Overview

| Table | Purpose | Retention |
|-------|---------|-----------|
| `email_recipients` | Store email recipients | Permanent |
| `search_settings` | Store search configuration | Permanent |
| `system_settings` | Store system configuration | Permanent |
| `articles` | Store found articles | 2 days |
| `daily_summaries` | Store generated summaries | 7 days |

## Environment Variables Required

Make sure these are set in your Vercel project:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY`
- `RESEND_API_KEY` (optional)

## Troubleshooting

If you encounter issues:
1. Check the Vercel function logs for errors
2. Verify all environment variables are set
3. Ensure the database schema was run successfully
4. Check that your Supabase project is active and accessible

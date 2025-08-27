# Improved Feedback System - Deployment Checklist

## Pre-Deployment Checklist

### ✅ Database Setup
- [ ] Run database migration script: `lib/migration-add-feedback-comparisons.sql`
- [ ] Verify `feedback_comparisons` table exists
- [ ] Verify new columns added to `system_settings` table
- [ ] Check database indexes are created
- [ ] Test database permissions for service role

### ✅ Code Implementation
- [ ] All TypeScript files compiled successfully
- [ ] No linter errors in comparison components
- [ ] API endpoints properly implemented
- [ ] Frontend components integrated
- [ ] Toast notifications working

### ✅ Dependencies
- [ ] `react-hot-toast` installed
- [ ] All imports resolved
- [ ] No missing dependencies

### ✅ Environment Variables
- [ ] `NEXT_PUBLIC_SUPABASE_URL` configured
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` configured
- [ ] `SUPABASE_SERVICE_ROLE_KEY` configured
- [ ] `OPENAI_API_KEY` configured
- [ ] All API keys have proper permissions

## Deployment Steps

### 1. Database Migration
```sql
-- Run in Supabase SQL Editor
-- Execute lib/migration-add-feedback-comparisons.sql
```

### 2. Build Application
```bash
npm run build
```

### 3. Test Locally
```bash
npm run dev
# Test the complete feedback flow:
# 1. Navigate to Summary Viewer
# 2. Provide feedback (thumbs up/down)
# 3. Complete A/B comparison flow
# 4. Verify data in database
```

### 4. Deploy to Production
```bash
# Deploy to your hosting platform (Vercel, etc.)
git add .
git commit -m "Implement Improved Feedback System with A/B comparisons"
git push
```

## Post-Deployment Verification

### ✅ Functionality Tests
- [ ] Initial feedback recording works
- [ ] Thank you page appears after feedback
- [ ] A/B comparison flow starts correctly
- [ ] All 3 comparisons complete successfully
- [ ] Success page shows correct summary
- [ ] Settings page shows comparison options

### ✅ Database Verification
```sql
-- Check if tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name = 'feedback_comparisons';

-- Check if columns exist
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'system_settings' 
AND column_name IN ('comparison_model', 'comparison_temperature', 'comparison_max_tokens');

-- Test data insertion
INSERT INTO feedback_comparisons (
  session_id, recipient_id, summary_id, article_id,
  current_summary, advanced_summary, current_model, advanced_model,
  user_preference, comparison_order, extraction_method
) VALUES (
  'test-session', 'test-recipient', 'test-summary', 'test-article',
  'Test current summary', 'Test advanced summary', 'gpt-4o-mini', 'gpt-5',
  'A', 1, 'extracted'
);
```

### ✅ API Endpoint Tests
```bash
# Test start-comparison endpoint
curl -X POST http://localhost:3000/api/feedback/start-comparison \
  -H "Content-Type: application/json" \
  -d '{"recipientId":"test","summaryId":"test"}'

# Test comparison data endpoint
curl http://localhost:3000/api/feedback/comparison/test-session/1

# Test submit-comparison endpoint
curl -X POST http://localhost:3000/api/feedback/submit-comparison \
  -H "Content-Type: application/json" \
  -d '{"sessionId":"test-session","comparisonOrder":1,"userPreference":"A"}'

# Test session summary endpoint
curl http://localhost:3000/api/feedback/session/test-session/summary
```

### ✅ Performance Tests
- [ ] Page load times acceptable (< 3 seconds)
- [ ] API response times acceptable (< 2 seconds)
- [ ] No memory leaks in comparison components
- [ ] Toast notifications don't cause performance issues

### ✅ Error Handling
- [ ] Network errors handled gracefully
- [ ] Database errors show appropriate messages
- [ ] Invalid data validation works
- [ ] Fallback mechanisms function correctly

## Monitoring Setup

### ✅ Analytics Tracking
- [ ] Comparison completion rates tracked
- [ ] User preference data collected
- [ ] Cost metrics monitored
- [ ] Error rates tracked

### ✅ Database Monitoring
```sql
-- Set up monitoring queries
-- 1. Daily completion rates
SELECT 
  DATE(created_at) as date,
  COUNT(*) as total_sessions,
  COUNT(CASE WHEN completed_comparisons = 3 THEN 1 END) as completed_sessions,
  ROUND(COUNT(CASE WHEN completed_comparisons = 3 THEN 1 END) * 100.0 / COUNT(*), 2) as completion_rate
FROM (
  SELECT session_id, created_at, COUNT(*) as completed_comparisons
  FROM feedback_comparisons 
  WHERE user_preference IS NOT NULL
  GROUP BY session_id, created_at
) session_stats
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- 2. Model preference trends
SELECT 
  DATE(created_at) as date,
  user_preference,
  COUNT(*) as count
FROM feedback_comparisons 
WHERE user_preference IS NOT NULL
GROUP BY DATE(created_at), user_preference
ORDER BY date DESC, user_preference;

-- 3. Extraction success rates
SELECT 
  extraction_method,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
FROM feedback_comparisons 
GROUP BY extraction_method;
```

## Rollback Plan

### If Issues Occur
1. **Disable comparison flow** by commenting out the thank you page trigger
2. **Revert database changes** if needed:
   ```sql
   -- Drop the new table (WARNING: This will lose data)
   DROP TABLE IF EXISTS feedback_comparisons;
   
   -- Remove new columns from system_settings
   ALTER TABLE system_settings 
   DROP COLUMN IF EXISTS comparison_model,
   DROP COLUMN IF EXISTS comparison_temperature,
   DROP COLUMN IF EXISTS comparison_max_tokens;
   ```
3. **Revert code changes** to previous working version
4. **Deploy rollback** version

## Success Criteria

### ✅ Go-Live Criteria
- [ ] All functionality tests pass
- [ ] Database queries return expected results
- [ ] API endpoints respond correctly
- [ ] Frontend components render properly
- [ ] No critical errors in logs
- [ ] Performance metrics within acceptable ranges

### ✅ Post-Launch Monitoring
- [ ] Monitor completion rates (target: >80%)
- [ ] Track API costs (target: <$0.10 per session)
- [ ] Watch for user feedback issues
- [ ] Monitor system performance
- [ ] Collect user preference data

## Support Documentation

### For Users
- [ ] Update user documentation
- [ ] Create FAQ for comparison feature
- [ ] Provide troubleshooting guide

### For Developers
- [ ] Update API documentation
- [ ] Document database schema changes
- [ ] Create maintenance procedures

---

**Deployment Date**: [To be filled]  
**Deployed By**: [To be filled]  
**Status**: [To be filled]

# Improved Feedback Tracking v1.3.1 - Deployment Checklist

## Pre-Deployment Steps

### 1. Database Migration
- [ ] Run the database migration: `lib/migration-improved-feedback-tracking.sql`
- [ ] Verify new tables are created:
  - `magic_link_tokens`
  - `user_sessions`
- [ ] Verify indexes are created
- [ ] Verify functions are created:
  - `find_or_create_recipient`
  - `generate_session_token`
  - `create_user_session`
  - `validate_session`
  - `cleanup_expired_magic_tokens`
  - `cleanup_expired_sessions`

### 2. Environment Variables
- [ ] Verify `NEXT_PUBLIC_APP_URL` is set correctly for production
- [ ] Verify email service is configured (Resend API key)
- [ ] Verify Supabase credentials are configured

### 3. Code Review
- [ ] Review all new files:
  - `lib/magicLinkService.ts`
  - `lib/contexts/UserSessionContext.tsx`
  - `components/UserIdentificationModal.tsx`
  - `app/api/auth/send-magic-link/route.ts`
  - `app/api/auth/lookup-user/route.ts`
  - `app/api/auth/verify/route.ts`
  - `app/api/auth/session/route.ts`
  - `app/auth/error/page.tsx`
- [ ] Review updated files:
  - `app/api/feedback/route.ts`
  - `components/SummaryViewer.tsx`
  - `app/layout.tsx`

## Deployment Steps

### 1. Deploy to Staging
- [ ] Deploy to staging environment
- [ ] Test magic link flow end-to-end
- [ ] Test existing user lookup
- [ ] Test new user registration
- [ ] Test feedback submission with authentication
- [ ] Test session persistence
- [ ] Test error handling

### 2. Production Deployment
- [ ] Deploy to production
- [ ] Monitor for errors in logs
- [ ] Test critical user flows
- [ ] Monitor email delivery rates
- [ ] Monitor database performance

## Post-Deployment Verification

### 1. Functional Testing
- [ ] **New User Flow:**
  - [ ] Click thumbs up/down without being logged in
  - [ ] Select "I'm new here"
  - [ ] Enter email address
  - [ ] Receive magic link email
  - [ ] Click magic link
  - [ ] Get redirected to summary page
  - [ ] Feedback is recorded successfully

- [ ] **Existing User Flow:**
  - [ ] Click thumbs up/down without being logged in
  - [ ] Select "I'm an existing subscriber"
  - [ ] Enter existing email address
  - [ ] Get logged in immediately
  - [ ] Feedback is recorded successfully

- [ ] **Session Persistence:**
  - [ ] Refresh page after login
  - [ ] Session should persist
  - [ ] Feedback should work without re-authentication

### 2. Error Handling
- [ ] **Invalid Email:**
  - [ ] Enter invalid email format
  - [ ] Should show validation error

- [ ] **Expired Magic Link:**
  - [ ] Wait for magic link to expire (1 hour)
  - [ ] Click expired link
  - [ ] Should redirect to error page

- [ ] **Rate Limiting:**
  - [ ] Send multiple magic link requests
  - [ ] Should be rate limited after 3 requests

### 3. Database Verification
- [ ] Check `magic_link_tokens` table for new entries
- [ ] Check `user_sessions` table for new sessions
- [ ] Check `feedback` table for properly attributed feedback
- [ ] Check `email_recipients` table for new users

## Monitoring & Alerts

### 1. Key Metrics to Monitor
- [ ] Magic link email delivery rate
- [ ] Magic link click-through rate
- [ ] User identification completion rate
- [ ] Feedback submission success rate
- [ ] Session validation success rate

### 2. Error Monitoring
- [ ] Monitor for authentication errors
- [ ] Monitor for email delivery failures
- [ ] Monitor for database connection issues
- [ ] Monitor for session validation failures

### 3. Performance Monitoring
- [ ] Monitor API response times
- [ ] Monitor database query performance
- [ ] Monitor email service response times

## Rollback Plan

### If Issues Arise:
1. **Immediate:** Disable new authentication flow
2. **Fallback:** Revert to hardcoded recipient ID for feedback
3. **Data:** Preserve all new user data
4. **Communication:** Notify users of temporary changes

### Rollback Steps:
- [ ] Revert `app/api/feedback/route.ts` to use hardcoded recipient ID
- [ ] Remove UserSessionProvider from layout
- [ ] Disable user identification modal
- [ ] Monitor for stability

## Success Criteria

### Primary Goals:
- [ ] >95% of feedback attempts succeed
- [ ] >80% of users complete identification
- [ ] >70% of magic links are clicked
- [ ] >90% of users maintain sessions across visits

### Secondary Goals:
- [ ] <30 seconds from click to feedback recorded
- [ ] >98% of magic link emails delivered
- [ ] <1% of feedback attempts fail
- [ ] Positive user feedback on new system

## Documentation Updates

### 1. User Documentation
- [ ] Update README with new authentication flow
- [ ] Document magic link process for users
- [ ] Update troubleshooting guide

### 2. Developer Documentation
- [ ] Document new API endpoints
- [ ] Document database schema changes
- [ ] Document session management
- [ ] Update deployment procedures

## Post-Launch Tasks

### Week 1:
- [ ] Monitor system performance
- [ ] Collect user feedback
- [ ] Fix any critical issues
- [ ] Analyze usage patterns

### Week 2:
- [ ] Optimize based on usage data
- [ ] Plan Phase 2 features (feedback history, analytics)
- [ ] Document lessons learned
- [ ] Plan future enhancements

---

**Deployment Date:** TBD  
**Deployed By:** TBD  
**Version:** v1.3.1  
**Status:** Ready for Deployment

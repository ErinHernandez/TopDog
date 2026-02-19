# Idesaign Deployment Checklist

**Purpose:** Ensure safe, reliable deployments to production  
**Owner:** DevOps / Tech Lead  
**Last Updated:** 2025-02-11

This checklist must be completed for every production deployment. Use it to verify code quality, test coverage, and system readiness before deploying.

---

## Table of Contents

1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Deployment Process](#deployment-process)
3. [Post-Deployment Verification](#post-deployment-verification)
4. [Rollback Procedures](#rollback-procedures)

---

## Pre-Deployment Checklist

### Code Quality (30 minutes before deploy)

**TypeScript Compilation Check**
- [ ] `npm run lint` passes without errors
- [ ] No TypeScript errors: `tsc --noEmit`
- [ ] All type definitions are complete
- [ ] No `@ts-ignore` comments used (unless approved by tech lead)

**Code Review**
- [ ] All changes reviewed and approved in pull request
- [ ] At least 1 senior engineer approval on PR
- [ ] No merge conflicts after rebase
- [ ] Commit history is clean and descriptive
- [ ] No secrets in code (check `.env` files removed from commits)

**Testing**
- [ ] All tests pass locally: `npm run test`
- [ ] Test coverage >= 80% for modified files
- [ ] No skipped tests (`describe.skip`, `it.skip`)
- [ ] E2E tests pass in staging environment
- [ ] Critical path tests included:
  - [ ] Login/signup flow
  - [ ] Image upload
  - [ ] Stripe payment
  - [ ] AI tool activation

**Load Testing (For significant changes)**
- [ ] Load test results reviewed: < 5s p95 latency at 100 concurrent users
- [ ] Memory usage stable during 5-minute load test
- [ ] No database connection exhaustion
- [ ] Error rate < 0.5% during load test

### Staging Verification (1 hour before deploy)

**Staging Environment Tests**
- [ ] Deploy to staging environment first
- [ ] Staging health check passes: `curl https://staging-idesaign.vercel.app/api/health`
- [ ] Test critical paths in staging:
  - [ ] User registration and login
  - [ ] Image upload and processing
  - [ ] Payment flow (use Stripe test cards)
  - [ ] AI tools (all 4 providers)
  - [ ] Settings and preferences
  - [ ] Webhooks receiving events

**Staging Smoke Test Checklist**
```
Feature Smoke Tests (5 minutes each):
- [ ] Homepage loads in < 2 seconds
- [ ] Login redirects unauthenticated users
- [ ] Authenticated user sees dashboard
- [ ] Image upload accepts common formats (JPG, PNG, GIF)
- [ ] Background removal completes in < 30 seconds
- [ ] Upscale processes without error
- [ ] Text generation returns reasonable output
- [ ] AI tools degrade gracefully if one provider down
- [ ] Settings save and persist
- [ ] Logout clears session
- [ ] Payment checkout shows pricing correctly
```

**Database Migrations (If applicable)**
- [ ] Any database migrations have been tested
- [ ] Rollback procedure documented
- [ ] Data backups exist before migration
- [ ] Migration tested on staging with production-like data
- [ ] Estimated downtime acceptable (< 30 seconds)

**Third-Party Integrations**
- [ ] API keys are valid and not rate limited
- [ ] Stripe webhook endpoint tested
- [ ] Firebase rules reviewed and verified
- [ ] Redis connection working
- [ ] AI provider API quotas available
- [ ] All external services report healthy status

**Vercel Configuration**
- [ ] Environment variables set correctly in production
- [ ] Function memory limits appropriate
- [ ] Build succeeds without warnings: `npm run build`
- [ ] Deploy preview tested (Vercel automatically creates)
- [ ] No build secrets in logs

### Monitoring & Alerts (Before deploy window)

**Monitoring Setup**
- [ ] Sentry project configured and connected
- [ ] Alert rules enabled for critical metrics:
  - [ ] Error rate > 5%
  - [ ] P95 latency > 5 seconds
  - [ ] Health check failure
  - [ ] Stripe webhook failures
- [ ] Status page ready for updates
- [ ] Team Slack channels ready (monitoring notifications enabled)

**Communication**
- [ ] Team notified of planned deployment
- [ ] Deployment window confirmed with no critical meetings
- [ ] On-call engineer assigned to monitor after deploy
- [ ] If P1 change: Tech lead on standby
- [ ] Release notes prepared for status page

---

## Deployment Process

### Deployment Steps

**1. Pre-Deployment (T-10 min)**
```bash
# Pull latest main branch
git pull origin main

# Verify commit message and changes
git log -1 --oneline

# Trigger Vercel deployment (if using GitHub integration, just push)
vercel deploy --prod

# Or via CLI:
npm run build  # Verify build succeeds locally first
```

**2. Monitor Deployment (T+0 to T+5 min)**
```
- Watch Vercel deployment progress
- Check build logs for any warnings
- Verify deployment completes without errors
- Wait for deployment status to show "Ready"
```

**3. Verify Deployment (T+5 to T+15 min)**
```bash
# Check health endpoints
curl https://idesaign.vercel.app/api/health
curl https://idesaign.vercel.app/api/health/deep

# Check error rate in Sentry (should be 0% increase)
# Check P95 latency hasn't spiked
# Check no new errors in logs

# Test critical paths manually:
# - Login
# - Image upload
# - AI tool usage
# - Payment flow
```

**4. Post-Deployment (T+15 to T+60 min)**
```
- Monitor error rate for 10 minutes (should be < 1%)
- Monitor latency metrics (should stay < 2s p95)
- Watch Sentry for new error patterns
- Check database query performance
- Verify rate limiting still working
- Confirm no spike in external API calls

If all good: Mark deployment as successful
If issues: See Rollback section
```

### Deployment Commands Reference

```bash
# Deploy to production (from main branch)
vercel deploy --prod

# Check deployment status
vercel deployments list

# View real-time logs
vercel logs --tail --follow

# Check recent errors
vercel logs | grep ERROR

# Scale function memory (if needed)
vercel env add VERCEL_FUNCTION_MEMORY 1024

# Rollback to previous version
vercel rollback
```

### If Deployment Fails

**Build Failure**
1. Stop deployment immediately
2. Review build errors in Vercel logs
3. Fix issue locally: `npm run build`
4. Verify fix: `npm run test`
5. Commit fix to main
6. Redeploy

**Deploy Completes But Errors Spike**
1. Check if errors are from code or external dependency
2. If code: Immediately rollback: `vercel rollback`
3. If external: Monitor external service status pages
4. If monitoring failure: Update alert thresholds
5. Redeploy when confirmed fixed

---

## Post-Deployment Verification

### Immediate Verification (First 15 minutes)

**Automated Checks**
- [ ] Health check endpoint returns 200: `curl /api/health`
- [ ] Error rate < 1%
- [ ] P95 latency < 2 seconds
- [ ] No new Sentry errors
- [ ] Rate limiter working (test with rapid requests)

**Manual Verification (Test critical user journeys)**

```
1. New User Flow (5 minutes)
   [ ] Visit homepage - loads in < 2 seconds
   [ ] Click "Sign Up"
   [ ] Enter email and password
   [ ] Verify email received (or skip if test account)
   [ ] Login with new account
   [ ] Dashboard visible

2. Image Processing Flow (5 minutes)
   [ ] Upload a test image (JPG, PNG, or GIF)
   [ ] Image appears in editor
   [ ] Click "Remove Background"
   [ ] Wait for processing (< 30 sec)
   [ ] Verify output image
   [ ] Click "Save"
   [ ] Verify save completes

3. AI Features Flow (5 minutes)
   [ ] Click "Generate Text"
   [ ] Enter prompt
   [ ] Wait for response (should use OpenAI or fallback)
   [ ] Verify output appears
   [ ] Click "Upscale Image"
   [ ] Verify scaling completes

4. Payment Flow (5 minutes)
   [ ] Click upgrade to premium
   [ ] Verify pricing correct
   [ ] Enter test card (4242 4242 4242 4242)
   [ ] Complete payment
   [ ] Verify webhook received (check logs)
   [ ] Verify subscription activated

5. AI Provider Failover (Optional - if testing resilience)
   [ ] Enable "AI provider outage" debug mode (if available)
   [ ] Try AI feature
   [ ] Verify automatic failover to next provider
   [ ] Verify no error shown to user
```

**Monitoring Dashboard Review**
- [ ] No spike in error rate
- [ ] No spike in latency
- [ ] No spike in Firebase costs
- [ ] Rate limiter working (should see some 429s on heavy endpoints)
- [ ] Dependency health checks all green

### Ongoing Verification (30-60 minutes)

**Monitor Key Metrics**
```
Check every 5 minutes for 30 minutes:
- Error rate (should be < 1%)
- P95 latency (should be < 2s)
- Memory usage (should be stable)
- Database latency (should be < 200ms)
- External API error rates (should be baseline)
```

**Watch for Cascading Issues**
- [ ] No spike in Firestore writes (indicates queuing issues)
- [ ] No spike in Redis errors (connection stable)
- [ ] No spike in rate limit 429s (rate limiter working normally)
- [ ] No spike in external API calls (logic not looping)

### Extended Monitoring (24 hours)

**Daily Checks**
- [ ] Monitor uptime percentage (should be 99.99%)
- [ ] Monitor incident reports (should be none)
- [ ] Review Sentry for new error patterns
- [ ] Review user feedback (no complaints)
- [ ] Monitor cost metrics (should be stable)

**Update Runbooks**
- [ ] If new issue discovered: Document in incident runbook
- [ ] If new alert triggered: Document in alert config
- [ ] If new edge case found: Add test case for future

---

## Rollback Procedures

### When to Rollback

Rollback immediately if:
1. **Error rate > 10%** for more than 2 minutes
2. **Critical feature broken** (auth, payments, image processing)
3. **Data loss or corruption** detected
4. **Security vulnerability** exposed
5. **External service dependent** on our changes is broken

Do NOT rollback if:
- Minor UI bug (fix forward)
- Error rate < 5% (usually resolves itself)
- Issue is external service down (not our code)
- Only non-critical feature affected

### Quick Rollback (< 2 minutes)

```bash
# Option 1: Vercel automatic rollback
vercel rollback

# Option 2: Deploy previous known good version
git log --oneline -5  # Find good commit
git checkout [good-commit-hash]
git push origin HEAD:main
vercel deploy --prod

# Option 3: Revert specific commit
git revert [bad-commit-hash]
git push origin main
vercel deploy --prod
```

### Rollback Verification

After rollback:
```bash
# Verify rollback deployed
vercel deployments list | head -1

# Verify health check green
curl https://idesaign.vercel.app/api/health

# Test critical paths work again
# - Login
# - Image upload
# - Payment

# Monitor error rate drops back to baseline
vercel logs --grep ERROR

# Verify no cascading failures
curl https://idesaign.vercel.app/api/health/deep
```

### Post-Rollback Actions

1. **Notify team:** Post to #deployments Slack channel
   ```
   🔄 Rollback completed: Reverted to [commit-hash]
   Reason: [error rate spike, feature broken, etc.]
   Status: ✅ All systems nominal
   ```

2. **Create incident ticket**
   - Link to deployment
   - Document what went wrong
   - Schedule postmortem within 48 hours

3. **Root Cause Analysis**
   - What change caused the issue?
   - Why wasn't it caught in staging?
   - What additional testing is needed?

4. **Fix & Redeploy**
   - Fix the issue locally
   - Add test case to prevent regression
   - Redeploy with extra caution
   - Extended monitoring after second deploy

---

## Deployment Checklist Template

Use this for each deployment:

```markdown
## Deployment: [Feature Name / Bug Fix]

**Deploy Date:** [Date]  
**Deployed By:** [Name]  
**Commit Hash:** [Hash]  
**Related Issue:** [Link]

### Pre-Deployment
- [x] TypeScript compilation passes
- [x] Tests pass locally
- [x] Staging deployment successful
- [x] Staging smoke tests passed
- [x] Database migrations tested (if applicable)
- [ ] Team notified of deployment
- [ ] On-call engineer assigned

### Deployment
- [x] Production deployment started
- [x] Build succeeded
- [x] Deployment completed
- [x] Health checks passing

### Post-Deployment (First 15 min)
- [x] Error rate < 1%
- [x] P95 latency normal
- [x] Manual smoke tests passed
- [x] No new Sentry errors
- [x] No cascading failures

### Status
✅ Deployment successful - Ready for monitoring

**Notes:** [Any issues encountered, fixes applied, etc.]
```

---

## Common Deployment Issues

### Issue: Build Times Out
**Solution:** Usually means heavy dependencies or slow Vercel instance
- Check for new large dependencies
- Verify no infinite loops in code
- Increase build timeout in vercel.json
- Try deploying again (usually temporary)

### Issue: Function Memory Exceeded
**Solution:** Function ran out of memory during build or runtime
```bash
vercel env add VERCEL_FUNCTION_MEMORY 1024  # Increase from 512MB to 1GB
```
Then redeploy.

### Issue: Health Check Fails After Deploy
**Solution:** External dependency unreachable from Vercel edge
- Verify Vercel can reach external services (Firebase, Stripe, etc.)
- Check API keys in environment variables
- Check network policies not blocking Vercel IPs
- Restart health check: curl /api/health/deep

### Issue: Webhook Not Receiving Events
**Solution:** Usually endpoint URL or auth issue
- Verify webhook endpoint URL is correct: `https://idesaign.vercel.app/api/webhooks/[service]`
- Check API key still valid and has webhook permissions
- Verify webhook secret correctly configured
- Test with provider's manual event send: `stripe events resend [event_id]`

### Issue: Rate Limiter Too Aggressive
**Solution:** After deploy, users getting 429 blocked
- Check if rate limit thresholds changed in code
- Verify Redis/Upstash connection working
- Check if traffic spike unrelated to deploy
- Temporarily increase rate limit, redeploy, then investigate

---

## Environment Variables Checklist

Before deployment, verify all required environment variables are set:

**Required for all deployments:**
```
NEXT_PUBLIC_FIREBASE_API_KEY
NEXT_PUBLIC_FIREBASE_APP_ID
FIREBASE_ADMIN_SDK_JSON
UPSTASH_REDIS_URL
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
OPENAI_API_KEY
STABILITY_API_KEY
REPLICATE_API_KEY
GOOGLE_AI_API_KEY
TWILIO_ACCOUNT_SID
TWILIO_AUTH_TOKEN
SENTRY_AUTH_TOKEN
```

**Optional (feature-specific):**
```
VERCEL_FUNCTION_MEMORY (usually 512, increase if needed)
DEBUG_MODE (if local development only)
```

**Never commit:**
```
Don't put these in git:
- API keys
- Database credentials
- Passwords
- Private keys
- Stripe test cards
```

---

## Metrics to Track After Deploy

Create a dashboard showing these metrics for 24 hours post-deploy:

```
Real-time Metrics:
- Error rate (should be < 1%)
- P95 latency (should be < 2 seconds)
- Request count (should be normal pattern)
- Memory usage (should be stable)
- Database connections (should be stable)
- Webhook success rate (should be > 99%)

SLA Metrics:
- Uptime (should be 99.99%)
- Mean response time (should be < 1 second)
- Error budget remaining (should be > 95%)

Business Metrics:
- Successful payments (should be normal)
- Active users (should be normal)
- Feature usage (should match baseline)
```

---

**Document Version:** 1.0  
**Last Updated:** 2025-02-11  
**Next Review:** 2025-05-11  
**Owner:** DevOps / Tech Lead

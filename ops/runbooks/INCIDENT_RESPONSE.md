# Idesaign Incident Response Runbook

**Last Updated:** 2025-02-11  
**Owner:** DevOps / On-Call Engineer  
**Status Page:** https://status.idesaign.io

This runbook provides step-by-step procedures for responding to incidents in the Idesaign production environment. All team members must be familiar with severity classifications, escalation paths, and common failure modes.

---

## Table of Contents

1. [Severity Classification](#severity-classification)
2. [Escalation Path](#escalation-path)
3. [Incident Response Workflow](#incident-response-workflow)
4. [Common Failure Modes](#common-failure-modes)
5. [Detection & Triage](#detection--triage)
6. [Post-Incident Procedures](#post-incident-procedures)

---

## Severity Classification

### P1 - Critical (Response Time: 15 minutes)

**Definition:** Full platform outage, data loss, active security breach, or production system completely unavailable.

**Examples:**
- All users unable to authenticate or access app
- Complete Firestore data loss or corruption
- Active security breach or unauthorized data access
- Payment processing entirely down (Stripe unavailable)
- Database unable to respond to queries
- Critical vulnerability exposed in production

**Response Actions:**
1. Immediately page on-call L2/L3 engineer
2. Start incident war room (Slack channel: #incident-critical)
3. Begin real-time status updates every 5 minutes
4. Post status page update within 5 minutes
5. Activate incident commander to coordinate response

### P2 - High (Response Time: 1 hour)

**Definition:** Major feature degraded, significant user impact, but not complete outage.

**Examples:**
- 20%+ of users unable to use specific feature
- Payment failures affecting checkout flow
- AI tools consistently failing (fallover triggered)
- Auth working but specific permission groups broken
- Specific API endpoint returning 5xx errors
- Database performance severely degraded (queries >30s)

**Response Actions:**
1. Alert on-call L1 engineer immediately
2. Create incident Slack channel (#incident-p2-[feature])
3. Update status page within 15 minutes
4. Escalate to L2 if not resolved in 30 minutes
5. Provide hourly status updates

### P3 - Medium (Response Time: 4 hours)

**Definition:** Minor feature broken, non-critical functionality impacted, workaround available.

**Examples:**
- Specific image format not processing correctly
- Rate limiting too aggressive for legitimate users
- Webhook failing but with manual retry capability
- Non-critical service degraded but core features work
- UI bug affecting subset of users
- Slow performance on non-critical features

**Response Actions:**
1. Create ticket in incident tracking system
2. Assign to on-call engineer
3. Update status page if customer-facing
4. Aim for resolution within 4 hours
5. Daily status updates

### P4 - Low (Response Time: 24 hours)

**Definition:** Cosmetic issues, minor bugs with no user impact, or documentation improvements.

**Examples:**
- Typos or UI alignment issues
- Rarely-used feature broken
- Informational error messages improved
- Minor performance improvement opportunities
- Documentation updates
- Non-critical dependency updates

**Response Actions:**
1. Create GitHub issue for tracking
2. Backlog for sprint planning
3. No status page update required
4. Standard SLA: resolved within 24 hours

---

## Escalation Path

### Level 1 (On-Call Engineer)
- **Availability:** On-call rotation, 24/7
- **Responsibility:** Triage incidents, check dashboards, execute runbook steps, gather logs
- **Response Time:** 15 minutes (P1), 30 minutes (P2)
- **Authority:** Can deploy hotfixes, restart services, access Vercel/Firebase dashboards
- **Escalation Trigger:** Unresolved P1/P2 after 30 min, requires specialized knowledge

### Level 2 (Tech Lead / Senior Engineer)
- **Availability:** Business hours + on-call rotation
- **Responsibility:** Deep technical investigation, code-level debugging, architecture decisions
- **Response Time:** Called if L1 escalates
- **Authority:** Can approve emergency deployments, modify prod configurations, incident commander
- **Escalation Trigger:** Unresolved after 1 hour, involves multiple systems, security incident

### Level 3 (CTO + Security Team)
- **Availability:** On-call for P1 critical/security incidents
- **Responsibility:** Executive decisions, customer communication, regulatory compliance, post-incident review
- **Response Time:** Immediate for P1/security
- **Authority:** Can take system offline, rollback changes, authorize emergency procedures
- **Escalation Trigger:** Active data breach, regulatory impact, customer SLA breach

### Escalation Timeline

P1: Alert L1 → T+5 Alert L2 → T+15 Alert L3 → T+30 Exec update
P2: Alert L1 → T+30 Alert L2 → T+60 Take over → T+120 Escalate to L3
P3: Alert L1 → T+240 Escalate to L2 (Standard SLA: 4 hours)

---

## Incident Response Workflow

### Phase 1: Detection & Initial Response (First 5 minutes)

1. **Receive Alert** - Verify alert, check dashboards, assess impact
2. **Acknowledge & Triage** - Confirm real impact, assign severity, create ticket
3. **Initial Communication** - Post to Slack, update status page for P1/P2

### Phase 2: Investigation (Next 10-30 minutes)

1. **Gather Information** - Pull logs, check health endpoints, review errors
2. **Identify Root Cause** - Correlate with deployments, check dependencies
3. **Document Findings** - Post updates every 10 minutes, share dashboards

### Phase 3: Mitigation (During Investigation)

1. **Quick Fixes (0-15 min)** - Restart service, rollback deployment, enable failover
2. **Workarounds (15-60 min)** - Disable feature, scale resources, route around failure
3. **Full Recovery (60+ min)** - Deploy fix, verify resolution

### Phase 4: Resolution & Verification (Next 15 minutes)

1. **Verify Fix** - Error rate normal, health checks green, critical paths working
2. **Update Communications** - Slack resolution, status page, incident log
3. **Document for Postmortem** - Timeline, root cause, action items

### Phase 5: Post-Incident (Within 24 hours)

Conduct postmortem, create action items, update runbook if needed.

---

## Common Failure Modes

### 1. Firebase Auth Down (P1)

**Impact:** All authenticated routes fail, complete app lockout
**Detection:** HTTP 401 spike, health check reports `firebase_auth_healthy: false`

**Mitigation:**
1. Verify Firebase status at https://firebase.google.com/status
2. Enable "authentication unavailable" banner in UI
3. Cache and reuse valid tokens from last 24 hours
4. Redirect to static "maintenance" page
5. Enable read-only mode for cached token holders

**Recovery:**
- Firebase auto-recovers (SLA 99.95%)
- Clear cache after 30 min
- Process queued IndexedDB writes

**Prevention:** Keep SDK updated, test auth failure scenarios, monitor health continuously

---

### 2. Redis/Upstash Connection Failure (P2)

**Impact:** Rate limiting degraded, caching disabled, slower responses
**Detection:** Redis connection timeout in `/api/health/deep`, Upstash dashboard errors

**Mitigation:**
1. Check Upstash status at https://upstash.statuspage.io
2. Fail-open rate limiting (fall back to in-memory, log for review)
3. Bypass cache (read directly from Firestore)
4. Monitor Upstash auto-failover (30 sec SLA)

**Recovery:**
- Verify connection restored: `redis-cli -h $UPSTASH_URL PING`
- Warm cache for critical entries
- Monitor Firestore costs return to normal

**Prevention:** Implement circuit breaker, test Redis failure monthly, persistent connection pooling

---

### 3. AI Provider Outage (P2)

**Impact:** AI tools fail, automatic failover triggered
**Detection:** Circuit breaker trips, error logs show 5xx from provider

**Mitigation (Automatic):**
- OpenAI down → Failover to Stability AI
- Stability AI down → Failover to Replicate
- Replicate down → Fallback to Google AI
- Google AI down → Show "Service unavailable" message
- Circuit breaker: Trip after 5 failures, cooldown 60 sec

**Recovery:**
- Check provider status pages
- Circuit breaker auto-resets after cooldown
- Monitor provider recovery periodically

**Prevention:** Robust circuit breaker, model-specific health checks, test failures weekly

---

### 4. Stripe Webhook Failure (P2)

**Impact:** Payments not processed, subscriptions not activated
**Detection:** Webhook endpoint non-200, Stripe dashboard shows failed deliveries

**Mitigation:**
1. Check webhook logs: `vercel logs --grep webhook`
2. Identify failure mode (code, API key, signature)
3. Stripe auto-retries for 72 hours (escalating intervals)
4. If code issue: deploy hotfix immediately
5. If key issue: rotate API key and restart functions

**Recovery:**
- Verify webhook handler running latest code
- Test with sample: `curl -X POST /api/webhooks/stripe -d @sample.json`
- Manually replay failed events if Stripe retry exceeds 72h
- Reconcile user subscriptions (manually activate if needed)

**Prevention:** Webhook deduplication, queue to database before processing, idempotency checks

---

### 5. High Error Rate >5% (P1/P2)

**Impact:** App returns errors to many users, features unavailable
**Detection:** Error rate > 5% over 5 min, Sentry shows spike

**Mitigation:**
1. Identify error pattern in Sentry
2. Correlate with recent deployments: `vercel logs --tail --since [time]`
3. Determine if code, resource, dependency, or config issue
4. Rollback or deploy hotfix (within 10 min)
5. Scale resources if memory-related

**Recovery:**
- Deploy fix or rollback: `git checkout [good-commit] && git push origin main`
- Verify error rate < 1%, health checks green
- Monitor for 30 minutes, check for cascading failures

**Prevention:** Require passing tests, load test before deploy, automated rollback on error spike

---

### 6. Memory/CPU Spike - Slow Responses (P2)

**Impact:** Pages load slowly, operations timeout
**Detection:** Function duration > 10s, memory > 80%, timeout errors

**Mitigation:**
1. Check Vercel dashboard: function duration trend
2. Identify bottleneck: memory leak, N+1 query, large response, slow database
3. Scale up function memory: `vercel env add VERCEL_FUNCTION_MEMORY 1024`
4. Clear cache (restart functions)
5. Disable heavy features if needed

**Recovery:**
- Deploy optimization (fix memory leak, optimize query, add indexing)
- Verify function duration returns normal
- Monitor memory for 24 hours

**Prevention:** Request timeouts (30s max), continuous memory monitoring, load test before release

---

### 7. DDoS / Abuse Attack (P1/P2)

**Impact:** Service overloaded, legitimate users blocked
**Detection:** 429 spike > 20%, request rate 10x normal, WAF triggers

**Mitigation:**
1. Confirm attack: check request logs for IP patterns
2. Enable Vercel WAF: Aggressive mode
3. Create IP blocklist and deploy to edge middleware
4. Scale resources if needed
5. Update status page (operational issue, not "DDoS")

**Recovery:**
- Monitor for new attack IPs, add to blocklist
- Whitelist legitimate traffic (CDNs, cloud providers)
- Keep WAF in aggressive mode for 24 hours
- Set up automated IP blocking for high-rate IPs

**Prevention:** Rate limiting per IP/user, continuous request monitoring, WAF enabled by default

---

### 8. Data Breach / Unauthorized Access (P1)

**Impact:** User data exposed, account compromise potential
**Detection:** Anomalous data access patterns, user reports, third-party leak alerts

**Mitigation (Immediate):**
1. Confirm breach: check audit logs, database queries, API logs
2. Do NOT shut down (preserve evidence), isolate if possible
3. Enable detailed logging everywhere
4. Revoke compromised access: force password reset, rotate API keys
5. Immediately escalate to CTO and Security Officer

**Recovery:**
1. Security audit: Firestore rules, service accounts, API keys
2. Fix root cause (code vulnerability, permission issue)
3. User notification: what compromised, when, steps to take
4. Enhanced monitoring: bulk read alerts, unusual API patterns

**Prevention:** Quarterly security review, least privilege, key rotation monthly, MFA required

---

## Detection & Triage

### Health Check Endpoints

**`/api/health`** - Quick check (2 sec)
- Firebase auth, Stripe API status
- Alert if non-200

**`/api/health/deep`** - Deep check (10 sec)
- All services: Firebase, Firestore, Storage, Redis, Stripe, OpenAI, Stability, Replicate, Google AI, Twilio, Sharp
- Metrics: error rate (5 min), p95 latency, memory %, Firestore connections
- Alert if critical service unhealthy, if metrics exceed thresholds

### Monitoring Dashboard URLs

- Vercel: https://vercel.com/idesaign
- Sentry: https://sentry.io/organizations/idesaign/issues/
- Stripe: https://dashboard.stripe.com
- Firebase: https://console.firebase.google.com
- Upstash: https://console.upstash.com

---

## Post-Incident Procedures

### Blameless Postmortem (Within 48 hours for P1, 1 week for P2)

Document in `/incidents/INC-YYYYMMDD-001.md`:

1. **Timeline:** Detailed events with timestamps
2. **Root Cause:** Why the incident happened
3. **Impact:** Duration, affected users, failed requests, data loss, financial impact
4. **Contributing Factors:** Why wasn't this caught?
5. **Action Items:** What changes prevent recurrence
6. **Lessons Learned:** What did we learn?

### 5 Whys Analysis

Ask "Why?" 5 times to find systemic issue, not symptom:

```
Why did N+1 query happen?
→ Code refactored without query optimization

Why wasn't caught in code review?
→ Reviewer didn't check query performance

Why no automatic monitoring?
→ Health check doesn't track Firestore query count

Why no load test?
→ Load test process not formalized

Why not formalized?
→ Fix: Make load testing mandatory before deploy
```

### Incident Log

Track all incidents for trends:
```
| Date | ID | Severity | Service | Duration | Root Cause |
```

---

## Quick Reference

### When to Page
- **L2:** P1 started, P2 unresolved 30+ min, unknown cause
- **L3:** P1 started, security/breach, external communication needed

### Useful Commands

```bash
vercel deployments list --limit 5
vercel logs --tail --follow
vercel logs | grep -c "error"
vercel rollback
curl https://idesaign.vercel.app/api/health
curl https://idesaign.vercel.app/api/health/deep
redis-cli -h $UPSTASH_REDIS_URL PING
```

### Status Page Links
- Public: https://status.idesaign.io
- Upstash: https://upstash.statuspage.io
- Firebase: https://firebase.google.com/status
- Vercel: https://www.vercel-status.com
- Stripe: https://status.stripe.com

---

**Document History:** Version 1.0, 2025-02-11  
**Next Review:** 2025-05-11  
**Owner:** DevOps Team

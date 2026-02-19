# Idesaign Operations Quick Reference

**Emergency? Go to [INCIDENT_RESPONSE.md](./runbooks/INCIDENT_RESPONSE.md)**

---

## Severity Classification (Quick)

| Severity | Response | Duration | When |
|----------|----------|----------|------|
| **P1 Critical** | 15 min | ~1 hour | Full outage, data loss, security breach |
| **P2 High** | 1 hour | ~4 hours | Major feature down, payment failures |
| **P3 Medium** | 4 hours | ~1 day | Minor feature broken, workaround exists |
| **P4 Low** | 24 hours | ~1 week | Cosmetic issue, non-blocking bug |

---

## Incident Checklist (First 5 Minutes)

```
1. [ ] Alert confirmed real (not false positive)
2. [ ] Check health endpoints:
       curl https://idesaign.vercel.app/api/health
       curl https://idesaign.vercel.app/api/health/deep
3. [ ] Determine severity (P1, P2, P3, P4)
4. [ ] Post to Slack: "P[N] INC-[ID]: [Description]"
5. [ ] For P1/P2: Create incident Slack channel
6. [ ] For P1/P2: Update status page as "Investigating"
7. [ ] Start gathering logs: vercel logs --tail
8. [ ] Check external status pages (Firebase, Stripe, etc.)
```

---

## Escalation Rules (Quick)

```
IMMEDIATELY page on-call L2 if:
✓ P1 incident started
✓ P2 unresolved after 30 minutes
✓ Unknown root cause

IMMEDIATELY page L3 (CTO) if:
✓ P1 incident started
✓ Possible security breach
✓ Data loss detected
```

---

## Health Check Interpretation

**`/api/health` responses:**

| Response | Meaning | Action |
|----------|---------|--------|
| 200 OK + healthy | All systems good | Continue monitoring |
| 200 OK + degraded | Some service struggling | Check /api/health/deep |
| Non-200 | Critical failure | P1 incident, page L1/L2 |

**`/api/health/deep` services to check:**
- firebase_auth: If unhealthy → Auth will fail for new logins
- firestore: If unhealthy → Data persistence fails
- redis: If unhealthy → Cache disabled, rate limiting degrades
- stripe_api: If unhealthy → Payments may fail
- ai_providers: If unhealthy → AI features disabled/failover

---

## Common Failures (Quick Response)

### Firebase Auth Down
```
1. Check status at: https://firebase.google.com/status
2. Enable read-only mode in UI
3. Cache tokens for 24 hours
4. Auto-recovers (no manual action needed)
```

### Redis Down
```
1. Check Upstash status: https://upstash.statuspage.io
2. Automatic failover in progress
3. Fall back to in-memory rate limiting
4. Users see slightly slower responses
5. Auto-recovers
```

### Payment Processing Down
```
1. Check Stripe status: https://status.stripe.com
2. Queue payments to database
3. Stripe auto-retries for 72 hours
4. Manual replay if needed: stripe events resend
```

### High Error Rate
```
1. Check Sentry for error pattern
2. Correlate with recent deployments
3. If recent deploy: vercel rollback
4. Otherwise: check external dependencies
```

### DDoS Attack
```
1. Check for IP pattern in logs
2. Enable Vercel WAF: Aggressive mode
3. Block attacking IPs
4. Monitor for more attackers
```

---

## Critical Commands (Copy-Paste)

```bash
# Check health
curl https://idesaign.vercel.app/api/health/deep | jq

# View logs
vercel logs --tail --follow

# Find error patterns
vercel logs | grep ERROR | head -20

# Rollback immediately
vercel rollback

# Check Upstash Redis
redis-cli -h $UPSTASH_REDIS_URL PING

# Check current deployment
vercel deployments list --limit 5

# Check error rate
vercel logs | tail -1000 | grep -c "error"
```

---

## Status Page Updates

**Format for Slack + Status Page:**

```
🔴 INCIDENT: P1 INC-20250211-001
Title: Firebase Auth Service Down
Status: Investigating
Impact: All users unable to login
Started: 2025-02-11 10:30 UTC
Last Update: 2025-02-11 10:45 UTC

--- At resolution ---

✅ RESOLVED: INC-20250211-001
Root Cause: Firebase API endpoint unresponsive
Resolution: Firebase auto-recovered
Duration: 15 minutes
Action Items: [Links to postmortem actions]
```

---

## Team Notification Template

```
@oncall P[N] Incident: [Service Name]

Severity: P[N] ([Response Time])
Status: [Investigating/Mitigating/Resolved]
Impact: [Who/what affected]
Started: [Time UTC]

Key Info:
- Error Rate: [X]%
- Affected Users: ~[Y]
- Root Cause: [If known]

Runbook: [Link to relevant section]
Next Update: [Time UTC or "On resolution"]

[War Room]: https://slack.com/archives/[channel]
```

---

## Postmortem Reminder (Within 48 hours)

After resolution:
```
1. [ ] Create postmortem doc at /incidents/INC-YYYYMMDD-001.md
2. [ ] Timeline with UTC timestamps
3. [ ] Root cause analysis (5 Whys)
4. [ ] Contributing factors
5. [ ] Action items (what prevents this next time)
6. [ ] Schedule retrospective meeting
7. [ ] Update runbooks if needed
```

---

## Monitor Dashboard Metrics

Watch these during and after incident:

```
CRITICAL (Red Alert):
- Error rate > 5%
- Health check non-200
- Any service: unhealthy

WARNING (Yellow Alert):
- Error rate > 1%
- P95 latency > 5s
- Memory > 80%
- Any service: degraded

GOOD (Green):
- Error rate < 0.5%
- P95 latency < 2s
- All services healthy
- Uptime > 99.9%
```

---

## Quick Links

**Status Pages:**
- Firebase: https://firebase.google.com/status
- Stripe: https://status.stripe.com
- Upstash: https://upstash.statuspage.io
- Vercel: https://www.vercel-status.com

**Dashboards:**
- Sentry: https://sentry.io/organizations/idesaign/
- Vercel: https://vercel.com/idesaign
- Firebase Console: https://console.firebase.google.com

**Slack Channels:**
- Emergency: #incident-critical
- Ops: #operations
- Errors: #errors
- Deployments: #deployments

**Runbooks:**
- Master: [INCIDENT_RESPONSE.md](./runbooks/INCIDENT_RESPONSE.md)
- Degradation: [GRACEFUL_DEGRADATION.md](./runbooks/GRACEFUL_DEGRADATION.md)
- Deploy: [DEPLOYMENT_CHECKLIST.md](./runbooks/DEPLOYMENT_CHECKLIST.md)

---

## When in Doubt

1. **Don't panic** - We have procedures for this
2. **Assess real impact** - Is it actually affecting users?
3. **Classify severity** - P1? P2? P3?
4. **Check health endpoints** - Tells you what's down
5. **Check status pages** - External service issue?
6. **Gather logs** - `vercel logs --tail`
7. **Post status update** - Keep team informed
8. **Execute runbook** - Follow the steps
9. **Escalate if needed** - Don't be a hero
10. **Document everything** - For postmortem

---

**Last Updated:** 2025-02-11  
**Owner:** DevOps Team  
**Emergency?** Page on-call: #oncall Slack or PagerDuty

# Idesaign Operations & Incident Response

Enterprise-grade incident response, monitoring, and deployment procedures for the Idesaign platform.

**Last Updated:** 2025-02-11  
**Status:** Production Ready

---

## Quick Start

### For On-Call Engineers

1. **Emergency:** Go to [INCIDENT_RESPONSE.md](./runbooks/INCIDENT_RESPONSE.md)
   - Severity classification
   - Incident response workflow
   - Common failure modes

2. **Service Down:** Check [GRACEFUL_DEGRADATION.md](./runbooks/GRACEFUL_DEGRADATION.md)
   - What works when each service fails
   - Automatic fallback strategies
   - Recovery procedures

3. **Alerts:** See [alerts/alert-config.ts](./alerts/alert-config.ts)
   - All configured alerts
   - Alert thresholds and windows
   - Alert routing (Slack, PagerDuty, email)

### For Deployment

1. Use [DEPLOYMENT_CHECKLIST.md](./runbooks/DEPLOYMENT_CHECKLIST.md)
   - Pre-deployment tests
   - Deployment steps
   - Post-deployment verification
   - Rollback procedures

---

## Directory Structure

```
ops/
├── README.md                          # This file
├── runbooks/                          # Incident response procedures
│   ├── INCIDENT_RESPONSE.md          # Master incident runbook (400 lines)
│   ├── GRACEFUL_DEGRADATION.md       # Service degradation guide (200 lines)
│   └── DEPLOYMENT_CHECKLIST.md       # Deployment procedures (150 lines)
└── alerts/                            # Monitoring and alerting
    ├── alert-config.ts                # Alert rules configuration (200 lines)
    └── health-monitor.ts              # Health monitoring service (300 lines)
```

---

## Key Documents

### 1. INCIDENT_RESPONSE.md (~400 lines)
Master incident response runbook covering:

- **Severity Classification:** P1 (15 min), P2 (1 hour), P3 (4 hours), P4 (24 hours)
- **Escalation Path:** L1 (on-call) → L2 (tech lead) → L3 (CTO)
- **Incident Workflow:** Detection → Investigation → Mitigation → Resolution → Postmortem
- **Common Failures:** 8 detailed failure modes with detection, mitigation, and recovery steps:
  1. Firebase Auth Down
  2. Redis/Upstash Failure
  3. AI Provider Outage
  4. Stripe Webhook Failure
  5. High Error Rate
  6. Memory/CPU Spike
  7. DDoS/Abuse Attack
  8. Data Breach
- **Health Checks:** `/api/health` and `/api/health/deep` endpoints
- **Postmortem Template:** Blameless analysis with 5 Whys
- **Action Items:** Preventing recurrence

**Use When:**
- Alerted to an incident
- Need incident classification
- Need response procedure
- Need to understand failure mode
- Conducting postmortem

### 2. GRACEFUL_DEGRADATION.md (~200 lines)
Service degradation strategies:

| Service | Impact When Down | Degradation Strategy |
|---------|------------------|---------------------|
| Firebase Auth | All auth fails | Cached token validation, read-only mode |
| Firestore | Data unavailable | In-memory cache, queue writes to IndexedDB |
| Redis | No caching, rate limit degrades | Fail-open, bypass cache, direct reads |
| OpenAI | Text generation fails | Automatic failover to Stability AI |
| Stability AI | Background removal fails | Failover to Replicate |
| Replicate | Model inference fails | Fallback to Google AI or disable |
| Google AI | Limited features | Disable feature, show message |
| Stripe | Payments queued | Auto-retry for 72 hours, manual replay |
| Twilio | SMS fails | Fallback to email notifications |
| Sharp | Image processing slow | Browser-side processing fallback |
| Vercel | Entire app down | DNS failover to static page |

**Use When:**
- Need to understand what happens when a service fails
- Implementing fallback/degradation strategy
- Need to understand data loss risks
- Assessing blast radius of a service failure

### 3. alert-config.ts (~200 lines)
Complete alert configuration:

**Critical Alerts (P1):**
- High error rate (>5%, 5 min)
- Health check failure (immediate)
- Firebase auth unavailable (1 min)
- Firestore down (1 min)
- Redis down (immediate)
- Stripe webhook failures (>10%, 15 min)

**Warning Alerts (P2):**
- P95 latency (>5s, 5 min)
- Rate limit spike (>20%, 10 min)
- AI circuit breaker open (immediate)
- Memory usage high (>80%, 5 min)
- Cache hit rate low (<50%, 30 min)
- Write queue depth (>100, 5 min)

**Info Alerts (P3/P4):**
- SSL certificate expiry (<14 days)
- New error patterns
- Firestore cost spike (2x baseline)

**Features:**
- Severity mapping
- Channel routing (Slack, PagerDuty, email, SMS)
- Cooldown periods
- Runbook links
- Custom alert logic

### 4. health-monitor.ts (~300 lines)
TypeScript health monitoring service:

**Features:**
- Continuous health checking (`/api/health` every 1 min)
- Deep health checking (`/api/health/deep` less frequent)
- Incident tracking with timeline
- Uptime calculations (24h, 7d, 30d)
- Event emission for integrations
- Prometheus metrics export
- Dashboard-ready JSON export

**Usage:**
```typescript
import { healthMonitor } from './ops/alerts/health-monitor';

healthMonitor.start(); // Start monitoring

healthMonitor.on('status_change', ({ from, to, incident }) => {
  // Trigger alerts, create incidents, etc.
});

healthMonitor.on('service_unhealthy:firebase_auth', () => {
  // Handle specific service failure
});

const metrics = healthMonitor.exportMetrics();
// Use for dashboard, Prometheus, etc.
```

### 5. DEPLOYMENT_CHECKLIST.md (~150 lines)
Deployment procedures:

**Pre-Deployment (30 min before):**
- Code quality: TypeScript, tests, coverage
- Code review: Approval, conflicts, secrets
- Testing: Unit, E2E, load testing
- Staging verification: All critical paths

**Deployment (5-15 min):**
- Deploy to production
- Monitor build logs
- Verify health checks
- Test critical journeys

**Post-Deployment (15-60 min):**
- Monitor error rate
- Monitor latency
- Verify all features work
- Watch for cascading failures

**Rollback:**
- When to rollback (error rate > 10%)
- How to rollback (3 methods)
- Verification steps
- Post-rollback analysis

---

## Alert Routing

### Critical Alerts (P1)
- **Primary:** Slack #incident-critical
- **Secondary:** PagerDuty (pages on-call engineer)
- **Tertiary:** Email + SMS (executive notification)

### Warning Alerts (P2)
- **Primary:** Slack #operations
- **Secondary:** PagerDuty (if escalated)
- **Tertiary:** Email (if escalated after 30 min)

### Info Alerts (P3/P4)
- **Primary:** Slack #errors
- **Secondary:** Email (for non-real-time)

---

## Health Check Endpoints

### `/api/health` - Quick Check (2 seconds)
Returns critical service status. Alerts if non-200.

```bash
curl https://idesaign.vercel.app/api/health
# {
#   "status": "healthy",
#   "timestamp": "2025-02-11T10:30:00Z",
#   "checks": {
#     "firebase_auth": "healthy",
#     "stripe_api": "healthy"
#   }
# }
```

### `/api/health/deep` - Deep Check (10 seconds)
Returns all services, database connections, metrics. Used for detailed diagnostics.

```bash
curl https://idesaign.vercel.app/api/health/deep
# {
#   "status": "healthy",
#   "checks": {
#     "firebase_auth": "healthy",
#     "firestore": "healthy",
#     "redis": "healthy",
#     "openai_api": "healthy",
#     // ... more checks
#   },
#   "metrics": {
#     "error_rate_5min": 0.2,
#     "p95_latency_ms": 1200,
#     "memory_usage_percent": 65
#   }
# }
```

---

## Incident Response Workflow

### Phase 1: Detection (0-5 min)
1. Alert triggered (automated or manual)
2. Verify it's real (check dashboards)
3. Classify severity (P1, P2, P3, P4)
4. Create incident ticket (INC-YYYYMMDD-001)
5. Post to Slack: "P[N] INC-001: Brief description"

### Phase 2: Investigation (5-30 min)
1. Gather logs: `vercel logs --tail`
2. Check health endpoints
3. Identify root cause
4. Post updates every 10 min

### Phase 3: Mitigation (Parallel to investigation)
1. Quick fixes (restart, rollback, failover)
2. Workarounds (disable feature, scale resources)
3. Full recovery (deploy fix)

### Phase 4: Resolution (30-60 min total)
1. Verify error rate normal
2. Test critical paths
3. Update status page
4. Close incident ticket

### Phase 5: Postmortem (Within 48 hours)
1. Timeline of events
2. Root cause analysis (5 Whys)
3. Contributing factors
4. Action items (what prevents recurrence)
5. Lessons learned

---

## Escalation Timeline

**P1 Critical Incident:**
```
T+0:      Alert L1 engineer
T+5:      Alert L2 tech lead
T+15:     Alert L3 CTO
T+30:     Executive status update
T+60:     All-hands postmortem scheduled
```

**P2 High Incident:**
```
T+0:      Alert L1 engineer
T+30:     If unresolved, alert L2
T+60:     Tech lead takes over
T+120:    If still unresolved, escalate to L3
```

**P3 Medium Incident:**
```
T+0:      Alert L1 engineer (business hours)
T+240:    If unresolved, escalate to L2
SLA:      Resolve within 4 hours
```

---

## Common Commands

```bash
# Check deployment status
vercel deployments list --limit 5

# View real-time logs
vercel logs --tail --follow

# Search error logs
vercel logs | grep -i error

# Rollback to previous version
vercel rollback

# Check health endpoints
curl https://idesaign.vercel.app/api/health
curl https://idesaign.vercel.app/api/health/deep

# Connect to Redis
redis-cli -h $UPSTASH_REDIS_URL PING

# Check TypeScript
npm run lint

# Run tests
npm run test

# Build locally
npm run build
```

---

## Integration Points

### Slack
- Alert routing to #incident-critical, #operations, #deployments
- Incident war room channels
- Real-time status updates
- Integration with Sentry for error notifications

### PagerDuty
- Escalation policies
- On-call schedules
- Incident acknowledgment
- Integration with alert-config.ts

### Sentry
- Error tracking and grouping
- Release tracking
- Replay videos
- Alert generation

### Vercel
- Deployment management
- Environment variables
- Logs and monitoring
- Function scaling

### Firebase
- Authentication
- Firestore database
- Storage
- Status page monitoring

### Stripe
- Payment processing
- Webhook handling
- API key management

---

## Metrics Dashboard

Create a dashboard showing:

**Real-Time:**
- Error rate (target: < 1%)
- P95 latency (target: < 2s)
- Health status (target: green)
- Active incidents (target: 0)

**24-Hour Trends:**
- Uptime percentage (target: 99.99%)
- Error budget remaining (target: > 95%)
- Incident count (target: 0)

**System Health:**
- Memory usage (target: < 70%)
- Database connections (target: stable)
- Rate limit 429s (target: < 1% of traffic)
- API latency (target: < 1s p50)

---

## SLAs & SLOs

**Uptime SLA:**
- Platform: 99.99% uptime per month
- = ~4.3 minutes of acceptable downtime
- Error budget: ~43 errors per million requests

**Response Time SLA:**
- P95 latency: < 5 seconds
- P99 latency: < 10 seconds
- Health check: < 2 seconds

**Incident Response SLA:**
- P1: Response within 15 minutes
- P2: Response within 1 hour
- P3: Response within 4 hours

---

## Key Contacts

**On-Call Schedule:**
- View at: [Link to on-call calendar]
- Rotation: Weekly (Saturdays 12:00 PM)

**Team Channels:**
- #operations - General ops discussion
- #incident-critical - P1 incidents only
- #incident-p2 - P2 incidents
- #deployments - Deployment notifications
- #errors - Error tracking discussions

**External Status Pages:**
- Vercel: https://www.vercel-status.com
- Firebase: https://firebase.google.com/status
- Stripe: https://status.stripe.com
- Upstash: https://upstash.statuspage.io

---

## Document Maintenance

| Document | Review Frequency | Owner |
|----------|------------------|-------|
| INCIDENT_RESPONSE.md | Quarterly | DevOps Lead |
| GRACEFUL_DEGRADATION.md | Quarterly | Architecture |
| alert-config.ts | Monthly | DevOps |
| DEPLOYMENT_CHECKLIST.md | Quarterly | Tech Lead |
| health-monitor.ts | As needed | DevOps |

**Last Updated:** 2025-02-11  
**Next Review:** 2025-05-11  
**Reviewers:** DevOps Team, Tech Leads

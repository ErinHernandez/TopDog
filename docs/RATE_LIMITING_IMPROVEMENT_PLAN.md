# Rate Limiting Improvement Plan

## Executive Summary

This plan outlines improvements to the rate limiting system to address security weaknesses while maintaining VPN/proxy access for legitimate users. The focus is on **monitoring and detection** rather than strict blocking, aligning with the principle that users should be able to access the platform regardless of geographic restrictions.

## Current State Analysis

### Existing Weaknesses

1. **IP-Only Identification**
   - Rate limits use only IP addresses
   - Easily bypassed with VPNs/proxies
   - Shared IPs (NAT/proxy) cause false positives

2. **Firestore-Based Storage**
   - Expensive: Every request = Firestore transaction
   - Slow: Adds 50-200ms latency per request
   - Doesn't scale horizontally across server instances
   - Fail-open on errors (disables rate limiting when Firestore is down)

3. **No Progressive Limits**
   - Same limits for authenticated and unauthenticated users
   - No benefit for legitimate users with accounts

4. **No Suspicious Pattern Detection**
   - Can't detect coordinated attacks across multiple IPs
   - No monitoring of VPN abuse patterns
   - No alerts for unusual activity

### Current Limits

| Endpoint | Limit | Window | Risk Level |
|----------|-------|--------|------------|
| Signup | 3/hour | 1 hour | 🔴 High (easily bypassed) |
| Username Check | 30/min | 1 minute | 🟡 Medium (enumeration risk) |
| Payment Intent | 20/min | 1 minute | 🟡 Medium (cost risk) |
| Login | 5 | 15 min | 🟢 Low (has auth checks) |

## Design Principles

1. **VPN/Proxy Access Maintained**
   - Never block based on VPN detection
   - Allow legitimate users from restricted regions
   - Focus on behavior, not location

2. **Monitoring Over Blocking**
   - Detect suspicious patterns
   - Log for manual review
   - Only block clear abuse cases

3. **Progressive Limits**
   - Higher limits for authenticated users
   - Device ID presence increases limits
   - Reward legitimate usage patterns

4. **Performance First**
   - In-memory storage (fast)
   - Firestore as backup/audit trail only
   - Minimal latency impact

5. **Multi-Factor Identification**
   - IP + User ID + Device ID
   - Use most specific identifier available
   - Track at multiple levels for monitoring

## Proposed Architecture

### Component 1: Enhanced Rate Limiter (V2)

**Location:** `lib/rateLimiterV2.js`

**Features:**
- In-memory storage (Map-based) for primary checks
- Multi-factor client identification:
  - Level 1: IP only (unauthenticated)
  - Level 2: IP + Device ID
  - Level 3: User ID (authenticated)
  - Level 4: User ID + Device ID (best tracking)
- Progressive limits based on authentication status
- Firestore fallback for persistence across restarts (optional)

**Key Methods:**
```javascript
class RateLimiterV2 {
  // Primary check method
  async check(req) {
    // 1. Get multi-factor identifier
    // 2. Calculate effective limit (progressive)
    // 3. Check all relevant levels
    // 4. Monitor for suspicious patterns
    // 5. Return result
  }
  
  // Monitoring
  monitorActivity(clientId, result, effectiveLimit)
  detectSuspiciousPatterns(clientId)
  getMonitoringStats()
}
```

### Component 2: Device Fingerprinting Helper

**Location:** `lib/rateLimiting/deviceFingerprint.js`

**Purpose:** Extract device ID from request headers (sent by client)

**Implementation:**
- Client sends `X-Device-ID` header (from localStorage)
- Server validates format
- Falls back gracefully if missing
- Never blocks if device ID unavailable

**Client Integration:**
- Use existing `lib/userMetrics.js` device ID
- Send in API request headers
- Optional (doesn't break if missing)

### Component 3: Monitoring Service

**Location:** `lib/rateLimiting/monitoringService.js`

**Purpose:** Track suspicious patterns without blocking

**Tracks:**
1. **High Activity IPs**
   - IPs approaching limits
   - Multiple endpoints from same IP
   - Rapid request patterns

2. **Suspicious User Patterns**
   - Multiple IPs per user in short time
   - Multiple devices per user
   - Unusual endpoint combinations

3. **VPN/Proxy Indicators** (for monitoring only)
   - Rapid IP switching
   - Geographic inconsistencies
   - Known VPN IP ranges (info only, not blocking)

**Storage:**
- In-memory for real-time monitoring
- Periodic export to Firestore for analysis
- Auto-cleanup after 24 hours

### Component 4: Updated Rate Limit Configuration

**Location:** `lib/rateLimitConfigV2.js`

**Changes:**
- Progressive limits based on auth status
- Monitoring thresholds
- Alert configurations

**Example Config:**
```javascript
{
  signup: {
    baseLimit: 3,           // Per hour
    authenticatedMultiplier: 2,  // 6/hour for authenticated
    deviceMultiplier: 1.5,        // 9/hour with device ID
    monitorThreshold: 0.8,        // Monitor at 80%
    alertThreshold: 0.95,         // Alert at 95%
  }
}
```

## Implementation Plan

### Phase 1: Core Infrastructure (Week 1)

**Tasks:**
1. ✅ Create `RateLimiterV2` class with in-memory storage
2. ✅ Implement multi-factor client identification
3. ✅ Add progressive limit calculation
4. ✅ Create device fingerprinting helper
5. ✅ Add basic monitoring hooks

**Files to Create:**
- `lib/rateLimiterV2.js` (already created)
- `lib/rateLimiting/deviceFingerprint.js`
- `lib/rateLimiting/monitoringService.js`
- `lib/rateLimitConfigV2.js`

**Testing:**
- Unit tests for rate limiter logic
- Test progressive limits
- Test multi-factor identification
- Test monitoring detection

### Phase 2: Integration (Week 2)

**Tasks:**
1. Update high-risk endpoints to use V2:
   - `/api/auth/signup`
   - `/api/auth/username/check`
   - `/api/stripe/payment-intent`
2. Add device ID header extraction in API middleware
3. Integrate monitoring service
4. Add monitoring dashboard/endpoint (admin only)

**Files to Modify:**
- `pages/api/auth/signup.js`
- `pages/api/auth/username/check.js`
- `pages/api/stripe/payment-intent.ts`
- `lib/apiAuth.js` (add device ID extraction)

**Migration Strategy:**
- Run V1 and V2 in parallel initially
- Compare results
- Gradually migrate endpoints
- Keep V1 as fallback

### Phase 3: Monitoring & Alerts (Week 3)

**Tasks:**
1. Create monitoring dashboard (admin)
2. Set up alert thresholds
3. Add Firestore export for historical analysis
4. Create admin API for viewing monitoring stats

**Files to Create:**
- `pages/admin/rate-limit-monitoring.js`
- `pages/api/admin/rate-limit-stats.ts`
- `lib/rateLimiting/firestoreExporter.js`

**Alert Types:**
- High activity IPs (>95% of limit)
- Suspicious user patterns (5+ IPs in 1 hour)
- Coordinated attacks (same pattern across IPs)

### Phase 4: Optimization & Documentation (Week 4)

**Tasks:**
1. Performance optimization
2. Add comprehensive logging
3. Document monitoring patterns
4. Create runbook for responding to alerts
5. Update security documentation

**Deliverables:**
- Performance benchmarks
- Monitoring runbook
- Security documentation update
- Admin training materials

## Progressive Limits Strategy

### Unauthenticated Users
- Base limits (current values)
- IP + Device ID = 1.5x multiplier
- Example: Signup 3/hour → 4.5/hour with device ID

### Authenticated Users
- Base limit × 2 (authenticated multiplier)
- With device ID: Base × 2 × 1.5
- Example: Signup 3/hour → 6/hour (auth) → 9/hour (auth + device)

### Rationale
- Legitimate users benefit from authentication
- Device ID helps distinguish real users from bots
- Still allows VPN users (no blocking)
- Higher limits reduce false positives

## Monitoring Thresholds

### Activity Levels

| Usage % | Action |
|---------|--------|
| 0-50% | Normal - no action |
| 50-80% | Logged - normal monitoring |
| 80-95% | **Monitor** - flag for review |
| 95-100% | **Alert** - immediate attention |
| >100% | **Blocked** - rate limit exceeded |

### Suspicious Patterns

1. **Rapid IP Switching**
   - 5+ unique IPs per user in 1 hour
   - Flag for review (may be VPN or abuse)

2. **Coordinated Activity**
   - Same endpoint pattern across multiple IPs
   - Same device fingerprint across IPs
   - Potential bot network

3. **Unusual Endpoint Combinations**
   - Signup → Payment → Export in rapid succession
   - Multiple username checks from same IP
   - Potential enumeration attack

## Migration Strategy

### Option A: Gradual Migration (Recommended)
1. Deploy V2 alongside V1
2. Migrate high-risk endpoints first
3. Monitor for 1 week
4. Migrate remaining endpoints
5. Deprecate V1 after 1 month

### Option B: Big Bang
1. Deploy V2 to all endpoints
2. Keep V1 as fallback
3. Monitor closely for issues
4. Remove V1 after 2 weeks

**Recommendation:** Option A (gradual) for safety

## Performance Targets

### Latency
- **Current:** 50-200ms per request (Firestore)
- **Target:** <10ms per request (in-memory)
- **Improvement:** 5-20x faster

### Cost
- **Current:** ~$0.10 per 1000 requests (Firestore reads/writes)
- **Target:** ~$0.001 per 1000 requests (in-memory + periodic export)
- **Improvement:** 100x cost reduction

### Scalability
- **Current:** Limited by Firestore transaction limits
- **Target:** Scales with server memory
- **Improvement:** Horizontal scaling possible

## Security Considerations

### What We're NOT Doing
- ❌ Blocking VPNs/proxies
- ❌ IP reputation blocking
- ❌ Geographic restrictions
- ❌ Strict device fingerprinting (can be spoofed)

### What We ARE Doing
- ✅ Monitoring suspicious patterns
- ✅ Progressive limits for legitimate users
- ✅ Multi-factor identification
- ✅ Alerting for manual review
- ✅ Logging for forensic analysis

## Risk Assessment

### Low Risk
- ✅ In-memory storage (fast, but lost on restart)
- ✅ Monitoring only (doesn't break existing flows)
- ✅ Gradual migration (can rollback)

### Medium Risk
- ⚠️ Device ID extraction (needs client changes)
- ⚠️ Monitoring overhead (memory usage)
- ⚠️ False positives (need tuning)

### Mitigation
- Firestore backup for critical data
- Monitoring dashboard for visibility
- Gradual rollout with monitoring
- Configurable thresholds

## Success Metrics

### Performance
- [ ] <10ms latency per rate limit check
- [ ] 100x cost reduction vs Firestore
- [ ] 99.9% uptime for rate limiting

### Security
- [ ] Detect 90%+ of suspicious patterns
- [ ] <1% false positive rate
- [ ] Alert response time <5 minutes

### User Experience
- [ ] No impact on legitimate users
- [ ] VPN users can still access
- [ ] Progressive limits benefit authenticated users

## Open Questions

1. **Device ID Client Integration**
   - How to ensure all clients send device ID?
   - Fallback strategy if missing?
   - Privacy considerations?

2. **Monitoring Storage**
   - How long to keep monitoring data?
   - Firestore export frequency?
   - Admin dashboard access control?

3. **Alert Response**
   - Who receives alerts?
   - Automated response actions?
   - Escalation procedures?

4. **Rollback Plan**
   - How to quickly revert to V1?
   - Data migration if needed?
   - Communication plan?

## Next Steps

1. **Review & Approve Plan**
   - Stakeholder review
   - Security team approval
   - Performance team sign-off

2. **Create Detailed Specs**
   - API contracts
   - Data models
   - Monitoring schemas

3. **Begin Implementation**
   - Start with Phase 1
   - Weekly progress reviews
   - Adjust based on learnings

## Appendix: Code Structure

```
lib/
├── rateLimiterV2.js              # Main rate limiter class
├── rateLimitConfigV2.js           # Configuration
└── rateLimiting/
    ├── deviceFingerprint.js       # Device ID extraction
    ├── monitoringService.js        # Pattern detection
    └── firestoreExporter.js       # Data export

pages/
├── api/
│   └── admin/
│       └── rate-limit-stats.ts    # Monitoring API
└── admin/
    └── rate-limit-monitoring.js   # Dashboard
```

## References

- Current implementation: `lib/rateLimiter.js`
- Device tracking: `lib/userMetrics.js`
- Fraud detection: `lib/fraudDetection.js`
- Security review: `COMPREHENSIVE_CODE_REVIEW_2025.md`

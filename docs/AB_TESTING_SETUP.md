# A/B Testing Setup for VX2 Migration

**Purpose:** Guide for setting up and monitoring A/B testing during VX2 migration  
**Date:** January 2025  
**Status:** Phase 1C - Migration Testing

---

## Overview

The middleware now supports gradual rollout of VX2 draft rooms with A/B testing capabilities.

### How It Works

1. **Consistent User Assignment**: Users are assigned to VX2 or legacy based on a hash of their identifier
2. **Gradual Rollout**: Percentage can be adjusted from 0% to 100%
3. **Stable Assignment**: Same user always gets same version (until rollout increases)

---

## Configuration

### Environment Variables

**Primary (Recommended):**
```bash
VX2_ROLLOUT_PERCENTAGE=0.10  # 10% rollout (A/B test start)
```

**Legacy (Deprecated):**
```bash
ENABLE_DRAFT_REDIRECTS=true  # 100% rollout (full migration)
```

### Rollout Stages

| Stage | Percentage | Duration | Purpose |
|-------|------------|----------|---------|
| A/B Test | 0.10 (10%) | 1 week | Initial validation |
| Gradual 1 | 0.25 (25%) | 3 days | Expand test |
| Gradual 2 | 0.50 (50%) | 3 days | Half migration |
| Gradual 3 | 0.75 (75%) | 3 days | Near complete |
| Full | 1.0 (100%) | Ongoing | Complete migration |

---

## Setting Up A/B Test

### Step 1: Initial 10% Rollout

```bash
# In Vercel dashboard or .env.local
VX2_ROLLOUT_PERCENTAGE=0.10
```

**What happens:**
- 10% of users visiting `/draft/v2/`, `/draft/v3/`, or `/draft/topdog/` are redirected to `/draft/vx2/`
- 90% stay on legacy versions
- Same users always get same version (stable assignment)

### Step 2: Monitor Metrics

Track for 1 week:

| Metric | How to Measure | Target |
|--------|----------------|--------|
| **Error rate** | Sentry dashboard | VX2 ≤ legacy |
| **Draft completion** | Firestore query | VX2 ≥ legacy |
| **Avg pick time** | Analytics | VX2 ≤ legacy |
| **Support tickets** | Support inbox | No VX2-specific issues |
| **User complaints** | Feedback channels | No increase |

### Step 3: Gradual Increase

If metrics are acceptable, increase rollout:

```bash
# Day 4-6: 25%
VX2_ROLLOUT_PERCENTAGE=0.25

# Day 7-9: 50%
VX2_ROLLOUT_PERCENTAGE=0.50

# Day 10-12: 75%
VX2_ROLLOUT_PERCENTAGE=0.75

# Day 13+: 100%
VX2_ROLLOUT_PERCENTAGE=1.0
```

---

## Monitoring

### Sentry Dashboard

**Query for VX2 errors:**
```
environment:production
tags.draft_version:vx2
```

**Query for legacy errors:**
```
environment:production
tags.draft_version:v2 OR tags.draft_version:v3
```

### Firestore Queries

**Draft completion rate (VX2):**
```javascript
// Firestore query
const vx2Drafts = await db.collection('draftRooms')
  .where('version', '==', 'vx2')
  .where('status', '==', 'completed')
  .get();

const vx2Total = await db.collection('draftRooms')
  .where('version', '==', 'vx2')
  .get();

const vx2CompletionRate = vx2Drafts.size / vx2Total.size;
```

**Draft completion rate (Legacy):**
```javascript
const legacyDrafts = await db.collection('draftRooms')
  .where('version', 'in', ['v2', 'v3', 'topdog'])
  .where('status', '==', 'completed')
  .get();

const legacyTotal = await db.collection('draftRooms')
  .where('version', 'in', ['v2', 'v3', 'topdog'])
  .get();

const legacyCompletionRate = legacyDrafts.size / legacyTotal.size;
```

### Analytics

**Track draft room visits:**
- `/draft/vx2/[roomId]` - VX2 version
- `/draft/v2/[roomId]` - Legacy v2
- `/draft/v3/[roomId]` - Legacy v3
- `/draft/topdog/[roomId]` - Legacy TopDog

**Compare metrics:**
- Page load time
- Time to first pick
- Average session duration
- Bounce rate

---

## Rollback Procedure

### If Issues Detected

**Immediate rollback:**
```bash
# Set to 0% (no redirects)
VX2_ROLLOUT_PERCENTAGE=0.0
```

**What happens:**
- All users revert to legacy versions
- VX2 users redirected back to legacy
- No data loss (drafts continue in Firestore)

### Partial Rollback

If only specific issues:
```bash
# Reduce to lower percentage
VX2_ROLLOUT_PERCENTAGE=0.05  # 5% instead of 10%
```

---

## Response Headers

The middleware adds headers for tracking:

**VX2 Users:**
```
X-VX2-Migration: redirected
X-Rollout-Percentage: 0.10
```

**Legacy Users:**
```
X-VX2-Migration: legacy
X-Rollout-Percentage: 0.10
```

These can be logged in analytics for A/B test analysis.

---

## Testing Locally

### Test 10% Rollout

```bash
# .env.local
VX2_ROLLOUT_PERCENTAGE=0.10

# Visit multiple times with different user agents
# Should see ~10% redirects
```

### Test 100% Rollout

```bash
# .env.local
VX2_ROLLOUT_PERCENTAGE=1.0

# All legacy URLs should redirect
```

### Test Stable Assignment

```bash
# Visit same URL multiple times
# Should always get same version (VX2 or legacy)
# Change user agent to get different assignment
```

---

## Checklist

### Before Starting A/B Test

- [ ] Middleware updated with A/B testing logic
- [ ] Environment variable configured (VX2_ROLLOUT_PERCENTAGE=0.10)
- [ ] Sentry alerts configured for VX2 errors
- [ ] Analytics tracking set up
- [ ] Firestore queries ready for completion rate
- [ ] Support team notified
- [ ] Rollback procedure documented

### During A/B Test (Week 1)

- [ ] Monitor error rates daily
- [ ] Check draft completion rates
- [ ] Review support tickets
- [ ] Track user feedback
- [ ] Document any issues

### After A/B Test

- [ ] Metrics acceptable?
- [ ] No critical issues?
- [ ] Ready for 25% rollout?

---

## Success Criteria

**Proceed to 25% if:**
- ✅ Error rate: VX2 ≤ legacy (or within 5%)
- ✅ Completion rate: VX2 ≥ legacy (or within 5%)
- ✅ No critical bugs
- ✅ No user complaints increase

**Rollback if:**
- ❌ Error rate: VX2 > legacy by >10%
- ❌ Completion rate: VX2 < legacy by >10%
- ❌ Critical bugs found
- ❌ User complaints spike

---

**Last Updated:** January 2025  
**Next Review:** After 1 week of A/B testing

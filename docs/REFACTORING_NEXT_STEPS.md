# Refactoring Plan - Next Steps

**Date:** January 2025  
**Status:** Ready for Phase 1D - Gradual Migration  
**Reference:** TOPDOG_MASTER_REFACTORING_PLAN.md

---

## Current Status Summary

### ✅ Completed Phases

| Phase | Status | Completion |
|-------|--------|------------|
| **Phase 1A: Feature Parity Audit** | ✅ Complete | 100% |
| **Phase 1B: Complete VX2 P0 Features** | ✅ Skipped | N/A (no P0 gaps) |
| **Phase 1C: A/B Testing Setup** | ✅ Complete | 100% |

### ⏳ Next Phase

| Phase | Status | Ready? |
|-------|--------|--------|
| **Phase 1D: Gradual Migration** | ⏳ Ready to Start | ✅ Yes |

---

## What's Been Done

### Phase 1A: Feature Parity Audit ✅

- ✅ Created `docs/DRAFT_ROOM_FEATURE_MATRIX.md` - Comprehensive feature comparison
- ✅ Created `docs/VX2_GAPS.md` - Gap analysis document
- ✅ Verified all P0 (critical) features exist in VX2
- ✅ Identified P1/P2 gaps (deferrable)

**Key Finding:** VX2 has all critical features. No blocking gaps.

### Phase 1C: A/B Testing Setup ✅

- ✅ Updated `middleware.ts` with A/B testing logic
- ✅ Implemented gradual rollout (0% to 100%)
- ✅ Consistent user assignment (stable A/B test)
- ✅ Created `docs/AB_TESTING_SETUP.md` - Complete guide
- ✅ Created `pages/draft/vx2/[roomId].tsx` - Production route
- ✅ Analytics tracking endpoint exists (`/api/analytics/draft-version`)

**Infrastructure Ready:** All code is in place. Just needs environment variable.

---

## Next Steps: Phase 1D - Gradual Migration

### Step 1: Start A/B Test (10% Rollout)

**Action Required:** Set environment variable in production

```bash
# In Vercel dashboard or production environment
VX2_ROLLOUT_PERCENTAGE=0.10
```

**What happens:**
- 10% of users visiting `/draft/v2/`, `/draft/v3/`, or `/draft/topdog/` are redirected to `/draft/vx2/`
- 90% stay on legacy versions
- Same users always get same version (stable assignment)

**Duration:** 1 week

### Step 2: Monitor Metrics

Track these metrics for 1 week:

| Metric | How to Measure | Target |
|--------|----------------|--------|
| **Error rate** | Sentry dashboard | VX2 ≤ legacy |
| **Draft completion** | Firestore query | VX2 ≥ legacy |
| **Avg pick time** | Analytics | VX2 ≤ legacy |
| **Support tickets** | Support inbox | No VX2-specific issues |
| **User complaints** | Feedback channels | No increase |

**Monitoring Resources:**
- Sentry: Filter by `tags.draft_version:vx2`
- Firestore: Query `draftVersionAnalytics` collection
- Analytics: Track `/draft/vx2/[roomId]` vs legacy routes

### Step 3: Gradual Increase (If Metrics Acceptable)

If metrics look good after 1 week, gradually increase:

| Day | Percentage | Environment Variable | Duration |
|-----|------------|---------------------|----------|
| 1-3 | 10% | `VX2_ROLLOUT_PERCENTAGE=0.10` | ✅ Current |
| 4-6 | 25% | `VX2_ROLLOUT_PERCENTAGE=0.25` | 3 days |
| 7-9 | 50% | `VX2_ROLLOUT_PERCENTAGE=0.50` | 3 days |
| 10-12 | 75% | `VX2_ROLLOUT_PERCENTAGE=0.75` | 3 days |
| 13+ | 100% | `VX2_ROLLOUT_PERCENTAGE=1.0` | Ongoing |

### Step 4: Full Migration (After 100% Stable)

Once 100% rollout is stable for 1+ week:
- Proceed to **Phase 1E: Legacy Cleanup** (delete old code)

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

If only minor issues:
```bash
# Reduce to lower percentage
VX2_ROLLOUT_PERCENTAGE=0.05  # 5% instead of 10%
```

---

## Checklist for Starting Phase 1D

### Before Starting A/B Test

- [ ] Review `docs/AB_TESTING_SETUP.md` for complete details
- [ ] Verify VX2 route works: `/draft/vx2/[roomId]`
- [ ] Test middleware locally with `VX2_ROLLOUT_PERCENTAGE=0.10`
- [ ] Set up Sentry alerts for VX2 errors
- [ ] Prepare Firestore queries for completion rate tracking
- [ ] Set up analytics dashboard (if using custom analytics)

### Starting A/B Test

- [ ] Set `VX2_ROLLOUT_PERCENTAGE=0.10` in production environment
- [ ] Deploy to production
- [ ] Verify headers: `X-VX2-Migration` and `X-Rollout-Percentage`
- [ ] Monitor first 24 hours closely
- [ ] Document any issues immediately

### During A/B Test (Week 1)

- [ ] Daily Sentry error review
- [ ] Daily completion rate check
- [ ] Monitor support tickets
- [ ] Track user feedback
- [ ] Document metrics daily

### After A/B Test (Week 1)

- [ ] Review all metrics
- [ ] Compare VX2 vs legacy performance
- [ ] Decision: Proceed to 25% or rollback?
- [ ] If proceeding: Update to `VX2_ROLLOUT_PERCENTAGE=0.25`

---

## Key Files Reference

| File | Purpose |
|------|---------|
| `middleware.ts` | A/B testing and redirect logic |
| `pages/draft/vx2/[roomId].tsx` | VX2 draft room route |
| `docs/AB_TESTING_SETUP.md` | Complete A/B testing guide |
| `docs/DRAFT_ROOM_FEATURE_MATRIX.md` | Feature comparison |
| `docs/VX2_GAPS.md` | Gap analysis |
| `lib/analytics/draftVersionTracking.ts` | Analytics tracking utility |
| `pages/api/analytics/draft-version.ts` | Analytics endpoint |

---

## Environment Variables

### Current (Default)
```bash
# No variable set = 0% rollout (safe default)
```

### For A/B Test
```bash
VX2_ROLLOUT_PERCENTAGE=0.10
```

### For Full Migration
```bash
VX2_ROLLOUT_PERCENTAGE=1.0
```

### For Rollback
```bash
VX2_ROLLOUT_PERCENTAGE=0.0
```

---

## Success Criteria

### Phase 1D Complete When:

- ✅ 100% rollout achieved (`VX2_ROLLOUT_PERCENTAGE=1.0`)
- ✅ Stable for 1+ week at 100%
- ✅ Error rate acceptable (VX2 ≤ legacy)
- ✅ Completion rate acceptable (VX2 ≥ legacy)
- ✅ No increase in support tickets
- ✅ Ready for Phase 1E (legacy cleanup)

---

## Timeline Estimate

| Stage | Duration | Total Time |
|-------|----------|------------|
| A/B Test (10%) | 1 week | Week 1 |
| Gradual 1 (25%) | 3 days | Week 2 |
| Gradual 2 (50%) | 3 days | Week 2 |
| Gradual 3 (75%) | 3 days | Week 3 |
| Full (100%) | 1+ week | Week 4+ |

**Total: ~4-5 weeks** for complete gradual migration

---

## Next Actions

1. **Immediate:** Review this document and `docs/AB_TESTING_SETUP.md`
2. **Before Deployment:** Complete "Before Starting A/B Test" checklist
3. **Deploy:** Set `VX2_ROLLOUT_PERCENTAGE=0.10` and deploy
4. **Monitor:** Follow "During A/B Test" checklist for 1 week
5. **Decide:** After 1 week, proceed to 25% or rollback

---

**Last Updated:** January 2025  
**Next Review:** After A/B test completion (1 week)

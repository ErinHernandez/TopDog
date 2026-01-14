# Phase 4: Draft Version Consolidation Plan

**Date:** January 2025  
**Status:** 🚧 **IN PROGRESS**  
**Reference:** `CODE_REVIEW_HANDOFF_REFINED.md` - Phase 4

---

## Executive Summary

**Goal:** Consolidate four draft room versions (v2, v3, vx, vx2) into a single, maintainable vx2 implementation.

**Current State:**
- **v2**: Legacy clean architecture (components/draft/v2/)
- **v3**: Migration foundation with preserved measurements (components/draft/v3/)
- **vx**: Mobile-first component library (components/vx/)
- **vx2**: Target version - most complete, TypeScript, tablet support (components/vx2/)

**Impact:** 
- Bug fixes require changes in 4 places
- New features must be built 4 times
- Code reviews multiply by 4x
- Maintenance overhead is unsustainable

---

## Phase 4 Roadmap

| Phase | Action | Timeline | Effort |
|-------|--------|----------|--------|
| 1. Audit | Feature parity analysis | Week 8 | 8 hours |
| 2. Traffic Analysis | Analytics setup & data collection | Week 8-9 | 4 hours |
| 3. Feature Freeze | No new features on v2/v3/vx | Week 9 | 2 hours |
| 4. Migration Tooling | Redirects & migration utilities | Week 9-10 | 10-15 hours |
| 5. Deprecation Notice | In-app banners for old versions | Week 10-11 | 4 hours |
| 6. Force Migration | Redirect old URLs to vx2 | Week 11-12 | 10-15 hours |
| 7. Code Deletion | Remove v2/v3/vx code | Week 12 | 5-10 hours |

**Total: ~35-50 hours**

---

## Phase 1: Feature Parity Audit

### Current Draft Room Routes

| Route | Component | Status |
|-------|-----------|--------|
| `/draft/topdog/[roomId]` | Legacy implementation | ⚠️ Active |
| `/draft/v2/[roomId]` | DraftRoomV2 (v2) | ⚠️ Active |
| `/draft/v3/[roomId]` | DraftRoomV3 (v3) | ⚠️ Active |
| `/draft/vx2/[roomId]` | DraftRoomVX2 (vx2) | ✅ Target |

### Feature Comparison Matrix

| Feature | v2 | v3 | vx | vx2 | Notes |
|---------|----|----|----|-----|-------|
| **Core Drafting** |
| Real-time picks | ✅ | ✅ | ✅ | ✅ | All support |
| Player search/filter | ✅ | ✅ | ✅ | ✅ | All support |
| Queue management | ✅ | ✅ | ✅ | ✅ | All support |
| Draft board view | ✅ | ✅ | ✅ | ✅ | All support |
| Timer/countdown | ✅ | ✅ | ✅ | ✅ | All support |
| **Architecture** |
| TypeScript | ❌ | ❌ | ✅ | ✅ | vx/vx2 only |
| Modular components | ✅ | ✅ | ✅ | ✅ | All support |
| Context/state management | ✅ | ✅ | ✅ | ✅ | All support |
| **Mobile Support** |
| Mobile-optimized | ❌ | ❌ | ✅ | ✅ | vx/vx2 only |
| Tablet support | ❌ | ❌ | ❌ | ✅ | vx2 only |
| Legacy device support | ❌ | ❌ | ❌ | ✅ | vx2 only |
| **Performance** |
| Virtual scrolling | ✅ | ❌ | ✅ | ✅ | v2/vx/vx2 |
| Memoization | ✅ | ❌ | ✅ | ✅ | v2/vx/vx2 |
| Lazy loading | ✅ | ❌ | ✅ | ✅ | v2/vx/vx2 |
| **Developer Experience** |
| Dev tools | ✅ | ❌ | ❌ | ❌ | v2 only |
| Performance monitoring | ✅ | ❌ | ❌ | ❌ | v2 only |
| Error boundaries | ✅ | ✅ | ✅ | ✅ | All support |
| **Accessibility** |
| ARIA labels | Partial | Partial | ✅ | ✅ | vx/vx2 better |
| Keyboard navigation | Partial | Partial | ✅ | ✅ | vx/vx2 better |
| Screen reader support | Partial | Partial | ✅ | ✅ | vx/vx2 better |
| **Production Readiness** |
| Production tested | ⚠️ | ❌ | ⚠️ | ✅ | vx2 most mature |
| Analytics integration | ❌ | ❌ | ❌ | ✅ | vx2 only |
| Error tracking | Partial | Partial | ✅ | ✅ | vx/vx2 better |

### Key Findings

1. **vx2 is the most complete:**
   - TypeScript throughout
   - Mobile + tablet support
   - Legacy device support
   - Best accessibility
   - Production-ready

2. **v2 has unique dev tools:**
   - DevTools component
   - Performance monitoring
   - Element editor
   - **Action:** Port dev tools to vx2 if needed

3. **v3 is migration foundation:**
   - Preserved measurements
   - Constants extracted
   - **Action:** Verify vx2 has all measurements

4. **vx is component library:**
   - Shared components
   - Mobile-first
   - **Action:** Ensure vx2 uses vx components

---

## Phase 2: Traffic Analysis

### Analytics Setup Required

**Current Status:** Analytics not yet implemented (per Phase 1 docs)

**Action Items:**
1. ✅ Create analytics endpoint (already documented in `docs/DRAFT_VERSION_ANALYTICS.md`)
2. ⏳ Add tracking to all draft room routes
3. ⏳ Collect 2-4 weeks of traffic data
4. ⏳ Generate traffic distribution report

### Expected Traffic Distribution

**Hypothesis:**
- `/draft/topdog/[roomId]` - 60-80% (main route)
- `/draft/v2/[roomId]` - 10-20% (legacy)
- `/draft/v3/[roomId]` - 0-5% (testing)
- `/draft/vx2/[roomId]` - 0-10% (new)

**Decision Criteria:**
- If <5% on v2/v3/vx → Hard deprecation (redirect immediately)
- If 5-20% on v2/v3/vx → Soft deprecation (warnings, 4-week notice)
- If >20% on v2/v3/vx → Extended migration (8-week notice)

---

## Phase 3: Feature Freeze

### Immediate Actions

1. **Add deprecation comments to v2/v3/vx:**
   ```javascript
   /**
    * @deprecated This version is deprecated. Use vx2 instead.
    * Migration: /draft/vx2/[roomId]
    * Deprecation date: [DATE]
    */
   ```

2. **Update README files:**
   - Mark as deprecated
   - Link to vx2 migration guide
   - Document deprecation timeline

3. **CI enforcement:**
   - Block new features in v2/v3/vx directories
   - Allow bug fixes only
   - Require approval for changes

---

## Phase 4: Migration Tooling

### Redirect Middleware

**File:** `middleware.ts` (Next.js middleware)

```typescript
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Redirect old draft routes to vx2
  if (pathname.startsWith('/draft/v2/')) {
    const roomId = pathname.split('/draft/v2/')[1];
    return NextResponse.redirect(
      new URL(`/draft/vx2/${roomId}`, request.url)
    );
  }
  
  if (pathname.startsWith('/draft/v3/')) {
    const roomId = pathname.split('/draft/v3/')[1];
    return NextResponse.redirect(
      new URL(`/draft/vx2/${roomId}`, request.url)
    );
  }
  
  // Legacy topdog route
  if (pathname.startsWith('/draft/topdog/')) {
    const roomId = pathname.split('/draft/topdog/')[1];
    return NextResponse.redirect(
      new URL(`/draft/vx2/${roomId}`, request.url)
    );
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/draft/v2/:path*', '/draft/v3/:path*', '/draft/topdog/:path*'],
};
```

### Migration Utility Script

**File:** `scripts/migrate-draft-urls.js`

```javascript
/**
 * Migration script to update draft room URLs in database
 * Updates Firestore documents that reference old draft routes
 */

// TODO: Implement based on Firestore schema
```

---

## Phase 5: Deprecation Notice

### In-App Banner Component

**File:** `components/shared/DeprecationBanner.tsx`

```typescript
import React from 'react';
import { useRouter } from 'next/router';

interface DeprecationBannerProps {
  version: 'v2' | 'v3' | 'vx';
  migrationDate: string;
}

export function DeprecationBanner({ version, migrationDate }: DeprecationBannerProps) {
  const router = useRouter();
  const roomId = router.query.roomId as string;
  
  const handleMigrate = () => {
    router.push(`/draft/vx2/${roomId}`);
  };
  
  return (
    <div className="bg-yellow-600 text-white p-4 text-center">
      <p>
        This draft room version ({version}) is deprecated and will be removed on {migrationDate}.
        <button onClick={handleMigrate} className="ml-4 underline">
          Switch to vx2
        </button>
      </p>
    </div>
  );
}
```

### Implementation Plan

1. Add banner to v2 route
2. Add banner to v3 route
3. Add banner to vx route (if used)
4. Track banner interactions (analytics)
5. Monitor migration rate

---

## Phase 6: Force Migration

### Timeline

**Week 11:**
- Enable redirects for v2/v3 routes
- Monitor error rates
- Track user feedback

**Week 12:**
- Enable redirect for topdog route
- Final verification
- Update documentation

### Rollback Plan

If issues arise:
1. Disable redirects immediately
2. Investigate root cause
3. Fix in vx2
4. Re-enable redirects

---

## Phase 7: Code Deletion

### Deletion Checklist

**Before deletion:**
- ✅ All traffic migrated
- ✅ No active users on old versions
- ✅ vx2 fully tested
- ✅ Documentation updated
- ✅ Team notified

**Directories to delete:**
```
components/draft/v2/     # 31 files
components/draft/v3/     # 32 files
components/vx/           # Keep (component library)
pages/draft/v2/          # 1 file
pages/draft/v3/          # 1 file
```

**Files to keep:**
- `components/vx/` - Component library (used by vx2)
- Documentation files (archive)

**Files to delete:**
- `components/draft/v2/` - Entire directory
- `components/draft/v3/` - Entire directory
- `pages/draft/v2/[roomId].js`
- `pages/draft/v3/[roomId].js`

---

## Success Metrics

### Phase 1-2 (Audit & Analysis)
- ✅ Feature parity matrix complete
- ✅ Traffic data collected (2-4 weeks)
- ✅ Migration decision made

### Phase 3-4 (Freeze & Tooling)
- ✅ Feature freeze enforced
- ✅ Migration tooling created
- ✅ Redirects tested

### Phase 5-6 (Deprecation & Migration)
- ✅ Deprecation banners shown
- ✅ 90%+ users migrated
- ✅ Redirects enabled

### Phase 7 (Deletion)
- ✅ Old code removed
- ✅ Zero regressions
- ✅ Documentation updated

---

## Risk Mitigation

### Risks

1. **Users on old versions:**
   - Mitigation: Analytics + soft deprecation
   - Rollback: Disable redirects

2. **Missing features in vx2:**
   - Mitigation: Feature parity audit
   - Rollback: Port missing features

3. **Performance issues:**
   - Mitigation: Load testing before migration
   - Rollback: Revert redirects

4. **Data migration issues:**
   - Mitigation: Test migration scripts
   - Rollback: Keep old routes temporarily

---

## Next Steps

### Immediate (Week 8)
1. ✅ Complete feature parity audit (this document)
2. ⏳ Set up analytics tracking
3. ⏳ Collect traffic data

### Week 9
1. ⏳ Review traffic data
2. ⏳ Make migration decision
3. ⏳ Implement feature freeze
4. ⏳ Create migration tooling

### Week 10-12
1. ⏳ Deploy deprecation notices
2. ⏳ Enable redirects
3. ⏳ Monitor migration
4. ⏳ Delete old code

---

**Document Status:** In Progress  
**Next Update:** After traffic analysis  
**Related:** `docs/DRAFT_VERSION_ANALYTICS.md`, `VX2_MIGRATION_STATUS.md`

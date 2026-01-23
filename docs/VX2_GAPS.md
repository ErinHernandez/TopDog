# VX2 Feature Gaps

**Purpose:** Document features missing in VX2 compared to legacy versions  
**Date:** January 2025  
**Status:** Phase 1A - Gap Analysis  
**Reference:** `docs/DRAFT_ROOM_FEATURE_MATRIX.md`

---

## Summary

After comprehensive feature verification, **VX2 has all P0 (critical) features** required for migration. The gaps identified are primarily P1 (should have) and P2 (nice to have) features that can be deferred or added post-migration.

---

## P0 Gaps (Block Migration)

### ✅ None Found

**Status:** VX2 has all critical features required for migration:
- ✅ Real-time pick updates
- ✅ Submit pick functionality
- ✅ Pick timer with auto-pick
- ✅ **12-hour timer support** ✅ (verified - accepts 43,200 seconds)
- ✅ Turn indicator
- ✅ Draft completion handling
- ✅ Player list with search
- ✅ Position filters
- ✅ Queue management
- ✅ Roster view
- ✅ Draft board
- ✅ Pick history
- ✅ **Timer pause/resume** ✅ (verified - useDraftTimer.pause/resume, useDraftRoom.togglePause)

**Decision:** ✅ **Proceed with migration** - No blocking gaps

---

## P1 Gaps (Should Have)

### Gap 1: Quick Pick Feature

**Current state:** Not explicitly found in VX2  
**Required behavior:** Fast pick button for slow drafts (skip timer, submit pick immediately)  
**Priority:** P1 (should have)  
**Estimated effort:** 4-6 hours  
**Impact:** Slow draft users cannot quickly submit picks without waiting for timer

**Current Implementation:**
- `fastMode` exists for testing (3-second timer)
- No explicit "Quick Pick" button to skip timer and submit immediately
- Users must wait for timer or manually select player

**Files to create/modify:**
- `components/vx2/draft-room/components/DraftFooter.tsx` (modify - add quick pick button)
- `components/vx2/draft-room/hooks/useDraftRoom.ts` (modify - add quickPick method that bypasses timer)

**Decision:** Add post-migration if needed. Not critical for initial migration.

---

### Gap 2: Desktop Layout Support

**Current state:** VX2 is mobile-first, no desktop layout  
**Required behavior:** Desktop-optimized layout for larger screens  
**Priority:** P1 (can defer)  
**Estimated effort:** 2-3 weeks  
**Impact:** Desktop users will have mobile layout (functional but not optimal)

**Files to create/modify:**
- `components/vx2/draft-room/components/DraftRoomDesktop.tsx` (new)
- `components/vx2/draft-room/hooks/useResponsiveLayout.ts` (new)
- `components/vx2/draft-room/components/DraftRoomVX2.tsx` (modify)

**Decision:** Defer to post-migration. Mobile-first approach is acceptable.

---

### Gap 3: Custom Rankings

**Current state:** Not implemented in VX2  
**Required behavior:** Allow users to set custom player rankings that override ADP  
**Priority:** P1 (can defer)  
**Estimated effort:** 1 week  
**Impact:** Users cannot customize player order beyond queue

**Files to create/modify:**
- `components/vx2/draft-room/hooks/useCustomRankings.ts` (new)
- `components/vx2/draft-room/components/CustomRankingsModal.tsx` (new)
- `components/vx2/draft-room/hooks/useDraftRoom.ts` (modify - integrate custom rankings into auto-pick logic)

**Decision:** Defer to post-migration. Queue + ADP fallback is sufficient.

---


---

## P2 Gaps (Nice to Have)

### Gap 5: Enhanced Player Stats

**Current state:** Basic stats shown (ADP, projected points, bye week)  
**Required behavior:** More detailed stats (season stats, recent performance, etc.)  
**Priority:** P2  
**Estimated effort:** 1 week  
**Impact:** Minor - basic stats are sufficient

**Decision:** Defer to post-migration enhancement.

---

### Gap 6: Jersey Number Display

**Current state:** Not displayed  
**Required behavior:** Show player jersey number  
**Priority:** P2  
**Estimated effort:** 2-4 hours  
**Impact:** Very minor - nice to have

**Decision:** Defer to post-migration.

---

## Verified Features (No Gaps)

### ✅ Core Features
- Real-time pick updates (Firestore listeners)
- Submit pick (API integration)
- Pick timer (useDraftTimer hook)
- Turn indicator (DraftStatusBar)
- Draft completion (status transitions)

### ✅ Player Selection
- Player list (PlayerList, VirtualizedPlayerList)
- Player search (search functionality)
- Position filters (QB, RB, WR, TE, FLEX)
- **ADP display** ✅ (extensively implemented)
- **Bye week display** ✅ (implemented in types and components)
- Team display (NFL team abbreviation)
- Player details modal (PlayerExpandedCard)

### ✅ Automation
- Autopick enable/disable ✅
- Draft queue ✅ (useDraftQueue hook)
- Auto-pick from queue ✅
- Auto-pick fallback (ADP) ✅

### ✅ UI/UX
- Mobile layout ✅
- Tablet layout ✅
- Responsive design ✅
- Loading states ✅
- Error handling ✅
- Tutorial/onboarding ✅ (DraftTutorialModal)

### ✅ Roster View
- My roster ✅ (RosterView component)
- Other rosters ✅ (team selector)
- Position slots ✅
- Position badges ✅
- Player photos ✅

### ✅ Draft History
- Pick history ✅
- Pick ticker ✅ (PicksBar)
- Draft board ✅ (DraftBoard component)
- Picks bar ✅ (PicksBar component)

---

## Migration Readiness Assessment

| Category | Status | Notes |
|----------|--------|-------|
| **P0 Features** | ✅ Complete | All critical features present |
| **P1 Features** | ⚠️ Partial | Desktop layout and custom rankings missing (deferrable) |
| **P2 Features** | ⚠️ Partial | Enhanced stats and jersey numbers missing (nice to have) |
| **Overall** | ✅ **Ready for Migration** | No blocking gaps |

---

## Recommendations

1. **Proceed with Phase 1B** (skip - no P0 gaps)
2. **Proceed with Phase 1C** (A/B testing setup)
3. **Mobile-first migration** - Desktop layout can be added later
4. **Defer custom rankings** - Queue + ADP is sufficient for initial migration
5. **Verify slow draft support** - Quick check that 12-hour timer works

---

## Next Steps

1. ✅ Feature matrix created
2. ✅ VX2 features verified
3. ✅ Gaps documented
4. ⏭️ **Proceed to Phase 1C** (A/B testing setup)

---

**Last Updated:** January 2025  
**Next Review:** After Phase 1C completion

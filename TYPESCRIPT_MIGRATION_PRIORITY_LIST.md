# TypeScript Migration Priority List

**Date:** January 23, 2025  
**Total JavaScript Files:** 83 files in `components/` directory  
**Status:** Prioritized and Ready for Migration

---

## Priority Categories

### 🔴 P1 - High Priority (Start Here)
**Impact:** High | **Effort:** Medium-High | **Files:** ~25

### 🟡 P2 - Medium Priority
**Impact:** Medium | **Effort:** Medium | **Files:** ~35

### 🟢 P3 - Low Priority
**Impact:** Low | **Effort:** Low-Medium | **Files:** ~23

---

## P1 - High Priority (25 files)

### 1. Shared Components (8 files)
**Why:** Used across entire application, high impact

- [ ] `components/shared/PlayerDropdown/PlayerDropdown.js` ⭐ **START HERE**
- [ ] `components/shared/PlayerDropdown/PlayerDropdownRow.js`
- [ ] `components/shared/PlayerDropdown/PlayerDropdownContent.js`
- [ ] `components/shared/PlayerDropdown/PlayerDropdownStyles.js`
- [ ] `components/shared/PlayerDropdown/index.js`
- [ ] `components/Modal.js` - Base modal component
- [ ] `components/LoadingSpinner.js` - Used everywhere
- [ ] `components/AuthModal.js` - Authentication modal

**Estimated Effort:** 16-24 hours  
**Impact:** Very High (affects all features using these components)

### 2. V3 Layout Components (7 files)
**Why:** Core layout, still in use

- [ ] `components/v3/Layout/AppShell.js` ⭐
- [ ] `components/v3/Layout/Navigation.js`
- [ ] `components/v3/Layout/SubHeader.js`
- [ ] `components/v3/Layout/ContentContainer.js`
- [ ] `components/v3/UI/Button.js`
- [ ] `components/v3/UI/Card.js`
- [ ] `components/v3/UI/SearchBar.js`
- [ ] `components/v3/UI/LoadingState.js`

**Estimated Effort:** 14-20 hours  
**Impact:** High (core layout components)

### 3. Mobile Core Components (5 files)
**Why:** Mobile experience, high user impact

- [ ] `components/mobile/MobileLayout.js` ⭐
- [ ] `components/mobile/MobileFooter.js`
- [ ] `components/mobile/shared/MobilePhoneFrame.js`
- [ ] `components/mobile/index.js`
- [ ] `components/mobile/shared/index.js`

**Estimated Effort:** 10-16 hours  
**Impact:** High (mobile user experience)

### 4. Draft Components (3 files)
**Why:** Core draft functionality

- [ ] `components/draft/mobile/DraftSubHeaderMobile.js`
- [ ] `components/FullDraftBoard.js`
- [ ] `components/mobile/DraftBoardModal.js`

**Estimated Effort:** 8-12 hours  
**Impact:** High (draft room functionality)

### 5. Critical Utilities (2 files)
**Why:** Used frequently, need type safety

- [ ] `components/StrictModeDroppable.js` - React DnD wrapper
- [ ] `components/RegistrationModal.js` - User registration

**Estimated Effort:** 6-10 hours  
**Impact:** High (critical user flows)

---

## P2 - Medium Priority (35 files)

### 6. Mobile Tab Components (10 files)
- [ ] `components/mobile/tabs/MyTeamsTab.js`
- [ ] `components/mobile/tabs/ExposureTab.js`
- [ ] `components/mobile/tabs/LobbyTab.js`
- [ ] `components/mobile/tabs/LiveDraftsTab.js`
- [ ] `components/mobile/tabs/ProfileTab.js`
- [ ] `components/mobile/tabs/MyTeams/index.js`
- [ ] `components/mobile/tabs/MyTeams/TeamListView.js`
- [ ] `components/mobile/tabs/MyTeams/TeamDetailsView.js`
- [ ] `components/mobile/tabs/index.js`
- [ ] `components/mobile/tabs/MyTeams/mockTeamData.js`

**Estimated Effort:** 20-30 hours  
**Impact:** Medium (mobile tabs)

### 7. Mobile Page Components (8 files)
- [ ] `components/mobile/pages/MobileHomeContent.js`
- [ ] `components/mobile/pages/ProfileCustomizationContent.js`
- [ ] `components/mobile/pages/PaymentPageContent.js`
- [ ] `components/mobile/pages/RankingsContent.js`
- [ ] `components/mobile/pages/DepositHistoryContent.js`
- [ ] `components/mobile/pages/index.js`
- [ ] `components/mobile/ExposureReport/index.js`
- [ ] `components/mobile/ExposureReport/PositionFilterBar.js`

**Estimated Effort:** 16-24 hours  
**Impact:** Medium (mobile pages)

### 8. Mobile Shared Components (6 files)
- [ ] `components/mobile/shared/MobileFooterBase.js`
- [ ] `components/mobile/shared/PaymentMethodIcon.js`
- [ ] `components/mobile/shared/index.js`
- [ ] `components/mobile/modals/TournamentRulesModal.js`
- [ ] `components/mobile/modals/index.js`
- [ ] `components/mobile/ShareButton.js`

**Estimated Effort:** 12-18 hours  
**Impact:** Medium (mobile shared)

### 9. Mobile Feature Components (6 files)
- [ ] `components/mobile/PlayerRankingsMobile.js`
- [ ] `components/mobile/RankingsMobile.js`
- [ ] `components/mobile/RankingsPageMobile.js`
- [ ] `components/mobile/TournamentCardMobile.js`
- [ ] `components/mobile/TournamentModalMobile.js`
- [ ] `components/mobile/ShareModal.js`

**Estimated Effort:** 12-18 hours  
**Impact:** Medium

### 10. Exposure Report Components (3 files)
- [ ] `components/mobile/ExposureReportMobile.js`
- [ ] `components/mobile/ExposureReport/ExposurePlayerRow.js`
- [ ] `components/mobile/ExposureReport/index.js`

**Estimated Effort:** 6-10 hours  
**Impact:** Medium

### 11. Other Components (2 files)
- [ ] `components/ExportModal.js`
- [ ] `components/JoinTournamentModal.js`

**Estimated Effort:** 4-8 hours  
**Impact:** Medium

---

## P3 - Low Priority (23 files)

### 12. Timer Components (5 files)
- [ ] `components/CountdownTimer.js`
- [ ] `components/LongDurationTimer.js`
- [ ] `components/FreshCountdownTimer.js`
- [ ] `components/SevenSegmentCountdown.js`
- [ ] `components/PicksAwayCalendar.js`

**Estimated Effort:** 10-15 hours  
**Impact:** Low (utility components)

### 13. Team Logo Components (7 files)
- [ ] `components/team-logos/Glyph1.js`
- [ ] `components/team-logos/Glyph2.js`
- [ ] `components/team-logos/Glyph3.js`
- [ ] `components/team-logos/Glyph4.js`
- [ ] `components/team-logos/Glyph5.js`
- [ ] `components/team-logos/Glyph6.js`
- [ ] `components/team-logos/index.js`

**Estimated Effort:** 7-14 hours  
**Impact:** Low (visual components)

### 14. Utility Components (6 files)
- [ ] `components/BorderColorPicker.js`
- [ ] `components/LogoPicker.js`
- [ ] `components/GradientExample.js`
- [ ] `components/ClayPdfProcessor.js`
- [ ] `components/AzureImageAnalyzer.js`
- [ ] `components/ImageAnalyzer.js`

**Estimated Effort:** 12-18 hours  
**Impact:** Low (utility/dev components)

### 15. Dev/Test Components (5 files)
- [ ] `components/dev/DevNav.js`
- [ ] `components/PerformanceMonitor.js`
- [ ] `components/PaymentSecurityDashboard.js`
- [ ] `components/BadgeTest.js`
- [ ] `components/Navbar.js` (if legacy)

**Estimated Effort:** 8-12 hours  
**Impact:** Low (dev/test only)

---

## Migration Order

### Sprint 1 (2 weeks)
1. ✅ Shared PlayerDropdown components (5 files)
2. ✅ Modal and LoadingSpinner (2 files)
3. ✅ AuthModal (1 file)

**Target:** 8 files, 16-24 hours

### Sprint 2 (2 weeks)
4. ✅ V3 Layout components (8 files)

**Target:** 8 files, 14-20 hours

### Sprint 3 (2 weeks)
5. ✅ Mobile core components (5 files)
6. ✅ Draft components (3 files)

**Target:** 8 files, 18-28 hours

### Sprint 4-6 (6 weeks)
7. ✅ Mobile tab components (10 files)
8. ✅ Mobile page components (8 files)
9. ✅ Mobile shared components (6 files)

**Target:** 24 files, 48-72 hours

### Sprint 7-8 (4 weeks)
10. ✅ Remaining mobile components
11. ✅ Timer and utility components

**Target:** 20 files, 30-45 hours

### Sprint 9+ (Ongoing)
12. ✅ Team logos and dev components

**Target:** 23 files, 25-40 hours

---

## Migration Template

### For Each File:

```typescript
// 1. Rename file
mv Component.js Component.tsx

// 2. Add imports
import React from 'react';
import type { ComponentProps } from './types';

// 3. Add types
interface ComponentProps {
  prop1: string;
  prop2?: number;
}

// 4. Type component
export function Component({ prop1, prop2 }: ComponentProps): React.ReactElement {
  // Implementation
}

// 5. Update exports
export default Component;
```

---

## Success Criteria

- ✅ **80%+ TypeScript coverage** (from 60%)
- ✅ **Zero `any` types** in migrated files
- ✅ **All tests passing**
- ✅ **No functionality regressions**
- ✅ **Improved IDE autocomplete**

---

## Tracking

### Progress
- **P1 Files:** 0/25 (0%)
- **P2 Files:** 0/35 (0%)
- **P3 Files:** 0/23 (0%)
- **Total:** 0/83 (0%)

### Next File to Migrate
- **File:** `components/shared/PlayerDropdown/PlayerDropdown.js`
- **Priority:** P1-HIGH
- **Estimated Effort:** 4-6 hours
- **Status:** Ready to start

---

**Last Updated:** January 23, 2025  
**Next Review:** After first migration

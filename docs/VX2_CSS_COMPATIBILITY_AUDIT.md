# VX2 CSS Compatibility Audit

**Generated:** December 30, 2024  
**Scope:** `components/vx2/` directory  
**Target:** iOS 12+ Safari

---

## Summary

| Feature | iOS Requirement | Matches | Files | Risk | Action Required |
|---------|-----------------|---------|-------|------|-----------------|
| `gap` (flexbox) | 14.5+ | 88 | 33 | MEDIUM | Add margin fallbacks |
| `aspect-ratio` | 15+ | 0 | 0 | NONE | N/A |
| `:focus-visible` | 15.4+ | 0 | 0 | NONE | N/A |
| `clamp()` | 13.4+ | 1 | 1 | LOW | Already compatible |
| CSS Variables | 9.3+ | Many | Many | NONE | Already compatible |
| CSS Grid | 10.3+ | Many | Many | NONE | Already compatible |
| Flexbox | 7+ | Many | Many | NONE | Already compatible |

**Overall Status:** NEEDS WORK - 88 `gap` usages need fallback system

---

## Critical Finding: Flexbox `gap` Property

### The Problem

The CSS `gap` property in flexbox context requires iOS 14.5+. This affects:
- **Tier 2 devices** on iOS 14.0-14.4 (partial)
- **Tier 3 devices** that may have older iOS versions

### Usage Analysis

**88 total usages across 33 files**

**Highest Impact Files:**

| File | Count | Component | Impact |
|------|-------|-----------|--------|
| `DraftTutorialModal.tsx` | 13 | Tutorial slides | Medium |
| `TabletDraftHeader.tsx` | 8 | Tablet header | Tablet only |
| `ProfileTabVX2.tsx` | 5 | Profile page | High |
| `TabletDraftRoomVX2.tsx` | 5 | Tablet draft | Tablet only |
| `MyTeamsTabVX2.tsx` | 4 | Teams list | High |
| `MobilePhoneFrame.tsx` | 4 | Dev tool | Low |
| `PlayerList.tsx` | 3 | Player list | HIGH |
| `DraftStatusBar.tsx` | 3 | Status bar | HIGH |

### Solution: CSS Fallback System

Create a progressive enhancement approach:

```css
/* For browsers that don't support gap in flexbox */
.flex-gap-fallback {
  margin: calc(var(--gap, 8px) / -2);
}
.flex-gap-fallback > * {
  margin: calc(var(--gap, 8px) / 2);
}

/* Modern browsers use native gap */
@supports (gap: 1px) {
  .flex-gap-fallback {
    margin: 0;
    gap: var(--gap, 8px);
  }
  .flex-gap-fallback > * {
    margin: 0;
  }
}
```

---

## Safe Features Confirmed

### CSS Grid `gap` - SAFE
- Grid `gap` (as opposed to flexbox `gap`) is supported since iOS 10.3
- Check: All grid usages are fine

### CSS Variables (Custom Properties) - SAFE
- Supported since iOS 9.3
- Extensively used in VX2 - no issues

### CSS `clamp()` - MOSTLY SAFE
- Supported since iOS 13.4
- Only 1 usage found in `numbers.ts`
- Acceptable for Tier 1/2 devices

### Modern Layout Features - SAFE

| Feature | iOS Support | Status |
|---------|-------------|--------|
| Flexbox | 7+ | Safe |
| CSS Grid | 10.3+ | Safe |
| `calc()` | 6+ | Safe |
| `vh`/`vw` units | 6+ | Safe |
| `min()`/`max()` | 11.3+ | Safe |
| `position: sticky` | 6.1+ | Safe |
| `object-fit` | 10+ | Safe |

---

## Files Requiring Gap Fallbacks

### Priority 1: High-Traffic Mobile Components

```
components/vx2/draft-room/components/PlayerList.tsx (3)
components/vx2/draft-room/components/DraftStatusBar.tsx (3)
components/vx2/tabs/profile/ProfileTabVX2.tsx (5)
components/vx2/tabs/my-teams/MyTeamsTabVX2.tsx (4)
components/vx2/tabs/live-drafts/LiveDraftsTabVX2.tsx (2)
components/vx2/tabs/lobby/LobbyTabVX2.tsx (1)
```

### Priority 2: Draft Room Components

```
components/vx2/draft-room/components/PicksBar.tsx (2)
components/vx2/draft-room/components/QueueView.tsx (1)
components/vx2/draft-room/components/PlayerExpandedCard.tsx (1)
components/vx2/draft-room/components/LeaveConfirmModal.tsx (1)
```

### Priority 3: Modals

```
components/vx2/modals/RankingsModalVX2.tsx (2)
components/vx2/modals/AutodraftLimitsModalVX2.tsx (1)
components/vx2/draft-room/components/ShareOptionsModal.tsx (2)
components/vx2/draft-room/components/DraftInfoModal.tsx (2)
```

### Priority 4: Tablet (Lower priority - newer devices)

```
components/vx2/tablet/draft-room/TabletDraftHeader.tsx (8)
components/vx2/tablet/draft-room/TabletDraftRoomVX2.tsx (5)
components/vx2/tablet/shell/TabletHeaderVX2.tsx (3)
... (others)
```

### Priority 5: Dev Tools (Lowest - dev only)

```
components/vx2/shell/MobilePhoneFrame.tsx (4)
```

---

## Implementation Plan

### Step 1: Create Legacy Support CSS

Create `styles/legacy-support.css` with:
- Flexbox gap fallbacks
- Feature detection with `@supports`
- Utility classes for common patterns

### Step 2: Add Global Feature Detection

```javascript
// Add to app initialization
if (!CSS.supports('gap', '1px')) {
  document.documentElement.classList.add('no-flex-gap');
}
```

### Step 3: Update High-Priority Components

For each component with `gap`:

**Before:**
```jsx
<div style={{ display: 'flex', gap: 8 }}>
```

**After (Option A - CSS class):**
```jsx
<div className="flex-gap" style={{ '--gap': '8px' }}>
```

**After (Option B - Inline fallback):**
```jsx
<div style={{ 
  display: 'flex', 
  gap: 8,
  // Fallback for iOS < 14.5
  ...(isLegacyDevice && { gap: 0 }),
}}>
  {children.map((child, i) => (
    <div key={i} style={isLegacyDevice ? { marginLeft: i > 0 ? 8 : 0 } : undefined}>
      {child}
    </div>
  ))}
</div>
```

### Step 4: Test on iOS 14.0 Simulator

Verify fallbacks work correctly.

---

## Recommendations

1. **Create utility CSS file** with gap fallbacks
2. **Prioritize mobile components** (draft room, tabs)
3. **Skip tablet components** initially (iPads have newer iOS)
4. **Use `@supports` for progressive enhancement**
5. **Test on BrowserStack** with iOS 14.0

---

## Audit Complete

**Result:** 88 flexbox `gap` usages need fallback support for iOS < 14.5
**Effort Estimate:** 8 hours for high-priority components
**Action Required:** Create `legacy-support.css`, update priority components



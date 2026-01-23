# TournamentCard Bottom Section - Layout Rebuild Handoff

**Date:** January 2025  
**Status:** 🔄 **READY FOR IMPLEMENTATION**  
**Goal:** Eliminate layout shifts in TournamentCard bottom section (progress bar, button, stats) while preserving all functionality  
**Time Estimate:** 4-6 hours  
**Priority:** High (affects user experience on mobile and desktop)

---

## 🎯 Executive Summary

The TournamentCard component's bottom section (progress bar, join button, and stats grid) experiences layout shifts when viewport height changes. This causes elements to jump unexpectedly, creating a poor user experience. This handoff provides a complete rebuild strategy using CSS Grid and stable positioning to eliminate all layout shifts while maintaining exact visual appearance and functionality.

**What This Fixes:**
- Layout shifts when desktop panel opens/closes
- Layout shifts when mobile browser address bar shows/hides
- Layout shifts during image loading
- Layout shifts from CSS override conflicts
- Unstable positioning from flexbox spacer dependency

**What This Preserves:**
- Exact button styling (57px height, tiled background, 14px font)
- Progress bar appearance (5px height, tiled fill background)
- Stats grid layout (3 columns, exact font sizes)
- All functionality (clicks, progress updates, ARIA labels)
- All style override capabilities

---

## 📋 Problem Statement

### Current Issues

Three elements in the TournamentCard bottom section shift position:

1. **Progress Section** (`vx2-progress-section`)
   - DOM Path: `div.vx2-tournament-card > div[2] > div[1] > div.vx2-progress-section`
   - Current Position: top=466px, left=265px, width=203px, height=5px
   - Issue: Shifts when container height changes

2. **Join Tournament Button** (`vx2-tournament-button`)
   - DOM Path: `div.vx2-tournament-card > div[2] > div[1] > button.vx2-tournament-button`
   - Current Position: top=481px, left=265px, width=203px, height=35px (rendered: 57px)
   - Issue: Position calculated from flexbox spacer, shifts with viewport

3. **Stats Grid** (`vx2-tournament-stats`)
   - DOM Path: `div.vx2-tournament-card > div[2] > div[1] > div.vx2-tournament-stats`
   - Current Position: top=526px (for first stat item)
   - Issue: Margin-based spacing collapses or shifts

### Root Causes

1. **Flexbox Spacer Dependency** (`vx2-card-spacer`)
   - Uses `flex: 1` to push content down
   - Recalculates when container height changes
   - Location: `TournamentCard.tsx` line 355

2. **Margin-Based Spacing**
   - Elements use `marginTop` and `marginBottom`
   - Margins can collapse or shift unpredictably
   - Location: Multiple places in bottom section

3. **CSS Override Conflicts**
   - `styles/device-sizing.css` has `!important` overrides
   - Conflicts with inline styles in component
   - Location: Lines 104-131, 177-202

4. **Nested Flex Containers**
   - Multiple nested flex containers cause recalculation cascades
   - Location: Content layer structure

5. **Viewport Height Instability**
   - Container uses flexbox centering but elements still shift
   - No viewport height locking mechanism

---

## 🔍 Investigation Checklist

Before implementing, verify these items:

### Step 1: Document Current State

- [ ] Open browser DevTools on `/testing-grounds/vx2`
- [ ] Inspect each problematic element (progress, button, stats)
- [ ] Document computed styles for each element
- [ ] Note all CSS classes applied
- [ ] Check for conflicting `!important` rules in `device-sizing.css`
- [ ] Measure actual rendered positions vs. expected

### Step 2: Test Layout Shift Triggers

- [ ] **Desktop**: Open/close bottom panel (terminal), observe shifts
- [ ] **Mobile**: Show/hide browser address bar, observe shifts
- [ ] **Image Loading**: Reload page, observe shifts during background fade-in
- [ ] **Conditional Rendering**: Toggle `tournament.maxEntries` to show/hide progress bar
- [ ] **CSS Overrides**: Check if `device-sizing.css` rules conflict with component styles

### Step 3: Analyze Spacing System

- [ ] Review `components/vx2/core/constants/sizes.ts` spacing values
- [ ] Document all margin/padding values in bottom section
- [ ] Identify any magic numbers (hardcoded values not from constants)
- [ ] Check for margin collapse between adjacent elements

---

## 🏗️ Implementation Plan

### Phase 1: Create New Bottom Section Component

**File**: `components/vx2/tabs/lobby/TournamentCardBottomSection.tsx` (NEW FILE)

**Purpose**: Extract bottom section into isolated component with stable CSS Grid layout

**Implementation**:

```typescript
/**
 * TournamentCardBottomSection - Stable bottom section for tournament card
 * 
 * Uses CSS Grid for stable positioning, eliminates layout shifts
 */

import React from 'react';
import { ProgressBar } from '../../components/shared';
import { SPACING, RADIUS, TYPOGRAPHY } from '../../core/constants/sizes';
import { TILED_BG_STYLE } from '../../draft-room/constants';
import type { Tournament } from '../../hooks/data';

// ============================================================================
// CONSTANTS (Preserve exact values from TournamentCard.tsx)
// ============================================================================

const BOTTOM_SECTION_PX = {
  // Grid gap between rows
  rowGap: SPACING.lg, // 16px
  
  // Progress section
  progressHeight: 8, // md size from ProgressBar
  progressMarginBottom: 0, // Use grid gap instead
  
  // Button
  buttonHeight: 57,
  buttonFontSize: TYPOGRAPHY.fontSize.sm, // 14px
  buttonBorderRadius: RADIUS.md, // 8px
  
  // Stats
  statsGap: SPACING.xl, // 24px
  statsValueFontSize: TYPOGRAPHY.fontSize.lg, // 18px
  statsLabelFontSize: TYPOGRAPHY.fontSize.xs, // 12px
} as const;

// ============================================================================
// TYPES
// ============================================================================

export interface TournamentCardBottomSectionProps {
  tournament: Tournament;
  onJoinClick?: () => void;
  styleOverrides?: {
    buttonBackground?: string;
    buttonBackgroundColor?: string;
    progressBg?: string;
  };
}

interface StatItemProps {
  value: string;
  label: string;
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function StatItem({ value, label }: StatItemProps): React.ReactElement {
  return (
    <div 
      className="text-center" 
      style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center' 
      }}
    >
      <span 
        className="vx2-tournament-stat-value font-bold" 
        style={{ 
          fontSize: `${BOTTOM_SECTION_PX.statsValueFontSize}px`, 
          color: '#FFFFFF',
          backgroundColor: '#000000',
          padding: '2px 6px',
          borderRadius: '4px',
        }}
      >
        {value}
      </span>
      <span 
        className="vx2-tournament-stat-label"
        style={{ 
          fontSize: `${BOTTOM_SECTION_PX.statsLabelFontSize}px`, 
          color: 'rgba(255, 255, 255, 0.7)',
          backgroundColor: '#000000',
          padding: '1px 4px',
          borderRadius: '3px',
          marginTop: '2px',
        }}
      >
        {label}
      </span>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function TournamentCardBottomSection({
  tournament,
  onJoinClick,
  styleOverrides = {},
}: TournamentCardBottomSectionProps): React.ReactElement {
  const fillPercentage = tournament.maxEntries 
    ? Math.round((tournament.currentEntries / tournament.maxEntries) * 100)
    : 0;
  
  const progressBg = styleOverrides.progressBg ?? 'rgba(55, 65, 81, 0.5)';
  
  // CSS Grid layout with explicit rows
  // Row 1: Progress (conditional)
  // Row 2: Button
  // Row 3: Stats
  return (
    <div
      className="vx2-tournament-bottom-section"
      style={{
        display: 'grid',
        gridTemplateRows: tournament.maxEntries 
          ? 'auto auto auto' // Progress, Button, Stats
          : 'auto auto', // Button, Stats (no progress)
        gap: `${BOTTOM_SECTION_PX.rowGap}px`,
        // CSS containment to isolate layout calculations
        contain: 'layout style',
        // Prevent layout shifts from propagating
        willChange: 'auto',
      }}
    >
      {/* Progress Bar Row */}
      {tournament.maxEntries && (
        <div 
          className="vx2-progress-section"
          style={{
            // Fixed height container to prevent shifts
            height: `${BOTTOM_SECTION_PX.progressHeight}px`,
            contain: 'layout',
          }}
        >
          <ProgressBar 
            value={fillPercentage} 
            fillBackgroundImage="url(/wr_blue.png)"
            backgroundColor={progressBg}
            size="md"
          />
        </div>
      )}

      {/* Join Button Row */}
      <button
        onClick={onJoinClick}
        className="vx2-tournament-button w-full font-semibold transition-colors duration-200 active:scale-[0.98]"
        style={{ 
          ...(styleOverrides.buttonBackground ? {} : TILED_BG_STYLE),
          ...(styleOverrides.buttonBackground ? { 
            backgroundImage: styleOverrides.buttonBackground,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          } : {}),
          ...(styleOverrides.buttonBackgroundColor ? { 
            backgroundColor: styleOverrides.buttonBackgroundColor 
          } : {}),
          color: '#FFFFFF',
          height: `${BOTTOM_SECTION_PX.buttonHeight}px`,
          fontSize: `${BOTTOM_SECTION_PX.buttonFontSize}px`,
          borderRadius: `${BOTTOM_SECTION_PX.buttonBorderRadius}px`,
          border: 'none',
          cursor: 'pointer',
          // Fixed height, no flex-based sizing
          minHeight: `${BOTTOM_SECTION_PX.buttonHeight}px`,
          maxHeight: `${BOTTOM_SECTION_PX.buttonHeight}px`,
        }}
        aria-label={`Join ${tournament.title} for ${tournament.entryFee}`}
      >
        Join Tournament
      </button>

      {/* Stats Grid Row */}
      <div 
        className="vx2-tournament-stats"
        style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(3, 1fr)', 
          gap: `${BOTTOM_SECTION_PX.statsGap}px`,
          // Fixed dimensions to prevent shifts
          contain: 'layout',
        }}
      >
        <StatItem value={tournament.entryFee} label="Entry" />
        <StatItem value={tournament.totalEntries} label="Entries" />
        <StatItem value={tournament.firstPlacePrize} label="1st Place" />
      </div>
    </div>
  );
}

export default TournamentCardBottomSection;
```

**Key Features**:
- CSS Grid with explicit row definitions (no flexbox spacer)
- Fixed spacing using `gap` property (no margins)
- CSS containment (`contain: layout`) to isolate calculations
- Fixed heights for critical elements
- Conditional progress bar without layout shift

---

### Phase 2: Update Main TournamentCard Component

**File**: `components/vx2/tabs/lobby/TournamentCard.tsx`

**Changes Required**:

1. **Import new component** (add at top):
```typescript
import { TournamentCardBottomSection } from './TournamentCardBottomSection';
```

2. **Remove StatItem component** (lines 114-149) - now in bottom section component

3. **Replace bottom section** (lines 357-411):
```typescript
// FIND THIS:
{/* Bottom Section - Progress, Button, Stats */}
<div style={{ marginTop: `${SPACING.xl}px` }}>
  {/* Progress Bar */}
  {tournament.maxEntries && (
    <div className="vx2-progress-section" style={{ marginBottom: `${SPACING.lg}px` }}>
      <ProgressBar ... />
    </div>
  )}

  {/* Join Button */}
  <button className="vx2-tournament-button" ...>
    Join Tournament
  </button>

  {/* Stats Grid */}
  <div className="vx2-tournament-stats" ...>
    <StatItem ... />
    <StatItem ... />
    <StatItem ... />
  </div>
</div>

// REPLACE WITH:
<TournamentCardBottomSection
  tournament={tournament}
  onJoinClick={onJoinClick}
  styleOverrides={styleOverrides}
/>
```

4. **Remove spacer dependency** (line 355):
```typescript
// FIND THIS:
{/* Spacer to push bottom content down - hidden on compact */}
<div className="vx2-card-spacer" style={{ flex: 1 }} />

// REMOVE IT (no longer needed with grid layout)
```

5. **Update content layer** (lines 328-335):
```typescript
// FIND THIS:
<div style={{ 
  position: 'relative', 
  zIndex: 2, 
  display: 'flex', 
  flexDirection: 'column', 
  flex: 1,
  minHeight: 0,
}}>

// UPDATE TO (add justify-content for better spacing):
<div style={{ 
  position: 'relative', 
  zIndex: 2, 
  display: 'flex', 
  flexDirection: 'column', 
  flex: 1,
  minHeight: 0,
  justifyContent: 'space-between', // Distribute space evenly
}}>
```

6. **Remove ProgressBar import** (if no longer used elsewhere in file):
```typescript
// REMOVE THIS LINE if ProgressBar only used in bottom section:
import { ProgressBar } from '../../components/shared';
```

---

### Phase 3: Consolidate CSS Overrides

**File**: `styles/device-sizing.css`

**Changes Required**:

1. **Review progress section overrides** (lines 104-106, 177-179):
```css
/* FIND THESE: */
.vx2-device-compact .vx2-progress-section {
  margin-bottom: 12px !important;
}

@media screen and (max-height: 700px) {
  .vx2-progress-section {
    margin-bottom: 12px !important;
  }
}

/* UPDATE TO (use grid gap instead of margin): */
.vx2-device-compact .vx2-tournament-bottom-section {
  gap: 12px !important;
}

@media screen and (max-height: 700px) {
  .vx2-tournament-bottom-section {
    gap: 12px !important;
  }
}
```

2. **Review button overrides** (lines 114-118, 186-190):
```css
/* FIND THESE: */
.vx2-device-compact .vx2-tournament-button {
  height: 40px !important;
  font-size: 12px !important;
  margin-bottom: 12px !important;
}

/* UPDATE TO (remove margin-bottom, use grid gap): */
.vx2-device-compact .vx2-tournament-button {
  height: 40px !important;
  font-size: 12px !important;
  min-height: 40px !important;
  max-height: 40px !important;
}
```

3. **Review stats overrides** (lines 121-131, 192-202):
```css
/* KEEP THESE (they're fine): */
.vx2-device-compact .vx2-tournament-stats {
  gap: 12px !important;
}

.vx2-device-compact .vx2-tournament-stat-value {
  font-size: 14px !important;
}

.vx2-device-compact .vx2-tournament-stat-label {
  font-size: 10px !important;
}
```

4. **Remove spacer override** (lines 98-101, 204-206):
```css
/* FIND AND REMOVE (spacer no longer exists): */
.vx2-device-compact .vx2-card-spacer {
  flex: 1 !important;
  display: block !important;
}

@media screen and (max-height: 700px) {
  .vx2-card-spacer {
    display: none !important;
  }
}
```

---

## ✅ Testing & Validation

### Test Cases

1. **Desktop Viewport Changes**
   - [ ] Open bottom panel (terminal), verify no layout shifts
   - [ ] Close bottom panel, verify no layout shifts
   - [ ] Resize browser window, verify elements stay stable

2. **Mobile Browser UI**
   - [ ] Test on actual iPhone device
   - [ ] Scroll to show/hide address bar, verify no shifts
   - [ ] Test keyboard appearance, verify no shifts

3. **Image Loading**
   - [ ] Hard refresh page, observe during background fade-in
   - [ ] Verify bottom section doesn't shift during image load
   - [ ] Test with slow network (throttle in DevTools)

4. **Conditional Rendering**
   - [ ] Toggle `tournament.maxEntries` to show/hide progress bar
   - [ ] Verify button and stats don't shift when progress appears/disappears
   - [ ] Test with multiple tournament cards

5. **Device Sizes**
   - [ ] Test compact device class (max-height: 700px)
   - [ ] Test large device (min-height: 881px)
   - [ ] Test default device size
   - [ ] Verify responsive scaling works correctly

6. **CSS Override Conflicts**
   - [ ] Check DevTools for conflicting `!important` rules
   - [ ] Verify component styles take precedence where needed
   - [ ] Test style overrides prop functionality

7. **Functionality**
   - [ ] Click join button, verify click handler fires
   - [ ] Verify ARIA labels are correct
   - [ ] Test keyboard navigation (Tab to button, Enter to click)
   - [ ] Verify progress bar updates when tournament data changes

### Validation Criteria

- ✅ **No Layout Shifts**: Measure element positions before/after viewport changes, verify shifts < 1px
- ✅ **Visual Match**: Compare screenshots before/after, verify identical appearance
- ✅ **Functionality Preserved**: All click handlers, progress updates, ARIA labels work
- ✅ **Performance**: No layout thrashing in Performance tab
- ✅ **Accessibility**: Screen reader announces elements correctly

### Measurement Tools

Use browser DevTools:
1. **Performance Tab**: Record during viewport changes, check for Layout events
2. **Elements Tab**: Measure `getBoundingClientRect()` before/after changes
3. **Console**: Add temporary logging:
```javascript
const measure = () => {
  const progress = document.querySelector('.vx2-progress-section');
  const button = document.querySelector('.vx2-tournament-button');
  const stats = document.querySelector('.vx2-tournament-stats');
  
  console.log({
    progress: progress?.getBoundingClientRect(),
    button: button?.getBoundingClientRect(),
    stats: stats?.getBoundingClientRect(),
  });
};

// Call before and after viewport change
measure();
```

---

## 📁 Files to Modify

### New Files
1. **`components/vx2/tabs/lobby/TournamentCardBottomSection.tsx`**
   - New isolated component for bottom section
   - Contains StatItem sub-component
   - Uses CSS Grid for stable layout

### Modified Files
1. **`components/vx2/tabs/lobby/TournamentCard.tsx`**
   - Import and use new bottom section component
   - Remove StatItem component (moved to bottom section)
   - Remove flexbox spacer
   - Update content layer flex properties

2. **`styles/device-sizing.css`**
   - Update progress section overrides (use grid gap)
   - Update button overrides (remove margin-bottom)
   - Remove spacer overrides (spacer no longer exists)
   - Keep stats overrides (they're fine)

### Files to Preserve (No Changes)
1. **`components/vx2/components/shared/display/ProgressBar.tsx`**
   - No changes needed
   - Maintain existing functionality

2. **`components/vx2/draft-room/constants/index.ts`**
   - Preserve `TILED_BG_STYLE` constant
   - Used by button background

3. **`components/vx2/core/constants/sizes.ts`**
   - Preserve spacing constants
   - Used for grid gaps

---

## 🎯 Constants to Preserve

All values must match exactly from original implementation:

### From `TournamentCard.tsx`:
- `CARD_PX.buttonHeight: 57` → `BOTTOM_SECTION_PX.buttonHeight: 57`
- `CARD_PX.buttonFontSize: TYPOGRAPHY.fontSize.sm` (14px)
- `CARD_PX.statsGap: SPACING.xl` (24px)
- `CARD_PX.statsValueFontSize: TYPOGRAPHY.fontSize.lg` (18px)
- `CARD_PX.statsLabelFontSize: TYPOGRAPHY.fontSize.xs` (12px)

### From `ProgressBar.tsx`:
- `SIZE_CONFIG.md.height: 8` (for progress bar height)

### From `draft-room/constants/index.ts`:
- `TILED_BG_STYLE` (button background)

---

## 🚨 Common Pitfalls & Solutions

### Pitfall 1: Grid Gap vs Margin
**Problem**: Using margins instead of grid gap causes spacing issues  
**Solution**: Always use `gap` property on grid container, never margins on grid items

### Pitfall 2: Conditional Progress Bar Shifts Layout
**Problem**: Progress bar conditional rendering causes button/stats to jump  
**Solution**: Use `gridTemplateRows: 'auto auto auto'` when progress exists, `'auto auto'` when it doesn't. Grid automatically adjusts.

### Pitfall 3: CSS Overrides Still Apply
**Problem**: `device-sizing.css` overrides conflict with new grid layout  
**Solution**: Update overrides to target `.vx2-tournament-bottom-section` instead of individual elements

### Pitfall 4: StatItem Dimensions Shift
**Problem**: StatItem text wrapping causes grid column width changes  
**Solution**: Use `contain: layout` on stats grid, ensure StatItem has fixed width constraints

### Pitfall 5: Button Height Varies
**Problem**: Button height changes on different devices  
**Solution**: Use both `height`, `minHeight`, and `maxHeight` to lock dimensions

---

## 📊 Success Criteria

Implementation is complete when:

1. ✅ **No Layout Shifts**: Elements maintain position within 1px when viewport changes
2. ✅ **Visual Match**: Screenshots match original exactly (button, fonts, progress bar)
3. ✅ **Functionality**: All click handlers, progress updates work correctly
4. ✅ **CSS Overrides**: No conflicts, responsive scaling works
5. ✅ **Performance**: No layout thrashing (check Performance tab)
6. ✅ **Accessibility**: ARIA labels, keyboard navigation work
7. ✅ **Cross-Device**: Works on compact, default, and large device sizes

---

## 🔄 Rollback Plan

If issues arise, rollback steps:

1. **Revert TournamentCard.tsx**: Restore original bottom section code (lines 357-411)
2. **Restore StatItem**: Uncomment StatItem component (lines 114-149)
3. **Restore Spacer**: Add back `vx2-card-spacer` div (line 355)
4. **Revert CSS**: Restore original overrides in `device-sizing.css`
5. **Delete New File**: Remove `TournamentCardBottomSection.tsx`

**Git Commands**:
```bash
git checkout HEAD -- components/vx2/tabs/lobby/TournamentCard.tsx
git checkout HEAD -- styles/device-sizing.css
rm components/vx2/tabs/lobby/TournamentCardBottomSection.tsx
```

---

## 📝 Implementation Checklist

Use this checklist during implementation:

### Pre-Implementation
- [ ] Read this handoff document completely
- [ ] Review current TournamentCard.tsx code
- [ ] Review device-sizing.css overrides
- [ ] Test current layout shift issues to understand problem

### Implementation
- [ ] Create `TournamentCardBottomSection.tsx` with grid layout
- [ ] Copy StatItem component to new file
- [ ] Update TournamentCard.tsx to use new component
- [ ] Remove StatItem from TournamentCard.tsx
- [ ] Remove flexbox spacer from TournamentCard.tsx
- [ ] Update device-sizing.css overrides
- [ ] Remove spacer CSS overrides

### Testing
- [ ] Test desktop viewport changes
- [ ] Test mobile browser UI changes
- [ ] Test image loading
- [ ] Test conditional progress bar rendering
- [ ] Test all device sizes
- [ ] Test CSS override conflicts
- [ ] Test functionality (clicks, keyboard nav)
- [ ] Measure layout shifts (should be < 1px)

### Validation
- [ ] Screenshot comparison (before/after)
- [ ] Performance tab check (no layout thrashing)
- [ ] Accessibility audit (screen reader)
- [ ] Cross-browser testing (Chrome, Safari, Firefox)

### Documentation
- [ ] Update component JSDoc if needed
- [ ] Document any trade-offs or limitations
- [ ] Note any future improvements needed

---

## 🎓 Key Learnings

### Why CSS Grid Works Better

1. **Explicit Row Definitions**: Grid rows are defined upfront, no recalculation needed
2. **Gap Property**: Replaces margins, prevents collapse, more predictable
3. **CSS Containment**: `contain: layout` isolates calculations, prevents propagation
4. **Fixed Dimensions**: Grid items can have fixed sizes, no flex-based calculations

### Why Flexbox Spacer Failed

1. **Dynamic Calculation**: `flex: 1` recalculates when container height changes
2. **Cascade Effect**: Spacer change affects all children below it
3. **Viewport Dependency**: Container height depends on viewport, which is unstable

### Best Practices Applied

1. **Single Source of Truth**: All spacing from constants, no magic numbers
2. **Isolation**: CSS containment prevents layout shifts from propagating
3. **Fixed Dimensions**: Critical elements have locked heights/widths
4. **Conditional Rendering**: Grid adapts without layout shifts

---

## 📞 Questions or Issues?

If you encounter issues during implementation:

1. **Check DevTools**: Inspect computed styles, look for conflicts
2. **Review Constants**: Verify all spacing values match original
3. **Test Incrementally**: Implement one phase at a time, test after each
4. **Compare Screenshots**: Use before/after screenshots to verify visual match

---

**End of Handoff Document**

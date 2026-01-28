# Draft Room Phone Frame Implementation - Handoff Document

**Date:** January 2025  
**Status:** Ready for Implementation  
**Estimated Time:** 2-3 hours  
**Difficulty:** Intermediate

---

## Executive Summary

This document provides a complete implementation guide for creating a fresh, clean draft room component that properly fits within a phone frame (375px × 812px). The new implementation eliminates all height/overflow issues by using a simple, reliable flexbox layout instead of complex absolute positioning.

**Key Goal:** Create `DraftRoomPhoneFrame.tsx` - a new component that renders the draft room perfectly within the phone frame constraints, maintaining all existing functionality.

---

## Problem Statement

### Current Issues

The existing `DraftRoomVX2` component has systemic layout problems when rendered inside a phone frame:

1. **Content Overflow:** Content exceeds the 812px phone frame height
2. **Complex Positioning:** Uses absolute positioning with conflicting calculations
3. **Height Calculation Errors:** Doesn't properly account for all fixed elements (header, picks bar, footer)
4. **Nested Wrappers:** Multiple wrapper divs with conflicting styles
5. **Scroll Issues:** Content doesn't scroll correctly within constrained space

### Root Cause

The component uses `position: absolute` with `top`, `left`, `right`, `bottom` calculations that don't properly constrain content. The flexbox layout is broken by absolute positioning, preventing proper height distribution.

---

## Solution Architecture

### Layout Structure

```
Phone Frame Container (375px × 812px)
└── DraftRoomPhoneFrame (100% × 100%)
    ├── Header (54px, flexShrink: 0)
    ├── Content Area (flex: 1, minHeight: 0)
    │   ├── Picks Bar (200px when visible, flexShrink: 0)
    │   └── Main Content (flex: 1, overflowY: auto)
    └── Footer (56px, flexShrink: 0)
```

### Key Measurements

| Element | Height | Notes |
|---------|--------|-------|
| Phone Frame | 812px | Fixed container |
| Header | 54px | DraftStatusBar (HEADER_HEIGHT) |
| Footer | 56px | DraftFooter (DRAFT_LAYOUT.footerHeight) |
| Picks Bar | 200px | Only visible when activeTab !== 'board' |
| Available Content | 702px | 812 - 54 - 56 |
| Main Content (with picks) | 502px | 702 - 200 |
| Main Content (no picks) | 702px | When on board tab |

---

## Implementation Steps

### Step 1: Create DraftRoomPhoneFrame Component

**File:** `components/vx2/draft-room/components/DraftRoomPhoneFrame.tsx`

Create a new component file with the following structure:

```typescript
/**
 * DraftRoomPhoneFrame - Clean phone frame implementation
 * 
 * Uses simple flexbox layout to properly constrain content within
 * a 375px × 812px phone frame. Eliminates all height/overflow issues.
 * 
 * Architecture:
 * - Root: flex column, height: 100%
 * - Header: fixed height (54px)
 * - Content: flex: 1 with minHeight: 0 (critical for overflow)
 * - Footer: fixed height (56px)
 * 
 * Key Principle: No absolute positioning - pure flexbox
 */

import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import type { DraftTab } from '../types';
import { DRAFT_LAYOUT, DRAFT_DEFAULTS } from '../constants';
import { BG_COLORS } from '../../core/constants/colors';
import { createScopedLogger } from '../../../../lib/clientLogger';

// Import all the same components and hooks as DraftRoomVX2
import { useDraftRoom } from '../hooks/useDraftRoom';
import DraftStatusBar, { HEADER_HEIGHT } from './DraftStatusBar';
import PicksBar from './PicksBar';
import PlayerList from './PlayerList';
import QueueView from './QueueView';
import RosterView from './RosterView';
import DraftBoard from './DraftBoard';
import DraftInfo from './DraftInfo';
import DraftFooter from './DraftFooter';
import LeaveConfirmModal from './LeaveConfirmModal';
import DraftInfoModal from './DraftInfoModal';
import DraftTutorialModal from './DraftTutorialModal';

const logger = createScopedLogger('[DraftRoomPhoneFrame]');

// Constants
const LAYOUT_PX = {
  headerHeight: HEADER_HEIGHT, // 54px
  picksBarHeight: DRAFT_LAYOUT.picksBarHeight, // 200px
  footerHeight: DRAFT_LAYOUT.footerHeight, // 56px
} as const;

// Props interface - same as DraftRoomVX2
export interface DraftRoomPhoneFrameProps {
  roomId: string;
  userId?: string;
  onLeave?: () => void;
  fastMode?: boolean;
  initialPickNumber?: number;
  teamCount?: number;
  onDevToolsReady?: (devTools: {
    startDraft: () => void;
    togglePause: () => void;
    forcePick: () => void;
    isPaused: boolean;
    status: string;
  }) => void;
}

// TabContent component (same as DraftRoomVX2)
function TabContent({ 
  activeTab, 
  draftRoom, 
  onTutorial, 
  onLeave, 
  onLeaveFromLink,
  draftSettings 
}: {
  activeTab: DraftTab;
  draftRoom: ReturnType<typeof useDraftRoom>;
  onTutorial: () => void;
  onLeave: () => void;
  onLeaveFromLink?: () => void;
  draftSettings: {
    teamCount: number;
    rosterSize: number;
    pickTimeSeconds: number;
  };
}): React.ReactElement {
  switch (activeTab) {
    case 'players':
      return (
        <PlayerList
          players={draftRoom.availablePlayers.filteredPlayers}
          totalCount={draftRoom.availablePlayers.totalCount}
          isLoading={draftRoom.availablePlayers.isLoading}
          isMyTurn={draftRoom.isMyTurn}
          draftedCounts={draftRoom.picks.userPositionCounts}
          positionFilters={draftRoom.availablePlayers.positionFilters}
          onToggleFilter={draftRoom.availablePlayers.togglePositionFilter}
          searchQuery={draftRoom.availablePlayers.searchQuery}
          onSearchChange={draftRoom.availablePlayers.setSearchQuery}
          onClearAll={draftRoom.availablePlayers.clearAll}
          sortOption={draftRoom.availablePlayers.sortOption}
          onSortChange={draftRoom.availablePlayers.setSortOption}
          onDraft={draftRoom.draftPlayer}
          onToggleQueue={draftRoom.queue.toggleQueue}
          isQueued={draftRoom.queue.isQueued}
          initialScrollPosition={draftRoom.getScrollPosition('players')}
          onScrollPositionChange={(pos) => draftRoom.saveScrollPosition('players', pos)}
        />
      );
    
    case 'queue':
      return (
        <QueueView
          queue={draftRoom.queue.queue}
          onRemove={draftRoom.queue.removeFromQueue}
          onReorder={draftRoom.queue.reorderQueue}
          onClear={draftRoom.queue.clearQueue}
          onAddPlayers={() => draftRoom.setActiveTab('players')}
          initialScrollPosition={draftRoom.getScrollPosition('queue')}
          onScrollPositionChange={(pos) => draftRoom.saveScrollPosition('queue', pos)}
        />
      );
    
    case 'rosters':
      return (
        <RosterView
          picks={draftRoom.picks.picks}
          participants={draftRoom.participants}
          userParticipantIndex={draftRoom.userParticipantIndex}
          getPicksForParticipant={(idx) => draftRoom.picks.picksByParticipant(idx)}
          initialScrollPosition={draftRoom.getScrollPosition('rosters')}
          onScrollPositionChange={(pos) => draftRoom.saveScrollPosition('rosters', pos)}
        />
      );
    
    case 'board':
      return (
        <DraftBoard
          picks={draftRoom.picks.picks}
          currentPickNumber={draftRoom.currentPickNumber}
          participants={draftRoom.participants}
          userParticipantIndex={draftRoom.userParticipantIndex}
          getPickForSlot={draftRoom.picks.getPickForSlot}
          initialScrollPosition={draftRoom.getScrollPosition('board')}
          onScrollPositionChange={(pos) => draftRoom.saveScrollPosition('board', pos)}
        />
      );
    
    case 'info':
      return (
        <DraftInfo 
          settings={draftSettings}
          initialScrollPosition={draftRoom.getScrollPosition('info')}
          onScrollPositionChange={(pos) => draftRoom.saveScrollPosition('info', pos)}
          onTutorial={onTutorial}
          onLeave={onLeaveFromLink || onLeave}
        />
      );
    
    default:
      return <div>Unknown tab</div>;
  }
}

// Loading and Error states (copy from DraftRoomVX2)
function LoadingState(): React.ReactElement {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100%',
      backgroundColor: BG_COLORS.primary,
    }}>
      <div style={{ color: '#9CA3AF', fontSize: 14 }}>Loading draft room...</div>
    </div>
  );
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }): React.ReactElement {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100%',
      padding: 20,
      backgroundColor: BG_COLORS.primary,
    }}>
      <div style={{ color: '#EF4444', fontSize: 16, marginBottom: 12, textAlign: 'center' }}>
        {message}
      </div>
      <button
        onClick={onRetry}
        style={{
          padding: '10px 20px',
          backgroundColor: '#3B82F6',
          color: '#FFFFFF',
          border: 'none',
          borderRadius: 8,
          cursor: 'pointer',
          fontSize: 14,
        }}
      >
        Retry
      </button>
    </div>
  );
}

// Main component
export default function DraftRoomPhoneFrame({
  roomId,
  userId,
  onLeave,
  fastMode = false,
  initialPickNumber = 1,
  teamCount = 12,
  onDevToolsReady,
}: DraftRoomPhoneFrameProps): React.ReactElement {
  // Initialize draft room hook (same as DraftRoomVX2)
  const draftRoom = useDraftRoom({
    roomId,
    userId,
    fastMode,
    initialPickNumber,
    teamCount,
  });
  
  // Expose dev tools to parent (same logic as DraftRoomVX2)
  const prevDevToolsRef = useRef<{ status: string; isPaused: boolean } | null>(null);
  
  React.useEffect(() => {
    if (!onDevToolsReady || draftRoom.isLoading) return;
    
    const current = {
      status: draftRoom.status,
      isPaused: draftRoom.devTools.isPaused,
    };
    
    const prev = prevDevToolsRef.current;
    if (!prev || prev.status !== current.status || prev.isPaused !== current.isPaused) {
      prevDevToolsRef.current = current;
      onDevToolsReady({
        ...draftRoom.devTools,
        status: draftRoom.status,
      });
    }
  }, [onDevToolsReady, draftRoom.devTools, draftRoom.status, draftRoom.isLoading]);

  // Modal state (same as DraftRoomVX2)
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [showTopBarHint, setShowTopBarHint] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [showTutorialModal, setShowTutorialModal] = useState(false);
  const hasAutoShownTutorial = useRef(false);

  // Draft settings (same as DraftRoomVX2)
  const draftSettings = useMemo(() => ({
    teamCount,
    rosterSize: DRAFT_DEFAULTS.rosterSize,
    pickTimeSeconds: DRAFT_DEFAULTS.pickTimeSeconds,
  }), [teamCount]);

  // Handlers (same as DraftRoomVX2)
  const handleLeaveClick = useCallback(() => {
    setShowTopBarHint(false);
    setShowLeaveModal(true);
  }, []);

  const handleLeaveFromLink = useCallback(() => {
    setShowTopBarHint(true);
    setShowLeaveModal(true);
  }, []);

  const handleLeaveConfirm = useCallback(() => {
    draftRoom.leaveDraft();
    setShowLeaveModal(false);
    if (onLeave) {
      setTimeout(() => onLeave(), 0);
    }
  }, [draftRoom, onLeave]);

  const handleWithdraw = useCallback(() => {
    draftRoom.leaveDraft();
    setShowLeaveModal(false);
    if (onLeave) {
      setTimeout(() => onLeave(), 0);
    }
  }, [draftRoom, onLeave]);

  const handleLeaveCancel = useCallback(() => {
    setShowLeaveModal(false);
    setShowTopBarHint(false);
  }, []);

  const handleInfoClick = useCallback(() => {
    setShowInfoModal(true);
  }, []);

  const handleTutorialClick = useCallback(() => {
    setShowInfoModal(false);
    setShowTutorialModal(true);
  }, []);

  const handleGracePeriodEnd = useCallback(() => {
    draftRoom.autoPickForUser();
  }, [draftRoom]);

  // Loading state
  if (draftRoom.isLoading) {
    return <LoadingState />;
  }

  // Error state
  if (draftRoom.error) {
    return (
      <ErrorState 
        message={draftRoom.error || 'An error occurred'} 
        onRetry={() => window.location.reload()} 
      />
    );
  }

  // Determine if picks bar should be visible
  const showPicksBar = draftRoom.activeTab !== 'board';

  // MAIN LAYOUT - Clean flexbox structure
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        width: '100%',
        backgroundColor: BG_COLORS.primary,
        overflow: 'hidden',
      }}
    >
      {/* Header - Fixed height */}
      <div
        style={{
          flexShrink: 0,
          height: `${LAYOUT_PX.headerHeight}px`,
          zIndex: 50,
        }}
      >
        <DraftStatusBar
          timerSeconds={draftRoom.timer.seconds}
          isUserTurn={draftRoom.isMyTurn && draftRoom.status === 'active'}
          onGracePeriodEnd={handleGracePeriodEnd}
          onLeave={handleLeaveClick}
          hideTimer={draftRoom.status === 'active'}
        />
      </div>
      
      {/* Content Area - Flexible, constrained */}
      <div
        style={{
          flex: 1,
          minHeight: 0, // CRITICAL: Allows flexbox to respect overflow
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Picks Bar - Fixed height when visible */}
        {showPicksBar && (
          <div
            style={{
              flexShrink: 0,
              height: `${LAYOUT_PX.picksBarHeight}px`,
            }}
          >
            <PicksBar
              picks={draftRoom.picks.picks}
              currentPickNumber={draftRoom.currentPickNumber}
              participants={draftRoom.participants}
              userParticipantIndex={draftRoom.userParticipantIndex}
              timer={draftRoom.timer.seconds}
              status={draftRoom.status}
            />
          </div>
        )}
        
        {/* Main Content - Scrollable */}
        <main
          style={{
            flex: 1,
            minHeight: 0, // CRITICAL: Allows flexbox to respect overflow
            overflowY: 'auto',
            overflowX: 'hidden',
            width: '100%',
            WebkitOverflowScrolling: 'touch', // Smooth scrolling on iOS
          }}
        >
          <TabContent 
            activeTab={draftRoom.activeTab} 
            draftRoom={draftRoom} 
            onTutorial={() => setShowTutorialModal(true)}
            onLeave={handleLeaveClick}
            onLeaveFromLink={handleLeaveFromLink}
            draftSettings={draftSettings}
          />
        </main>
      </div>
      
      {/* Footer - Fixed height */}
      <div
        style={{
          flexShrink: 0,
          height: `${LAYOUT_PX.footerHeight}px`,
          zIndex: 50,
        }}
      >
        <DraftFooter
          activeTab={draftRoom.activeTab}
          onTabChange={draftRoom.setActiveTab}
          queueCount={draftRoom.queue.queueCount}
          useAbsolutePosition={false} // Not needed with flexbox
        />
      </div>
      
      {/* Modals */}
      <LeaveConfirmModal
        isOpen={showLeaveModal}
        draftStatus={draftRoom.status}
        onConfirm={handleLeaveConfirm}
        onWithdraw={handleWithdraw}
        onCancel={handleLeaveCancel}
        showTopBarHint={showTopBarHint}
      />
      
      <DraftInfoModal
        isOpen={showInfoModal}
        onClose={() => setShowInfoModal(false)}
        onTutorial={handleTutorialClick}
        draftInfo={{
          format: 'Snake',
          teams: draftSettings.teamCount,
          rounds: draftSettings.rosterSize,
          pickTime: draftSettings.pickTimeSeconds,
          scoring: 'Best Ball',
        }}
      />
      
      <DraftTutorialModal
        isOpen={showTutorialModal}
        onClose={() => setShowTutorialModal(false)}
        onRules={() => logger.debug('Rules clicked')}
        format="Snake"
        showDontShowAgain={true}
        onDontShowAgainChange={(value) => {
          if (value && typeof window !== 'undefined') {
            localStorage.setItem('topdog_tutorial_disabled', 'true');
          }
        }}
      />
    </div>
  );
}
```

### Step 2: Update Testing Page

**File:** `pages/testing-grounds/vx2-draft-room.tsx`

Replace the phone frame section with the new component:

**Find this section (around line 290-324):**
```typescript
<div
  className="bg-black rounded-[40px] overflow-hidden shadow-2xl relative"
  data-phone-frame="true"
  style={{
    width: '375px',
    height: '812px',
    position: 'relative',
    isolation: 'isolate',
  }}
>
  <div
    style={{
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      overflow: 'hidden',
    }}
  >
    <DraftRoomVX2
      key={draftKey}
      roomId={roomId}
      useAbsolutePosition={true}
      onLeave={handleLeaveDraft}
      fastMode={fastMode}
      onDevToolsReady={handleDevToolsReady}
      initialPickNumber={initialPickNumber}
      teamCount={teamCount}
    />
  </div>
</div>
```

**Replace with:**
```typescript
<div
  className="bg-black rounded-[40px] overflow-hidden shadow-2xl relative"
  data-phone-frame="true"
  style={{
    width: '375px',
    height: '812px',
    position: 'relative',
  }}
>
  <DraftRoomPhoneFrame
    key={draftKey}
    roomId={roomId}
    onLeave={handleLeaveDraft}
    fastMode={fastMode}
    onDevToolsReady={handleDevToolsReady}
    initialPickNumber={initialPickNumber}
    teamCount={teamCount}
  />
</div>
```

**Update imports at top of file:**
```typescript
// Change this:
import { DraftRoomVX2 } from '../../components/vx2/draft-room';

// To this:
import { DraftRoomVX2 } from '../../components/vx2/draft-room';
import DraftRoomPhoneFrame from '../../components/vx2/draft-room/components/DraftRoomPhoneFrame';
```

### Step 3: Export Component (if needed)

**File:** `components/vx2/draft-room/index.ts`

Add export if you want to import from the main index:

```typescript
export { default as DraftRoomPhoneFrame } from './components/DraftRoomPhoneFrame';
```

---

## Critical Implementation Details

### 1. Flexbox Layout Principles

**Root Container:**
- `display: flex, flexDirection: column, height: 100%`
- This makes the component fill the phone frame exactly

**Header/Footer:**
- `flexShrink: 0` - Prevents compression
- Explicit `height` - Ensures fixed size

**Content Area:**
- `flex: 1` - Takes remaining space
- `minHeight: 0` - **CRITICAL** - Allows flexbox to respect `overflow: hidden` on children
- `overflow: hidden` - Prevents content from escaping

**Main Content:**
- `flex: 1` - Takes remaining space after picks bar
- `minHeight: 0` - **CRITICAL** - Allows scrolling to work
- `overflowY: auto` - Enables scrolling when content exceeds available space

### 2. Why `minHeight: 0` is Critical

Without `minHeight: 0`, flexbox children have an implicit `min-height: auto`, which prevents them from shrinking below their content size. This breaks overflow handling. Setting `minHeight: 0` explicitly allows the flex item to shrink and enables proper scrolling.

### 3. Height Calculations

The layout automatically calculates available space:
- Total: 812px (phone frame)
- Header: 54px (fixed)
- Footer: 56px (fixed)
- Available: 702px (812 - 54 - 56)
- With picks bar: 502px (702 - 200)
- Without picks bar: 702px

Flexbox handles these calculations automatically - no manual math needed.

### 4. No Absolute Positioning

The entire layout uses flexbox. This eliminates:
- Complex `top/bottom/left/right` calculations
- Positioning conflicts
- Z-index issues
- Overflow problems

---

## Testing Checklist

### Visual Verification

- [ ] Content fits exactly within phone frame (no overflow)
- [ ] Header stays at top (54px height)
- [ ] Footer stays at bottom (56px height)
- [ ] Picks bar shows/hides correctly based on active tab
- [ ] Main content scrolls when it exceeds available space
- [ ] No content is cut off at top or bottom
- [ ] All tabs render correctly (players, queue, rosters, board, info)

### Functional Verification

- [ ] Draft controls in DevNav work (start, pause, force pick, etc.)
- [ ] All modals open and close correctly
- [ ] Tab switching works
- [ ] Scrolling works in player list
- [ ] Scrolling works in queue
- [ ] Scrolling works in rosters
- [ ] Scrolling works in board
- [ ] Dev tools integration works
- [ ] Fast mode toggle works

### Browser Testing

- [ ] Chrome/Edge (desktop)
- [ ] Safari (desktop)
- [ ] Firefox (desktop)
- [ ] Mobile Safari (iOS)
- [ ] Chrome Mobile (Android)

### Edge Cases

- [ ] Very long player list (100+ players)
- [ ] Very long queue (20+ players)
- [ ] Switching tabs while scrolling
- [ ] Opening modals while draft is active
- [ ] Fast mode toggle during active draft

---

## Troubleshooting

### Issue: Content still overflows

**Solution:** Verify `minHeight: 0` is set on both the content wrapper and main element. This is the most common cause.

### Issue: Scrolling doesn't work

**Solution:** 
1. Check that `overflowY: auto` is set on main element
2. Verify `minHeight: 0` is set
3. Ensure parent has `overflow: hidden`

### Issue: Header/footer not fixed

**Solution:** Verify `flexShrink: 0` is set on header and footer containers.

### Issue: Picks bar causes overflow

**Solution:** Verify picks bar has `flexShrink: 0` and explicit `height: 200px`.

### Issue: Layout shifts when switching tabs

**Solution:** This is expected when picks bar shows/hides. The flexbox layout should handle it automatically.

---

## Files Modified

1. **Create:** `components/vx2/draft-room/components/DraftRoomPhoneFrame.tsx`
   - New component with clean flexbox layout
   - ~400-500 lines of code
   - Reuses all existing hooks and sub-components

2. **Update:** `pages/testing-grounds/vx2-draft-room.tsx`
   - Replace DraftRoomVX2 with DraftRoomPhoneFrame in desktop view
   - Simplify phone frame container
   - Update imports

3. **Optional:** `components/vx2/draft-room/index.ts`
   - Add export for DraftRoomPhoneFrame

---

## Dependencies

All dependencies are already in place:
- `useDraftRoom` hook
- All draft room components (PicksBar, PlayerList, etc.)
- All constants (DRAFT_LAYOUT, HEADER_HEIGHT, etc.)
- All types and interfaces

No new dependencies required.

---

## Benefits of This Approach

1. **Eliminates Height Issues:** Flexbox automatically calculates available space
2. **Simpler Code:** No complex positioning calculations
3. **More Reliable:** Works consistently across browsers
4. **Easier to Debug:** Clear layout structure
5. **Better Performance:** No absolute positioning recalculations
6. **Maintainable:** Easy to modify and extend

---

## Next Steps After Implementation

1. Test thoroughly using the checklist above
2. Verify in multiple browsers
3. Test on actual mobile devices if possible
4. Monitor for any layout issues
5. Consider applying similar approach to mobile view if needed

---

## Questions or Issues?

If you encounter any issues during implementation:

1. Check the Troubleshooting section above
2. Verify all constants match (HEADER_HEIGHT, DRAFT_LAYOUT values)
3. Ensure `minHeight: 0` is set on flex children
4. Check browser console for any errors
5. Compare with working DraftRoomVX2 implementation for reference

---

## Success Criteria

The implementation is successful when:

- ✅ Content fits exactly within 812px height
- ✅ No vertical overflow or content cutoff
- ✅ Scrolling works correctly in main content area
- ✅ All existing functionality works (tabs, modals, controls)
- ✅ Layout is stable (no shifts or jumps)
- ✅ Works across all major browsers

---

**End of Handoff Document**

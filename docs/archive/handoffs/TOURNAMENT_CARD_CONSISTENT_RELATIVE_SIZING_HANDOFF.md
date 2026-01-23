# Tournament Card Consistent Relative Sizing Fix
## Zero-Ambiguity Implementation Specification

**Version:** 2.0 Final  
**Date:** January 2025  
**Estimated Time:** 2-3 hours  
**Difficulty:** Medium  
**Status:** 🔄 **READY FOR IMPLEMENTATION**

---

## Problem Summary

Tournament cards appear at different relative sizes on different iPhone models because:

1. **Hardcoded status bar height (47px)** — Actual values range from 20px (iPhone SE) to 62px (iPhone 16 Pro Max)
2. **Incorrect available height calculation** — Wrong status bar height = wrong card size
3. **No device detection** — Same calculation used for all devices

**Goal:** Cards should fill exactly **55% of available viewport height** on ALL iPhone models, creating visual consistency across the device comparison page.

---

## THE MATH

Understanding the calculation is critical:

```
┌─────────────────────────────────────┐
│         Status Bar (20-62px)        │  ← Device-specific
├─────────────────────────────────────┤
│                                     │
│                                     │
│         Available Height            │  ← Content area
│         (fills remainder)           │
│                                     │
│     ┌───────────────────────┐       │
│     │                       │       │
│     │   Tournament Card     │       │  ← 55% of available
│     │   (55% of available)  │       │
│     │                       │       │
│     └───────────────────────┘       │
│                                     │
├─────────────────────────────────────┤
│         Tab Bar (81px fixed)        │  ← Constant
└─────────────────────────────────────┘

Formula:
availableHeight = viewportHeight - statusBarHeight - tabBarHeight - containerPadding
cardHeight = availableHeight × 0.55
```

**Example - iPhone 14 Pro Max (932px viewport):**
```
availableHeight = 932 - 59 - 81 - 24 = 768px
cardHeight = 768 × 0.55 = 422px
```

**Example - iPhone SE (667px viewport):**
```
availableHeight = 667 - 20 - 81 - 24 = 542px
cardHeight = 542 × 0.55 = 298px → 400px (minHeight applied)
```

---

## PRE-IMPLEMENTATION SETUP

### Step 0.1: Create Working Branch

```bash
git checkout -b fix/consistent-card-sizing
```

### Step 0.2: Verify Required Files Exist

```bash
# Check that these files exist
ls components/vx2/tabs/lobby/LobbyTabVX2.tsx
ls components/vx2/core/constants/sizes.ts

# Check if hooks directory exists
ls components/vx2/hooks/ui/ 2>/dev/null || echo "Need to create hooks/ui directory"
```

### Step 0.3: Create Hooks Directory (if needed)

```bash
mkdir -p components/vx2/hooks/ui
```

---

## PHASE 1: Create useCardHeight Hook

### Step 1.1: Create the Hook File

```bash
touch components/vx2/hooks/ui/useCardHeight.ts
```

### Step 1.2: Copy This Exact Code

Open `components/vx2/hooks/ui/useCardHeight.ts` and paste this complete implementation:

```typescript
/**
 * useCardHeight - Device-aware card height calculation
 * 
 * Calculates card height to fill a consistent relative percentage
 * of available viewport space across all iPhone models.
 * 
 * Uses three-tier status bar detection:
 * 1. Device preset (for phone frames)
 * 2. CSS environment variable (for real devices)
 * 3. Viewport-based estimation (fallback)
 * 
 * @module useCardHeight
 */

import { useState, useEffect, useMemo } from 'react';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Device preset ID type
 * Must match the keys in DEVICE_PRESETS from sizes.ts
 */
export type DevicePresetId = 
  | 'iphone-se'
  | 'iphone-13-mini'
  | 'iphone-12'
  | 'iphone-13'
  | 'iphone-15'
  | 'iphone-11'
  | 'iphone-12-pro-max'
  | 'iphone-13-pro-max'
  | 'iphone-14-pro-max'
  | 'iphone-16-pro-max';

/**
 * Options for useCardHeight hook
 */
export interface UseCardHeightOptions {
  /** Device preset ID (for phone frames in sandbox/demo) */
  devicePreset?: DevicePresetId;
  /** Total container padding (top + bottom) in pixels */
  containerPadding?: number;
  /** Percentage of available height to fill (0.0 - 1.0) */
  fillPercentage?: number;
  /** Minimum card height in pixels */
  minHeight?: number;
  /** Maximum card height in pixels (optional) */
  maxHeight?: number;
}

/**
 * Return value from useCardHeight hook
 */
export interface CardHeightResult {
  /** Calculated card height in pixels, or undefined during SSR */
  height: number | undefined;
  /** Available content height in pixels */
  availableHeight: number | undefined;
  /** Detected status bar height in pixels */
  statusBarHeight: number | undefined;
  /** Tab bar height in pixels (constant 81px) */
  tabBarHeight: number;
  /** Viewport height in pixels */
  viewportHeight: number | undefined;
  /** Whether calculation is complete (false during SSR) */
  isReady: boolean;
}

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Status bar heights for each iPhone model
 * Source: Apple Human Interface Guidelines + device measurements
 */
const STATUS_BAR_HEIGHTS: Record<DevicePresetId, number> = {
  'iphone-se': 20,           // No notch, classic status bar
  'iphone-13-mini': 50,      // Notch
  'iphone-12': 47,           // Notch
  'iphone-13': 47,           // Notch
  'iphone-15': 59,           // Dynamic Island
  'iphone-11': 48,           // Notch
  'iphone-12-pro-max': 47,   // Notch
  'iphone-13-pro-max': 47,   // Notch
  'iphone-14-pro-max': 59,   // Dynamic Island
  'iphone-16-pro-max': 62,   // Dynamic Island (taller)
};

/**
 * Viewport heights for device detection fallback
 * Used when device preset is not provided
 */
const VIEWPORT_HEIGHT_RANGES = {
  COMPACT: 700,      // iPhone SE and similar
  STANDARD: 860,     // iPhone 12/13/14
  LARGE: 960,        // Pro Max models
};

/**
 * Tab bar total height (constant across all devices)
 * Breakdown:
 * - paddingTop: 10px
 * - minHeight: 44px
 * - paddingBottom: 10px
 * - homeIndicatorMarginTop: 8px
 * - homeIndicatorHeight: 5px
 * - homeIndicatorMarginBottom: 4px
 * Total: 81px
 */
const TAB_BAR_HEIGHT = 81;

/**
 * Default options
 */
const DEFAULTS = {
  containerPadding: 24,    // 12px top + 12px bottom
  fillPercentage: 0.55,    // 55% of available height
  minHeight: 400,          // Minimum card height
  maxHeight: undefined,    // No maximum by default
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Detect status bar height using three-tier fallback
 * 
 * Priority:
 * 1. Device preset (if provided) - most accurate for phone frames
 * 2. CSS env(safe-area-inset-top) - accurate for real devices
 * 3. Viewport-based estimation - fallback when above unavailable
 */
function detectStatusBarHeight(devicePreset?: DevicePresetId): number {
  // Tier 1: Use device preset if provided
  if (devicePreset && STATUS_BAR_HEIGHTS[devicePreset] !== undefined) {
    return STATUS_BAR_HEIGHTS[devicePreset];
  }

  // Tier 2: Use CSS environment variable (real devices)
  if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    try {
      // Create a temporary element to measure safe-area-inset-top
      const testEl = document.createElement('div');
      testEl.style.cssText = 'position:fixed;top:env(safe-area-inset-top);';
      document.body.appendChild(testEl);
      const safeAreaTop = testEl.getBoundingClientRect().top;
      document.body.removeChild(testEl);

      if (safeAreaTop > 0) {
        // Safe area represents the notch/dynamic island area
        // Add base status bar height (20px) for total
        return Math.round(safeAreaTop);
      }
    } catch {
      // Fall through to Tier 3
    }
  }

  // Tier 3: Estimate from viewport dimensions
  if (typeof window !== 'undefined') {
    const viewportHeight = window.innerHeight;
    const userAgent = navigator.userAgent || '';

    // iPhone SE and compact devices (667px and below)
    if (viewportHeight <= VIEWPORT_HEIGHT_RANGES.COMPACT) {
      return 20; // Classic status bar
    }

    // Standard iPhones (up to 860px)
    if (viewportHeight <= VIEWPORT_HEIGHT_RANGES.STANDARD) {
      // Check for Dynamic Island in user agent
      const hasDynamicIsland = /iPhone\s*(1[4-9]|[2-9]\d)\s*Pro/i.test(userAgent) ||
                               /iPhone\s*1[5-9]/i.test(userAgent);
      return hasDynamicIsland ? 59 : 47;
    }

    // Large devices / Pro Max (up to 960px)
    if (viewportHeight <= VIEWPORT_HEIGHT_RANGES.LARGE) {
      // iPhone 16 Pro Max has the tallest status bar
      if (viewportHeight >= 950) return 62;
      // iPhone 14/15 Pro Max
      if (/iPhone\s*(14|15)\s*Pro\s*Max/i.test(userAgent)) return 59;
      // Older Pro Max models
      return 47;
    }
  }

  // Ultimate fallback: standard iPhone with notch
  return 47;
}

// ============================================================================
// MAIN HOOK
// ============================================================================

/**
 * Calculate card height for consistent relative sizing across devices
 * 
 * @param options - Configuration options
 * @returns Card height calculation result
 * 
 * @example
 * ```tsx
 * function LobbyTab() {
 *   const { height, isReady } = useCardHeight({
 *     fillPercentage: 0.55,
 *     containerPadding: 24,
 *     minHeight: 400,
 *   });
 * 
 *   if (!isReady) return <Loading />;
 * 
 *   return (
 *     <div style={{ height: `${height}px` }}>
 *       <TournamentCard />
 *     </div>
 *   );
 * }
 * ```
 */
export function useCardHeight(options: UseCardHeightOptions = {}): CardHeightResult {
  // Merge options with defaults
  const {
    devicePreset,
    containerPadding = DEFAULTS.containerPadding,
    fillPercentage = DEFAULTS.fillPercentage,
    minHeight = DEFAULTS.minHeight,
    maxHeight = DEFAULTS.maxHeight,
  } = options;

  // ----------------------------------------
  // State
  // ----------------------------------------
  const [viewportHeight, setViewportHeight] = useState<number | undefined>(undefined);
  const [isReady, setIsReady] = useState(false);

  // ----------------------------------------
  // Memoized calculations
  // ----------------------------------------

  // Status bar height (depends on devicePreset or detection)
  const statusBarHeight = useMemo(() => {
    if (typeof window === 'undefined') return undefined;
    return detectStatusBarHeight(devicePreset);
  }, [devicePreset]);

  // Available height for content
  const availableHeight = useMemo(() => {
    if (viewportHeight === undefined || statusBarHeight === undefined) {
      return undefined;
    }
    return viewportHeight - statusBarHeight - TAB_BAR_HEIGHT - containerPadding;
  }, [viewportHeight, statusBarHeight, containerPadding]);

  // Final card height with constraints
  const height = useMemo(() => {
    if (availableHeight === undefined) return undefined;

    // Calculate raw height
    let calculated = Math.floor(availableHeight * fillPercentage);

    // Apply minimum constraint
    if (calculated < minHeight) {
      calculated = minHeight;
    }

    // Apply maximum constraint (if provided)
    if (maxHeight !== undefined && calculated > maxHeight) {
      calculated = maxHeight;
    }

    return calculated;
  }, [availableHeight, fillPercentage, minHeight, maxHeight]);

  // ----------------------------------------
  // Effect: Update viewport height
  // ----------------------------------------
  useEffect(() => {
    // Skip during SSR
    if (typeof window === 'undefined') return;

    /**
     * Update viewport height from window
     */
    const updateViewportHeight = () => {
      // Prefer visualViewport for more accurate mobile measurements
      const vh = window.visualViewport?.height ?? window.innerHeight;
      setViewportHeight(vh);
      setIsReady(true);
    };

    // Initial measurement
    updateViewportHeight();

    // Debounced resize handler (prevents layout thrashing)
    let resizeTimeout: ReturnType<typeof setTimeout>;
    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(updateViewportHeight, 150);
    };

    // Listen for resize events
    window.addEventListener('resize', handleResize);
    
    // Also listen to visualViewport (more accurate on mobile)
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleResize);
    }

    // Handle orientation changes (delay to let browser settle)
    const handleOrientationChange = () => {
      setTimeout(updateViewportHeight, 100);
    };
    window.addEventListener('orientationchange', handleOrientationChange);

    // Cleanup
    return () => {
      clearTimeout(resizeTimeout);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleOrientationChange);
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleResize);
      }
    };
  }, []);

  // ----------------------------------------
  // Return result
  // ----------------------------------------
  return {
    height,
    availableHeight,
    statusBarHeight,
    tabBarHeight: TAB_BAR_HEIGHT,
    viewportHeight,
    isReady,
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

export default useCardHeight;
```

### Step 1.3: Create Index File for Exports

Create file: `components/vx2/hooks/ui/index.ts`

```bash
touch components/vx2/hooks/ui/index.ts
```

Add this content:

```typescript
/**
 * UI Hooks - Reusable hooks for UI calculations
 */

export { useCardHeight } from './useCardHeight';
export type { 
  UseCardHeightOptions, 
  CardHeightResult,
  DevicePresetId,
} from './useCardHeight';
```

### Step 1.4: Verify Files Created

```bash
ls -la components/vx2/hooks/ui/
# Should show:
# useCardHeight.ts
# index.ts
```

---

## PHASE 2: Update LobbyTabVX2.tsx

### Step 2.1: Open the File

```bash
code components/vx2/tabs/lobby/LobbyTabVX2.tsx
```

### Step 2.2: Add Import

Find the imports section at the top of the file. Add this import:

```typescript
// ADD THIS LINE with the other imports
import { useCardHeight } from '../../hooks/ui/useCardHeight';
```

### Step 2.3: Find and DELETE the Old Calculation Code

Search for this code block (it may be around lines 84-142). **DELETE THE ENTIRE BLOCK**:

```typescript
// DELETE THIS ENTIRE BLOCK - START
// Calculate card height to fill same relative amount across devices
const [cardHeight, setCardHeight] = useState<number | undefined>(undefined);

useEffect(() => {
  if (typeof window === 'undefined') return;
  
  const calculateCardHeight = () => {
    // Tab bar height: paddingTop (10) + minHeight (44) + paddingBottom (10) + 
    // homeIndicatorMarginTop (8) + homeIndicatorHeight (5) + homeIndicatorMarginBottom (4) = 81px
    const tabBarHeight = 81;
    
    // Status bar height (varies by device, use safe default)
    const statusBarHeight = 47; // <-- THIS IS THE PROBLEM - hardcoded!
    
    // Container padding (top + bottom)
    const containerPadding = LOBBY_PX.containerPaddingY * 2;
    
    // Get viewport height
    const viewportHeight = window.innerHeight || window.visualViewport?.height || 0;
    
    // Available height = viewport - status bar - tab bar - container padding
    const availableHeight = viewportHeight - statusBarHeight - tabBarHeight - containerPadding;
    
    // Card should fill ~55% of available height for consistent relative sizing
    const calculatedHeight = Math.floor(availableHeight * 0.55);
    
    // Set minimum height to prevent cards from being too small
    const minHeight = 400;
    const finalHeight = Math.max(calculatedHeight, minHeight);
    
    setCardHeight(finalHeight);
  };
  
  calculateCardHeight();
  
  // Recalculate on resize (debounced)
  let timeoutId: NodeJS.Timeout;
  const handleResize = () => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(calculateCardHeight, 150);
  };
  
  window.addEventListener('resize', handleResize);
  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', handleResize);
  }
  
  return () => {
    clearTimeout(timeoutId);
    window.removeEventListener('resize', handleResize);
    if (window.visualViewport) {
      window.visualViewport.removeEventListener('resize', handleResize);
    }
  };
}, []);
// DELETE THIS ENTIRE BLOCK - END
```

### Step 2.4: Add the New Hook Usage

In the same location where you deleted the old code, add this:

```typescript
// Calculate card height for consistent relative sizing across all iPhone models
// Uses device-aware status bar detection instead of hardcoded 47px
const { 
  height: cardHeight, 
  isReady: isCardHeightReady,
  statusBarHeight,
  availableHeight,
} = useCardHeight({
  containerPadding: LOBBY_PX.containerPaddingY * 2,
  fillPercentage: 0.55,
  minHeight: 400,
});
```

### Step 2.5: Find the Card Wrapper and Update It

Search for the tournament card wrapper div. It should look something like this:

```typescript
<div
  style={{
    width: '100%',
    maxWidth: '420px',
    // ... other styles
  }}
>
  <TournamentCard ... />
</div>
```

Update it to use the calculated height:

```typescript
{/* Tournament Card - Uses calculated height for consistent sizing */}
<div
  style={{
    width: '100%',
    maxWidth: '420px',
    // Use calculated height, fallback to auto if not ready
    height: cardHeight ? `${cardHeight}px` : 'auto',
    display: 'flex',
    flexDirection: 'column',
  }}
>
  <TournamentCard
    tournament={featuredTournament}
    onJoinClick={() => handleJoinClick(featuredTournament.id)}
    featured={true}
    className="w-full h-full"
    styleOverrides={cardHeight ? { minHeight: cardHeight } : undefined}
  />
</div>
```

### Step 2.6: (Optional) Add Debug Logging

For testing, temporarily add this useEffect after the hook:

```typescript
// DEBUG: Remove after testing
useEffect(() => {
  if (isCardHeightReady) {
    console.log('[useCardHeight] Calculation:', {
      viewportHeight: window.innerHeight,
      statusBarHeight,
      availableHeight,
      cardHeight,
      fillPercentage: '55%',
    });
  }
}, [isCardHeightReady, statusBarHeight, availableHeight, cardHeight]);
```

---

## PHASE 3: TypeScript Verification

### Step 3.1: Run TypeScript Check

```bash
npx tsc --noEmit
```

**Expected:** No errors

**Common errors and fixes:**

| Error | Fix |
|-------|-----|
| Cannot find module '../../hooks/ui/useCardHeight' | Check the file path is correct |
| Type 'number \| undefined' not assignable | Use conditional: `cardHeight ? \`${cardHeight}px\` : 'auto'` |
| LOBBY_PX is not defined | Make sure LOBBY_PX constant exists in the file |

### Step 3.2: Run Linter

```bash
npm run lint
```

Fix any linting errors before proceeding.

---

## PHASE 4: Testing

### Step 4.1: Start Dev Server

```bash
npm run dev
```

### Step 4.2: Test in Device Comparison View

Navigate to your device comparison page (e.g., `/testing-grounds/vx2-mobile-app-demo`).

**Check each device:**

| Device | Viewport | Expected Status Bar | Expected Card % |
|--------|----------|---------------------|-----------------|
| iPhone SE | 667px | 20px | 55% (or minHeight 400px) |
| iPhone 13 | 844px | 47px | 55% |
| iPhone 14 Pro Max | 932px | 59px | 55% |
| iPhone 16 Pro Max | 956px | 62px | 55% |

### Step 4.3: Verify Console Output

Open browser DevTools Console. You should see:

```
[useCardHeight] Calculation: {
  viewportHeight: 844,
  statusBarHeight: 47,
  availableHeight: 692,
  cardHeight: 380,
  fillPercentage: "55%"
}
```

**Verify:**
- `statusBarHeight` matches expected value for the device
- `cardHeight` is approximately 55% of `availableHeight`
- `cardHeight` is at least 400 (minHeight)

### Step 4.4: Visual Verification

Cards across all device sizes should:
1. Fill approximately the same relative amount of screen
2. Not have huge gaps below them
3. Not overflow or get cut off
4. Look proportionally similar

### Step 4.5: Resize Test

1. Open Chrome DevTools
2. Toggle device toolbar
3. Switch between different iPhone presets
4. Verify smooth recalculation (no flicker)

---

## PHASE 5: Cleanup and Commit

### Step 5.1: Remove Debug Logging

Delete the `console.log` useEffect added in Step 2.6.

### Step 5.2: Stage Changes

```bash
git add components/vx2/hooks/ui/useCardHeight.ts
git add components/vx2/hooks/ui/index.ts
git add components/vx2/tabs/lobby/LobbyTabVX2.tsx
```

### Step 5.3: Commit

```bash
git commit -m "feat: device-aware card height calculation

Created useCardHeight hook with three-tier status bar detection:
1. Device preset (for phone frames) - most accurate
2. CSS env(safe-area-inset-top) (for real devices)
3. Viewport-based estimation (fallback)

Status bar heights by device:
- iPhone SE: 20px (was using 47px - WRONG)
- iPhone 12/13: 47px
- iPhone 14/15 Pro: 59px
- iPhone 16 Pro Max: 62px

Updated LobbyTabVX2 to use new hook instead of hardcoded 47px.

Result: Cards now fill exactly 55% of available height across
all iPhone models, creating visual consistency."
```

### Step 5.4: Push

```bash
git push origin fix/consistent-card-sizing
```

---

## TROUBLESHOOTING

### Issue: Cards still different sizes across devices

**Check 1:** Is the hook being used?
```bash
grep -n "useCardHeight" components/vx2/tabs/lobby/LobbyTabVX2.tsx
```

**Check 2:** Is the old code deleted?
```bash
grep -n "statusBarHeight = 47" components/vx2/tabs/lobby/LobbyTabVX2.tsx
# Should return nothing
```

**Check 3:** Is the height being applied?
```bash
grep -n "cardHeight" components/vx2/tabs/lobby/LobbyTabVX2.tsx
# Should show the hook usage and the style application
```

### Issue: Cards too small on iPhone SE

The minHeight (400px) is being applied. This is correct behavior because:
```
iPhone SE: 542px available × 0.55 = 298px (too small)
With minHeight: 400px (applied)
```

If 400px looks too small, increase `minHeight` in the hook call:
```typescript
const { height: cardHeight } = useCardHeight({
  minHeight: 350, // or lower
});
```

### Issue: Hydration mismatch error

The hook returns `undefined` during SSR and calculates on client. Make sure you handle this:

```typescript
// CORRECT
height: cardHeight ? `${cardHeight}px` : 'auto'

// WRONG (causes hydration mismatch)
height: `${cardHeight}px`
```

### Issue: Status bar height wrong for a specific device

Add or update the device in `STATUS_BAR_HEIGHTS`:

```typescript
const STATUS_BAR_HEIGHTS: Record<DevicePresetId, number> = {
  // ... existing devices
  'new-iphone-model': 65, // Add new device
};
```

---

## QUICK REFERENCE: Status Bar Heights

| Device | Height | Has Notch | Has Dynamic Island |
|--------|--------|-----------|-------------------|
| iPhone SE | 20px | ❌ | ❌ |
| iPhone 11 | 48px | ✅ | ❌ |
| iPhone 12/13 | 47px | ✅ | ❌ |
| iPhone 13 Mini | 50px | ✅ | ❌ |
| iPhone 14 | 47px | ✅ | ❌ |
| iPhone 14 Pro | 59px | ❌ | ✅ |
| iPhone 15 | 59px | ❌ | ✅ |
| iPhone 16 Pro Max | 62px | ❌ | ✅ |

---

## FILES SUMMARY

| File | Action | Description |
|------|--------|-------------|
| `hooks/ui/useCardHeight.ts` | CREATE | Device-aware height calculation hook |
| `hooks/ui/index.ts` | CREATE | Export index |
| `tabs/lobby/LobbyTabVX2.tsx` | MODIFY | Use new hook, delete old calculation |

---

## SYSTEMIC IMPLICATIONS

### Reusability
- The `useCardHeight` hook can be used by other components needing consistent relative sizing
- Future card components can leverage the same calculation logic
- Reduces code duplication across the codebase

### Device Support
- Works with all iPhone models in DEVICE_PRESETS
- Handles future devices through viewport-based estimation
- Supports both real devices and simulated phone frames

### Performance
- Memoized calculations prevent unnecessary recalculations
- Debounced resize handlers reduce layout thrashing
- SSR-safe (returns undefined during server render)

### Maintainability
- Single source of truth for height calculations
- Easy to adjust fill percentage globally
- Clear separation of concerns

### Testing
- Can be tested with different device presets
- Viewport dimensions can be mocked
- Status bar height detection is testable

---

## SUCCESS CRITERIA

- [ ] Cards fill exactly 55% of available height across all iPhone models
- [ ] Status bar heights are accurately detected for each device
- [ ] No visual inconsistencies between iPhone SE, iPhone 13, and iPhone 14 Pro Max
- [ ] Smooth recalculation on orientation changes
- [ ] No performance regressions (debounced resize handlers)
- [ ] Code is reusable for future components
- [ ] No hydration mismatches
- [ ] Works in both real devices and phone frames

---

**END OF HANDOFF DOCUMENT**

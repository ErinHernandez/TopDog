# Fixed Pixel Margin Card Sizing
## Zero-Ambiguity Implementation Specification

**Version:** 2.0 Final  
**Date:** January 2025  
**Estimated Time:** 2-3 hours  
**Difficulty:** Medium  
**Status:** Ready for Implementation

---

## Problem With Previous Approach

The percentage-based approach (55% of available height) had issues:
- Cards appeared different relative sizes on different devices
- Complex calculation with device-specific status bar detection
- Percentage doesn't translate to consistent visual spacing

## New Approach: Fixed Pixel Margins

Instead of calculating a percentage, we define **fixed pixel margins** from the edges:

```
Card Height = Viewport - StatusBar - TabBar - TopMargin - BottomMargin
Card Width  = Viewport Width - LeftMargin - RightMargin (with maxWidth cap)
```

This ensures the card always has exactly 16px (configurable) of visible space between it and the UI chrome.

---

## Visual Model

```
┌─────────────────────────────────────┐
│         STATUS BAR (device-specific)│
├─────────────────────────────────────┤
│  ↕ 16px top margin                  │
│  ┌───────────────────────────────┐  │
│  │                               │  │
│  │                               │  │
│  │        TOURNAMENT CARD        │  │
│  │                               │  │
│  │   Height = fills available    │  │
│  │   Width  = viewport - 32px    │  │
│  │           (max 420px)         │  │
│  │                               │  │
│  │                               │  │
│  └───────────────────────────────┘  │
│  ↕ 16px bottom margin               │
├─────────────────────────────────────┤
│            TAB BAR (81px)           │
└─────────────────────────────────────┘

← 16px →                        ← 16px →
  left                            right
 margin                          margin
```

---

## The Math

```
Height Calculation:
availableHeight = viewportHeight - statusBarHeight - tabBarHeight - topMargin - bottomMargin
cardHeight = clamp(availableHeight, minHeight, maxHeight)

Width Calculation:
availableWidth = viewportWidth - leftMargin - rightMargin
cardWidth = clamp(availableWidth, minWidth, maxWidth)
```

**Example - iPhone 14 Pro (393×852):**
```
viewportHeight = 852
statusBarHeight = 59
tabBarHeight = 81
topMargin = 16
bottomMargin = 16

availableHeight = 852 - 59 - 81 - 16 - 16 = 680px
cardHeight = 680px (within min/max bounds)

viewportWidth = 393
leftMargin = 16
rightMargin = 16

availableWidth = 393 - 16 - 16 = 361px
cardWidth = 361px (under maxWidth of 420px)
```

---

# PRE-IMPLEMENTATION CHECKLIST

## Step 0.1: Verify Dependencies Exist

The original plan references `useStatusBarHeight` and `useTabBarHeight` hooks. **These likely don't exist.** We'll create a self-contained solution instead.

```bash
# Check if these hooks exist
find . -name "useStatusBarHeight*" -type f | grep -v node_modules
find . -name "useTabBarHeight*" -type f | grep -v node_modules

# If they don't exist (likely), we'll include the logic inline
```

## Step 0.2: Create Working Branch

```bash
git checkout -b refactor/fixed-margin-card-sizing
```

## Step 0.3: Verify Target Files Exist

```bash
ls components/vx2/hooks/ui/useCardHeight.ts
ls components/vx2/tabs/lobby/LobbyTabVX2.tsx
```

---

# PHASE 1: Rewrite useCardHeight Hook

## Step 1.1: Backup Existing Hook

```bash
cp components/vx2/hooks/ui/useCardHeight.ts components/vx2/hooks/ui/useCardHeight.ts.backup
```

## Step 1.2: Replace Hook Contents

Open `components/vx2/hooks/ui/useCardHeight.ts` and **replace the entire file** with:

```typescript
/**
 * useCardHeight - Fixed Margin Card Sizing
 * 
 * Calculates card dimensions based on fixed pixel margins from viewport boundaries.
 * 
 * Instead of percentage-based sizing (55% of available), this approach uses:
 * - Fixed pixel margins from status bar (top)
 * - Fixed pixel margins from tab bar (bottom)
 * - Fixed pixel margins from screen edges (left/right)
 * 
 * This ensures consistent visual spacing regardless of device size.
 * 
 * @module useCardHeight
 */

import { useState, useEffect, useMemo } from 'react';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Device preset ID for phone frame simulation
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
  | 'iphone-16-pro-max'
  | string; // Allow any string for flexibility

/**
 * Configuration options for margin-based card sizing
 */
export interface UseCardHeightOptions {
  /** Device preset ID (for phone frames in sandbox/demo) */
  devicePreset?: DevicePresetId;

  // ========================================
  // MARGIN CONFIGURATION
  // ========================================

  /** Pixels between status bar and card top edge */
  topMargin?: number;

  /** Pixels between card bottom edge and tab bar */
  bottomMargin?: number;

  /** Pixels between left screen edge and card */
  leftMargin?: number;

  /** Pixels between right screen edge and card */
  rightMargin?: number;

  // ========================================
  // HEIGHT CONSTRAINTS
  // ========================================

  /** Minimum card height in pixels */
  minHeight?: number;

  /** Maximum card height in pixels (optional) */
  maxHeight?: number;

  // ========================================
  // WIDTH CONSTRAINTS
  // ========================================

  /** Minimum card width in pixels */
  minWidth?: number;

  /** Maximum card width in pixels */
  maxWidth?: number;
}

/**
 * Return value from useCardHeight hook
 */
export interface CardHeightResult {
  /** Final card height in pixels (after constraints) */
  height: number | undefined;

  /** Final card width in pixels (after constraints) */
  width: number | undefined;

  /** Available height before constraints */
  availableHeight: number | undefined;

  /** Available width before constraints */
  availableWidth: number | undefined;

  /** Detected status bar height */
  statusBarHeight: number | undefined;

  /** Tab bar height (constant 81px) */
  tabBarHeight: number;

  /** Current viewport height */
  viewportHeight: number | undefined;

  /** Current viewport width */
  viewportWidth: number | undefined;

  /** Configuration used (for debugging) */
  margins: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };

  /** Whether calculation is complete (false during SSR) */
  isReady: boolean;
}

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Default margin and constraint values
 */
const DEFAULTS = {
  // Margins (pixels)
  topMargin: 16,
  bottomMargin: 16,
  leftMargin: 16,
  rightMargin: 16,

  // Height constraints
  minHeight: 400,
  maxHeight: undefined as number | undefined,

  // Width constraints
  minWidth: 300,
  maxWidth: 420,
} as const;

/**
 * Tab bar total height (constant across all iOS devices)
 * 
 * Breakdown:
 * - paddingTop: 10px
 * - content minHeight: 44px
 * - paddingBottom: 10px
 * - homeIndicatorMarginTop: 8px
 * - homeIndicatorHeight: 5px
 * - homeIndicatorMarginBottom: 4px
 * 
 * Total: 81px
 */
const TAB_BAR_HEIGHT = 81;

/**
 * Status bar heights by device
 * Used when devicePreset is provided (phone frames)
 */
const STATUS_BAR_BY_DEVICE: Record<string, number> = {
  'iphone-se': 20,
  'iphone-13-mini': 50,
  'iphone-12': 47,
  'iphone-13': 47,
  'iphone-15': 59,
  'iphone-11': 48,
  'iphone-12-pro-max': 47,
  'iphone-13-pro-max': 47,
  'iphone-14-pro-max': 59,
  'iphone-16-pro-max': 62,
};

/**
 * Viewport height thresholds for status bar estimation
 */
const VIEWPORT_THRESHOLDS = {
  COMPACT: 700,   // iPhone SE and similar
  STANDARD: 860,  // iPhone 12/13/14
  LARGE: 960,     // Pro Max models
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Detect status bar height
 * 
 * Priority:
 * 1. Device preset (if provided)
 * 2. CSS safe-area-inset-top (real devices)
 * 3. Viewport-based estimation
 */
function detectStatusBarHeight(devicePreset?: string): number {
  // Method 1: Use device preset
  if (devicePreset && STATUS_BAR_BY_DEVICE[devicePreset] !== undefined) {
    return STATUS_BAR_BY_DEVICE[devicePreset];
  }

  // Server-side: return default
  if (typeof window === 'undefined') {
    return 47;
  }

  // Method 2: CSS environment variable
  try {
    const computedStyle = getComputedStyle(document.documentElement);
    const safeAreaTop = computedStyle.getPropertyValue('env(safe-area-inset-top)');
    if (safeAreaTop) {
      const parsed = parseInt(safeAreaTop, 10);
      if (!isNaN(parsed) && parsed > 0) {
        return parsed;
      }
    }
  } catch {
    // Fall through to method 3
  }

  // Method 3: Viewport-based estimation
  const vh = window.innerHeight;

  if (vh <= VIEWPORT_THRESHOLDS.COMPACT) {
    return 20; // iPhone SE
  }

  if (vh <= VIEWPORT_THRESHOLDS.STANDARD) {
    // Check for Dynamic Island devices
    const ua = navigator.userAgent;
    if (/iPhone\s*(14|15|16)\s*Pro/i.test(ua)) {
      return 59;
    }
    return 47; // Standard notch
  }

  if (vh <= VIEWPORT_THRESHOLDS.LARGE) {
    // Pro Max models
    if (vh >= 950) return 62; // iPhone 16 Pro Max
    return 59; // iPhone 14/15 Pro Max
  }

  // Default
  return 47;
}

/**
 * Clamp a value between min and max
 */
function clamp(value: number, min?: number, max?: number): number {
  let result = value;
  if (min !== undefined && result < min) result = min;
  if (max !== undefined && result > max) result = max;
  return result;
}

// ============================================================================
// MAIN HOOK
// ============================================================================

/**
 * Calculate card dimensions based on fixed pixel margins
 * 
 * @param options - Configuration options
 * @returns Calculated dimensions and state
 * 
 * @example
 * ```tsx
 * function LobbyTab() {
 *   const { height, width, isReady } = useCardHeight({
 *     topMargin: 16,
 *     bottomMargin: 16,
 *     leftMargin: 16,
 *     rightMargin: 16,
 *     maxWidth: 420,
 *   });
 * 
 *   return (
 *     <div style={{ 
 *       width: width ? `${width}px` : '100%',
 *       height: height ? `${height}px` : 'auto',
 *     }}>
 *       <TournamentCard />
 *     </div>
 *   );
 * }
 * ```
 */
export function useCardHeight(options: UseCardHeightOptions = {}): CardHeightResult {
  // ----------------------------------------
  // Merge options with defaults
  // ----------------------------------------
  const {
    devicePreset,
    topMargin = DEFAULTS.topMargin,
    bottomMargin = DEFAULTS.bottomMargin,
    leftMargin = DEFAULTS.leftMargin,
    rightMargin = DEFAULTS.rightMargin,
    minHeight = DEFAULTS.minHeight,
    maxHeight = DEFAULTS.maxHeight,
    minWidth = DEFAULTS.minWidth,
    maxWidth = DEFAULTS.maxWidth,
  } = options;

  // ----------------------------------------
  // State
  // ----------------------------------------
  const [viewportHeight, setViewportHeight] = useState<number | undefined>(undefined);
  const [viewportWidth, setViewportWidth] = useState<number | undefined>(undefined);
  const [isReady, setIsReady] = useState(false);

  // ----------------------------------------
  // Detect status bar height
  // ----------------------------------------
  const statusBarHeight = useMemo(() => {
    if (typeof window === 'undefined') return undefined;
    return detectStatusBarHeight(devicePreset);
  }, [devicePreset]);

  // ----------------------------------------
  // Calculate available height
  // ----------------------------------------
  const availableHeight = useMemo(() => {
    if (viewportHeight === undefined || statusBarHeight === undefined) {
      return undefined;
    }

    // Total vertical space consumed by chrome and margins
    const topOffset = statusBarHeight + topMargin;
    const bottomOffset = TAB_BAR_HEIGHT + bottomMargin;

    return viewportHeight - topOffset - bottomOffset;
  }, [viewportHeight, statusBarHeight, topMargin, bottomMargin]);

  // ----------------------------------------
  // Calculate final height with constraints
  // ----------------------------------------
  const height = useMemo(() => {
    if (availableHeight === undefined) return undefined;
    return Math.floor(clamp(availableHeight, minHeight, maxHeight));
  }, [availableHeight, minHeight, maxHeight]);

  // ----------------------------------------
  // Calculate available width
  // ----------------------------------------
  const availableWidth = useMemo(() => {
    if (viewportWidth === undefined) return undefined;
    return viewportWidth - leftMargin - rightMargin;
  }, [viewportWidth, leftMargin, rightMargin]);

  // ----------------------------------------
  // Calculate final width with constraints
  // ----------------------------------------
  const width = useMemo(() => {
    if (availableWidth === undefined) return undefined;
    return Math.floor(clamp(availableWidth, minWidth, maxWidth));
  }, [availableWidth, minWidth, maxWidth]);

  // ----------------------------------------
  // Effect: Track viewport dimensions
  // ----------------------------------------
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const updateDimensions = () => {
      // Prefer visualViewport for accurate mobile measurements
      const vh = window.visualViewport?.height ?? window.innerHeight;
      const vw = window.visualViewport?.width ?? window.innerWidth;

      setViewportHeight(vh);
      setViewportWidth(vw);
      setIsReady(true);
    };

    // Initial measurement
    updateDimensions();

    // Debounced resize handler
    let resizeTimeout: ReturnType<typeof setTimeout>;
    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(updateDimensions, 100);
    };

    // Event listeners
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', () => {
      // Delay for orientation change to complete
      setTimeout(updateDimensions, 150);
    });

    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleResize);
    }

    // Cleanup
    return () => {
      clearTimeout(resizeTimeout);
      window.removeEventListener('resize', handleResize);
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
    width,
    availableHeight,
    availableWidth,
    statusBarHeight,
    tabBarHeight: TAB_BAR_HEIGHT,
    viewportHeight,
    viewportWidth,
    margins: {
      top: topMargin,
      bottom: bottomMargin,
      left: leftMargin,
      right: rightMargin,
    },
    isReady,
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

export default useCardHeight;
```

## Step 1.3: Update Index Exports (if exists)

If `components/vx2/hooks/ui/index.ts` exists, ensure it exports the hook:

```typescript
export { useCardHeight } from './useCardHeight';
export type { 
  UseCardHeightOptions, 
  CardHeightResult,
  DevicePresetId,
} from './useCardHeight';
```

## Step 1.4: Verify TypeScript Compiles

```bash
npx tsc --noEmit components/vx2/hooks/ui/useCardHeight.ts
```

---

# PHASE 2: Update LobbyTabVX2.tsx

## Step 2.1: Open the File

```bash
code components/vx2/tabs/lobby/LobbyTabVX2.tsx
```

## Step 2.2: Find the Current useCardHeight Call

Search for `useCardHeight`. You'll find something like:

```typescript
const { 
  height: cardHeight, 
  isReady: isCardHeightReady,
} = useCardHeight({
  containerPadding: LOBBY_PX.containerPaddingY * 2,
  fillPercentage: 0.55,
  minHeight: 400,
});
```

## Step 2.3: Replace the Hook Call

**DELETE** the old call and **REPLACE** with:

```typescript
// Calculate card dimensions using fixed pixel margins
// Card will have exactly 16px spacing from status bar and tab bar
const {
  height: cardHeight,
  width: cardWidth,
  isReady: isCardHeightReady,
  statusBarHeight,
  availableHeight,
} = useCardHeight({
  // Fixed pixel margins from viewport edges
  topMargin: 16,
  bottomMargin: 16,
  leftMargin: 16,
  rightMargin: 16,
  // Constraints
  minHeight: 400,
  maxWidth: 420,
});
```

## Step 2.4: Find the Container Styles

Search for the lobby container div. It might look like:

```typescript
<div
  className="vx2-lobby-content"
  style={{
    padding: `${LOBBY_PX.containerPaddingY}px ${LOBBY_PX.containerPaddingX}px`,
    // ... other styles
  }}
>
```

## Step 2.5: Update Container Styles

**Change the padding to 0** — margins are now handled by the card sizing calculation:

```typescript
<div
  className="vx2-lobby-content"
  style={{
    // REMOVED: padding: `${LOBBY_PX.containerPaddingY}px ...`
    padding: 0, // Margins handled by useCardHeight
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100%',
    backgroundColor: BG_COLORS.primary,
  }}
>
```

## Step 2.6: Find the Card Wrapper

Search for the div that wraps the TournamentCard. It might look like:

```typescript
<div
  style={{
    width: '100%',
    maxWidth: '420px',
    height: cardHeight ? `${cardHeight}px` : 'auto',
    // ... other styles
  }}
>
  <TournamentCard ... />
</div>
```

## Step 2.7: Update Card Wrapper

**REPLACE** the entire wrapper div with:

```typescript
{/* Tournament Card Wrapper - Uses calculated dimensions */}
<div
  style={{
    // Width: calculated from viewport minus margins, capped at maxWidth
    width: cardWidth ? `${cardWidth}px` : '100%',
    
    // Height: calculated from viewport minus status bar, tab bar, and margins
    height: cardHeight ? `${cardHeight}px` : 'auto',
    
    // Centering
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    
    // Debug: uncomment to see exact dimensions
    // border: '1px solid red',
  }}
>
  <TournamentCard
    tournament={featuredTournament}
    onJoinClick={() => handleJoinClick(featuredTournament.id)}
    featured={true}
    className="w-full h-full"
    styleOverrides={{
      // Ensure card fills the wrapper completely
      minHeight: cardHeight,
    }}
  />
</div>
```

## Step 2.8: (Optional) Add Debug Logging

For testing, temporarily add this after the hook call:

```typescript
// DEBUG: Remove after verification
useEffect(() => {
  if (isCardHeightReady) {
    console.log('[FixedMargins] Card dimensions:', {
      viewport: { width: window.innerWidth, height: window.innerHeight },
      statusBar: statusBarHeight,
      margins: { top: 16, bottom: 16, left: 16, right: 16 },
      available: { width: availableHeight, height: availableHeight },
      final: { width: cardWidth, height: cardHeight },
    });
  }
}, [isCardHeightReady, cardWidth, cardHeight, statusBarHeight, availableHeight]);
```

---

# PHASE 3: Handle Edge Cases

## Step 3.1: Check for containerPadding References

Search for any remaining references to the old approach:

```bash
grep -n "containerPadding" components/vx2/tabs/lobby/LobbyTabVX2.tsx
grep -n "fillPercentage" components/vx2/tabs/lobby/LobbyTabVX2.tsx
```

If found, **DELETE** these references — they're no longer used.

## Step 3.2: Check LOBBY_PX Usage

If `LOBBY_PX.containerPaddingY` or `LOBBY_PX.containerPaddingX` are no longer used anywhere in the file, you can leave them (they might be used elsewhere) but verify the container padding is set to 0.

## Step 3.3: Verify No Other Files Use Old API

```bash
grep -rn "fillPercentage" components/ --include="*.tsx" --include="*.ts" | grep -v node_modules
grep -rn "containerPadding.*useCardHeight" components/ --include="*.tsx" --include="*.ts"
```

If other files use the old API, they'll need to be updated too. The new hook is backwards-compatible with `minHeight` and `maxHeight`, but `fillPercentage` and `containerPadding` are removed.

---

# PHASE 4: TypeScript Verification

## Step 4.1: Full TypeScript Check

```bash
npx tsc --noEmit
```

**Common errors and fixes:**

| Error | Cause | Fix |
|-------|-------|-----|
| Property 'width' does not exist | Old hook didn't return width | Using new hook solves this |
| Property 'fillPercentage' does not exist | Old option removed | Remove from hook call |
| Property 'containerPadding' does not exist | Old option removed | Remove from hook call |

## Step 4.2: Lint Check

```bash
npm run lint
```

---

# PHASE 5: Testing

## Step 5.1: Start Dev Server

```bash
npm run dev
```

## Step 5.2: Test on Multiple Devices

Open your device comparison page and verify:

| Device | Expected Behavior |
|--------|-------------------|
| iPhone SE (375×667) | 16px margins visible, card fills remaining space |
| iPhone 13 (390×844) | 16px margins visible, card fills remaining space |
| iPhone 14 Pro Max (430×932) | 16px margins visible, card fills remaining space |

## Step 5.3: Visual Verification

For each device:
1. **Top margin**: Exactly 16px between status bar and card top
2. **Bottom margin**: Exactly 16px between card bottom and tab bar
3. **Side margins**: Exactly 16px on each side (unless maxWidth 420px applies)
4. **Card fills space**: No unexpected gaps

## Step 5.4: Console Verification

Check browser console for debug output:

```
[FixedMargins] Card dimensions: {
  viewport: { width: 390, height: 844 },
  statusBar: 47,
  margins: { top: 16, bottom: 16, left: 16, right: 16 },
  available: { width: 358, height: 684 },
  final: { width: 358, height: 684 }
}
```

Verify:
- `final.height` = `viewport.height` - `statusBar` - 81 (tab bar) - 32 (margins)
- `final.width` = min(`viewport.width` - 32, 420)

## Step 5.5: Resize Test

1. Open Chrome DevTools
2. Switch between device sizes
3. Verify smooth recalculation
4. Verify margins remain consistent

## Step 5.6: Orientation Test

1. Toggle device orientation in DevTools
2. Verify card recalculates
3. Width should use maxWidth (420px) in landscape if viewport is wide enough

---

# PHASE 6: Cleanup and Commit

## Step 6.1: Remove Debug Logging

Delete the `console.log` useEffect added in Step 2.8.

## Step 6.2: Remove Backup File

```bash
rm components/vx2/hooks/ui/useCardHeight.ts.backup
```

## Step 6.3: Stage Changes

```bash
git add components/vx2/hooks/ui/useCardHeight.ts
git add components/vx2/tabs/lobby/LobbyTabVX2.tsx
```

## Step 6.4: Commit

```bash
git commit -m "refactor: switch to fixed pixel margins for card sizing

BREAKING CHANGE: useCardHeight API changed

Removed options:
- fillPercentage (was 0.55)
- containerPadding

Added options:
- topMargin (default 16px)
- bottomMargin (default 16px)
- leftMargin (default 16px)
- rightMargin (default 16px)

New return values:
- width (calculated card width)
- availableWidth
- viewportWidth
- margins (config used)

Benefits:
- Consistent 16px spacing from UI chrome on ALL devices
- No percentage-based calculations
- Predictable visual spacing
- Width now calculated (respects maxWidth)

Formula:
height = viewport - statusBar - tabBar - topMargin - bottomMargin
width = min(viewport - leftMargin - rightMargin, maxWidth)"
```

## Step 6.5: Push

```bash
git push origin refactor/fixed-margin-card-sizing
```

---

# TROUBLESHOOTING

## Issue: Card too small / has gaps

**Cause:** Margins are being applied twice (once in hook, once in container padding).

**Fix:** Ensure container padding is set to `0`:
```typescript
<div style={{ padding: 0 }}>
```

## Issue: Card overlaps status bar or tab bar

**Cause:** Status bar height detection is wrong.

**Fix:** Check console output for `statusBarHeight`. If wrong, add/update the device in `STATUS_BAR_BY_DEVICE`:
```typescript
const STATUS_BAR_BY_DEVICE: Record<string, number> = {
  // ... add your device
  'new-device-id': 55,
};
```

## Issue: Card width is always maxWidth (420px)

**Cause:** This is correct behavior when viewport is wider than 420px + 32px margins.

**Verification:** On iPhone SE (375px wide), width should be 375 - 32 = 343px, which is less than 420px.

## Issue: TypeScript error about 'width' property

**Cause:** Using old version of hook that didn't return width.

**Fix:** Make sure you replaced the entire hook file with the new implementation.

## Issue: Other components break after hook update

**Cause:** Other components using the old `fillPercentage` or `containerPadding` options.

**Fix:** Update those components to use the new margin-based API, or add default values in the hook for backwards compatibility:

```typescript
// In the hook, for backwards compatibility (if needed):
const {
  fillPercentage, // DEPRECATED - ignored
  containerPadding, // DEPRECATED - use topMargin + bottomMargin instead
  ...
} = options;

// Log deprecation warning
if (fillPercentage !== undefined) {
  console.warn('[useCardHeight] fillPercentage is deprecated. Use topMargin/bottomMargin instead.');
}
```

---

# QUICK REFERENCE

## New API

```typescript
const { height, width, isReady } = useCardHeight({
  // Margins (all default to 16px)
  topMargin: 16,
  bottomMargin: 16,
  leftMargin: 16,
  rightMargin: 16,
  
  // Height constraints
  minHeight: 400,
  maxHeight: undefined, // no max by default
  
  // Width constraints
  minWidth: 300,
  maxWidth: 420,
});
```

## Calculation Formulas

```
Height:
availableHeight = viewportHeight - statusBarHeight - 81 - topMargin - bottomMargin
height = clamp(availableHeight, minHeight, maxHeight)

Width:
availableWidth = viewportWidth - leftMargin - rightMargin
width = clamp(availableWidth, minWidth, maxWidth)
```

---

# FILES SUMMARY

| File | Action | Description |
|------|--------|-------------|
| `hooks/ui/useCardHeight.ts` | REPLACE | New margin-based calculation |
| `tabs/lobby/LobbyTabVX2.tsx` | MODIFY | Use new API, remove container padding |

---

**END OF SPECIFICATION**

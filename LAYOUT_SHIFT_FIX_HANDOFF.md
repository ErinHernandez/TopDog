# Layout Shift Fix - Handoff Document (Refined)

## Problem Statement

Buttons and elements in the VX2 mobile app demo are moving when:
1. **Desktop**: Bottom panel/terminal opens, changing viewport height
2. **Mobile (iPhone)**: Browser address bar or keyboard shows/hides, changing viewport height

### Affected Elements
- Tournament card "Join Tournament" button
- Tournament stats (Entry, Entries, 1st Place)
- Progress bar section
- All elements within the tournament card container

### User Impact
- Poor UX: Elements jump/shift unexpectedly
- Affects both desktop preview and actual iPhone usage
- Breaks the "pixel-perfect" positioning requirement

## Root Cause Analysis

### Technical Issues

1. **Percentage-Based Positioning**
   - Tournament card uses `position: absolute` with `top: 50%` and `transform: translate(-50%, -50%)`
   - This is relative to container height, which changes when viewport changes
   - Location: `components/vx2/tabs/lobby/LobbyTabVX2.tsx` (lines 198-216)

2. **Dynamic Viewport Height**
   - Container uses `height: '100%'` which responds to viewport changes
   - No viewport height locking mechanism
   - Location: `components/vx2/shell/AppShellVX2.tsx` (line 114)

3. **Mobile Browser UI Changes**
   - iOS Safari address bar show/hide changes `window.innerHeight`
   - No Visual Viewport API handling
   - Keyboard appearance causes layout shifts

4. **No Viewport Stabilization**
   - No mechanism to lock initial viewport height
   - No handling for Visual Viewport API events
   - Container heights recalculate on every viewport change

## What the Original Plan Got Wrong

### Problem 1: The Hook Updates Too Often
The original `useViewportHeight` hook would listen to `visualViewport.resize`, which fires on **every** address bar animation frame. This causes:
- Continuous re-renders during scroll
- Layout thrashing
- The exact jitter we're trying to fix

**Fix:** Only update on orientation change or significant resize (>100px difference).

### Problem 2: Fixed Pixel Heights Break Responsiveness
The original plan hardcodes:
```typescript
const HEADER_HEIGHT = 60;
const TAB_BAR_HEIGHT = 80;
```

These values will be wrong on different devices, font sizes, or if the design changes.

**Fix:** Use CSS-based solutions with CSS custom properties.

### Problem 3: Mixing Concerns
The original spreads viewport logic across multiple files.

**Fix:** One hook, one CSS custom property, components just use it.

### Problem 4: No Debouncing
Viewport resize events can fire hundreds of times per second. The original has no throttling.

**Fix:** Debounce height updates.

## Refined Solution: Single Source of Truth

### Architecture

```
┌─────────────────────────────────────────────────────┐
│  useStableViewportHeight (hook)                     │
│  - Sets CSS variable --stable-vh on :root           │
│  - Only updates on orientation change                │
│  - Debounced to prevent thrashing                    │
└─────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────┐
│  CSS: height: calc(var(--stable-vh, 1vh) * 100)     │
│  - All components use the CSS variable              │
│  - No JavaScript in individual components           │
└─────────────────────────────────────────────────────┘
```

Components don't need to know about viewport locking. They just use CSS.

## Implementation Plan

### Phase 1: Create Stable Viewport Height Hook

**File**: `components/vx2/hooks/ui/useStableViewportHeight.ts` (NEW)

**Purpose**: Sets a CSS custom property (`--stable-vh`) that represents 1% of the "stable" viewport height.

**Key Features**:
- Only updates on initial load, orientation change, or significant resize (>100px)
- Does NOT update when mobile address bar shows/hides
- Debounced to prevent thrashing
- Sets CSS variable on `:root` for global use

**Complete Implementation**:
```typescript
/**
 * useStableViewportHeight
 * 
 * Sets a CSS custom property (--stable-vh) that represents 1% of the
 * "stable" viewport height. This height only changes on:
 * - Initial page load
 * - Orientation change
 * - Significant resize (>100px, e.g., desktop window resize)
 * 
 * It does NOT change when:
 * - Mobile address bar shows/hides
 * - Mobile keyboard appears
 * - User scrolls
 * 
 * Usage in CSS:
 *   height: calc(var(--stable-vh, 1vh) * 100);
 * 
 * This replaces `100vh` which is unstable on mobile browsers.
 */

import { useEffect, useRef } from 'react';

// Minimum height change (in pixels) to trigger an update
// This prevents updates from address bar (typically 50-70px)
// but allows window resize (typically 100px+)
const SIGNIFICANT_CHANGE_THRESHOLD = 100;

// Debounce delay in milliseconds
const DEBOUNCE_MS = 150;

export function useStableViewportHeight(): void {
  const lastHeightRef = useRef<number>(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isInitializedRef = useRef(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const setVhProperty = (height: number) => {
      const vh = height * 0.01;
      document.documentElement.style.setProperty('--stable-vh', `${vh}px`);
      lastHeightRef.current = height;
    };

    const getViewportHeight = (): number => {
      // Prefer visualViewport for accuracy on mobile
      if (window.visualViewport) {
        return window.visualViewport.height;
      }
      return window.innerHeight;
    };

    const handleResize = () => {
      const currentHeight = getViewportHeight();
      const heightDifference = Math.abs(currentHeight - lastHeightRef.current);

      // On first load, always set
      if (!isInitializedRef.current) {
        setVhProperty(currentHeight);
        isInitializedRef.current = true;
        return;
      }

      // Only update if change is significant (not just address bar)
      if (heightDifference >= SIGNIFICANT_CHANGE_THRESHOLD) {
        // Debounce to avoid rapid updates during window drag
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        timeoutRef.current = setTimeout(() => {
          setVhProperty(currentHeight);
        }, DEBOUNCE_MS);
      }
    };

    const handleOrientationChange = () => {
      // Always update on orientation change, with small delay for browser to settle
      setTimeout(() => {
        const currentHeight = getViewportHeight();
        setVhProperty(currentHeight);
      }, 100);
    };

    // Initialize immediately
    handleResize();

    // Listen for resize events
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleResize);
    } else {
      window.addEventListener('resize', handleResize);
    }

    // Always listen for orientation changes
    window.addEventListener('orientationchange', handleOrientationChange);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleResize);
      } else {
        window.removeEventListener('resize', handleResize);
      }
      window.removeEventListener('orientationchange', handleOrientationChange);
    };
  }, []);
}
```

### Phase 2: Update AppShellVX2

**File**: `components/vx2/shell/AppShellVX2.tsx`

**Changes**:
- Import and call `useStableViewportHeight` hook (one line)
- Update container height to use CSS variable instead of `h-full`

**Code Changes**:
```typescript
// At the top of the file, add import:
import { useStableViewportHeight } from '../hooks/ui/useStableViewportHeight';

// Inside InnerShell component, add this as the first line:
function InnerShell({ badgeOverrides, deviceClass = 'standard' }: InnerShellProps) {
  // Initialize stable viewport height (sets CSS variable)
  useStableViewportHeight();
  
  // ... rest of existing code unchanged ...
  
  return (
    <ModalContext.Provider value={modalContext}>
      <div 
        className={`flex flex-col relative vx2-device-${deviceClass}`}
        data-device-class={deviceClass}
        style={{ 
          backgroundColor: BG_COLORS.primary,
          height: '100vh', // Fallback
          height: 'calc(var(--stable-vh, 1vh) * 100)',
          overflow: 'hidden',
        }}
      >
        {/* ... rest of component */}
      </div>
    </ModalContext.Provider>
  );
}
```

### Phase 3: Fix LobbyTabVX2 Container

**File**: `components/vx2/tabs/lobby/LobbyTabVX2.tsx`

**Key Change**: Replace absolute positioning with flexbox centering

**Why**: Flexbox `justify-content: center` centers the child without any calculations based on container height. When the container height changes, the centering just works.

**Code Changes**:
```typescript
// FIND this section (around line 187-216):
<div 
  className="vx2-lobby-container flex-1 relative"
  style={{ 
    // ... existing styles
  }}
>
  <div
    style={{
      position: 'absolute',
      top: '50%',           // ❌ PROBLEM: This causes shifts
      left: '50%',
      transform: 'translate(-50%, -50%)',
      // ...
    }}
  >
    <TournamentCard ... />
  </div>
</div>

// REPLACE WITH:
<div 
  className="vx2-lobby-container"
  style={{ 
    padding: `${LOBBY_PX.containerPaddingY}px ${LOBBY_PX.containerPaddingX}px`,
    backgroundColor: BG_COLORS.primary,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',  // ✅ Flexbox centering instead of absolute
    flex: 1,
    overflow: 'hidden',
    // No fixed height needed - parent controls it
  }}
>
  <div
    style={{
      width: '100%',
      maxWidth: '100%',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      // ✅ No position: absolute, no top: 50%, no transform
    }}
  >
    <TournamentCard
      tournament={featuredTournament}
      onJoinClick={() => handleJoinClick(featuredTournament.id)}
      featured={true}
      className="w-full"
    />
  </div>
</div>
```

### Phase 4: Update Mobile Demo Page

**File**: `pages/testing-grounds/vx2-mobile-app-demo.js`

**Changes**: Use stable viewport height for mobile container

**Code Changes**:
```javascript
// Find the mobile container (around line where isMobile is used)

// BEFORE:
{isMobile ? (
  <div style={{ 
    position: 'fixed', 
    inset: 0, 
    backgroundColor: '#101927',
    // height comes from inset: 0, which is unstable
  }}>
    <AppShellVX2 {...props} />
  </div>
) : (
  // desktop version
)}

// AFTER:
{isMobile ? (
  <div 
    style={{ 
      position: 'fixed', 
      top: 0,
      left: 0,
      right: 0,
      backgroundColor: '#101927',
      overflow: 'hidden',
      // Use stable viewport height
      height: '100vh', // Fallback
      height: 'calc(var(--stable-vh, 1vh) * 100)',
    }}
  >
    <AppShellVX2 {...props} />
  </div>
) : (
  // desktop version - no changes needed
)}
```

### Phase 5: Add CSS Utilities

**File**: `styles/globals.css`

**Changes**: Add utility classes for stable viewport height

**CSS Additions**:
```css
/* 
 * Stable Viewport Height Utilities
 * 
 * These use the --stable-vh CSS variable set by useStableViewportHeight hook.
 * The variable is set to 1% of the stable viewport height.
 * 
 * Example: var(--stable-vh) * 100 = full stable viewport height
 */

/* Full stable viewport height */
.h-stable-screen {
  height: 100vh; /* Fallback for SSR and old browsers */
  height: calc(var(--stable-vh, 1vh) * 100);
}

/* Minimum stable viewport height */
.min-h-stable-screen {
  min-height: 100vh;
  min-height: calc(var(--stable-vh, 1vh) * 100);
}

/* Maximum stable viewport height */
.max-h-stable-screen {
  max-height: 100vh;
  max-height: calc(var(--stable-vh, 1vh) * 100);
}

/* 
 * For components that need stable centering without flexbox,
 * use these with position: absolute 
 */
.top-stable-center {
  top: 50vh;
  top: calc(var(--stable-vh, 1vh) * 50);
}
```

## Complete File List

| File | Action | Key Change |
|------|--------|------------|
| `components/vx2/hooks/ui/useStableViewportHeight.ts` | **CREATE** | New hook with debouncing and threshold |
| `components/vx2/shell/AppShellVX2.tsx` | **MODIFY** | Add hook call, use CSS variable for height |
| `components/vx2/tabs/lobby/LobbyTabVX2.tsx` | **MODIFY** | Replace absolute positioning with flexbox |
| `pages/testing-grounds/vx2-mobile-app-demo.js` | **MODIFY** | Use CSS variable for container height |
| `styles/globals.css` | **MODIFY** | Add utility classes |

## Testing Instructions

### Test 1: Desktop Terminal Toggle
1. Open the app in desktop browser
2. Open browser DevTools (this changes viewport height)
3. **Expected:** No movement of tournament card or buttons
4. Close DevTools
5. **Expected:** No movement

### Test 2: Desktop Window Resize
1. Grab browser window edge
2. Resize vertically by >100px
3. **Expected:** Layout adjusts after resize completes (debounced)
4. **Expected:** No jitter during resize

### Test 3: Mobile Address Bar (iOS Safari)
1. Open on iPhone in Safari
2. Scroll down slowly (address bar hides)
3. **Expected:** No movement of tournament card
4. Scroll up (address bar shows)
5. **Expected:** No movement

### Test 4: Mobile Keyboard
1. Tap on any input field
2. Keyboard appears
3. **Expected:** Content above keyboard doesn't jump
4. Dismiss keyboard
5. **Expected:** No movement

### Test 5: Orientation Change
1. Rotate device from portrait to landscape
2. **Expected:** Layout recalculates correctly after rotation
3. Rotate back to portrait
4. **Expected:** Layout correct

## Why This Solution is Better

| Original Plan | Refined Solution |
|---------------|------------------|
| Updates on every visualViewport resize | Only updates on significant change (>100px) |
| No debouncing | 150ms debounce prevents thrashing |
| Hardcoded pixel values | CSS variable works everywhere |
| Logic spread across 5 files | One hook sets CSS variable, components just use CSS |
| Absolute positioning with `top: 50%` | Flexbox centering (no calculations) |
| Components import and call hook | Hook called once at root, CSS cascades down |

## Success Criteria

✅ **No visible element movement** when:
- Bottom panel opens/closes on desktop
- Terminal opens/closes on desktop
- Browser window is resized

✅ **No layout shift** when:
- Mobile browser address bar shows/hides
- Mobile keyboard opens/closes
- Device is rotated

✅ **Stable positioning**:
- Tournament card remains perfectly centered
- Button maintains exact position
- Stats maintain exact positions
- Progress bar maintains position

✅ **Performance**:
- No jank or stuttering
- Smooth transitions
- No layout thrashing

## Rollback Plan

If issues occur:

1. Delete `components/vx2/hooks/ui/useStableViewportHeight.ts`
2. Remove the `useStableViewportHeight()` call from `AppShellVX2.tsx`
3. Revert height styles to `height: 100%` or `h-full`
4. Revert `LobbyTabVX2.tsx` to absolute positioning
5. Remove CSS utility classes

All changes are additive and isolated — easy to revert.

## Implementation Checklist

```markdown
- [ ] Create `useStableViewportHeight.ts` hook
- [ ] Add hook call to `AppShellVX2.tsx`
- [ ] Update container height in `AppShellVX2.tsx` to use CSS variable
- [ ] Replace absolute positioning with flexbox in `LobbyTabVX2.tsx`
- [ ] Update mobile container in `vx2-mobile-app-demo.js`
- [ ] Add CSS utilities to `globals.css`
- [ ] Test: Desktop terminal toggle
- [ ] Test: Desktop window resize
- [ ] Test: Mobile address bar show/hide
- [ ] Test: Mobile keyboard show/hide
- [ ] Test: Device orientation change
- [ ] Code review
- [ ] Deploy to staging
- [ ] QA sign-off
- [ ] Deploy to production
```

## Technical Notes

### Visual Viewport API Support
- Modern browsers (Chrome 61+, Safari 13+, Firefox 91+)
- Fallback to `window.innerHeight` for older browsers
- `window.visualViewport.height` gives accurate mobile viewport height

### CSS Units
- `100vh` - Viewport height (includes browser UI) - used as fallback
- `100dvh` - Dynamic viewport height (excludes browser UI) - not used in this solution
- `calc(var(--stable-vh, 1vh) * 100)` - Stable viewport height (our solution)

### Debouncing Strategy
- 150ms debounce delay prevents rapid updates during window drag
- 100px threshold prevents updates from address bar (typically 50-70px)
- Orientation changes always trigger update (with 100ms delay for browser to settle)

### Safe Area Insets
- iOS devices with notches/Dynamic Island
- Use `env(safe-area-inset-*)` CSS variables where needed
- Account for in height calculations if necessary

## Key Insights

1. **Use flexbox centering instead of absolute positioning with percentages** - This eliminates the need for calculations based on container height
2. **Single source of truth** - One hook sets CSS variable, all components use CSS
3. **Debouncing and thresholds** - Prevent unnecessary updates and layout thrashing
4. **CSS-first approach** - Components don't need to know about viewport locking

## Estimated Time

**2-3 hours** including testing

## Questions for Handoff

1. Should we lock height on all pages or just the lobby?
2. Do we need to handle tablet/desktop viewport changes differently?
3. Should we add visual feedback when viewport changes (for debugging)?
4. Any specific browser versions we need to support?

## Contact

For questions or issues during implementation, refer to:
- Plan file: `.cursor/plans/fix_layout_shift_on_viewport_changes_aee963ba.plan.md`
- This handoff document: `LAYOUT_SHIFT_FIX_HANDOFF.md`
- Refined plan: `/Users/td.d/Downloads/LAYOUT_SHIFT_FIX_REFINED.md`

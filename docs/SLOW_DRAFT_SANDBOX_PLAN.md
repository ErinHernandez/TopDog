# Slow Draft Sandbox - Implementation Plan

**Last Updated:** 2025-01-XX  
**Status:** Ready for Implementation  
**Purpose:** Create testing grounds page route for existing slow draft sandbox components

---

## Overview

The slow draft sandbox components are fully implemented and self-contained in `sandbox/slowdraft/`, but there is no page route to access them in the testing grounds. This plan creates the missing page route and integrates it with the development navigation system, following the established patterns from other sandbox pages.

### Current State

- ✅ **Sandbox components exist** in `sandbox/slowdraft/`:
  - `Sandbox.tsx` - Main sandbox container component
  - `SlowDraftsTabVX2.tsx` - Primary UI component
  - `components/` - Card, filter, roster, and UI components
  - `hooks/useSlowDrafts.ts` - Mock data generation hook
  - `types.ts` - TypeScript type definitions
  - `constants.ts` - Design tokens and configuration
  - `deps/` - Self-contained dependency stubs
  - `README.md` - Component documentation

- ❌ **No page route** in `pages/testing-grounds/`
- ❌ **Not linked** in DevNav component

### Goal

Create a testing grounds page route that:
- Exposes the existing sandbox components at `/testing-grounds/slow-draft-sandbox`
- Follows the pattern established by `dynamic-island-sandbox.tsx` and other sandbox pages
- Integrates with DevNav for easy navigation
- Maintains consistency with other testing grounds pages

---

## Architecture

### Existing Components

The sandbox is fully self-contained with all dependencies stubbed:

```
sandbox/slowdraft/
├── Sandbox.tsx              # Main container (ready to use)
├── SlowDraftsTabVX2.tsx     # Primary component
├── components/               # UI components
│   ├── SlowDraftCard.tsx
│   ├── FilterSortBar.tsx
│   ├── MyRosterStrip.tsx
│   ├── NotablePicks.tsx
│   └── PositionNeedsIndicator.tsx
├── hooks/
│   └── useSlowDrafts.ts     # Mock data hook
├── types.ts                 # Type definitions
├── constants.ts             # Design tokens
└── deps/                    # Dependency stubs
    ├── core/constants/
    ├── draft-room/constants.ts
    └── components/shared/
```

### Component API

The `Sandbox.tsx` component is a simple container that:

1. **Renders header** with title and description
2. **Wraps SlowDraftsTabVX2** with callback handlers
3. **Handles interactions**:
   - `onEnterDraft(draft)` - Navigate to draft room
   - `onJoinDraft()` - Open lobby/join flow
   - `onQuickPick(draftId, playerId)` - Quick pick action

**Current Implementation:**
```typescript
// sandbox/slowdraft/Sandbox.tsx (EXISTS)
export default function SlowDraftSandbox() {
  const handleEnterDraft = (draft: any) => {
    console.log('Enter draft:', draft);
    alert(`Entering draft: ${draft.tournamentName}`);
  };

  const handleJoinDraft = () => {
    console.log('Join draft');
    alert('Join new slow draft');
  };

  const handleQuickPick = async (draftId: string, playerId: string) => {
    console.log('Quick pick:', { draftId, playerId });
    alert(`Quick picking player ${playerId} in draft ${draftId}`);
  };

  return (
    <div style={{ /* full viewport styles */ }}>
      {/* Header */}
      {/* SlowDraftsTabVX2 with handlers */}
    </div>
  );
}
```

---

## Implementation Plan

### Phase 1: Create Page Route

#### 1.1 Create Page File

**File:** `pages/testing-grounds/slow-draft-sandbox.tsx`

**Purpose:**
- Next.js page route that imports and renders the sandbox component
- Adds page metadata (title, description)
- Optional: Includes DevNav for navigation consistency

**Implementation:**

```typescript
/**
 * Slow Draft Sandbox - Testing Grounds Page
 * 
 * Testing environment for slow draft components and features.
 * This page showcases the SlowDraftsTabVX2 component with mock data.
 * 
 * Access via: /testing-grounds/slow-draft-sandbox
 */

import React from 'react';
import Head from 'next/head';
import SlowDraftSandbox from '../../sandbox/slowdraft/Sandbox';

export default function SlowDraftSandboxPage(): React.ReactElement {
  return (
    <>
      <Head>
        <title>Slow Draft Sandbox - TopDog</title>
        <meta 
          name="description" 
          content="Testing environment for slow draft components and features" 
        />
      </Head>

      <SlowDraftSandbox />
    </>
  );
}
```

**Alternative with DevNav (if desired):**

If you want to include DevNav for consistency with other sandbox pages:

```typescript
import React from 'react';
import Head from 'next/head';
import DevNav from '../../components/dev/DevNav';
import SlowDraftSandbox from '../../sandbox/slowdraft/Sandbox';

export default function SlowDraftSandboxPage(): React.ReactElement {
  return (
    <>
      <Head>
        <title>Slow Draft Sandbox - TopDog</title>
        <meta 
          name="description" 
          content="Testing environment for slow draft components and features" 
        />
      </Head>

      <DevNav />
      <SlowDraftSandbox />
    </>
  );
}
```

**Decision Point:**
- Simple version (recommended): Just the sandbox component, cleaner UI
- With DevNav: More navigation options but adds visual clutter

Choose based on consistency with other testing grounds pages.

---

### Phase 2: Verify Sandbox Component

#### 2.1 Type Safety Check

**File:** `sandbox/slowdraft/Sandbox.tsx`

**Action:** Verify TypeScript types are properly defined

**Current State:**
- Uses `any` type for draft parameter: `handleEnterDraft = (draft: any)`
- Should use proper type from `types.ts`: `SlowDraft`

**Recommended Fix (Optional Enhancement):**

```typescript
import type { SlowDraft } from './types';

export default function SlowDraftSandbox() {
  const handleEnterDraft = (draft: SlowDraft) => {
    console.log('Enter draft:', draft);
    alert(`Entering draft: ${draft.tournamentName}`);
  };
  
  // ... rest of component
}
```

**Note:** This is an optional improvement. The current `any` type works but lacks type safety.

---

### Phase 3: Add DevNav Integration

#### 3.1 Add Link to DevNav

**File:** `components/dev/DevNav.js`

**Location:** `DEFAULT_LINKS` array (around line 102-116)

**Action:** Add new link entry for slow draft sandbox

**Implementation:**

```javascript
const DEFAULT_LINKS = [
  { id: 'vx2-shell', href: '/testing-grounds/vx2-mobile-app-demo', label: 'Mobile App (VX2)', bgColor: '#14532D', bgColorActive: '#1F4D3A', textColor: '#86EFAC' },
  { id: 'vx2-draft', href: '/testing-grounds/vx2-draft-room', label: 'Draft Room (VX2)', bgColor: '#14532D', bgColorActive: '#1F4D3A', textColor: '#86EFAC' },
  { id: 'vx2-tablet', href: '/testing-grounds/vx2-tablet-draft-room', label: 'Tablet Draft (VX2)', bgColor: '#14532D', bgColorActive: '#1F4D3A', textColor: '#86EFAC' },
  { id: 'slow-draft-sandbox', href: '/testing-grounds/slow-draft-sandbox', label: 'Slow Draft Sandbox', bgColor: '#14532D', bgColorActive: '#1F4D3A', textColor: '#86EFAC' }, // NEW
  { id: 'dynamic-island-sandbox', href: '/testing-grounds/dynamic-island-sandbox', label: 'Dynamic Island Sandbox', bgColor: '#D97706', bgColorActive: '#B45309', textColor: '#FDE68A' },
  // ... rest of links
];
```

**Styling Notes:**
- Uses green color scheme (`#14532D`) to match other VX2 components
- Positioned after other VX2 components, before legacy items
- Follows the same pattern as existing links

---

## File Structure

### Files to Create

```
pages/testing-grounds/
  └── slow-draft-sandbox.tsx          # NEW - Page route
```

### Files to Modify

```
components/dev/
  └── DevNav.js                       # MODIFY - Add link to DEFAULT_LINKS
```

### Files to Verify (Optional)

```
sandbox/slowdraft/
  └── Sandbox.tsx                     # VERIFY - Type safety (optional)
```

---

## Testing Checklist

After implementation, verify:

### Basic Functionality
- [ ] Page route accessible at `/testing-grounds/slow-draft-sandbox`
- [ ] Sandbox component renders without errors
- [ ] Page title and metadata display correctly
- [ ] No console errors or warnings

### Component Interactions
- [ ] Mock draft data displays correctly
- [ ] Draft cards render with proper styling
- [ ] Filter/Sort controls work
- [ ] "Enter Draft" button triggers handler (alert/console log)
- [ ] "Join Draft" button triggers handler (alert/console log)
- [ ] Quick pick actions work (if implemented in UI)

### Navigation
- [ ] DevNav link appears (if DevNav integration added)
- [ ] DevNav link navigates to correct route
- [ ] Link styling matches other VX2 components

### Mobile/Responsive
- [ ] Page displays correctly on desktop
- [ ] Page displays correctly on mobile (if applicable)
- [ ] No horizontal scroll issues
- [ ] Sandbox component handles viewport correctly

---

## Implementation Steps

### Step 1: Create Page Route

1. Create `pages/testing-grounds/slow-draft-sandbox.tsx`
2. Copy implementation from Phase 1.1
3. Choose simple version or DevNav version
4. Verify imports resolve correctly

### Step 2: Test Basic Functionality

1. Start development server: `npm run dev`
2. Navigate to `/testing-grounds/slow-draft-sandbox`
3. Verify page loads without errors
4. Verify sandbox component renders

### Step 3: Add DevNav Link (Optional)

1. Open `components/dev/DevNav.js`
2. Locate `DEFAULT_LINKS` array
3. Add slow draft sandbox link entry
4. Use green color scheme matching VX2 components
5. Position after other VX2 links

### Step 4: Final Testing

1. Verify all items in Testing Checklist
2. Test navigation from DevNav
3. Verify no regressions in other pages
4. Check for console errors

---

## Code Examples

### Complete Page Route (Simple Version)

```typescript
/**
 * Slow Draft Sandbox - Testing Grounds Page
 * 
 * Testing environment for slow draft components and features.
 * This page showcases the SlowDraftsTabVX2 component with mock data.
 */

import React from 'react';
import Head from 'next/head';
import SlowDraftSandbox from '../../sandbox/slowdraft/Sandbox';

export default function SlowDraftSandboxPage(): React.ReactElement {
  return (
    <>
      <Head>
        <title>Slow Draft Sandbox - TopDog</title>
        <meta 
          name="description" 
          content="Testing environment for slow draft components and features" 
        />
      </Head>

      <SlowDraftSandbox />
    </>
  );
}
```

### DevNav Link Entry

```javascript
{
  id: 'slow-draft-sandbox',
  href: '/testing-grounds/slow-draft-sandbox',
  label: 'Slow Draft Sandbox',
  bgColor: '#14532D',
  bgColorActive: '#1F4D3A',
  textColor: '#86EFAC'
}
```

---

## Future Enhancements (Out of Scope)

Potential enhancements to the sandbox (not part of this implementation):

1. **Scenario Switcher**
   - Different draft states (your-turn, waiting, paused, complete)
   - Various roster compositions
   - Different pick counts and rounds

2. **Data Manipulator**
   - Adjust number of drafts
   - Change draft parameters (pick count, team count, etc.)
   - Modify position needs and roster states

3. **Debug Panel**
   - Show internal state
   - Display raw mock data
   - Toggle between different data sets

4. **Performance Monitoring**
   - Render time tracking
   - Component re-render counts
   - Memory usage

5. **Mobile Device Preview**
   - Multi-device preview (like `vx2-mobile-app-demo`)
   - Device frame overlays
   - Responsive breakpoint testing

These can be added iteratively as needed.

---

## Dependencies

### Existing Dependencies (Already Satisfied)

The sandbox is self-contained and requires no additional dependencies:
- React (via Next.js)
- TypeScript (if using .tsx)
- Next.js Head component

### No Additional Packages Needed

All dependencies are already installed as part of the project.

---

## Related Documentation

- `sandbox/slowdraft/README.md` - Sandbox component documentation
- `docs/PLAYOFF_TAB_SANDBOX_PLAN.md` - Similar sandbox implementation plan
- `components/vx2/dynamic-island/README.md` - Dynamic Island sandbox example
- `SLOW_DRAFTS_REDESIGN_PLAN.md` - Slow drafts redesign planning document

---

## Questions & Decisions

### Decision 1: DevNav Integration

**Question:** Should the page include DevNav component?

**Options:**
- **Option A (Simple):** Just the sandbox component - cleaner, focused UI
- **Option B (With DevNav):** Include DevNav - better navigation, more consistent with some other sandbox pages

**Recommendation:** Option A (Simple) - The sandbox component already has its own header, and adding DevNav adds visual clutter.

### Decision 2: Type Safety

**Question:** Should we fix the `any` type in `Sandbox.tsx`?

**Options:**
- **Option A:** Leave as-is (works, less type-safe)
- **Option B:** Fix to use `SlowDraft` type (better type safety)

**Recommendation:** Option B (Fix types) - Quick improvement, better code quality, but not blocking for MVP.

---

## Success Criteria

The implementation is complete when:

1. ✅ Page route exists at `/testing-grounds/slow-draft-sandbox`
2. ✅ Sandbox component renders correctly
3. ✅ All interactions work (handlers execute)
4. ✅ No console errors or warnings
5. ✅ DevNav link added (if implementing navigation)
6. ✅ Page follows established sandbox patterns

---

## Notes

- The sandbox components are **fully self-contained** - no external API calls needed
- Mock data is generated by `useSlowDrafts` hook - no backend required
- All dependencies are stubbed in `sandbox/slowdraft/deps/` - no external component dependencies
- The sandbox is ready to use immediately - just needs the page route

---

**Status:** Ready for Implementation  
**Estimated Time:** 15-30 minutes  
**Priority:** Medium  
**Blocker:** None
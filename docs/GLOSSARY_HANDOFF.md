# TopDog Master Glossary - Handoff Document

**Last Updated:** 2026-02-04
**Status:** Core Infrastructure Complete, Content Population In Progress

---

## ✅ What's Been Built

### 1. Wireframe Preview System
- **Files:**
  - `/components/glossary/WireframePreview.tsx`
  - `/components/glossary/WireframePreview.module.css`
- **Features:**
  - 4 device frames: Web Browser, iPhone 15 Pro, iPad Pro 11", Pixel 8
  - Safe area indicators with hatched patterns
  - Element highlighting with colored borders and ID labels
  - Dynamic Island on iPhone, Android nav buttons
  - Device specs display (screen size, safe areas in pt/px)
- **Usage:** `<MultiPlatformWireframe elementId={...} elementName={...} wireframeContext={...} />`

### 2. Per-Platform Documentation Structure
- **File:** `/lib/glossary/types.ts`
- **New Types Added:**
  - `Platform` - includes 'web' | 'ios' | 'ipad' | 'android'
  - `PlatformDocumentation` - complete docs for ONE platform (architecture, visuals, best practices, improvements)
  - `AllPlatformDocs` - container for all platform docs per element
  - `PlatformImprovement` - platform-specific suggestions
  - `SoundSpecification`, `SoundAsset` - audio feedback specs
  - `PlatformHaptic`, `AudioSpec` - haptic/audio per state
- **Element Support:** `GlossaryElement.platformDocs?: AllPlatformDocs`

### 3. Enhanced Element States
- Added states: `warning`, `critical`, `urgent`, `expiring`, `paused`, `compact`, `expanded`, `hidden`
- States can now include: `animation`, `audio`, `haptic` (simple or per-platform)

### 4. Element Detail Page Updates
- **File:** `/pages/glossary/[elementId].tsx`
- Wireframe section added showing element position on all 4 platforms
- Full-width layout (no phone frame wrapper)

### 5. Elements with Full Documentation (5 enhanced)
- DR-SB-001: Leave Button ✅
- DR-SB-002: Timer Display ✅
- DR-SB-004: Your Turn Indicator ✅
- DR-PB-003: Pick Avatar ✅
- DR-FT-001: Footer Timer ✅
- DR-FT-002: Draft Position ✅

---

## ⏳ What's Left To Do

### 1. Populate Per-Platform Docs for All Elements
Each of the 18 elements needs `platformDocs` filled out with:
```typescript
platformDocs: {
  ios: {
    platform: 'ios',
    architecture: { summary, componentPath, componentTree, parentComponent, dataFlow, stateManagement, dependencies },
    visuals: { dimensions, touchTarget, spacing, colors, assets },
    bestPractices: { summary, doList, dontList, performanceTips, accessibilityRequirements },
    improvements: [{ id, category, title, summary, currentState, proposedChange, impact, effort, rationale }]
  },
  // Same for: web, ipad, android
  crossPlatform: { sharedBehavior, keyDivergences, featureParity }
}
```

### 2. Naming Convention Change (Deferred)
- Current: IDs like `DR-SB-001`
- Target: Slugs like `leave-button`
- Files affected:
  - `/lib/glossary/elements.ts` - element IDs
  - `/pages/glossary/[elementId].tsx` - routing
  - All cross-references between elements

---

## File Locations

| Purpose | Path |
|---------|------|
| Type definitions | `/lib/glossary/types.ts` |
| Element data (18 elements) | `/lib/glossary/elements.ts` |
| Main glossary page | `/pages/glossary/index.tsx` |
| Element detail page | `/pages/glossary/[elementId].tsx` |
| Wireframe component | `/components/glossary/WireframePreview.tsx` |
| Element page styles | `/pages/glossary/element.module.css` |
| Glossary index styles | `/pages/glossary/glossary.module.css` |

---

## How to Continue

### To Add platformDocs to an Element:
1. Open `/lib/glossary/elements.ts`
2. Find the element (e.g., `DR-SB-003`)
3. Add `platformDocs` property following the `PlatformDocumentation` interface
4. Include all 4 platforms if element exists on all, or subset if platform-specific

### To Test:
```bash
npm run dev
# Visit http://localhost:3000/glossary/DR-SB-001
```

### Build Check:
```bash
npm run build
# Should complete with no type errors
```

---

## Current Element Count

- **Total:** 18 elements in `/lib/glossary/elements.ts`
- **Module:** All in `draft-room`
- **Categories:** Status Bar (5), Picks Bar (6), Footer (2), Main Content (5)

---

## Known Issues

1. **Title Warning:** React hydration warning about title element receiving array - cosmetic only, doesn't break functionality
2. **Wireframe Bounds:** Some elements use `{width, height}` without `x, y` - fixed by making x/y optional in Bounds interface

---

## Architecture Decisions

1. **Wireframe per OS:** Each platform gets its own device frame showing element position - ensures docs scale when adding new platforms
2. **Per-platform docs:** Complete independence - adding Android doesn't require touching iOS docs
3. **Optional platformDocs:** Elements can be documented incrementally - page renders fine without full platformDocs

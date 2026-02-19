# TopDog Master Glossary & Architecture Blueprint

> **Philosophy**: Maniacally thorough. Every screen. Every element. Every pixel. Every state. Every action. Every platform difference. Documented so comprehensively that any developer can build any part of this app on any platform using only this glossary.

## Implementation Todos

- [x] **Setup**: Create pages/glossary/, components/glossary/, lib/glossary/ folder structure ✅ 2026-02-04
- [x] **Setup**: Build WireframePhone component with element highlight capability ✅ 2026-02-04
- [x] **Setup**: Build glossary UI (search, filters, element list, detail view) ✅ 2026-02-04
- [x] **M1 Batch 1 (Partial)**: [StatusBar] ✅ [Footer] ✅ [PicksBar] ✅ - 18 elements documented
- [ ] **M1 Batch 1 (Remaining)**: [Players Tab Part 1] [Queue Tab] - 2 parallel subagents
- [ ] **M1 Batch 2**: [Players Tab Part 2] [Rosters Tab] [Board Tab] [Info Tab] - 4 parallel subagents
- [ ] **M1 Batch 3**: [Leave Modal] [Tutorial Modal] [Info+Share Modals] [Player Expanded Card] - 4 parallel subagents
- [ ] **M1 Batch 4**: [Alerts Modal] [Tech Debt Audit] [Platform Comparison] [Action Catalog] - 4 parallel subagents
- [ ] **M1 Compile**: Generate remaining elements + wireframe contexts + screenshots
- [ ] **M1 Wireframes**: Create wireframe context views for all Draft Room screens
- [ ] **Module 2 (Lobby)**: Documentation + elements data + wireframe contexts
- [ ] **Module 3 (My Teams)**: Documentation + elements data + wireframe contexts
- [ ] **Module 4 (Live/Slow Drafts)**: Documentation + elements data + wireframe contexts
- [ ] **Module 5 (Auth)**: Documentation + elements data + wireframe contexts
- [ ] **Module 6 (Settings/Profile)**: Documentation + elements data + wireframe contexts
- [ ] **Module 7 (Payments)**: Documentation + elements data + wireframe contexts
- [ ] **Module 8 (Onboarding)**: Documentation + elements data + wireframe contexts
- [ ] **Module 9 (Navigation Shell)**: Documentation + elements data + wireframe contexts
- [ ] **Final Review**: Cross-module consistency, search indexing, all wireframes working

## Current Progress

### Completed Infrastructure (2026-02-04)

**Pages Created:**
- `pages/glossary/index.tsx` - Main glossary page with search, filters, module sidebar
- `pages/glossary/[elementId].tsx` - Element detail page with specs, states, code refs
- `pages/glossary/module/[moduleId].tsx` - Module overview page

**Components Created:**
- `components/glossary/WireframePhone.tsx` - Phone frame with element highlighting
- `components/glossary/WireframeElement.tsx` - Wireframe placeholder component
- `components/glossary/GlossaryLayout.tsx` - Layout wrapper
- `components/glossary/ElementCard.tsx` - Element preview card
- `components/glossary/SearchBar.tsx` - Debounced search
- `components/glossary/FilterPanel.tsx` - Module/type/interactive filters

**Data Files Created:**
- `lib/glossary/types.ts` - Complete TypeScript type definitions
- `lib/glossary/elements.ts` - 18 Draft Room elements (StatusBar + PicksBar + Footer)

### Elements Documented So Far (18/~70 for Draft Room)

**Status Bar (Group A):** 5 elements
- DR-SB-001: Leave Button ✅
- DR-SB-002: Timer Display ✅
- DR-SB-003: Timer Background ✅
- DR-SB-004: Your Turn Indicator ✅
- DR-SB-005: Pre-Draft Countdown ✅

**Picks Bar (Group B):** 6 elements
- DR-PB-001: Picks Bar Container ✅
- DR-PB-002: Pick Slot ✅
- DR-PB-003: Pick Avatar ✅
- DR-PB-004: Pick Number Badge ✅
- DR-PB-005: Current Pick Indicator ✅
- DR-PB-006: Scroll Container ✅

**Footer (Group I):** 7 elements
- DR-FT-001: Footer Container ✅
- DR-FT-002: Tab Button - Players ✅
- DR-FT-003: Tab Button - Queue ✅
- DR-FT-004: Tab Button - Rosters ✅
- DR-FT-005: Tab Button - Board ✅
- DR-FT-006: Tab Button - Info ✅
- DR-FT-007: Home Indicator Bar ✅

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Deliverables](#deliverables)
3. [Wireframe Phone System](#wireframe-phone-system-architecture)
4. [Master Spreadsheet Schema](#master-spreadsheet-schema)
5. [Element Documentation Template](#element-documentation-template)
6. [Module 1: Draft Room](#module-1-draft-room-current-focus)
7. [Module 2: Lobby/Home](#module-2-lobbyhome)
8. [Module 3: My Teams](#module-3-my-teams)
9. [Module 4: Live/Slow Drafts](#module-4-liveslow-drafts)
10. [Module 5: Auth](#module-5-auth)
11. [Module 6: Settings/Profile](#module-6-settingsprofile)
12. [Module 7: Payments](#module-7-payments)
13. [Module 8: Onboarding](#module-8-onboarding)
14. [Module 9: Navigation Shell](#module-9-navigation-shell)
15. [Execution Strategy](#execution-strategy)
16. [Success Criteria](#success-criteria)

---

## Project Overview

### What This Is

A comprehensive, platform-agnostic "product blueprint" for the entire TopDog application. This is NOT code documentation - this is PRODUCT documentation that describes what the app IS and HOW it works, independent of any specific implementation.

### Why We're Doing This

1. **Cross-Platform Development**: Build iOS, Android, iPad, web apps from a single source of truth
2. **Pixel-Perfect Consistency**: Ensure every platform matches exactly
3. **Maintainability**: Future developers can understand every element
4. **Tech Debt Discovery**: Systematically find and document issues
5. **Architecture Decisions**: Record WHY things are the way they are

### Modules Overview

| Module | Area | Description | Element Count | Complexity | Status |
|--------|------|-------------|---------------|------------|--------|
| 1 | **Draft Room** | Live drafting experience - the core product | ~70 | High | **Current** |
| 2 | Lobby/Home | Tournament discovery, featured contests, entry flow | ~25 | Medium | Pending |
| 3 | My Teams | Drafted teams list, team details, live standings | ~30 | Medium | Pending |
| 4 | Live/Slow Drafts | Active draft management, your turn alerts | ~25 | Medium | Pending |
| 5 | Auth | Login, registration, password reset, verification | ~35 | Medium | Pending |
| 6 | Settings/Profile | User preferences, notifications, account management | ~30 | Low | Pending |
| 7 | Payments | Deposits, withdrawals, transaction history | ~40 | High | Pending |
| 8 | Onboarding | First-time user flow, tutorials, permissions | ~20 | Low | Pending |
| 9 | Navigation Shell | Tab bar, headers, global elements, safe areas | ~25 | Low | Pending |

**Total Elements: ~300+**

---

## Deliverables

### 1. Glossary Web App (localhost:3000/glossary)

A fully interactive design system explorer accessible at `/glossary` in the Next.js app.

**Features:**
- **Searchable**: Search across all ~300 elements
- **Filterable**: Filter by module, screen, component, element type
- **Interactive**: Click any element to see full details
- **Visual**: Screenshots inline for every state
- **Wireframe Context View**: For each element, show a phone wireframe where:
  - The current element is rendered as the ACTUAL component (real, highlighted)
  - All OTHER elements on that screen are shown as wireframe outlines
  - Helps visualize exactly where each element appears in context

**File Structure:**
```
pages/
└── glossary/
    ├── index.tsx                    # Main glossary page (search, filters, list)
    ├── [elementId].tsx              # Individual element detail page
    └── module/
        └── [moduleId].tsx           # Module overview page

components/
└── glossary/
    ├── GlossaryLayout.tsx           # Layout wrapper
    ├── ElementCard.tsx              # Element preview card
    ├── ElementDetail.tsx            # Full element documentation
    ├── WireframePhone.tsx           # Phone frame with wireframe capability
    ├── WireframeElement.tsx         # Generic wireframe placeholder
    ├── SearchBar.tsx                # Search functionality
    ├── FilterPanel.tsx              # Module/screen/type filters
    └── contexts/
        └── [ComponentName]Context.tsx  # Context view for each component

lib/
└── glossary/
    ├── elements.ts                  # All element data (generated from documentation)
    ├── types.ts                     # TypeScript types for glossary
    └── search.ts                    # Search indexing
```

### 2. Element Data Store

Location: `lib/glossary/elements.ts`

### 3. Architecture Documents (Per Module)

```
docs/glossary/
├── README.md
├── draft-room/
│   ├── ARCHITECTURE.md
│   ├── TECH_DEBT.md
│   └── PLATFORM_COMPARISON.md
├── lobby/
├── my-teams/
...
```

### 4. Screenshots Archive

Location: `public/glossary/screenshots/`

---

## Wireframe Phone System Architecture

For each element, show a phone mockup where the current element is REAL and siblings are wireframed.

See full plan for component architecture and screen definitions (~35 screens total).

---

## Module 1: Draft Room (Current Focus)

~70 elements across 14 groups (A-N):
- Group A: Status Bar (5 elements)
- Group B: Picks Bar (6 elements)
- Group C: Players Tab (16 elements)
- Group D: Player Expanded Card (8 elements)
- Group E: Queue Tab (9 elements)
- Group F: Rosters Tab (10 elements)
- Group G: Board Tab (9 elements)
- Group H: Info Tab (7 elements)
- Group I: Footer (7 elements)
- Group J: Leave Modal (8 elements)
- Group K: Tutorial Modal (7 elements)
- Group L: Info Modal (4 elements)
- Group M: Share Modal (3 elements)
- Group N: Alerts Modal (4 elements)

46 user actions catalogued.

See full plan for detailed element specifications and parallel execution batches.

---

## Modules 2-9

See full plan for complete element lists for:
- Module 2: Lobby/Home (~25 elements)
- Module 3: My Teams (~30 elements)
- Module 4: Live/Slow Drafts (~25 elements)
- Module 5: Auth (~35 elements)
- Module 6: Settings/Profile (~30 elements)
- Module 7: Payments (~40 elements)
- Module 8: Onboarding (~20 elements)
- Module 9: Navigation Shell (~25 elements)

---

## Full Plan Reference

The complete detailed plan with all element specifications, action catalogs, and execution strategy is available at:

**Cursor Plans**: `~/.cursor/plans/draft_room_master_glossary_7842bf3a.plan.md`

Or start a new session and ask to "continue the TopDog Master Glossary implementation plan".

---

*Created: 2026-02-04*

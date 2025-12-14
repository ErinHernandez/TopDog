# VX2 Migration Status

**Last Updated:** December 11, 2024  
**Current Phase:** Phase 2 In Progress - Draft Room Implementation + Historical Stats Integration

---

## Summary Statistics

| Metric | Value |
|--------|-------|
| **Infrastructure modules created** | 9 (core, shell, navigation, hooks, components, utils, modals, draft-room, historicalStats) |
| **Total VX2 files** | 125+ |
| **Data hooks implemented** | 11 (useTournaments, useLiveDrafts, useMyTeams, useExposure, useTransactionHistory, useUser, useDraftRoom, useAvailablePlayers, useDraftTimer, useQueue, useHistoricalStats) |
| **UI hooks implemented** | 2 (useLongPress, useDebounce) |
| **Icon components** | 22 |
| **Shared UI components** | 10 (PositionBadge, StatusBadge, ProgressBar, PlayerCard, PlayerCell, EmptyState, ErrorState, Skeleton, SearchInput, TournamentCard) |
| **Tab components** | 5 (Lobby, LiveDrafts, MyTeams, Exposure, Profile) |
| **Modal components** | 5 (Rankings, Withdraw, AutodraftLimits, DepositHistory, LeaveConfirm) |
| **Draft Room components** | 10 (DraftNavbar, DraftFooter, PicksBar, PlayerList, DraftBoard, RosterView, QueueView, DraftInfo, PlayerExpandedCard, LeaveConfirmModal) |
| | |
| **Components using VX2 hooks** | All tabs, modals, and draft room |
| **Components with loading states** | All tabs and modals |
| **Components with error states** | All tabs and modals |
| **Components with empty states** | All tabs and modals |
| **Components with TypeScript** | 100% |
| **Components with ARIA labels** | 100% |
| **Sandbox/Testing Pages** | 4 (vx2-draft-room, card-sandbox, navbar-sandbox, vx2-mobile-app-demo) |

---

## Recent Updates (December 11, 2024)

### Historical Stats Integration - PlayerExpandedCard

Integrated real NFL historical statistics (2021-2024) into the PlayerExpandedCard component:

#### Features Implemented
| Feature | Description |
|---------|-------------|
| **Historical Data Service** | `lib/historicalStats/service.ts` - Fetches from static JSON files with caching |
| **Player ID Generation** | Handles suffixes (Jr., Sr., II, III, IV, V) for proper ID matching |
| **Position-Specific Tables** | QB: passing + rushing stats / RB: rushing + receiving / WR-TE: receiving + rushing |
| **Team Gradient Backgrounds** | Dynamic team colors with diagonal gradient (secondary → primary → secondary) |
| **DRAFT Button Styling** | Uses `/wr_blue.png` background image when user's turn |

#### Stats Columns by Position
| Position | Columns |
|----------|---------|
| **QB** | CMP, ATT, YDS, CMP%, AVG, TD, INT, SACK, CAR, YDS, AVG, TD, FUM |
| **RB** | CAR, YDS, AVG, TD, FUM, REC, TGTS, YDS, AVG, TD |
| **WR/TE** | REC, TGTS, YDS, AVG, TD, CAR, YDS, AVG, TD, FUM |

#### Data Display Rules
- **"-"** = Player did not play that season (no data exists)
- **"0"** = Player played that season but has zero in that stat category
- **Proj. row** = Placeholder for future projection system integration
- **Years shown** = 2024, 2023, 2022, 2021 (2025 excluded - incomplete season)

#### Bug Fixes
- Fixed `generatePlayerId` to strip suffixes (Jr., Sr., II, III, etc.) before generating ID
- Added JAC/JAX alias for Jacksonville (player pool uses JAC, constants use JAX)
- Created `jac.png` logo copy for Jacksonville team display
- Removed LNG and FD columns (user request - not needed for fantasy)

#### Files Modified
- `components/vx2/draft-room/components/PlayerExpandedCard.tsx` - Main integration
- `components/vx2/draft-room/utils/index.ts` - `generatePlayerId` suffix handling
- `lib/gradientUtils.js` - Team gradient direction (225deg), JAC alias
- `lib/nflConstants.js` - JAC bye week alias
- `public/logos/nfl/jac.png` - Jacksonville logo copy

---

### Draft Room VX2 - Complete Mobile Implementation

Built 100% fresh VX2 code (no VX reuse) for the mobile draft room:

#### Components Created
| Component | Features |
|-----------|----------|
| **DraftNavbar** | 64px height, tiled wr_blue background, TopDog logo, back button |
| **DraftFooter** | Tab icons (Players, Queue, Roster, Board, Info), 72px height |
| **PicksBar** | Horizontal scrolling picks, auto-center current pick, timer display |
| **FilledCard** | Completed picks with player name (2 lines), position-team, tracker bar |
| **BlankCard** | Future picks with timer/status, tiled image border for user picks |
| **ScrollingUsername** | Tap to scroll truncated usernames to reveal full name |
| **PlayerList** | HTML table with sticky headers, SVG queue button, tabular number alignment |
| **PlayerExpandedCard** | Detailed stats with horizontal scrolling, position-colored gradient |
| **DraftBoard** | Full draft grid, scroll position preservation, user pick blue outline |
| **RosterView** | Team roster with three-color FLEX badge |
| **QueueView** | localStorage-persisted queue with drag support |
| **DraftInfo** | Scrollable draft rules/info |
| **LeaveConfirmModal** | iOS-style confirmation dialog |

#### Hooks Created
| Hook | Purpose |
|------|---------|
| **useDraftRoom** | Main orchestration - status, picks, participants, timer, scroll positions |
| **useAvailablePlayers** | Player pool, filtering, sorting, mock rankings with variance |
| **useDraftTimer** | Countdown timer with pause/resume |
| **useQueue** | localStorage queue persistence |

#### Key Features Implemented
- **Pre-draft state**: Draft starts in 'waiting', user clicks Start Draft
- **Tiled image borders**: User's picks use wr_blue.png with rounded corners (wrapper approach)
- **Scroll position preservation**: Returns to same position when switching tabs
- **Sticky headers**: ADP/PROJ/RANK headers stay visible when scrolling
- **Tabular numbers**: `fontVariantNumeric: 'tabular-nums'` for aligned columns
- **Dev tools**: Start/Pause/Force Pick/Speed Toggle/Restart buttons
- **Snake draft math**: Proper pick number calculation for alternating rounds

### Testing Infrastructure

| Page | URL | Purpose |
|------|-----|---------|
| **VX2 Draft Room** | `/testing-grounds/vx2-draft-room` | Full draft room in phone frame with dev controls |
| **Card Sandbox** | `/testing-grounds/card-sandbox` | Isolated FilledCard/BlankCard testing |
| **Navbar Sandbox** | `/testing-grounds/navbar-sandbox` | Isolated DraftNavbar testing |
| **DevNav** | (global component) | Persistent navigation across all testing-grounds pages |

### Constants Added
```typescript
// Tiled background style for consistent usage
export const TILED_BG_STYLE = {
  backgroundImage: 'url(/wr_blue.png)',
  backgroundRepeat: 'repeat',
  backgroundSize: '50px 50px',
  backgroundColor: '#1E3A5F',
} as const;
```

---

## Project Context

### What is VX2?
VX2 is an enterprise-grade mobile app framework for the TopDog platform. It provides a clean, production-ready architecture with consistent patterns, proper data hooks, and accessibility built-in.

### Key Decisions Made
1. **Co-location pattern**: Related sub-components live in the same file with clear section headers
2. **Hook-based data layer**: All data fetching through custom hooks with loading/error/empty states
3. **Constants-driven styling**: All colors, spacing, and typography from centralized constants
4. **Icon library**: Dedicated icon components instead of inline SVGs
5. **Accessibility-first**: ARIA labels and keyboard navigation throughout
6. **Mobile-first**: Build for mobile, adapt for desktop
7. **100% fresh code**: No VX code reuse in VX2 draft room

### Important User Preferences (from memories)
- NO emojis in codebase or UI
- NO visible scrollbars on mobile (except in modals)
- Position colors: QB=#F472B6, RB=#0fba80, WR=#FBBF25, TE=#7C3AED
- "navbar" = top blue bar with logo; "subheader" = bar underneath navbar
- Focus on "whale" users - provide data granularity but minimal analysis
- Global users, so no US-centric assumptions for verification
- Use actual usernames, not "You" for user display

---

## Architecture Overview

### Directory Structure
```
components/vx2/
├── core/                 # Constants, types, context
│   ├── constants/        # colors.ts, sizes.ts, tabs.ts
│   ├── context/          # TabNavigationContext.tsx
│   └── types/            # TypeScript interfaces
│
├── shell/                # App shell components
│   ├── AppShellVX2.tsx   # Main app wrapper
│   ├── AppHeaderVX2.tsx  # Top header bar
│   └── MobilePhoneFrame.tsx
│
├── navigation/           # Tab navigation
│   └── components/
│       ├── TabBarVX2.tsx
│       ├── TabContentVX2.tsx
│       ├── TabErrorBoundary.tsx
│       └── TabLoadingState.tsx
│
├── hooks/                # Custom hooks
│   ├── data/             # Data fetching hooks
│   │   ├── useTournaments.ts
│   │   ├── useLiveDrafts.ts
│   │   ├── useMyTeams.ts
│   │   ├── useExposure.ts
│   │   ├── useTransactionHistory.ts
│   │   └── useUser.ts
│   └── ui/               # UI utility hooks
│       ├── useLongPress.ts
│       └── useDebounce.ts
│
├── components/           # Shared UI components
│   ├── icons/            # 22 icon components
│   │   ├── navigation/   # ChevronLeft, ChevronRight, ArrowUp, ArrowDown
│   │   ├── actions/      # Close, Search, Edit, Share, Plus, Minus, Refresh
│   │   └── menu/         # Payment, Rankings, Settings, History, etc.
│   └── shared/
│       ├── feedback/     # EmptyState, ErrorState, LoadingSkeleton
│       ├── display/      # PositionBadge, StatusBadge, ProgressBar, PlayerCard
│       └── inputs/       # SearchInput
│
├── tabs/                 # Tab content components
│   ├── lobby/            # LobbyTabVX2, TournamentCard
│   ├── live-drafts/      # LiveDraftsTabVX2
│   ├── my-teams/         # MyTeamsTabVX2
│   ├── exposure/         # ExposureTabVX2
│   └── profile/          # ProfileTabVX2
│
├── modals/               # Modal components
│   ├── RankingsModalVX2.tsx
│   ├── WithdrawModalVX2.tsx
│   ├── AutodraftLimitsModalVX2.tsx
│   └── DepositHistoryModalVX2.tsx
│
├── draft-room/           # Draft room (NEW)
│   ├── components/
│   │   ├── DraftRoomVX2.tsx      # Main container
│   │   ├── DraftNavbar.tsx       # Top navbar
│   │   ├── DraftFooter.tsx       # Bottom tab bar
│   │   ├── PicksBar.tsx          # Horizontal scrolling picks
│   │   ├── PlayerList.tsx        # Available players table
│   │   ├── PlayerExpandedCard.tsx # Player detail card
│   │   ├── DraftBoard.tsx        # Full draft grid
│   │   ├── RosterView.tsx        # Team roster
│   │   ├── QueueView.tsx         # User's queue
│   │   ├── DraftInfo.tsx         # Draft rules/info
│   │   └── LeaveConfirmModal.tsx # Exit confirmation
│   ├── hooks/
│   │   ├── useDraftRoom.ts       # Main orchestration
│   │   ├── useAvailablePlayers.ts # Player pool
│   │   ├── useDraftTimer.ts      # Countdown timer
│   │   └── useQueue.ts           # localStorage queue
│   ├── constants/
│   │   └── index.ts              # Draft-specific constants, TILED_BG_STYLE
│   ├── types/
│   │   └── index.ts              # Draft TypeScript interfaces
│   └── index.ts                  # Barrel export
│
├── utils/                # Utility functions
│   └── formatting/       # currency.ts, date.ts, numbers.ts
│
└── index.ts              # Main barrel export

lib/historicalStats/      # Historical player statistics (NEW)
├── types.ts              # SeasonStats, HistoricalPlayer interfaces
├── service.ts            # Data fetching with caching
└── index.ts              # Barrel export

hooks/
└── useHistoricalStats.ts # React hooks for historical data

components/dev/           # Development tools (NEW)
└── DevNav.js             # Global testing-grounds navigation

pages/testing-grounds/    # Test pages (NEW)
├── vx2-draft-room.js     # Draft room test page
├── card-sandbox.js       # Card component sandbox
└── navbar-sandbox.js     # Navbar component sandbox
```

---

## Component Status

### Tabs (All Complete)

| Component | Lines | Hook | Loading | Error | Empty | Notes |
|-----------|-------|------|---------|-------|-------|-------|
| LobbyTabVX2 | 363 | useTournaments | Yes | Yes | Yes | TournamentCard extracted |
| LiveDraftsTabVX2 | 350 | useLiveDrafts | Yes | Yes | Yes | DraftCard inline |
| MyTeamsTabVX2 | 393 | useMyTeams | Yes | Yes | Yes | TeamCard, PlayerRow inline |
| ExposureTabVX2 | 331 | useExposure | Yes | Yes | Yes | ExposureRow inline |
| ProfileTabVX2 | 401 | useUser | Yes | Yes | Yes | AvatarBox, MenuItems inline |

### Modals (All Complete)

| Component | Lines | Features | Notes |
|-----------|-------|----------|-------|
| RankingsModalVX2 | 741 | Tabbed interface, drag-to-reorder, search, position filters, undo, unsaved warning | TabBar, PlayerListItem, RankedPlayerRow inline |
| WithdrawModalVX2 | 532 | Multi-step flow (Amount → Confirm → Code → Success), 6-digit verification | AmountStep, ConfirmStep, CodeStep, SuccessStep inline |
| AutodraftLimitsModalVX2 | 401 | Position-based limits, slider controls | Inline sub-components |
| DepositHistoryModalVX2 | 339 | Transaction list, filtering | TransactionRow inline |
| LeaveConfirmModal | ~100 | iOS-style warning dialog | Draft room specific |

### Draft Room (NEW - Complete)

| Component | Features | Notes |
|-----------|----------|-------|
| DraftRoomVX2 | Main container, tab orchestration, scroll preservation | Accepts useAbsolutePosition for phone frame |
| DraftNavbar | Tiled background, back button, centered logo | 64px height |
| DraftFooter | 5 tab icons, active state styling | 72px height |
| PicksBar | FilledCard, BlankCard, ScrollingUsername, auto-scroll | Tiled borders for user picks |
| PlayerList | HTML table, sticky headers, SVG queue button, filters | tabular-nums alignment |
| PlayerExpandedCard | Real historical stats (2021-2024), team gradient, horizontal scroll | Integrated with historicalStats service |
| DraftBoard | Full grid, scroll preservation, user pick styling | Blue outline + position color |
| RosterView | Position rows, three-color FLEX badge | Bottom padding fix |
| QueueView | Drag reorder, localStorage, queue count | Persists across sessions |
| DraftInfo | Draft rules, scrollable content | Hidden scrollbar |

---

## A-Grade Standards Applied

### 1. Type Safety
- [x] Full TypeScript throughout
- [x] Proper interfaces for all props
- [x] Return types on all functions
- [x] No `any` types

### 2. Constants & Consistency
- [x] Colors from `core/constants/colors.ts`
- [x] Sizes from `core/constants/sizes.ts`
- [x] Draft constants in `draft-room/constants/index.ts`
- [x] TILED_BG_STYLE for consistent tiled backgrounds
- [x] No inline magic numbers
- [x] Consistent patterns across all files

### 3. Data Layer
- [x] Custom hooks for all data fetching
- [x] Loading states with skeletons
- [x] Error states with retry
- [x] Empty states with CTAs
- [x] Scroll position preservation across tabs

### 4. Component Architecture
- [x] Co-located sub-components with clear section headers
- [x] Main component as thin orchestrator
- [x] Logic extracted to hooks where appropriate
- [x] Clear separation of concerns

### 5. Accessibility
- [x] ARIA labels on interactive elements
- [x] Keyboard navigation support
- [x] Touch targets >= 44px
- [x] Semantic HTML

### 6. Documentation
- [x] JSDoc on all exported components
- [x] Props documented
- [x] Usage examples in comments

### 7. Testing Infrastructure
- [x] Dedicated test pages for components
- [x] Dev tools for draft interaction
- [x] Sandbox pages for isolated testing
- [x] Global DevNav for navigation

---

## Next Steps (Phase 2 Continued)

### Draft Room - Remaining Work
1. **Firebase Integration**
   - Connect to real draft room data
   - Real-time pick updates
   - Timer synchronization

2. **User Draft Actions**
   - Actually draft players (not just mock)
   - Queue management with backend
   - Autodraft settings

3. **Polish**
   - Animation refinements
   - Error handling for network issues
   - Reconnection logic

### Ready for Production Integration
The VX2 architecture is complete and ready for:

1. **API Integration**
   - Replace mock data in hooks with real API calls
   - Add proper authentication handling
   - Implement real-time updates for live drafts

2. **Route Integration**
   - Wire VX2 components into production routes
   - Replace old VX components with VX2 equivalents

3. **Feature Completion**
   - Add remaining modals (Deposit, Settings, etc.)
   - Push notifications

---

## Quick Commands

```bash
# Run VX2 demo
npm run dev
# Navigate to: http://localhost:3001/testing-grounds/vx2-draft-room

# Test pages
# Draft Room: http://localhost:3001/testing-grounds/vx2-draft-room
# Card Sandbox: http://localhost:3001/testing-grounds/card-sandbox
# Navbar Sandbox: http://localhost:3001/testing-grounds/navbar-sandbox
# App Demo: http://localhost:3001/testing-grounds/vx2-mobile-app-demo

# Check for lint errors in VX2
npm run lint -- components/vx2/

# Count total VX2 files
find components/vx2 -name "*.tsx" -o -name "*.ts" | wc -l
```

---

## Contact/Context

This migration was planned and executed across multiple conversations. The VX2 architecture represents a clean, enterprise-grade foundation for the TopDog mobile experience.

Key context:
- User prefers thorough, production-grade work
- Co-location pattern chosen over excessive file splitting
- "Summary Statistics" command returns the status table at the top of this doc
- Draft room built 100% fresh - no VX code reuse
- Mobile-first approach - build for mobile, adapt for desktop

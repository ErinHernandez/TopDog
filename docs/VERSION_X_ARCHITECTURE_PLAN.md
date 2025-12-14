# VERSION X - ARCHITECTURE & MIGRATION PLAN
## TopDog Best Ball Platform Rebuild

**Document Version**: 1.0  
**Created**: December 5, 2025  
**Author**: Architecture Planning Session  
**Status**: Planning Phase

---

## TABLE OF CONTENTS

1. [Executive Summary](#1-executive-summary)
2. [Current State Analysis](#2-current-state-analysis)
3. [Version X Philosophy](#3-version-x-philosophy)
4. [Architecture Design](#4-architecture-design)
5. [Mobile-to-Desktop Migration Strategy](#5-mobile-to-desktop-migration-strategy)
6. [File Structure](#6-file-structure)
7. [Design System](#7-design-system)
8. [State Management](#8-state-management)
9. [Data Layer](#9-data-layer)
10. [Component Architecture](#10-component-architecture)
11. [Performance & Scale](#11-performance--scale)
12. [Migration Phases](#12-migration-phases)
13. [Quality Assurance](#13-quality-assurance)
14. [Risk Mitigation](#14-risk-mitigation)
15. [Success Metrics](#15-success-metrics)

---

## 1. EXECUTIVE SUMMARY

### What is Version X?

Version X is a complete architectural rebuild of the TopDog platform, designed to:

1. **Migrate from Mobile-First**: Desktop components will be built by adapting and scaling the refined mobile components, NOT the other way around
2. **Modernize Architecture**: Replace "vibe-coded" patterns with industry best practices
3. **Support Scale**: Handle 570,000+ user teams across 47,000+ drafts with global latency requirements
4. **Maintain Visual Identity**: Preserve the refined pixel-perfect designs while improving code structure
5. **Enable Future Growth**: Create a maintainable codebase that can evolve safely

### Core Principle

> **"The mobile components are the source of truth. Desktop is an adaptation of mobile, not a separate codebase."**

This inverts the traditional approach where desktop is built first and mobile is an afterthought. Our mobile components have been refined through iteration and represent the cleanest expression of the UI/UX vision.

---

## 2. CURRENT STATE ANALYSIS

### 2.1 Technical Inventory

| Category | Current State | Issues |
|----------|---------------|--------|
| **Framework** | Next.js 15 (Pages Router) | No App Router benefits |
| **Language** | Mixed JS/TS (~95% JS) | Type safety gaps |
| **Styling** | Tailwind + Inline CSS | Inconsistent patterns |
| **State** | Context + SWR + Local | Fragmented |
| **Mobile** | 38+ refined components | Good foundation |
| **Desktop** | Multiple versions (v2, v3) | Unclear which is canonical |
| **Files** | 94 pages, 59 lib files | Some bloat |

### 2.2 Codebase Metrics

```
Total Components:     150+
Total Pages:          94
Total Lib Files:      59
Lines of Code:        ~50,000+
Largest File:         DraftRoomApple.js (2,201 lines)
TypeScript Coverage:  ~5%
Test Coverage:        ~2%
```

### 2.3 What's Working Well (Keep)

| Asset | Location | Notes |
|-------|----------|-------|
| Mobile Layout System | `components/mobile/MobileLayout.js` | Clean, reusable |
| TypeScript Types | `types/player.ts`, `types/api.ts` | Well-defined |
| SWR Hooks | `lib/swr/usePlayerSWR.ts` | Modern data fetching |
| Position Colors | Memory + Constants | Locked: QB=#F472B6, RB=#0fba80, WR=#FBBF25, TE=#7C3AED |
| Mobile Draft Room | `components/draft/v3/mobile/apple/` | Refined UX |
| Player Pool Data | `lib/playerPool.js` | Complete with projections |
| Mobile Tabs | `components/mobile/tabs/` | Clean tab architecture |

### 2.4 What Needs Replacement (Remove/Refactor)

| Problem | Location | Impact |
|---------|----------|--------|
| Hardcoded Pixels | Throughout | Prevents responsive design |
| Multiple Draft Versions | v2/, v3/, topdog/ | Confusion about canonical |
| Monolithic Files | 2000+ line components | Unmaintainable |
| Inline Styles | Throughout pages | Inconsistent, hard to change |
| Global CSS Bloat | `styles/globals.css` (700+ lines) | Mixed concerns |
| Mixed State Patterns | Context vs Local vs SWR | Unpredictable |

### 2.5 Business Context

| Metric | Value | Implication |
|--------|-------|-------------|
| User Teams | 570,000 | High concurrent load possible |
| Drafts | 47,000 over 4 months | ~390/day average, peaks higher |
| Global Users | Yes | Latency-sensitive real-time features |
| Max Entries/User | 150 | Heavy drafters ("whales") |
| Streamer Partners | Critical | Don't compete with their add-ons |

---

## 3. VERSION X PHILOSOPHY

### 3.1 Guiding Principles

#### Principle 1: Mobile Components Are Canon
```
Mobile Component → Scale Up → Desktop Component
NOT
Desktop Component → Scale Down → Mobile Component
```

The mobile iteration has been refined through extensive testing. Desktop is an enlargement and adaptation of these proven patterns.

#### Principle 2: Composition Over Inheritance
```jsx
// BAD: Monolithic component
<DraftRoom2000LinesOfCode />

// GOOD: Composed from small pieces
<DraftRoom>
  <DraftNavbar />
  <PicksBar />
  <ThreeColumnLayout>
    <QueueColumn />
    <PlayersColumn />
    <RosterColumn />
  </ThreeColumnLayout>
</DraftRoom>
```

#### Principle 3: Colocation
Keep related code together. A component's styles, types, tests, and logic should live near each other.

#### Principle 4: Type Safety as Documentation
TypeScript isn't just for catching errors - it documents intent and enables tooling.

#### Principle 5: Progressive Enhancement
Core functionality works everywhere. Enhanced features layer on top for capable devices/browsers.

### 3.2 Non-Negotiables

These must be preserved exactly in Version X:

1. **Position Colors** [[memory:4753963]]
   - QB: #F472B6 (pink)
   - RB: #0fba80 (green)
   - WR: #FBBF25 (yellow/gold)
   - TE: #7C3AED (purple)

2. **No Emojis** [[memory:8869171]]
   - Global preference: no emojis anywhere in codebase or UI

3. **No Mobile Scrollbars** [[memory:9102895]]
   - Scrollbars must never be visible on mobile (except modals)

4. **First 9 Roster Cells** [[memory:6796118]]
   - Gradient/color formatting is locked, only text can change

5. **"Whale" User Strategy** [[memory:6268949]]
   - Maximum data granularity, minimal analysis in draft rooms
   - Don't compete with streamer partners

---

## 4. ARCHITECTURE DESIGN

### 4.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        PRESENTATION LAYER                        │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │   Mobile Views  │  │  Desktop Views  │  │  Shared Views   │  │
│  │  (Source Truth) │  │ (Scaled Mobile) │  │   (Modals, etc) │  │
│  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘  │
│           │                    │                    │           │
│           └────────────────────┼────────────────────┘           │
│                               ▼                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    COMPONENT LIBRARY                      │   │
│  │  Atomic → Molecules → Organisms → Templates → Pages       │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                         STATE LAYER                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │ Draft State │  │ User State  │  │ Server State (SWR)      │  │
│  │  (Zustand)  │  │  (Context)  │  │ Players, Stats, etc     │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                         DATA LAYER                               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │  Firebase   │  │  API Routes │  │  Static Data (Pools)    │  │
│  │  Realtime   │  │  /api/nfl/* │  │  Player Pool, Config    │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### 4.2 Technology Decisions

| Concern | Decision | Rationale |
|---------|----------|-----------|
| **Routing** | App Router (Next.js 14+) | Server components, better DX |
| **Language** | TypeScript (100%) | Type safety, documentation |
| **Styling** | Tailwind + CSS Variables | Design tokens, responsive |
| **State (Client)** | Zustand | Simpler than Redux, good DX |
| **State (Server)** | SWR (keep) | Already working well |
| **Real-time** | Firebase (keep) | Already integrated |
| **Testing** | Vitest + Testing Library | Fast, modern |
| **Components** | Radix UI primitives | Accessible, unstyled |

### 4.3 Responsive Strategy

Since desktop is built FROM mobile, we use a **scale-up** responsive approach:

```css
/* Mobile-first breakpoints */
--breakpoint-sm: 640px;   /* Large phones */
--breakpoint-md: 768px;   /* Tablets */
--breakpoint-lg: 1024px;  /* Small laptops */
--breakpoint-xl: 1280px;  /* Desktops */
--breakpoint-2xl: 1536px; /* Large desktops */
```

```jsx
// Component pattern: Mobile by default, desktop adapts
function PlayerCard({ player }) {
  return (
    <div className="
      /* Mobile (default) */
      p-3 text-sm
      
      /* Tablet+ */
      md:p-4 md:text-base
      
      /* Desktop+ */
      lg:p-5 lg:text-lg
    ">
      {/* Content */}
    </div>
  );
}
```

---

## 5. MOBILE-TO-DESKTOP MIGRATION STRATEGY

### 5.1 Migration Approach

```
MOBILE COMPONENT                    DESKTOP ADAPTATION
─────────────────                   ──────────────────
PlayerListApple.js         →        PlayerList.tsx (responsive)
                                    - Same structure
                                    - Larger touch targets → click targets
                                    - Expanded info on hover
                                    - Same data flow

MobileFooterApple.js       →        DesktopSidebar.tsx (repositioned)
                                    - Same navigation items
                                    - Vertical instead of horizontal
                                    - Keyboard shortcuts added

DraftRoomApple.js          →        DraftRoom.tsx (scaled layout)
                                    - Same component hierarchy
                                    - Three-column on desktop
                                    - Single-column on mobile
```

### 5.2 Component Mapping

| Mobile Component | Desktop Adaptation | Strategy |
|------------------|-------------------|----------|
| `MobileNavbarApple` | `Navbar` | Expand horizontally, add more items |
| `MobileFooterApple` | `Sidebar` | Convert to vertical navigation |
| `PlayerListApple` | `PlayerList` | Add columns, hover states |
| `PicksBarApple` | `PicksBar` | Expand card sizes, more info |
| `RosterPage` | `RosterPanel` | Side panel instead of page |
| `QueuePage` | `QueuePanel` | Side panel instead of page |
| `DraftBoard3Apple` | `DraftBoard` | Full grid view |
| `QuickActionsApple` | `ActionBar` | Keyboard shortcuts |

### 5.3 Shared vs. Adapted Components

```
SHARED (identical on both)          ADAPTED (different layouts)
─────────────────────────           ────────────────────────────
PositionBadge                       Navigation (footer → sidebar)
PlayerPhoto                         DraftRoom (tabs → columns)
Timer/Countdown                     PlayerList (compact → expanded)
Modal overlays                      PlayerCard (touch → hover)
Loading states                      Queue (page → panel)
Error states                        Roster (page → panel)
```

---

## 6. FILE STRUCTURE

### 6.1 Proposed Structure

```
/src
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Auth-required routes
│   │   ├── draft/[roomId]/
│   │   ├── my-teams/
│   │   ├── exposure/
│   │   └── profile/
│   ├── (public)/                 # Public routes
│   │   ├── page.tsx              # Home/Lobby
│   │   ├── tournaments/
│   │   └── rules/
│   ├── api/                      # API routes
│   │   └── nfl/
│   ├── layout.tsx
│   └── globals.css
│
├── components/
│   ├── ui/                       # Atomic components (design system)
│   │   ├── Button/
│   │   │   ├── Button.tsx
│   │   │   ├── Button.test.tsx
│   │   │   └── index.ts
│   │   ├── Badge/
│   │   ├── Card/
│   │   ├── Input/
│   │   └── ...
│   │
│   ├── player/                   # Player-related components
│   │   ├── PlayerCard/
│   │   ├── PlayerList/
│   │   ├── PlayerPhoto/
│   │   ├── PositionBadge/
│   │   └── PlayerStats/
│   │
│   ├── draft/                    # Draft room components
│   │   ├── DraftRoom/
│   │   ├── PicksBar/
│   │   ├── QueuePanel/
│   │   ├── RosterPanel/
│   │   ├── DraftBoard/
│   │   ├── Timer/
│   │   └── OnTheClock/
│   │
│   ├── navigation/               # Navigation components
│   │   ├── Navbar/
│   │   ├── Sidebar/
│   │   ├── Footer/
│   │   └── MobileNav/
│   │
│   ├── modals/                   # Modal components
│   │   ├── PlayerStatsModal/
│   │   ├── RulesModal/
│   │   └── JoinTournamentModal/
│   │
│   └── layouts/                  # Layout wrappers
│       ├── AppLayout/
│       ├── DraftLayout/
│       └── MobileLayout/
│
├── hooks/                        # Custom hooks
│   ├── useDraft.ts
│   ├── usePlayer.ts
│   ├── useAuth.ts
│   └── useResponsive.ts
│
├── stores/                       # Zustand stores
│   ├── draftStore.ts
│   ├── userStore.ts
│   └── uiStore.ts
│
├── lib/                          # Utilities and services
│   ├── api/                      # API clients
│   ├── firebase/                 # Firebase config
│   ├── utils/                    # Helper functions
│   └── constants/                # App constants
│
├── types/                        # TypeScript types
│   ├── player.ts
│   ├── draft.ts
│   ├── api.ts
│   └── index.ts
│
└── styles/                       # Global styles
    ├── tokens.css                # Design tokens
    └── globals.css               # Global styles
```

### 6.2 Naming Conventions

```typescript
// Files
ComponentName.tsx       // React components
componentName.ts        // Utilities/hooks
ComponentName.test.tsx  // Tests
ComponentName.stories.tsx // Storybook (if added)

// Components
export function PlayerCard() {}     // Named export
export default PlayerCard;          // Default export

// Types
interface PlayerCardProps {}        // Component props
type PlayerPosition = 'QB' | 'RB';  // Union types

// Constants
const POSITION_COLORS = {};         // SCREAMING_SNAKE_CASE
const playerPositions = [];         // camelCase for arrays
```

---

## 7. DESIGN SYSTEM

### 7.1 Design Tokens

```css
/* /src/styles/tokens.css */

:root {
  /* ===== COLORS ===== */
  
  /* Position Colors (LOCKED - DO NOT CHANGE) */
  --color-position-qb: #F472B6;
  --color-position-rb: #0fba80;
  --color-position-wr: #FBBF25;
  --color-position-te: #7C3AED;
  
  /* Brand Colors */
  --color-brand-primary: #2DE2C5;
  --color-brand-secondary: #59c5bf;
  --color-brand-accent: #04FBB9;
  
  /* Background Colors */
  --color-bg-primary: #101927;
  --color-bg-secondary: #1f2937;
  --color-bg-tertiary: #111827;
  --color-bg-elevated: rgba(255, 255, 255, 0.1);
  
  /* Text Colors */
  --color-text-primary: #ffffff;
  --color-text-secondary: #9ca3af;
  --color-text-muted: #6b7280;
  
  /* Border Colors */
  --color-border-default: rgba(255, 255, 255, 0.1);
  --color-border-focus: #59c5bf;
  
  /* ===== SPACING ===== */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 20px;
  --space-6: 24px;
  --space-8: 32px;
  --space-10: 40px;
  --space-12: 48px;
  
  /* ===== TYPOGRAPHY ===== */
  --font-family-primary: system-ui, -apple-system, sans-serif;
  --font-family-mono: 'Monocraft', monospace;
  --font-family-display: 'Anton SC', sans-serif;
  
  --font-size-xs: 12px;
  --font-size-sm: 14px;
  --font-size-base: 16px;
  --font-size-lg: 18px;
  --font-size-xl: 20px;
  --font-size-2xl: 24px;
  --font-size-3xl: 30px;
  
  /* ===== SIZING ===== */
  --touch-target-min: 44px;  /* Mobile minimum */
  --click-target-min: 32px;  /* Desktop minimum */
  
  /* ===== BORDERS ===== */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-xl: 16px;
  --radius-full: 9999px;
  
  /* ===== SHADOWS ===== */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.3);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.3);
  --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.3);
  
  /* ===== TRANSITIONS ===== */
  --transition-fast: 150ms ease;
  --transition-normal: 200ms ease;
  --transition-slow: 300ms ease;
  
  /* ===== Z-INDEX ===== */
  --z-dropdown: 100;
  --z-sticky: 200;
  --z-fixed: 300;
  --z-modal-backdrop: 400;
  --z-modal: 500;
  --z-popover: 600;
  --z-tooltip: 700;
}
```

### 7.2 Component Variants

```typescript
// /src/components/ui/Button/Button.tsx

interface ButtonProps {
  variant: 'primary' | 'secondary' | 'ghost' | 'danger';
  size: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  disabled?: boolean;
  loading?: boolean;
  children: React.ReactNode;
}

const variants = {
  primary: 'bg-brand-primary text-gray-900 hover:bg-brand-primary/90',
  secondary: 'bg-white/10 text-white hover:bg-white/20 border border-white/10',
  ghost: 'bg-transparent text-white hover:bg-white/10',
  danger: 'bg-red-500 text-white hover:bg-red-600',
};

const sizes = {
  sm: 'h-8 px-3 text-sm',
  md: 'h-10 px-4 text-base',
  lg: 'h-12 px-6 text-lg',
};
```

### 7.3 Position Badge System

```typescript
// /src/components/player/PositionBadge/PositionBadge.tsx

const POSITION_CONFIG = {
  QB: {
    color: 'var(--color-position-qb)',
    label: 'QB',
    gradient: 'from-pink-500 to-pink-600',
  },
  RB: {
    color: 'var(--color-position-rb)',
    label: 'RB', 
    gradient: 'from-emerald-500 to-emerald-600',
  },
  WR: {
    color: 'var(--color-position-wr)',
    label: 'WR',
    gradient: 'from-yellow-500 to-yellow-600',
  },
  TE: {
    color: 'var(--color-position-te)',
    label: 'TE',
    gradient: 'from-purple-500 to-purple-600',
  },
} as const;
```

---

## 8. STATE MANAGEMENT

### 8.1 State Categories

| Category | Tool | Scope | Examples |
|----------|------|-------|----------|
| **Server State** | SWR | Global | Player data, stats, ADP |
| **Draft State** | Zustand | Draft room | Picks, queue, timer |
| **User State** | Context | App-wide | Auth, balance, preferences |
| **UI State** | Local/Zustand | Component | Modals, tabs, filters |

### 8.2 Draft Store (Zustand)

```typescript
// /src/stores/draftStore.ts

interface DraftState {
  // Room Info
  roomId: string | null;
  status: 'waiting' | 'active' | 'paused' | 'completed';
  
  // Participants
  participants: Participant[];
  myPosition: number;
  
  // Draft Progress
  currentPick: number;
  picks: Pick[];
  timer: number;
  isMyTurn: boolean;
  
  // My Data
  myQueue: Player[];
  myRoster: RosterSlot[];
  
  // Actions
  setRoom: (roomId: string) => void;
  makePick: (player: Player) => void;
  addToQueue: (player: Player) => void;
  removeFromQueue: (index: number) => void;
  reorderQueue: (from: number, to: number) => void;
  resetDraft: () => void;
}

export const useDraftStore = create<DraftState>((set, get) => ({
  // Initial state
  roomId: null,
  status: 'waiting',
  participants: [],
  myPosition: 0,
  currentPick: 1,
  picks: [],
  timer: 90,
  isMyTurn: false,
  myQueue: [],
  myRoster: createEmptyRoster(),
  
  // Actions
  setRoom: (roomId) => set({ roomId }),
  
  makePick: (player) => {
    const { currentPick, picks, myRoster } = get();
    const newPick = { pickNumber: currentPick, player, timestamp: Date.now() };
    
    set({
      picks: [...picks, newPick],
      currentPick: currentPick + 1,
      myRoster: addToRoster(myRoster, player),
    });
  },
  
  addToQueue: (player) => {
    set((state) => ({ myQueue: [...state.myQueue, player] }));
  },
  
  removeFromQueue: (index) => {
    set((state) => ({
      myQueue: state.myQueue.filter((_, i) => i !== index),
    }));
  },
  
  reorderQueue: (from, to) => {
    set((state) => {
      const newQueue = [...state.myQueue];
      const [moved] = newQueue.splice(from, 1);
      newQueue.splice(to, 0, moved);
      return { myQueue: newQueue };
    });
  },
  
  resetDraft: () => set({
    roomId: null,
    status: 'waiting',
    picks: [],
    currentPick: 1,
    myQueue: [],
    myRoster: createEmptyRoster(),
  }),
}));
```

### 8.3 Server State (SWR - Keep Existing)

The existing SWR hooks are well-designed. Keep:
- `useHeadshots()`
- `usePlayerDataCombined()`
- `useSeasonStats()`
- `useADP()`
- `useInjuries()`
- `useNews()`

### 8.4 User Context (Simplified)

```typescript
// /src/hooks/useAuth.ts

interface AuthState {
  user: User | null;
  balance: number;
  loading: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
}

// Keep Firebase integration, simplify context
```

---

## 9. DATA LAYER

### 9.1 API Route Structure

```
/api
├── /nfl
│   ├── /players          # GET - All players
│   ├── /headshots        # GET - Player photos
│   ├── /projections      # GET - Season projections
│   ├── /stats
│   │   ├── /season       # GET - Season stats
│   │   └── /weekly       # GET - Weekly stats
│   ├── /adp              # GET - Average Draft Position
│   ├── /injuries         # GET - Injury reports
│   ├── /news             # GET - Player news
│   └── /teams            # GET - Team info
├── /draft
│   ├── /rooms            # GET/POST - Draft rooms
│   ├── /rooms/[id]       # GET - Single room
│   ├── /rooms/[id]/pick  # POST - Make pick
│   └── /rooms/[id]/queue # GET/POST/DELETE - Queue
├── /user
│   ├── /profile          # GET/PUT - User profile
│   ├── /teams            # GET - User's teams
│   └── /balance          # GET - Balance
└── /tournament
    ├── /active           # GET - Active tournaments
    └── /[id]             # GET - Tournament details
```

### 9.2 Firebase Collections

```
/users/{userId}
  - profile data
  - balance
  - preferences

/tournaments/{tournamentId}
  - tournament config
  - entry info
  - results

/drafts/{draftId}
  - room config
  - participants
  - picks (subcollection)
  - status

/drafts/{draftId}/picks/{pickId}
  - pickNumber
  - player
  - userId
  - timestamp
  - timeUsed
  - source (user/queue/auto)
```

### 9.3 Real-time Subscriptions

```typescript
// Draft room real-time listener
const useDraftRealtime = (roomId: string) => {
  useEffect(() => {
    const unsubscribe = onSnapshot(
      doc(db, 'drafts', roomId),
      (snapshot) => {
        const data = snapshot.data();
        useDraftStore.setState({
          status: data.status,
          currentPick: data.currentPick,
          timer: data.timer,
        });
      }
    );
    
    return unsubscribe;
  }, [roomId]);
};
```

---

## 10. COMPONENT ARCHITECTURE

### 10.1 Component Template

```typescript
// Standard component structure

// /src/components/player/PlayerCard/PlayerCard.tsx

import { type FC } from 'react';
import { cn } from '@/lib/utils';
import { PositionBadge } from '../PositionBadge';
import { PlayerPhoto } from '../PlayerPhoto';
import type { Player } from '@/types';

interface PlayerCardProps {
  player: Player;
  variant?: 'compact' | 'default' | 'expanded';
  onSelect?: (player: Player) => void;
  onQueue?: (player: Player) => void;
  isSelected?: boolean;
  isQueued?: boolean;
  className?: string;
}

export const PlayerCard: FC<PlayerCardProps> = ({
  player,
  variant = 'default',
  onSelect,
  onQueue,
  isSelected = false,
  isQueued = false,
  className,
}) => {
  return (
    <div
      className={cn(
        // Base styles (mobile-first)
        'flex items-center gap-3 p-3 rounded-lg',
        'bg-white/5 border border-white/10',
        'transition-all duration-200',
        
        // Interactive states
        onSelect && 'cursor-pointer hover:bg-white/10',
        isSelected && 'border-brand-primary bg-brand-primary/10',
        
        // Variant styles
        variant === 'compact' && 'p-2 gap-2',
        variant === 'expanded' && 'p-4 gap-4 md:p-5',
        
        // Custom classes
        className
      )}
      onClick={() => onSelect?.(player)}
    >
      <PlayerPhoto 
        player={player} 
        size={variant === 'compact' ? 'sm' : 'md'} 
      />
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium truncate">{player.name}</span>
          <PositionBadge position={player.position} size="sm" />
        </div>
        <div className="text-sm text-gray-400">
          {player.team} | Bye {player.bye}
        </div>
      </div>
      
      <div className="text-right">
        <div className="font-mono text-sm">{player.adp}</div>
        <div className="text-xs text-gray-500">ADP</div>
      </div>
      
      {onQueue && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onQueue(player);
          }}
          className={cn(
            'p-2 rounded-full transition-colors',
            isQueued 
              ? 'bg-brand-primary text-gray-900' 
              : 'bg-white/10 hover:bg-white/20'
          )}
        >
          {isQueued ? '✓' : '+'}
        </button>
      )}
    </div>
  );
};

// Re-export from index
export { PlayerCard } from './PlayerCard';
export type { PlayerCardProps } from './PlayerCard';
```

### 10.2 Responsive Layout Pattern

```typescript
// /src/components/draft/DraftRoom/DraftRoom.tsx

export const DraftRoom: FC<DraftRoomProps> = ({ roomId }) => {
  const isMobile = useMediaQuery('(max-width: 768px)');
  
  return (
    <div className="min-h-screen bg-bg-primary">
      <DraftNavbar roomId={roomId} />
      
      <PicksBar className="w-full" />
      
      {isMobile ? (
        // Mobile: Tab-based navigation (from mobile components)
        <MobileDraftTabs>
          <TabPanel id="players">
            <PlayerList />
          </TabPanel>
          <TabPanel id="queue">
            <QueuePanel />
          </TabPanel>
          <TabPanel id="roster">
            <RosterPanel />
          </TabPanel>
          <TabPanel id="board">
            <DraftBoard />
          </TabPanel>
        </MobileDraftTabs>
      ) : (
        // Desktop: Three-column layout (scaled from mobile)
        <div className="flex gap-4 p-4">
          <QueuePanel className="w-72 flex-shrink-0" />
          <PlayerList className="flex-1" />
          <RosterPanel className="w-80 flex-shrink-0" />
        </div>
      )}
      
      {isMobile && <MobileFooter />}
    </div>
  );
};
```

### 10.3 Mobile Component Adaptation Example

```typescript
// BEFORE: Mobile-only component
// /components/draft/v3/mobile/apple/components/PlayerListApple.js

// AFTER: Responsive component adapted from mobile
// /src/components/player/PlayerList/PlayerList.tsx

export const PlayerList: FC<PlayerListProps> = ({
  players,
  onSelect,
  onQueue,
  filters,
  className,
}) => {
  return (
    <div className={cn('flex flex-col', className)}>
      {/* Filter bar - same on both */}
      <PositionFilters 
        value={filters.position} 
        onChange={filters.setPosition}
        className="mb-4"
      />
      
      {/* Search - same on both */}
      <SearchInput
        value={filters.search}
        onChange={filters.setSearch}
        className="mb-4"
      />
      
      {/* Player list - responsive */}
      <div className={cn(
        // Mobile: single column, touch-optimized
        'flex flex-col gap-2',
        // Desktop: can show more info
        'md:gap-1'
      )}>
        {players.map((player) => (
          <PlayerCard
            key={player.name}
            player={player}
            variant={isMobile ? 'default' : 'expanded'}
            onSelect={onSelect}
            onQueue={onQueue}
          />
        ))}
      </div>
    </div>
  );
};
```

---

## 11. PERFORMANCE & SCALE

### 11.1 Performance Targets

| Metric | Target | Current | Priority |
|--------|--------|---------|----------|
| First Contentful Paint | < 1.5s | ~2.5s | High |
| Largest Contentful Paint | < 2.5s | ~4s | High |
| Time to Interactive | < 3s | ~5s | High |
| Bundle Size (initial) | < 200KB | ~400KB | Medium |
| Draft Room Load | < 2s | ~3s | Critical |
| Pick Submission | < 100ms | ~200ms | Critical |

### 11.2 Optimization Strategies

#### Code Splitting
```typescript
// Lazy load heavy components
const DraftBoard = lazy(() => import('./DraftBoard'));
const PlayerStatsModal = lazy(() => import('./PlayerStatsModal'));

// Route-based splitting (automatic with App Router)
```

#### Image Optimization
```typescript
// Use Next.js Image for headshots
<Image
  src={player.headshotUrl}
  alt={player.name}
  width={48}
  height={48}
  loading="lazy"
  placeholder="blur"
  blurDataURL={placeholderImage}
/>
```

#### List Virtualization
```typescript
// For 200+ player lists
import { useVirtualizer } from '@tanstack/react-virtual';

const PlayerList = ({ players }) => {
  const parentRef = useRef<HTMLDivElement>(null);
  
  const virtualizer = useVirtualizer({
    count: players.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 64, // Row height
    overscan: 5,
  });
  
  return (
    <div ref={parentRef} className="h-[600px] overflow-auto">
      <div style={{ height: virtualizer.getTotalSize() }}>
        {virtualizer.getVirtualItems().map((virtualRow) => (
          <PlayerCard
            key={virtualRow.key}
            player={players[virtualRow.index]}
            style={{
              position: 'absolute',
              top: 0,
              transform: `translateY(${virtualRow.start}px)`,
            }}
          />
        ))}
      </div>
    </div>
  );
};
```

#### Real-time Optimizations
```typescript
// Debounce non-critical updates
const debouncedSync = useDebouncedCallback(syncToServer, 300);

// Optimistic updates for picks
const makePick = async (player: Player) => {
  // Update UI immediately
  useDraftStore.setState((state) => ({
    picks: [...state.picks, { player, pending: true }],
  }));
  
  try {
    await submitPick(player);
    // Confirm pick
  } catch {
    // Rollback
  }
};
```

### 11.3 Global Scale Considerations

```typescript
// Handle global latency
const DRAFT_CONFIG = {
  // Increased buffer for global latency
  pickTimeBuffer: 2000, // 2s buffer before timeout
  
  // Regional timestamps
  useServerTimestamp: true,
  
  // Reconnection handling
  reconnectAttempts: 5,
  reconnectDelay: 1000,
  
  // Offline queue
  enableOfflineQueue: true,
};
```

---

## 12. MIGRATION PHASES

### Phase 0: Foundation (Week 1-2)
**Goal**: Set up Version X infrastructure without touching current site

- [ ] Create `/src` directory structure
- [ ] Set up TypeScript configuration
- [ ] Configure App Router alongside Pages Router
- [ ] Set up design tokens (CSS variables)
- [ ] Create base UI components (Button, Badge, Card, Input)
- [ ] Set up Zustand stores
- [ ] Configure testing framework

**Deliverable**: New foundation that can be developed in parallel

---

### Phase 1: Design System (Week 3-4)
**Goal**: Build complete component library from mobile components

- [ ] Extract all mobile components to new structure
- [ ] Create responsive variants of each component
- [ ] Build Position Badge system
- [ ] Build Player Card variants
- [ ] Build Player List with virtualization
- [ ] Document all components

**Deliverable**: Complete component library that works on all screen sizes

---

### Phase 2: Draft Room Core (Week 5-7)
**Goal**: Rebuild draft room using mobile components scaled to desktop

- [ ] Port PicksBarApple → PicksBar (responsive)
- [ ] Port PlayerListApple → PlayerList (responsive)
- [ ] Port QueuePage → QueuePanel (responsive)
- [ ] Port RosterPage → RosterPanel (responsive)
- [ ] Build desktop three-column layout
- [ ] Implement Zustand draft state
- [ ] Connect Firebase real-time

**Deliverable**: Functional draft room with mobile/desktop layouts

---

### Phase 3: Navigation & Layouts (Week 8-9)
**Goal**: Build all app layouts and navigation

- [ ] Port MobileNavbarApple → Navbar (responsive)
- [ ] Port MobileFooterApple → Sidebar/Footer (responsive)
- [ ] Build app shell layouts
- [ ] Build route structure (App Router)
- [ ] Implement mobile tab navigation
- [ ] Implement desktop sidebar navigation

**Deliverable**: Complete navigation system

---

### Phase 4: Supporting Pages (Week 10-11)
**Goal**: Migrate all non-draft pages

- [ ] Home/Lobby page (responsive)
- [ ] My Teams page (responsive)
- [ ] Exposure Report (responsive)
- [ ] Profile/Settings (responsive)
- [ ] Payment pages (responsive)
- [ ] Tournament detail pages

**Deliverable**: All pages migrated

---

### Phase 5: Polish & Optimization (Week 12-13)
**Goal**: Performance, testing, and final polish

- [ ] Performance optimization pass
- [ ] Accessibility audit
- [ ] Cross-browser testing
- [ ] Mobile device testing
- [ ] Load testing
- [ ] Fix all edge cases
- [ ] Final visual QA

**Deliverable**: Production-ready Version X

---

### Phase 6: Transition (Week 14)
**Goal**: Switch from current to Version X

- [ ] Feature flag setup
- [ ] A/B testing infrastructure
- [ ] Gradual rollout (5% → 25% → 50% → 100%)
- [ ] Monitor metrics
- [ ] Rollback plan ready

**Deliverable**: Version X in production

---

## 13. QUALITY ASSURANCE

### 13.1 Testing Strategy

| Type | Coverage Target | Tools |
|------|-----------------|-------|
| Unit Tests | 80% of utilities | Vitest |
| Component Tests | 70% of components | Testing Library |
| Integration Tests | Critical paths | Cypress |
| Visual Tests | Key components | Chromatic (optional) |
| E2E Tests | Draft flow, auth | Playwright |

### 13.2 Key Test Scenarios

```typescript
// Draft Room Tests
describe('DraftRoom', () => {
  it('loads player list on mount');
  it('filters players by position');
  it('allows adding to queue');
  it('shows correct current picker');
  it('submits pick when my turn');
  it('updates in real-time when others pick');
  it('handles timer expiration');
  it('works on mobile viewport');
  it('works on desktop viewport');
});

// Player Card Tests
describe('PlayerCard', () => {
  it('displays player info correctly');
  it('shows position badge with correct color');
  it('handles click to select');
  it('handles queue button click');
  it('shows selected state');
  it('shows queued state');
});
```

### 13.3 Visual Regression Prevention

```typescript
// Before each PR merge, verify:
const VISUAL_CHECKLIST = [
  'Position colors match spec (QB=#F472B6, RB=#0fba80, WR=#FBBF25, TE=#7C3AED)',
  'No emojis in UI',
  'No visible scrollbars on mobile',
  'First 9 roster cells unchanged',
  'Draft board grid alignment',
  'Player card spacing consistent',
  'Timer display correct',
];
```

---

## 14. RISK MITIGATION

### 14.1 Identified Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Visual regression | High | Medium | Screenshot testing, manual QA |
| Performance regression | High | Medium | Lighthouse CI, load testing |
| Data loss during migration | Critical | Low | Firebase backup, rollback plan |
| Real-time sync issues | High | Medium | Extensive testing, graceful degradation |
| Mobile UX degradation | High | Low | Mobile-first approach, device testing |
| Timeline overrun | Medium | Medium | Phased approach, MVP scope |

### 14.2 Rollback Strategy

```typescript
// Feature flag system
const FEATURE_FLAGS = {
  useVersionX: false,
  vxDraftRoom: false,
  vxNavigation: false,
  vxPlayerList: false,
};

// Instant rollback capability
if (errorRate > threshold) {
  FEATURE_FLAGS.useVersionX = false;
  // Automatic rollback to current version
}
```

### 14.3 Parallel Operation

During transition, both versions will run:

```
Current Site (Pages Router)     Version X (App Router)
─────────────────────────────   ─────────────────────
/pages/index.js                 /src/app/page.tsx
/pages/draft/[roomId].js        /src/app/draft/[roomId]/page.tsx
/pages/my-teams.js              /src/app/my-teams/page.tsx

Feature flag determines which serves each user
```

---

## 15. SUCCESS METRICS

### 15.1 Technical Metrics

| Metric | Current | Target | Measurement |
|--------|---------|--------|-------------|
| TypeScript Coverage | 5% | 100% | `tsc --noEmit` |
| Test Coverage | 2% | 70% | Jest coverage |
| Bundle Size | 400KB | <200KB | Webpack analyzer |
| Lighthouse Score | ~60 | >90 | Lighthouse CI |
| Build Time | 45s | <30s | CI metrics |

### 15.2 User Experience Metrics

| Metric | Current | Target | Measurement |
|--------|---------|--------|-------------|
| Page Load Time | 3s | <2s | Core Web Vitals |
| Draft Room Load | 4s | <2s | Custom timing |
| Pick Submission | 200ms | <100ms | Custom timing |
| Mobile Usability | Good | Excellent | User testing |

### 15.3 Business Metrics

| Metric | Measurement |
|--------|-------------|
| User Satisfaction | Post-migration survey |
| Draft Completion Rate | Analytics |
| Error Rate | Sentry monitoring |
| Support Tickets | Support system |

---

## APPENDICES

### Appendix A: Mobile Component Inventory

| Component | Lines | Complexity | Migration Priority |
|-----------|-------|------------|-------------------|
| DraftRoomApple.js | 2,201 | High | P0 |
| PlayerListApple.js | ~400 | Medium | P0 |
| PicksBarApple.js | ~300 | Medium | P0 |
| MobileNavbarApple.js | ~200 | Low | P1 |
| MobileFooterApple.js | ~200 | Low | P1 |
| RosterPage.js | ~350 | Medium | P1 |
| QueuePage.js | ~300 | Medium | P1 |
| DraftBoard3Apple.js | ~500 | High | P2 |
| PositionBadge.js | ~100 | Low | P0 |

### Appendix B: Current to VX Mapping

```
CURRENT                          VERSION X
───────                          ─────────
components/mobile/*         →    src/components/* (responsive)
components/draft/v3/*       →    src/components/draft/*
lib/playerPool.js           →    src/lib/data/playerPool.ts
lib/firebase.js             →    src/lib/firebase/index.ts
lib/userContext.js          →    src/hooks/useAuth.ts
lib/playerDataContext.js    →    src/hooks/usePlayerData.ts
lib/swr/*                   →    src/hooks/api/* (keep structure)
types/*                     →    src/types/* (keep structure)
pages/api/*                 →    src/app/api/* (migrate to route handlers)
styles/globals.css          →    src/styles/globals.css + tokens.css
```

### Appendix C: Terminology Glossary

| Term | Definition |
|------|------------|
| **VX** | Version X - the rebuild |
| **Mobile Canon** | Mobile components are source of truth |
| **Scale Up** | Adapting mobile → desktop (not vice versa) |
| **Whale Users** | Heavy drafters with 100+ entries |
| **APD** | Average Position Drafted - TopDog's term |
| **Picks Bar** | Horizontal scrolling draft pick display |
| **On The Clock** | Current drafter indicator |
| **Queue** | User's pre-ranked player wishlist |

---

## DOCUMENT HISTORY

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-12-05 | AI Assistant | Initial comprehensive plan |

---

**END OF DOCUMENT**


# MOBILE COMPONENT INVENTORY
## Source of Truth for Version X Desktop Migration

**Document Version**: 1.0  
**Created**: December 5, 2025  
**Purpose**: Detailed inventory of all mobile components for desktop migration

---

## TABLE OF CONTENTS

1. [Draft Room Components](#1-draft-room-components)
2. [App Navigation Components](#2-app-navigation-components)
3. [Tab Components](#3-tab-components)
4. [Shared/Base Components](#4-sharedbase-components)
5. [Page Content Components](#5-page-content-components)
6. [Modal Components](#6-modal-components)
7. [Constants & Configuration](#7-constants--configuration)
8. [Component Relationships](#8-component-relationships)
9. [Migration Priority Matrix](#9-migration-priority-matrix)

---

## 1. DRAFT ROOM COMPONENTS

### 1.1 DraftRoomApple.js
**Location**: `components/draft/v3/mobile/apple/DraftRoomApple.js`  
**Lines**: 2,201  
**Complexity**: High  
**Priority**: P0 (Critical)

**Purpose**: Main draft room container coordinating all draft functionality

**Props**:
```typescript
interface DraftRoomAppleProps {
  roomId: string;
  mockState?: DraftState;
  setMockState?: (state: DraftState) => void;
}
```

**State Managed**:
- `currentPickNumber` - Current pick in draft
- `isDraftActive` - Draft active status
- `isPaused` - Pause state
- `timer` - Pick timer countdown
- `isMyTurn` - User's turn indicator
- `participants` - Array of 12 participants
- `picks` - Array of completed picks
- `availablePlayers` - Players not yet drafted
- `userTeam` - User's drafted roster
- `selectedPlayer` - Currently selected player
- `activeTab` - Current footer tab ('Players', 'Queue', 'Rosters', 'Board', 'Info')
- `queuedPlayers` - User's queue
- `isRulesModalOpen` - Rules modal visibility

**Key Features**:
- Loading state with spinner
- Ripple effect animations
- Tab-based navigation via footer
- Player drafting flow
- Queue management
- Roster viewing
- Draft board grid

**Event Listeners**:
- `showTeamModal` - Switch to Rosters tab
- `showQueueModal` - Switch to Queue tab
- `showBoardModal` - Switch to Board tab
- `showInfoModal` - Switch to Info tab

**Desktop Adaptation Notes**:
- Convert tab navigation to three-column layout
- Keep state management logic
- Timer logic reusable
- Participant logic reusable

---

### 1.2 PlayerListApple.js
**Location**: `components/draft/v3/mobile/apple/components/PlayerListApple.js`  
**Lines**: 896  
**Complexity**: High  
**Priority**: P0 (Critical)

**Purpose**: Scrollable list of available players with filtering, sorting, and selection

**Props**:
```typescript
interface PlayerListAppleProps {
  players: Player[];
  onDraftPlayer: (player: Player) => void;
  onQueuePlayer: (player: Player) => void;
  onPlayerSelect?: (player: Player) => void;
  scrollRef?: RefObject<HTMLDivElement>;
  isMyTurn?: boolean;
  queuedPlayers?: Player[];
}
```

**State Managed**:
- `activeFilters` - Array of selected position filters (multi-select)
- `searchTerm` - Player search input
- `sortDirection` - Sort mode ('asc', 'desc', 'name_asc', 'name_desc', 'rank_asc', 'rank_desc', 'proj_asc', 'proj_desc')
- `customRankings` - User's custom player rankings
- `expandedPlayer` - Currently expanded player row

**Sub-Components**:
- `PlayerRowApple` - Individual player row with expansion capability

**Key Features**:
- **4-way Position Filtering**: QB, RB, WR, TE (multi-select)
- **4-way ADP Sorting**: [[memory:7610992]]
  - 'asc' - ADP ascending
  - 'desc' - ADP descending
  - 'name_asc' - Name A-Z
  - 'name_desc' - Name Z-A
- Search by player name, team, or full team name
- Player expansion with stats dropdown
- Queue add/remove buttons
- Custom rankings display
- Auto-scroll expanded player to view

**Position Colors** (Locked [[memory:4753963]]):
```javascript
const colors = {
  QB: '#F472B6',  // Pink
  RB: '#0fba80',  // Green
  WR: '#FBBF25',  // Yellow/Gold
  TE: '#7C3AED'   // Purple
};
```

**Desktop Adaptation Notes**:
- Add hover states for rows
- Expand row width for more columns
- Add keyboard navigation
- Consider virtualization for 200+ players

---

### 1.3 PicksBarApple.js
**Location**: `components/draft/v3/mobile/apple/components/PicksBarApple.js`  
**Lines**: 697  
**Complexity**: Medium-High  
**Priority**: P0 (Critical)

**Purpose**: Horizontal scrolling bar showing all draft picks

**Props**:
```typescript
interface PicksBarAppleProps {
  picks: Pick[];
  participants: Participant[];
  currentPickNumber: number;
  isDraftActive: boolean;
  timer: number;
  isInGracePeriod?: boolean;
  isMyTurn?: boolean;
  scrollRef?: RefObject<HTMLDivElement>;
  onPlayerCardClick?: (pickNumber: number) => void;
}
```

**State Managed**:
- `showAbsolutePickNumbers` - Toggle between "1.01" format and "1" format

**Sub-Components**:
- `BlankCardApple` - Empty spacer cards
- `PickCardApple` - Individual pick card with all states

**Key Features**:
- Auto-scroll to current pick (centered)
- Position tracker bar showing team composition
- Timer display for on-the-clock picks
- Pre-draft countdown display
- Click to toggle pick number format
- Team logos on completed picks
- User's future picks highlighted with custom border color
- Snake draft position calculation

**Visual States**:
1. **Empty (future)**: Gray border, "X away" text for user picks
2. **On the clock**: Red border, timer countdown
3. **Completed**: Position-colored border, player info, team logo

**Card Dimensions** (from mobileSizes.js):
```javascript
cardWidth: '107px',
cardGap: '4px',
height: '160px' (container)
```

**Desktop Adaptation Notes**:
- Increase card sizes
- Add player headshots to completed cards
- Add more info on hover
- Keep horizontal scroll behavior

---

### 1.4 QueuePage.js
**Location**: `components/draft/v3/mobile/apple/components/QueuePage.js`  
**Lines**: 467  
**Complexity**: Medium  
**Priority**: P1

**Purpose**: Full-page queue management with drag-and-drop reordering

**Props**:
```typescript
interface QueuePageProps {
  queuedPlayers: Player[];
  onRemoveFromQueue: (player: Player) => void;
  onReorderQueue: (newQueue: Player[]) => void;
  onDraftPlayer?: (player: Player) => void;
  isMyTurn?: boolean;
}
```

**State Managed**:
- `draggedIndex` - Index of player being dragged
- `dragOverIndex` - Index being hovered during drag
- `dropLinePosition` - Visual indicator position
- `animatingIndex` - Item being animated
- `lastClickTime` - For double-click detection
- `clickedIndex` - For arrow click tracking

**Key Features**:
- Drag and drop reordering (desktop only - uses HTML5 drag API)
- Arrow button to move up one position (0.7s delay)
- Double-click arrow to move to top
- Remove from queue button
- ADP display
- Position badges

**Desktop Adaptation Notes**:
- Convert to sidebar panel
- Enhanced drag visuals
- Keyboard shortcuts for reordering

---

### 1.5 RosterPage.js
**Location**: `components/draft/v3/mobile/apple/components/RosterPage.js`  
**Lines**: 389  
**Complexity**: Medium  
**Priority**: P1

**Purpose**: View any participant's roster with dropdown team selection

**Props**:
```typescript
interface RosterPageProps {
  participants: Participant[];
  picks: Pick[];
  selectedParticipantIndex: number;
  onParticipantChange: (index: number) => void;
  onDraftPlayer?: (player: Player) => void;
  isMyTurn?: boolean;
}
```

**State Managed**:
- `isDropdownOpen` - Participant selector dropdown state

**Key Features**:
- Dropdown to switch between participants
- Starting lineup display (QB, 2xRB, 3xWR, TE, 2xFLEX)
- Bench section (9 spots)
- Position badges
- Bye week display
- Projected points display
- Click outside to close dropdown

**Roster Structure**:
```javascript
['QB', 'RB', 'RB', 'WR', 'WR', 'WR', 'TE', 'FLEX', 'FLEX'] // Starting
[...Array(9)] // Bench
```

**Desktop Adaptation Notes**:
- Convert to sidebar panel
- Add more player details
- Add sorting options

---

### 1.6 MobileNavbarApple.js
**Location**: `components/draft/v3/mobile/apple/components/MobileNavbarApple.js`  
**Lines**: 242  
**Complexity**: Low-Medium  
**Priority**: P1

**Purpose**: Draft room top navigation with exit functionality

**Props**:
```typescript
interface MobileNavbarAppleProps {
  showBack?: boolean;
  title?: string;
  onMenuToggle?: () => void;
  transparent?: boolean;
  isMyTurn?: boolean;
  timer?: number;
  isDraftActive?: boolean;
  participantCount?: number;
  roomId?: string;
}
```

**State Managed**:
- `showLeaveDraftModal` - Exit confirmation modal visibility

**Sub-Components**:
- `LeaveDraftModal` - Confirmation dialog for leaving draft

**Key Features**:
- wr_blue.png background (normal state)
- User border color background when timer <= 10 seconds
- Centered logo
- Back arrow with leave confirmation
- Tournament withdrawal vs room exit distinction
- Safe area handling

**Desktop Adaptation Notes**:
- Integrate into main app navbar
- Keep leave confirmation logic
- Add room info display

---

### 1.7 MobileFooterApple.js
**Location**: `components/draft/v3/mobile/apple/components/MobileFooterApple.js`  
**Lines**: 72  
**Complexity**: Low  
**Priority**: P1

**Purpose**: Draft room bottom tab navigation

**Props**:
```typescript
interface MobileFooterAppleProps {
  activeTab?: 'Players' | 'Queue' | 'Rosters' | 'Board' | 'Info';
  onTabChange?: (tabId: string) => void;
  queueCount?: number;
}
```

**Tabs Configured**:
1. **Players** - Player list icon
2. **Queue** - Plus icon + badge count
3. **Rosters** - Lines icon
4. **Board** - Grid icon
5. **Info** - Info circle icon

**Desktop Adaptation Notes**:
- Convert to sidebar or remove entirely
- Keep tab concept for mobile view
- Integrate as view toggle buttons

---

### 1.8 PositionBadge.js
**Location**: `components/draft/v3/mobile/apple/components/PositionBadge.js`  
**Lines**: 142  
**Complexity**: Low  
**Priority**: P0 (Critical)

**Purpose**: Position indicator badge with locked colors

**Props**:
```typescript
interface PositionBadgeProps {
  position: 'QB' | 'RB' | 'WR' | 'TE' | 'FLEX' | 'BN';
  style?: CSSProperties;
  top?: string;
  left?: string;
  width?: string;
  height?: string;
}
```

**Key Features**:
- **LOCKED Colors** [[memory:4753963]]:
  - QB: #F472B6 (pink)
  - RB: #0fba80 (green)
  - WR: #FBBF25 (yellow/gold)
  - TE: #7C3AED (purple)
  - FLEX: Three-layer gradient (RB/WR/TE)
  - BN: #6B7280 (gray)
- Table-cell display for perfect text centering
- Scalable via width/height props
- Black text on all badges

**FLEX Badge Implementation**:
```javascript
// Three horizontal stripes for FLEX
<div style={{ flex: 1, backgroundColor: '#0fba80' }}></div> // RB Green
<div style={{ flex: 1, backgroundColor: '#FBBF25' }}></div> // WR Yellow
<div style={{ flex: 1, backgroundColor: '#7C3AED' }}></div> // TE Purple
```

**Desktop Adaptation Notes**:
- Keep exact same implementation
- Create TypeScript version
- Export as shared component

---

### 1.9 QuickActionsApple.js
**Location**: `components/draft/v3/mobile/apple/components/QuickActionsApple.js`  
**Lines**: ~100 (estimate)  
**Complexity**: Low  
**Priority**: P2

**Purpose**: Quick action buttons for common draft actions

**Desktop Adaptation Notes**:
- Convert to keyboard shortcuts display
- Integrate into action bar

---

### 1.10 PlayerStatsModal.js
**Location**: `components/draft/v3/mobile/apple/components/PlayerStatsModal.js`  
**Lines**: ~200 (estimate)  
**Complexity**: Medium  
**Priority**: P2

**Purpose**: Modal showing detailed player statistics

**Desktop Adaptation Notes**:
- Can be shown inline instead of modal
- Integrate with PlayerExpandedCard

---

### 1.11 RippleEffect.js
**Location**: `components/draft/v3/mobile/apple/components/RippleEffect.js`  
**Lines**: ~50 (estimate)  
**Complexity**: Low  
**Priority**: P3

**Purpose**: Touch feedback animation (iOS style)

**Desktop Adaptation Notes**:
- Optional - can be replaced with hover states
- Keep for mobile touch feedback

---

## 2. APP NAVIGATION COMPONENTS

### 2.1 MobileLayout.js
**Location**: `components/mobile/MobileLayout.js`  
**Lines**: 265  
**Complexity**: Medium  
**Priority**: P1

**Purpose**: Unified layout wrapper for all mobile pages

**Props**:
```typescript
interface MobileLayoutProps {
  children: ReactNode;
  title?: string;
  showHeader?: boolean;
  showFooter?: boolean;
  showBackButton?: boolean;
  onBackClick?: () => void;
  showDepositButton?: boolean;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  headerRight?: ReactNode;
  headerLeft?: ReactNode;
  phoneFrame?: boolean;
  fullHeight?: boolean;
  className?: string;
}
```

**Sub-Components**:
- `MobileHeader` - Top header with logo and navigation
- `MobileScrollContent` - Scrollable content wrapper
- `MobileCenteredContent` - Centered content for empty states
- `MobileLoading` - Loading spinner
- `MobileComingSoon` - Coming soon placeholder

**Key Features**:
- Optional phone frame simulation for desktop preview
- Safe area handling
- Flexible header/footer visibility
- Dynamic height calculation

**Desktop Adaptation Notes**:
- Create responsive layout that adapts
- Remove phone frame for actual mobile
- Keep safe area handling

---

### 2.2 MobileFooter.js
**Location**: `components/mobile/MobileFooter.js`  
**Lines**: 63  
**Complexity**: Low  
**Priority**: P1

**Purpose**: Main app bottom navigation (not draft room)

**Tabs Configured**:
1. **Lobby** - Tournament lobby
2. **Live Drafts** - Active drafts (with badge count)
3. **My Teams** - User's drafted teams
4. **Exposure** - Player exposure report
5. **Profile** - User settings

**Desktop Adaptation Notes**:
- Convert to sidebar navigation
- Keep same navigation items
- Add keyboard shortcuts

---

### 2.3 MobileFooterBase.js
**Location**: `components/mobile/shared/MobileFooterBase.js`  
**Lines**: 203  
**Complexity**: Medium  
**Priority**: P1

**Purpose**: Reusable base component for iOS-style bottom navigation

**Props**:
```typescript
interface MobileFooterBaseProps {
  tabs: TabConfig[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  showHomeIndicator?: boolean;
  bottomOffset?: string;
}

interface TabConfig {
  id: string;
  label: string;
  icon: (isActive: boolean) => ReactElement;
  badge?: number;
  badgePosition?: { top: string; right: string };
}
```

**Exports**:
- `MobileFooterBase` - Main component
- `createIcon` - Icon factory function
- `FOOTER_ICONS` - Pre-built icon components

**Desktop Adaptation Notes**:
- Reuse icon definitions
- Create sidebar version

---

## 3. TAB COMPONENTS

### 3.1 LobbyTab.js
**Location**: `components/mobile/tabs/LobbyTab.js`  
**Lines**: 33  
**Complexity**: Low  
**Priority**: P2

**Purpose**: Tournament lobby showing available tournaments

**Props**:
```typescript
interface LobbyTabProps {
  onJoinClick: () => void;
}
```

**Desktop Adaptation Notes**:
- Expand tournament cards
- Add tournament filtering

---

### 3.2 MyTeamsTab.js
**Location**: `components/mobile/tabs/MyTeamsTab.js`  
**Lines**: 47  
**Complexity**: Low  
**Priority**: P2

**Purpose**: User's drafted teams with list and detail views

**Props**:
```typescript
interface MyTeamsTabProps {
  selectedTeam: Team | null;
  setSelectedTeam: (team: Team | null) => void;
  setDraftBoardTeam: (team: Team) => void;
  setShowDraftBoard: (show: boolean) => void;
}
```

**Sub-Components**:
- `TeamListView` - List of all teams
- `TeamDetailsView` - Single team detail with roster

**Desktop Adaptation Notes**:
- Master-detail layout
- Add team comparison

---

### 3.3 ProfileTab.js
**Location**: `components/mobile/tabs/ProfileTab.js`  
**Lines**: 146  
**Complexity**: Low  
**Priority**: P2

**Purpose**: User profile and settings menu

**Menu Items**:
1. Payment Methods
2. Rankings
3. Customization
4. Autodraft Limits
5. Profile
6. Deposit History

**Desktop Adaptation Notes**:
- Convert to settings page
- Add more options

---

### 3.4 ExposureTab.js
**Location**: `components/mobile/tabs/ExposureTab.js`  
**Lines**: ~100 (estimate)  
**Complexity**: Medium  
**Priority**: P2

**Purpose**: Player exposure analysis across user's teams

**Desktop Adaptation Notes**:
- Add data visualization
- More detailed breakdown

---

### 3.5 LiveDraftsTab.js
**Location**: `components/mobile/tabs/LiveDraftsTab.js`  
**Lines**: ~100 (estimate)  
**Complexity**: Medium  
**Priority**: P2

**Purpose**: List of user's active draft rooms

**Desktop Adaptation Notes**:
- Add draft room status indicators
- Quick join functionality

---

## 4. SHARED/BASE COMPONENTS

### 4.1 PlayerExpandedCard.tsx
**Location**: `components/shared/PlayerExpandedCard/PlayerExpandedCard.tsx`  
**Lines**: 425  
**Complexity**: Medium  
**Priority**: P0 (Critical)

**Purpose**: Expandable player card with detailed stats (TypeScript)

**Props**:
```typescript
interface PlayerExpandedCardProps {
  player: PlayerData | null;
  onDraft?: (player: PlayerData) => void;
  onClose?: () => void;
  isMyTurn?: boolean;
  showDraftButton?: boolean;
  headshotUrl?: string | null;
  style?: React.CSSProperties;
}
```

**Key Features**:
- Team gradient background
- Team logo display
- Bye/ADP/Proj badges
- DRAFT button (conditional)
- Position-specific stats tables:
  - **QB**: Passing + Rushing stats
  - **RB**: Rushing + Receiving stats
  - **WR/TE**: Receiving + Rushing stats
- Year-by-year comparison (Proj, 2025, 2024, 2023, 2022)

**Stats Table Columns**:
- **QB**: YEAR, CMP, ATT, YDS, CMP%, AVG, TD, INT, LNG, SACK, CAR, YDS, AVG, TD, LNG, FUM
- **RB**: YEAR, CAR, YDS, AVG, TD, LNG, FUM, REC, TGTS, YDS, AVG, TD, LNG, FD
- **WR/TE**: YEAR, REC, TGTS, YDS, AVG, TD, LNG, FD, CAR, YDS, AVG, TD, LNG, FUM

**Desktop Adaptation Notes**:
- Already TypeScript - ready for migration
- Keep exact same implementation
- May show inline instead of dropdown

---

### 4.2 TournamentCardMobile.js
**Location**: `components/mobile/TournamentCardMobile.js`  
**Lines**: 233  
**Complexity**: Low  
**Priority**: P2

**Purpose**: Tournament display card with multiple variants

**Variants**:
1. `TournamentCardMobile` - Full size (320x522px)
2. `TournamentCardMobileCompact` - Compact for lists
3. `TournamentCardMobileWithProgress` - With fill progress bar

**Props** (main variant):
```typescript
interface TournamentCardMobileProps {
  title?: string;
  entryFee?: string;
  totalEntries?: string;
  firstPlacePrize?: string;
  onJoinClick?: () => void;
  className?: string;
  style?: CSSProperties;
}
```

**Desktop Adaptation Notes**:
- Scale up for desktop
- Add more tournament details

---

### 4.3 PaymentMethodIcon.js
**Location**: `components/mobile/shared/PaymentMethodIcon.js`  
**Lines**: ~50 (estimate)  
**Complexity**: Low  
**Priority**: P3

**Purpose**: Official payment method logos [[memory:5050081]]

**Desktop Adaptation Notes**:
- Reuse as-is

---

### 4.4 MobilePhoneFrame.js
**Location**: `components/mobile/shared/MobilePhoneFrame.js`  
**Lines**: ~50 (estimate)  
**Complexity**: Low  
**Priority**: P3

**Purpose**: Phone frame simulation for desktop preview

**Desktop Adaptation Notes**:
- Development tool only
- Keep for mobile testing

---

## 5. PAGE CONTENT COMPONENTS

### 5.1 MobileHomeContent.js
**Location**: `components/mobile/pages/MobileHomeContent.js`  
**Lines**: ~100 (estimate)  
**Complexity**: Low  
**Priority**: P2

---

### 5.2 PaymentPageContent.js
**Location**: `components/mobile/pages/PaymentPageContent.js`  
**Lines**: ~150 (estimate)  
**Complexity**: Medium  
**Priority**: P2

---

### 5.3 DepositHistoryContent.js
**Location**: `components/mobile/pages/DepositHistoryContent.js`  
**Lines**: ~100 (estimate)  
**Complexity**: Low  
**Priority**: P3

---

### 5.4 RankingsContent.js
**Location**: `components/mobile/pages/RankingsContent.js`  
**Lines**: ~150 (estimate)  
**Complexity**: Medium  
**Priority**: P2

---

### 5.5 ProfileCustomizationContent.js
**Location**: `components/mobile/pages/ProfileCustomizationContent.js`  
**Lines**: ~100 (estimate)  
**Complexity**: Low  
**Priority**: P3

---

## 6. MODAL COMPONENTS

### 6.1 TournamentRulesModal.js
**Location**: `components/mobile/modals/TournamentRulesModal.js`  
**Lines**: ~100 (estimate)  
**Complexity**: Low  
**Priority**: P2

---

### 6.2 DraftBoardModal.js
**Location**: `components/mobile/DraftBoardModal.js`  
**Lines**: ~200 (estimate)  
**Complexity**: Medium  
**Priority**: P2

---

### 6.3 ShareModal.js
**Location**: `components/mobile/ShareModal.js`  
**Lines**: ~100 (estimate)  
**Complexity**: Low  
**Priority**: P3

---

### 6.4 TournamentModalMobile.js
**Location**: `components/mobile/TournamentModalMobile.js`  
**Lines**: ~150 (estimate)  
**Complexity**: Medium  
**Priority**: P2

---

## 7. CONSTANTS & CONFIGURATION

### 7.1 mobileSizes.js
**Location**: `components/draft/v3/mobile/shared/constants/mobileSizes.js`  
**Lines**: 74  
**Complexity**: Low  
**Priority**: P0 (Critical)

**Exports**:
```typescript
export const MOBILE_SIZES = {
  TOUCH_TARGET_MIN: '44px',
  TOUCH_TARGET_COMFORT: '48px',
  TOUCH_TARGET_LARGE: '56px',
  PLAYER_CARD: { height: '64px', padding: '8px', gap: '12px' },
  PICKS_BAR: { height: '100px', cardWidth: '107px', cardGap: '4px', padding: '16px' },
  SPACING: { xs: '4px', sm: '8px', md: '16px', lg: '24px', xl: '32px' },
  TEXT: { body: '16px', small: '14px', large: '18px', title: '24px' }
};

export const MOBILE_BREAKPOINTS = {
  PHONE_SMALL: '320px',
  PHONE_LARGE: '414px',
  TABLET_SMALL: '768px',
  TABLET_LARGE: '1024px',
  PORTRAIT_MAX: '768px',
  LANDSCAPE_MIN: '769px'
};

export const PLATFORM_SPECIFIC = {
  IOS: {
    SAFE_AREA_TOP: 'env(safe-area-inset-top)',
    SAFE_AREA_BOTTOM: 'env(safe-area-inset-bottom)',
    BORDER_RADIUS: '12px',
    ANIMATION_DURATION: '0.25s'
  },
  ANDROID: {
    ELEVATION_1: '0px 1px 3px rgba(0,0,0,0.12)',
    ELEVATION_2: '0px 1px 5px rgba(0,0,0,0.2)',
    BORDER_RADIUS: '8px',
    ANIMATION_DURATION: '0.2s'
  }
};
```

**Desktop Adaptation Notes**:
- Add desktop-specific sizes
- Create responsive scale system

---

### 7.2 deviceDetection.js
**Location**: `components/draft/v3/mobile/shared/utils/deviceDetection.js`  
**Lines**: ~50 (estimate)  
**Complexity**: Low  
**Priority**: P1

**Purpose**: Detect mobile vs desktop, iOS vs Android

**Desktop Adaptation Notes**:
- Expand for responsive breakpoint detection
- Add feature detection

---

## 8. COMPONENT RELATIONSHIPS

```
DraftRoomApple
├── MobileNavbarApple
│   └── LeaveDraftModal
├── PicksBarApple
│   ├── BlankCardApple
│   └── PickCardApple
├── PlayerListApple
│   ├── PlayerRowApple
│   │   ├── PositionBadge
│   │   └── PlayerExpandedCard
│   └── PositionBadge (filters)
├── QueuePage
│   └── PositionBadge
├── RosterPage
│   └── PositionBadge
├── DraftBoardContainer
│   └── DraftBoard3Apple
├── QuickActionsApple
├── MobileFooterApple
│   └── MobileFooterBase
│       └── FOOTER_ICONS
└── RippleEffect

MobileLayout
├── MobileHeader
├── MobileFooter
│   └── MobileFooterBase
└── [Page Content]

MobileFooterBase
└── FOOTER_ICONS
    ├── lobby
    ├── liveDrafts
    ├── teams
    ├── exposure
    ├── profile
    ├── players
    ├── queue
    ├── roster
    ├── board
    └── info
```

---

## 9. MIGRATION PRIORITY MATRIX

### P0 - Critical (Week 1-3)
Must be migrated first - core functionality

| Component | Lines | Complexity | Notes |
|-----------|-------|------------|-------|
| DraftRoomApple.js | 2,201 | High | Core orchestrator |
| PlayerListApple.js | 896 | High | Main interaction |
| PicksBarApple.js | 697 | Medium-High | Key visual element |
| PositionBadge.js | 142 | Low | Used everywhere |
| PlayerExpandedCard.tsx | 425 | Medium | Already TypeScript |
| mobileSizes.js | 74 | Low | Configuration |

### P1 - High (Week 4-6)
Core user experience components

| Component | Lines | Complexity | Notes |
|-----------|-------|------------|-------|
| QueuePage.js | 467 | Medium | Queue management |
| RosterPage.js | 389 | Medium | Team viewing |
| MobileNavbarApple.js | 242 | Low-Medium | Navigation |
| MobileFooterApple.js | 72 | Low | Tab navigation |
| MobileLayout.js | 265 | Medium | Layout wrapper |
| MobileFooter.js | 63 | Low | App navigation |
| MobileFooterBase.js | 203 | Medium | Shared base |
| deviceDetection.js | ~50 | Low | Utility |

### P2 - Medium (Week 7-9)
Supporting features

| Component | Lines | Complexity | Notes |
|-----------|-------|------------|-------|
| LobbyTab.js | 33 | Low | Tournament display |
| MyTeamsTab.js | 47 | Low | Team management |
| ProfileTab.js | 146 | Low | Settings |
| ExposureTab.js | ~100 | Medium | Analytics |
| LiveDraftsTab.js | ~100 | Medium | Active drafts |
| TournamentCardMobile.js | 233 | Low | Tournament cards |
| PlayerStatsModal.js | ~200 | Medium | Stats display |
| TournamentRulesModal.js | ~100 | Low | Rules display |
| DraftBoardModal.js | ~200 | Medium | Board view |
| TournamentModalMobile.js | ~150 | Medium | Join flow |

### P3 - Low (Week 10+)
Polish and optional features

| Component | Lines | Complexity | Notes |
|-----------|-------|------------|-------|
| QuickActionsApple.js | ~100 | Low | Quick actions |
| RippleEffect.js | ~50 | Low | Touch feedback |
| ShareModal.js | ~100 | Low | Sharing |
| PaymentMethodIcon.js | ~50 | Low | Icons |
| MobilePhoneFrame.js | ~50 | Low | Dev tool |
| DepositHistoryContent.js | ~100 | Low | History |
| ProfileCustomizationContent.js | ~100 | Low | Customization |

---

## SUMMARY STATISTICS

| Metric | Value |
|--------|-------|
| Total Components | 38+ |
| Total Lines (estimated) | ~9,000 |
| TypeScript Components | 1 (PlayerExpandedCard) |
| P0 Critical Components | 6 |
| P1 High Priority | 8 |
| P2 Medium Priority | 10 |
| P3 Low Priority | 7 |

---

## APPENDIX: Component Import Paths

```javascript
// Draft Room Components
import DraftRoomApple from '@/components/draft/v3/mobile/apple/DraftRoomApple';
import PlayerListApple from '@/components/draft/v3/mobile/apple/components/PlayerListApple';
import PicksBarApple from '@/components/draft/v3/mobile/apple/components/PicksBarApple';
import QueuePage from '@/components/draft/v3/mobile/apple/components/QueuePage';
import RosterPage from '@/components/draft/v3/mobile/apple/components/RosterPage';
import MobileNavbarApple from '@/components/draft/v3/mobile/apple/components/MobileNavbarApple';
import MobileFooterApple from '@/components/draft/v3/mobile/apple/components/MobileFooterApple';
import PositionBadge from '@/components/draft/v3/mobile/apple/components/PositionBadge';

// Shared Components
import PlayerExpandedCard from '@/components/shared/PlayerExpandedCard';
import MobileFooterBase, { FOOTER_ICONS } from '@/components/mobile/shared/MobileFooterBase';

// Layout Components
import MobileLayout from '@/components/mobile/MobileLayout';
import MobileFooter from '@/components/mobile/MobileFooter';

// Tab Components
import LobbyTab from '@/components/mobile/tabs/LobbyTab';
import MyTeamsTab from '@/components/mobile/tabs/MyTeamsTab';
import ProfileTab from '@/components/mobile/tabs/ProfileTab';

// Constants
import { MOBILE_SIZES, PLATFORM_SPECIFIC, MOBILE_BREAKPOINTS } from '@/components/draft/v3/mobile/shared/constants/mobileSizes';
```

---

**END OF INVENTORY DOCUMENT**


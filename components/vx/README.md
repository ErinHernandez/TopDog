# Version X (VX) Components

> **⚠️ NOTE**  
> This directory contains shared component library used by vx2.  
> The draft room routes using vx are deprecated.  
> **Migration:** Use `/draft/vx2/[roomId]` instead.  
> **See:** `PHASE4_DRAFT_CONSOLIDATION_PLAN.md`

## Purpose

This directory contains the Version X migration components. These are being developed alongside the original mobile components, which remain untouched as a reference.

## Quick Start

```typescript
// Import everything from one place
import { 
  // UI Components
  Button, IconButton, Input, SearchInput, Select,
  Card, Badge, StatusBadge, PositionTag,
  Modal, Sheet, Toast, EmptyState,
  Tabs, SegmentedControl, ProgressBar, Avatar,
  // Draft Components
  PositionBadge, TeamLogo, Stat, Countdown,
  // Hooks
  useTimer, useAutoScroll, useLocalStorage,
  // Constants
  POSITION_COLORS, BG_COLORS, MOBILE, FONT_SIZE,
  // Utilities
  formatPlayerName, getByeWeek,
  // Types
  Player, Participant, Pick,
} from '@/components/vx';
```

## Development Approach

**Original Mobile Components** (DO NOT MODIFY):
- Location: `components/draft/v3/mobile/apple/`
- Demo: `/testing-grounds/mobile-apple-demo`
- Status: Reference/Safety copy

**VX Components** (Active Development):
- Location: `components/vx/`
- Demo: `/testing-grounds/vx-mobile-demo`
- Status: Active migration work

## Directory Structure

```
/components/vx/
├── index.ts                   # Master export (import from here)
├── constants/                 # Design tokens & config
│   ├── index.ts              # Central export
│   ├── colors.ts             # Position colors, UI colors, team colors
│   ├── sizes.ts              # Typography, spacing, breakpoints
│   ├── positions.ts          # Position config, roster structure
│   └── animations.ts         # Duration, easing, transitions
├── shared/                    # 60+ shared components & utilities
│   ├── index.ts              # Central export
│   ├── types.ts              # TypeScript interfaces
│   ├── utils.ts              # Utility functions
│   ├── Button.tsx            # Button, IconButton
│   ├── Input.tsx             # Input, SearchInput, Select, Textarea
│   ├── Card.tsx              # Card, CardHeader, CardFooter
│   ├── Badge.tsx             # Badge, StatusBadge, CountBadge, PositionTag
│   ├── Modal.tsx             # Modal, Sheet, ConfirmDialog
│   ├── Toast.tsx             # Toast notification system
│   ├── Tabs.tsx              # Tabs, TabPanel, SegmentedControl
│   ├── Progress.tsx          # ProgressBar, CircularProgress, Steps
│   ├── Avatar.tsx            # Avatar, AvatarGroup, UserAvatar
│   ├── Stat.tsx              # Stat, StatGroup, StatCard, InlineStat
│   ├── Countdown.tsx         # Countdown, DraftTimer, SimpleTimer
│   ├── Switch.tsx            # Switch, SwitchGroup
│   ├── Menu.tsx              # Menu, ActionMenu
│   ├── Divider.tsx           # Divider, SectionHeader
│   ├── EmptyState.tsx        # EmptyState presets
│   ├── PositionBadge.tsx     # Position indicator
│   ├── TeamLogo.tsx          # NFL team logo with fallback
│   ├── LoadingSpinner.tsx    # Loading & skeleton components
│   └── ErrorBoundary.tsx     # Error handling
├── hooks/                     # Custom React hooks
│   ├── index.ts              # Central export
│   ├── useTimer.ts           # Countdown timer
│   ├── useAutoScroll.ts      # Auto-scroll behavior
│   └── useLocalStorage.ts    # Persistent state
├── testing/                   # Testing utilities
│   ├── index.ts              # Central export
│   └── mockData.ts           # Mock data generators
├── mobile/                    # Mobile-first components
│   ├── draft/                 # Draft room components
│   ├── navigation/           # Navigation components
│   ├── app/                  # App-level components
│   └── shared/               # Mobile-specific shared
└── desktop/                   # Desktop adaptations (future)
```

---

## Shared Component Library (60+ components)

### Buttons

```tsx
import { Button, IconButton } from '@/components/vx';

// Variants: primary, secondary, ghost, danger
<Button variant="primary" size="md" onClick={handleClick}>
  Draft Player
</Button>

<Button variant="secondary" disabled>Loading...</Button>

<Button variant="danger" fullWidth>Delete</Button>

<IconButton
  icon={<PlusIcon />}
  variant="ghost"
  size="sm"
  aria-label="Add to queue"
/>
```

### Inputs

```tsx
import { Input, SearchInput, Select, Textarea } from '@/components/vx';

<Input
  label="Username"
  value={value}
  onChange={setValue}
  error="Username is required"
/>

<SearchInput
  value={search}
  onChange={setSearch}
  placeholder="Search players..."
  onClear={() => setSearch('')}
/>

<Select
  value={position}
  onChange={setPosition}
  options={[
    { value: 'all', label: 'All Positions' },
    { value: 'QB', label: 'Quarterback' },
  ]}
/>
```

### Cards

```tsx
import { Card, CardHeader, CardFooter } from '@/components/vx';

<Card variant="elevated" onClick={handleClick}>
  <CardHeader 
    title="Player Stats" 
    action={<IconButton icon={<CloseIcon />} />}
  />
  <div className="p-4">{content}</div>
  <CardFooter>
    <Button>View More</Button>
  </CardFooter>
</Card>
```

### Badges

```tsx
import { Badge, StatusBadge, CountBadge, PositionTag } from '@/components/vx';

<Badge variant="success">Active</Badge>
<StatusBadge status="warning" label="Pending" />
<CountBadge count={5} max={99} />
<PositionTag position="QB" size="md" />
```

### Modals & Overlays

```tsx
import { Modal, Sheet, ConfirmDialog, useToast } from '@/components/vx';

<Modal isOpen={isOpen} onClose={onClose} title="Player Details">
  {content}
</Modal>

<Sheet 
  isOpen={isOpen} 
  onClose={onClose} 
  position="bottom"
  height="80vh"
>
  {content}
</Sheet>

<ConfirmDialog
  isOpen={showConfirm}
  title="Remove from queue?"
  message="This action cannot be undone."
  onConfirm={handleRemove}
  onCancel={() => setShowConfirm(false)}
  confirmLabel="Remove"
  confirmVariant="danger"
/>

// Toast notifications
const { showToast } = useToast();
showToast({ type: 'success', message: 'Player drafted!' });
```

### Navigation

```tsx
import { Tabs, TabPanel, SegmentedControl } from '@/components/vx';

<Tabs
  tabs={[
    { id: 'players', label: 'Players', badge: 3 },
    { id: 'queue', label: 'Queue' },
  ]}
  activeTab={activeTab}
  onChange={setActiveTab}
  variant="underline"
/>

<TabPanel tabId="players" activeTab={activeTab}>
  <PlayerList />
</TabPanel>

<SegmentedControl
  options={[
    { value: 'all', label: 'All' },
    { value: 'qb', label: 'QB' },
    { value: 'rb', label: 'RB' },
  ]}
  value={filter}
  onChange={setFilter}
  fullWidth
/>
```

### Progress Indicators

```tsx
import { ProgressBar, CircularProgress, DraftProgress, Steps } from '@/components/vx';

<ProgressBar value={75} showLabel labelPosition="top" />

<CircularProgress value={50} size={64} showValue />

<DraftProgress 
  currentPick={25} 
  totalPicks={216} 
  currentRound={3} 
  totalRounds={18} 
/>

<Steps 
  steps={[
    { label: 'Queue' },
    { label: 'Draft', completed: true },
    { label: 'Review' },
  ]}
  currentStep={1}
/>
```

### Statistics Display

```tsx
import { Stat, StatGroup, StatCard, StatList } from '@/components/vx';

<Stat label="ADP" value="2.4" trend="up" trendValue="+5" />

<StatGroup
  stats={[
    { label: 'Points', value: '285.4' },
    { label: 'Rank', value: '3', sublabel: 'of 12' },
  ]}
  direction="row"
/>

<StatCard
  label="Projected"
  value="1,820"
  icon={<ChartIcon />}
  trend="up"
  trendValue="+12%"
/>
```

### Countdown & Timers

```tsx
import { Countdown, DraftTimer, SimpleTimer } from '@/components/vx';

<Countdown
  seconds={120}
  format="compact"  // 'full' | 'compact' | 'minimal'
  warningThreshold={30}
  dangerThreshold={10}
  onComplete={() => console.log('Time up!')}
/>

<DraftTimer 
  seconds={25} 
  isUserTurn 
  showRing 
  totalTime={30} 
/>

<SimpleTimer seconds={45} size="xl" />
```

### Avatars

```tsx
import { Avatar, AvatarGroup, UserAvatar } from '@/components/vx';

<Avatar 
  name="John Doe" 
  src="/profile.jpg" 
  size="md" 
  status="online" 
/>

<AvatarGroup 
  avatars={[
    { name: 'User 1' },
    { name: 'User 2' },
    { name: 'User 3' },
  ]} 
  max={3}
/>

<UserAvatar size="lg" />  // Default user icon fallback
```

### Layout Utilities

```tsx
import { Divider, SectionHeader, Menu } from '@/components/vx';

<Divider label="Or" variant="dashed" />

<SectionHeader 
  title="Your Queue" 
  action={<Button size="sm">Clear</Button>} 
/>

<Menu
  trigger={<IconButton icon={<MoreIcon />} />}
  items={[
    { id: 'edit', label: 'Edit', icon: <EditIcon /> },
    { id: 'delete', label: 'Delete', destructive: true },
  ]}
  onSelect={handleAction}
/>
```

### Form Controls

```tsx
import { Switch, SwitchGroup } from '@/components/vx';

<Switch
  checked={autopick}
  onChange={setAutopick}
  label="Autopick"
  description="Automatically select best available player"
/>

<SwitchGroup
  items={[
    { id: 'notifications', label: 'Notifications', checked: true },
    { id: 'sounds', label: 'Sound Effects', checked: false },
  ]}
  onChange={(id, checked) => handleToggle(id, checked)}
/>
```

### Empty States

```tsx
import { EmptyState, EmptyQueue, NoPlayers, ErrorState } from '@/components/vx';

<EmptyState
  icon={<SearchIcon />}
  title="No results found"
  description="Try adjusting your search"
  action={<Button>Clear Search</Button>}
/>

<EmptyQueue />  // Pre-built queue empty state
<NoPlayers />   // Pre-built no players state
<ErrorState message="Something went wrong" onRetry={retry} />
```

### Loading & Errors

```tsx
import { LoadingSpinner, Skeleton, ErrorBoundary } from '@/components/vx';

<LoadingSpinner size="lg" text="Loading players..." />

<Skeleton width="100%" height="40px" />
<Skeleton variant="circle" size={48} />

<ErrorBoundary componentName="PlayerList" fallback={<ErrorState />}>
  <PlayerList />
</ErrorBoundary>
```

---

## Constants

### Colors

```typescript
import { POSITION_COLORS, BG_COLORS, TEXT_COLORS, UI_COLORS, BRAND_COLORS } from '@/components/vx';

// Position colors (LOCKED - do not change)
POSITION_COLORS.QB  // '#F472B6' (pink)
POSITION_COLORS.RB  // '#0fba80' (green)
POSITION_COLORS.WR  // '#FBBF25' (gold)
POSITION_COLORS.TE  // '#7C3AED' (purple)

// Background colors
BG_COLORS.primary   // '#101927'
BG_COLORS.secondary // '#1a2332'
BG_COLORS.card      // '#1f2833'
BG_COLORS.elevated  // '#2a3441'

// Text colors
TEXT_COLORS.primary   // '#ffffff'
TEXT_COLORS.secondary // '#9ca3af'
TEXT_COLORS.muted     // '#6b7280'

// UI colors
UI_COLORS.success   // '#10B981'
UI_COLORS.warning   // '#F59E0B'
UI_COLORS.error     // '#EF4444'
UI_COLORS.info      // '#3B82F6'
```

### Sizes & Typography

```typescript
import { MOBILE, FONT_SIZE, SPACING, TOUCH_TARGETS } from '@/components/vx';

// Mobile-first sizes
MOBILE.playerCard.height  // '40px'
MOBILE.picksBar.height    // '160px'

// Semantic font sizes
FONT_SIZE.playerName     // '13px'
FONT_SIZE.playerTeam     // '11px'
FONT_SIZE.columnHeader   // '12px'
FONT_SIZE.timer          // '48px'

// Touch targets
TOUCH_TARGETS.min        // '44px' (iOS minimum)
TOUCH_TARGETS.comfort    // '48px'
```

### Animations

```typescript
import { DURATION, EASING, TRANSITION } from '@/components/vx';

DURATION.fast       // '150ms'
DURATION.normal     // '200ms'
DURATION.slow       // '300ms'

EASING.easeOut      // 'cubic-bezier(0, 0, 0.2, 1)'
EASING.easeInOut    // 'cubic-bezier(0.4, 0, 0.2, 1)'

TRANSITION.default  // 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)'
TRANSITION.fast     // 'all 150ms cubic-bezier(0, 0, 0.2, 1)'
```

---

## Custom Hooks

### useTimer

```typescript
import { useTimer } from '@/components/vx';

const { time, isRunning, start, pause, reset } = useTimer({
  initialTime: 30,
  onComplete: () => console.log('Time up!'),
  autoStart: true,
});
```

### useAutoScroll

```typescript
import { useAutoScroll } from '@/components/vx';

const { containerRef, scrollTo, scrollToElement } = useAutoScroll({
  behavior: 'smooth',
});

// Scroll to specific pick
scrollToElement(`[data-pick="${currentPick}"]`);
```

### useLocalStorage

```typescript
import { useLocalStorage } from '@/components/vx';

const [sortOrder, setSortOrder] = useLocalStorage('draft-sort', 'asc');
const [queue, setQueue] = useLocalStorage<Player[]>('player-queue', []);
```

---

## Utilities

```typescript
import { 
  formatPlayerName, 
  formatPlayerNameShort,
  formatPickNumber,
  formatADP,
  formatProjection,
  getByeWeek,
  truncate,
  getParticipantForPick,
} from '@/components/vx';

formatPlayerName('Patrick Mahomes');      // 'Patrick Mahomes'
formatPlayerNameShort('Patrick Mahomes'); // 'P. Mahomes'
formatPickNumber(13, 12);                 // '2.01'
formatADP(2.45);                          // '2.5'
formatProjection(285.67);                 // '285.7'
getByeWeek('KC');                         // 6
truncate('Long Name Here', 10);           // 'Long Name...'
getParticipantForPick(25, 12);            // 0 (participant index)
```

---

## Best Practices

### Use Shared Components

```tsx
// Bad - inline styling
<button className="bg-blue-500 text-white px-4 py-2 rounded">
  Draft
</button>

// Good - use shared Button
<Button variant="primary">Draft</Button>
```

### Use Constants

```tsx
// Bad - magic values
<div style={{ fontSize: '13px', color: '#9ca3af' }}>

// Good - semantic constants
<div style={{ fontSize: FONT_SIZE.playerName, color: TEXT_COLORS.secondary }}>
```

### Use Flexbox

```tsx
// Bad - absolute positioning
<div className="relative">
  <div className="absolute" style={{ right: '92px' }}>Queue</div>
</div>

// Good - flexbox layout
<div className="flex items-center">
  <div className="flex-1">Player Info</div>
  <div className="w-10 text-center">Queue</div>
</div>
```

### Add Accessibility

```tsx
<Button 
  onClick={handleClick}
  aria-label="Add player to queue"
  aria-pressed={isQueued}
>
  {isQueued ? 'Queued' : 'Queue'}
</Button>
```

### Memoize Components

```tsx
const PlayerRow = React.memo(function PlayerRow({ player, onDraft }) {
  return (
    <div>...</div>
  );
});
```

---

## Testing

### Demo Pages

- **Original**: http://localhost:3000/testing-grounds/mobile-apple-demo
- **VX**: http://localhost:3000/testing-grounds/vx-mobile-demo
- **VX App**: http://localhost:3000/testing-grounds/vx-mobile-app-demo

### Mock Data

```typescript
import { 
  createMockPlayer, 
  createMockParticipants, 
  createMockPicks 
} from '@/components/vx/testing';

const player = createMockPlayer({ position: 'QB' });
const participants = createMockParticipants(12);
const picks = createMockPicks(24, participants);
```

---

## Rules

1. NEVER modify files in `components/draft/v3/mobile/apple/`
2. All new work happens in `components/vx/`
3. Keep both demos functional for comparison
4. Document any deviations from original behavior
5. Use TypeScript for all VX components
6. Import from central exports (not deep paths)
7. Use shared components instead of inline styling
8. Follow accessibility best practices

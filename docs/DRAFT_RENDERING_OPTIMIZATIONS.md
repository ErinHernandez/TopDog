# Draft Room Rendering Optimizations

**Date:** January 12, 2025  
**Status:** ✅ **UTILITIES CREATED**  
**File:** `lib/draft/renderingOptimizations.js`

---

## Overview

Utility functions and hooks for optimizing draft room rendering performance. Provides memoization, filtering, and sorting utilities optimized for large player lists.

---

## Features

### Memoization Hooks
- **useMemoizedPlayers** - Memoized player filtering and sorting
- **useMemoizedPicksByTeam** - Memoized picks grouping by team
- **useMemoizedAvailablePlayers** - Memoized available players calculation
- **useMemoizedTeamRoster** - Memoized team roster
- **useMemoizedCurrentPicker** - Memoized current picker calculation

### Callback Memoization
- **useMemoizedPickHandler** - Memoized pick handler
- **useMemoizedPlayerSelectHandler** - Memoized player select handler

### Performance Utilities
- **calculateVisibleRange** - Virtual scrolling helper
- **useDebounce** - Debounce utility for search/filter inputs
- **throttle** - Throttle utility for scroll/resize events

---

## Usage

### Player Filtering and Sorting

```javascript
import { useMemoizedPlayers } from '@/lib/draft/renderingOptimizations';

function DraftRoom() {
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState(['ALL']);
  const [sortBy, setSortBy] = useState('adp');
  const [sortDirection, setSortDirection] = useState('asc');

  // Memoized filtered and sorted players
  const filteredPlayers = useMemoizedPlayers(
    availablePlayers,
    filters,
    search,
    sortBy,
    sortDirection
  );

  return (
    <div>
      {filteredPlayers.map(player => (
        <PlayerCard key={player.name} player={player} />
      ))}
    </div>
  );
}
```

### Picks Grouping

```javascript
import { useMemoizedPicksByTeam } from '@/lib/draft/renderingOptimizations';

function DraftBoard() {
  const picksByTeam = useMemoizedPicksByTeam(picks, draftOrder);

  return (
    <div>
      {draftOrder.map(team => (
        <TeamColumn key={team} team={team} picks={picksByTeam[team]} />
      ))}
    </div>
  );
}
```

### Available Players

```javascript
import { useMemoizedAvailablePlayers } from '@/lib/draft/renderingOptimizations';

function PlayerList() {
  const availablePlayers = useMemoizedAvailablePlayers(PLAYER_POOL, picks);

  return (
    <div>
      {availablePlayers.map(player => (
        <PlayerCard key={player.name} player={player} />
      ))}
    </div>
  );
}
```

### Debounced Search

```javascript
import { useDebounce } from '@/lib/draft/renderingOptimizations';

function SearchInput() {
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 300);

  const filteredPlayers = useMemoizedPlayers(
    players,
    filters,
    debouncedSearch, // Use debounced value
    sortBy,
    sortDirection
  );

  return (
    <input
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
      placeholder="Search players..."
    />
  );
}
```

### Memoized Handlers

```javascript
import { useMemoizedPickHandler } from '@/lib/draft/renderingOptimizations';

function PlayerCard({ player, onPick, isMyTurn }) {
  const handlePick = useMemoizedPickHandler(onPick, [isMyTurn]);

  return (
    <button onClick={() => handlePick(player)} disabled={!isMyTurn}>
      {player.name}
    </button>
  );
}
```

---

## React.memo Examples

### Player Card Component

```javascript
import React from 'react';

const PlayerCard = React.memo(({ player, onSelect, isSelected }) => {
  return (
    <div
      onClick={() => onSelect(player)}
      className={isSelected ? 'selected' : ''}
    >
      <div>{player.name}</div>
      <div>{player.position}</div>
      <div>{player.team}</div>
      <div>{player.adp}</div>
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison - only re-render if these change
  return (
    prevProps.player.name === nextProps.player.name &&
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.player.adp === nextProps.player.adp
  );
});

PlayerCard.displayName = 'PlayerCard';
export default PlayerCard;
```

### Pick Item Component

```javascript
import React from 'react';

const PickItem = React.memo(({ pick, round, team }) => {
  return (
    <div className="pick-item">
      <span>{pick.pickNumber}</span>
      <span>{pick.player.name}</span>
      <span>{pick.player.position}</span>
    </div>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.pick.pickNumber === nextProps.pick.pickNumber &&
    prevProps.pick.player.name === nextProps.pick.player.name
  );
});

PickItem.displayName = 'PickItem';
export default PickItem;
```

---

## Virtual Scrolling Example

```javascript
import { calculateVisibleRange } from '@/lib/draft/renderingOptimizations';

function VirtualizedPlayerList({ players, containerHeight }) {
  const [scrollTop, setScrollTop] = useState(0);
  const itemHeight = 60; // Height of each player card
  const overscan = 5;

  const { startIndex, endIndex, visibleItems } = calculateVisibleRange(
    scrollTop,
    itemHeight,
    containerHeight,
    players.length,
    overscan
  );

  const visiblePlayers = players.slice(startIndex, endIndex + 1);
  const totalHeight = players.length * itemHeight;
  const offsetY = startIndex * itemHeight;

  return (
    <div
      style={{ height: containerHeight, overflow: 'auto' }}
      onScroll={(e) => setScrollTop(e.target.scrollTop)}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div style={{ transform: `translateY(${offsetY}px)` }}>
          {visiblePlayers.map((player, index) => (
            <PlayerCard
              key={player.name}
              player={player}
              style={{ height: itemHeight }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
```

---

## Lazy Loading Example

```javascript
import dynamic from 'next/dynamic';

// Lazy load heavy components
const DraftBoard = dynamic(() => import('@/components/DraftBoard'), {
  loading: () => <div>Loading draft board...</div>,
  ssr: false, // Disable SSR if not needed
});

const PlayerModal = dynamic(() => import('@/components/PlayerModal'), {
  loading: () => <div>Loading player details...</div>,
});

function DraftRoom() {
  const [showBoard, setShowBoard] = useState(false);
  const [showModal, setShowModal] = useState(false);

  return (
    <div>
      <button onClick={() => setShowBoard(true)}>Show Board</button>
      {showBoard && <DraftBoard />}

      <button onClick={() => setShowModal(true)}>Show Modal</button>
      {showModal && <PlayerModal />}
    </div>
  );
}
```

---

## Optimization Checklist

### ✅ Completed (Utilities Created)
- [x] Created memoization hooks for players, picks, and rosters
- [x] Created debounce utility for search
- [x] Created throttle utility for events
- [x] Created virtual scrolling helper
- [x] Created callback memoization utilities
- [x] Documented React.memo patterns

### ⏳ Pending (Integration)
- [ ] Apply React.memo to PlayerCard component
- [ ] Apply React.memo to PickItem component
- [ ] Apply useMemoizedPlayers to draft room
- [ ] Apply useMemoizedPicksByTeam to draft board
- [ ] Apply useDebounce to search input
- [ ] Apply virtual scrolling to player list (if 100+ items)
- [ ] Lazy load DraftBoard component
- [ ] Lazy load PlayerModal component
- [ ] Test performance improvements
- [ ] Measure render times before/after

---

## Performance Guidelines

### When to Use React.memo
- ✅ Component renders frequently with same props
- ✅ Component is expensive to render
- ✅ Component receives complex props (objects, arrays)
- ❌ Component renders with different props each time
- ❌ Component is already fast (< 1ms render time)

### When to Use useMemo
- ✅ Expensive computations (filtering, sorting large arrays)
- ✅ Derived values from props/state
- ✅ Objects/arrays passed to memoized children
- ❌ Simple calculations
- ❌ Values that change every render anyway

### When to Use useCallback
- ✅ Functions passed to memoized children
- ✅ Functions used in useEffect dependencies
- ❌ Functions that change every render anyway
- ❌ Functions only used in current component

### When to Use Virtual Scrolling
- ✅ Lists with 100+ items
- ✅ Items have consistent height
- ✅ Scrollable container with fixed height
- ❌ Small lists (< 50 items)
- ❌ Items have variable heights (complex layout)

### When to Use Debounce
- ✅ Search inputs
- ✅ Filter inputs
- ✅ Inputs that trigger expensive operations
- ❌ Inputs with simple operations
- ❌ Inputs that need immediate feedback

---

## Performance Metrics

### Target Metrics
- **Initial render:** < 100ms
- **Re-render after pick:** < 50ms
- **Search filter:** < 16ms (60fps)
- **Scroll performance:** 60fps

### Measurement Tools
- React DevTools Profiler
- Chrome DevTools Performance tab
- `console.time()` / `console.timeEnd()`
- React Component Profiling

---

## Related Documentation

- `lib/draft/renderingOptimizations.js` - Implementation
- `pages/draft/topdog/[roomId].js` - Draft room component
- React Performance Optimization Guide
- React.memo Documentation
- Virtual Scrolling Guide

---

**Implementation Date:** January 12, 2025  
**Status:** ✅ **UTILITIES CREATED** - Ready for integration

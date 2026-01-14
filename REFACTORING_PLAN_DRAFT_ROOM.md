# Draft Room Refactoring Plan — Refined

**Target File:** `pages/draft/topdog/[roomId].js` (4,860 lines)  
**Goal:** Extract into maintainable, testable modules  
**Realistic Time:** 30-45 hours  
**Priority:** Critical (this is your core product)

---

## What the Original Plan Gets Right

The original plan correctly identifies:
- The file is too large (4,860 lines)
- It needs to be split into hooks, services, and components
- TypeScript conversion is needed
- Testing is essential

The architecture proposed is sound. The issues are in **execution details** and **risk management**.

---

## What the Original Plan Gets Wrong

### Problem 1: No Rollback Strategy

The original plan proposes 4 phases over 4 weeks with no way to roll back if something breaks. Draft rooms are your **core product**. Breaking them during a refactor is unacceptable.

**Fix:** Use feature flags and parallel implementations.

### Problem 2: TypeScript Conversion at the End

The original plan puts TypeScript conversion in Phase 4 (Week 4). This means you spend 3 weeks writing JavaScript that you'll immediately rewrite.

**Fix:** Write TypeScript from the start. The types catch bugs during extraction.

### Problem 3: No State Management Strategy

The file has 30+ useState calls. The plan extracts hooks but doesn't address how state will be shared between them. You'll end up with prop drilling or broken state.

**Fix:** Introduce a DraftRoomContext early, or use a state machine (XState) for complex draft logic.

### Problem 4: Missing Error Boundaries

The draft room handles real-time data, timers, and transactions. Any of these can fail. The plan doesn't include error boundaries.

**Fix:** Add error boundary before extraction begins.

### Problem 5: Underestimated Time

The original estimates 20-30 hours. This is optimistic for a 4,860-line file with real-time Firebase listeners, transactions, and complex UI.

**Fix:** Realistic estimate is 30-45 hours including testing.

### Problem 6: Testing After Extraction

The plan shows testing as a checklist item at the end of each phase. By then, you've already shipped potentially broken code.

**Fix:** Write tests for the existing behavior BEFORE extraction. Then extract and verify tests still pass.

---

## Revised Architecture

```
pages/draft/topdog/
├── [roomId].tsx                    # ~50 lines (routing only)
│
├── context/
│   └── DraftRoomContext.tsx        # ~200 lines (all shared state)
│
├── hooks/
│   ├── useDraftSocket.ts           # ~150 lines (Firebase listeners)
│   ├── useDraftTimer.ts            # ~100 lines (timer logic)
│   ├── useDraftActions.ts          # ~120 lines (pick, autopick)
│   ├── useDraftQueue.ts            # ~80 lines (queue management)
│   └── usePlayerFilters.ts         # ~60 lines (filtering/sorting)
│
├── components/
│   ├── DraftRoomLayout.tsx         # ~150 lines (main layout)
│   ├── DraftBoard/
│   │   ├── index.tsx               # ~100 lines
│   │   └── PickCard.tsx            # ~80 lines
│   ├── PlayerList/
│   │   ├── index.tsx               # ~120 lines
│   │   └── PlayerCard.tsx          # ~100 lines
│   ├── DraftHeader.tsx             # ~80 lines (timer, current pick)
│   ├── TeamRoster.tsx              # ~100 lines
│   └── DraftErrorBoundary.tsx      # ~80 lines
│
├── services/
│   ├── draftPickService.ts         # ~100 lines (Firebase transactions)
│   └── draftValidationService.ts   # ~60 lines (pure functions)
│
└── types/
    └── draft.ts                    # ~80 lines (shared types)

Total: ~1,700 lines across 18 files (65% reduction)
```

**Key Difference from Original:** Context-first architecture. All state lives in `DraftRoomContext`, hooks consume and dispatch to it.

---

## Revised Phase Plan

### Phase 0: Safety Net (Day 1) — 4 hours

Before touching any code, establish safety measures.

**Tasks:**

1. **Add Error Boundary**
```typescript
// components/DraftErrorBoundary.tsx
export class DraftErrorBoundary extends Component<Props, State> {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logger.error('Draft room error', error, {
      componentStack: errorInfo.componentStack,
      roomId: this.props.roomId,
    });
    Sentry.captureException(error);
  }

  render() {
    if (this.state.hasError) {
      return <DraftErrorFallback error={this.state.error} roomId={this.props.roomId} />;
    }
    return this.props.children;
  }
}
```

2. **Wrap Existing Component**
```javascript
// pages/draft/topdog/[roomId].js (temporary change)
import { DraftErrorBoundary } from './components/DraftErrorBoundary';

export default function DraftRoomPage() {
  // ... existing code
  return (
    <DraftErrorBoundary roomId={roomId}>
      {/* existing 4,800 lines of JSX */}
    </DraftErrorBoundary>
  );
}
```

3. **Add Feature Flag**
```typescript
// lib/featureFlags.ts
export const FEATURE_FLAGS = {
  USE_REFACTORED_DRAFT_ROOM: process.env.NEXT_PUBLIC_USE_NEW_DRAFT_ROOM === 'true',
};
```

4. **Create Parallel Route**
```typescript
// pages/draft/topdog/[roomId].tsx (new file)
import { FEATURE_FLAGS } from '@/lib/featureFlags';
import { DraftRoomLegacy } from './DraftRoomLegacy';
import { DraftRoomNew } from './DraftRoomNew';

export default function DraftRoomPage() {
  const router = useRouter();
  const { roomId } = router.query;

  if (FEATURE_FLAGS.USE_REFACTORED_DRAFT_ROOM) {
    return <DraftRoomNew roomId={roomId as string} />;
  }

  return <DraftRoomLegacy roomId={roomId as string} />;
}
```

**Deliverable:** Error boundary in production, feature flag ready, parallel route structure.

---

### Phase 1: Types and Context (Days 2-3) — 8 hours

Define the contract before extracting code.

**Task 1: Create Type Definitions**

```typescript
// types/draft.ts

export interface Player {
  name: string;
  position: 'QB' | 'RB' | 'WR' | 'TE';
  team: string;
  adp: number;
  bye: number;
}

export interface DraftPick {
  pickNumber: number;
  round: number;
  user: string;
  player: string;
  timestamp: Timestamp;
}

export interface DraftSettings {
  timerSeconds: number;
  totalRounds: number;
  maxParticipants: number;
}

export interface DraftRoom {
  id: string;
  status: 'waiting' | 'active' | 'paused' | 'completed';
  currentPick: number;
  participants: string[];
  draftOrder: string[];
  settings: DraftSettings;
  createdAt: Timestamp;
  startedAt?: Timestamp;
  completedAt?: Timestamp;
}

export interface DraftState {
  // Connection
  isConnected: boolean;
  isLoading: boolean;
  error: Error | null;

  // Room data
  room: DraftRoom | null;
  picks: DraftPick[];
  availablePlayers: Player[];

  // User state
  currentUser: string;
  isMyTurn: boolean;
  myPicks: DraftPick[];

  // Timer
  timer: number;
  isInGracePeriod: boolean;

  // Queue
  queue: Player[];

  // UI state
  selectedPlayer: Player | null;
  filters: {
    search: string;
    positions: string[];
    sortBy: 'adp' | 'rank';
    sortDirection: 'asc' | 'desc';
  };
}

export type DraftAction =
  | { type: 'SET_ROOM'; payload: DraftRoom }
  | { type: 'SET_PICKS'; payload: DraftPick[] }
  | { type: 'ADD_PICK'; payload: DraftPick }
  | { type: 'SET_TIMER'; payload: number }
  | { type: 'TICK_TIMER' }
  | { type: 'SET_QUEUE'; payload: Player[] }
  | { type: 'ADD_TO_QUEUE'; payload: Player }
  | { type: 'REMOVE_FROM_QUEUE'; payload: string }
  | { type: 'SET_FILTERS'; payload: Partial<DraftState['filters']> }
  | { type: 'SELECT_PLAYER'; payload: Player | null }
  | { type: 'SET_ERROR'; payload: Error | null }
  | { type: 'SET_LOADING'; payload: boolean };
```

**Task 2: Create Context with Reducer**

```typescript
// context/DraftRoomContext.tsx

import { createContext, useContext, useReducer, ReactNode } from 'react';
import { DraftState, DraftAction } from '../types/draft';

const initialState: DraftState = {
  isConnected: false,
  isLoading: true,
  error: null,
  room: null,
  picks: [],
  availablePlayers: [],
  currentUser: '',
  isMyTurn: false,
  myPicks: [],
  timer: 30,
  isInGracePeriod: false,
  queue: [],
  selectedPlayer: null,
  filters: {
    search: '',
    positions: [],
    sortBy: 'adp',
    sortDirection: 'asc',
  },
};

function draftReducer(state: DraftState, action: DraftAction): DraftState {
  switch (action.type) {
    case 'SET_ROOM':
      return {
        ...state,
        room: action.payload,
        isLoading: false,
      };

    case 'SET_PICKS':
      return {
        ...state,
        picks: action.payload,
        availablePlayers: state.availablePlayers.filter(
          (p) => !action.payload.some((pick) => pick.player === p.name)
        ),
      };

    case 'ADD_PICK':
      return {
        ...state,
        picks: [...state.picks, action.payload],
        availablePlayers: state.availablePlayers.filter(
          (p) => p.name !== action.payload.player
        ),
        // Auto-remove from queue if picked
        queue: state.queue.filter((p) => p.name !== action.payload.player),
      };

    case 'TICK_TIMER':
      return {
        ...state,
        timer: Math.max(0, state.timer - 1),
      };

    case 'SET_TIMER':
      return {
        ...state,
        timer: action.payload,
        isInGracePeriod: false,
      };

    case 'ADD_TO_QUEUE':
      if (state.queue.some((p) => p.name === action.payload.name)) {
        return state; // Already in queue
      }
      return {
        ...state,
        queue: [...state.queue, action.payload],
      };

    case 'REMOVE_FROM_QUEUE':
      return {
        ...state,
        queue: state.queue.filter((p) => p.name !== action.payload),
      };

    case 'SET_FILTERS':
      return {
        ...state,
        filters: { ...state.filters, ...action.payload },
      };

    case 'SELECT_PLAYER':
      return {
        ...state,
        selectedPlayer: action.payload,
      };

    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
        isLoading: false,
      };

    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };

    default:
      return state;
  }
}

interface DraftRoomContextValue {
  state: DraftState;
  dispatch: React.Dispatch<DraftAction>;
}

const DraftRoomContext = createContext<DraftRoomContextValue | null>(null);

export function DraftRoomProvider({
  children,
  initialUser,
}: {
  children: ReactNode;
  initialUser: string;
}) {
  const [state, dispatch] = useReducer(draftReducer, {
    ...initialState,
    currentUser: initialUser,
  });

  return (
    <DraftRoomContext.Provider value={{ state, dispatch }}>
      {children}
    </DraftRoomContext.Provider>
  );
}

export function useDraftRoom() {
  const context = useContext(DraftRoomContext);
  if (!context) {
    throw new Error('useDraftRoom must be used within DraftRoomProvider');
  }
  return context;
}

// Convenience selectors
export function useDraftState() {
  return useDraftRoom().state;
}

export function useDraftDispatch() {
  return useDraftRoom().dispatch;
}
```

**Deliverable:** Type definitions and context that can hold all draft state.

---

### Phase 2: Extract Hooks (Days 4-7) — 12 hours

Extract logic from the monolith into hooks that use the context.

**Order matters:** Extract in dependency order.

1. **useDraftSocket** (Firebase listeners) — First, because everything depends on data
2. **useDraftTimer** (Timer logic) — Independent, can test in isolation
3. **useDraftActions** (Pick submission) — Depends on socket data
4. **useDraftQueue** (Queue management) — Depends on picks data
5. **usePlayerFilters** (Filtering) — Pure computation, no dependencies

**Example: useDraftSocket with Context Integration**

```typescript
// hooks/useDraftSocket.ts

import { useEffect } from 'react';
import { doc, collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useDraftDispatch } from '../context/DraftRoomContext';
import { DraftRoom, DraftPick } from '../types/draft';
import { logger } from '@/lib/logger';

export function useDraftSocket(roomId: string) {
  const dispatch = useDraftDispatch();

  // Room listener
  useEffect(() => {
    if (!roomId) return;

    logger.info('Connecting to draft room', { roomId });

    const unsubRoom = onSnapshot(
      doc(db, 'draftRooms', roomId),
      (snapshot) => {
        if (!snapshot.exists()) {
          dispatch({ type: 'SET_ERROR', payload: new Error('Room not found') });
          return;
        }

        const room = { id: snapshot.id, ...snapshot.data() } as DraftRoom;
        dispatch({ type: 'SET_ROOM', payload: room });
      },
      (error) => {
        logger.error('Room listener error', error, { roomId });
        dispatch({ type: 'SET_ERROR', payload: error });
      }
    );

    return () => {
      logger.info('Disconnecting from draft room', { roomId });
      unsubRoom();
    };
  }, [roomId, dispatch]);

  // Picks listener
  useEffect(() => {
    if (!roomId) return;

    const picksQuery = query(
      collection(db, 'draftRooms', roomId, 'picks'),
      orderBy('pickNumber')
    );

    const unsubPicks = onSnapshot(
      picksQuery,
      (snapshot) => {
        const picks = snapshot.docs.map((doc) => ({
          ...doc.data(),
          id: doc.id,
        })) as DraftPick[];
        dispatch({ type: 'SET_PICKS', payload: picks });
      },
      (error) => {
        logger.error('Picks listener error', error, { roomId });
        // Don't set error for picks - room error is enough
      }
    );

    return () => unsubPicks();
  }, [roomId, dispatch]);
}
```

**Critical: Test Each Hook Before Moving On**

```typescript
// __tests__/hooks/useDraftTimer.test.ts

import { renderHook, act } from '@testing-library/react';
import { DraftRoomProvider } from '../context/DraftRoomContext';
import { useDraftTimer } from '../hooks/useDraftTimer';

const wrapper = ({ children }) => (
  <DraftRoomProvider initialUser="testUser">{children}</DraftRoomProvider>
);

describe('useDraftTimer', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('counts down when active', () => {
    const onExpire = jest.fn();
    const { result } = renderHook(
      () => useDraftTimer({ isActive: true, onExpire }),
      { wrapper }
    );

    expect(result.current.timer).toBe(30);

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(result.current.timer).toBe(29);
  });

  it('calls onExpire when timer reaches 0', () => {
    const onExpire = jest.fn();
    renderHook(
      () => useDraftTimer({ isActive: true, onExpire, initialSeconds: 2 }),
      { wrapper }
    );

    act(() => {
      jest.advanceTimersByTime(3000);
    });

    expect(onExpire).toHaveBeenCalledTimes(1);
  });

  it('pauses when isPaused is true', () => {
    const { result, rerender } = renderHook(
      ({ isPaused }) => useDraftTimer({ isActive: true, isPaused, onExpire: jest.fn() }),
      { wrapper, initialProps: { isPaused: false } }
    );

    act(() => {
      jest.advanceTimersByTime(1000);
    });
    expect(result.current.timer).toBe(29);

    rerender({ isPaused: true });

    act(() => {
      jest.advanceTimersByTime(5000);
    });
    expect(result.current.timer).toBe(29); // Should not have changed
  });
});
```

**Deliverable:** 5 hooks extracted, each with tests passing.

---

### Phase 3: Extract Components (Days 8-11) — 10 hours

With state in context and logic in hooks, components become simple.

**Component Extraction Order:**

1. **DraftHeader** (timer display, current pick) — Smallest, good warmup
2. **PlayerCard** (single player display) — Reused many times
3. **PlayerList** (list of players with filters) — Uses PlayerCard
4. **PickCard** (single pick display) — Reused in board
5. **DraftBoard** (horizontal scrolling picks) — Uses PickCard
6. **TeamRoster** (user's team) — Independent
7. **DraftRoomLayout** (orchestrates all) — Last

**Example: Stateless Component Using Context**

```typescript
// components/DraftHeader.tsx

import { useDraftState } from '../context/DraftRoomContext';

export function DraftHeader() {
  const { room, timer, isMyTurn, currentUser } = useDraftState();

  if (!room) return null;

  const currentPicker = room.draftOrder[(room.currentPick - 1) % room.draftOrder.length];
  const round = Math.ceil(room.currentPick / room.draftOrder.length);

  return (
    <header className="draft-header bg-gray-800 p-4 flex justify-between items-center">
      <div>
        <span className="text-gray-400">Round {round}</span>
        <span className="mx-2">•</span>
        <span className="text-gray-400">Pick {room.currentPick}</span>
      </div>

      <div className="text-center">
        <div className={`text-4xl font-bold ${timer <= 10 ? 'text-red-500' : 'text-white'}`}>
          {timer}
        </div>
        <div className="text-sm text-gray-400">
          {isMyTurn ? "Your Pick!" : `${currentPicker}'s turn`}
        </div>
      </div>

      <div className="text-right">
        <span className="text-gray-400">You: {currentUser}</span>
      </div>
    </header>
  );
}
```

**Deliverable:** 7 components extracted, rendering correctly.

---

### Phase 4: Integration and Testing (Days 12-14) — 8 hours

Wire everything together and verify.

**Task 1: Create New Draft Room Component**

```typescript
// DraftRoomNew.tsx

import { DraftRoomProvider } from './context/DraftRoomContext';
import { DraftErrorBoundary } from './components/DraftErrorBoundary';
import { DraftRoomLayout } from './components/DraftRoomLayout';
import { useDraftSocket } from './hooks/useDraftSocket';
import { useAuth } from '@/hooks/useAuth';

interface DraftRoomNewProps {
  roomId: string;
}

function DraftRoomContent({ roomId }: { roomId: string }) {
  // Initialize socket connection
  useDraftSocket(roomId);

  return <DraftRoomLayout />;
}

export function DraftRoomNew({ roomId }: DraftRoomNewProps) {
  const { user } = useAuth();

  if (!user) {
    return <div>Please sign in to join the draft</div>;
  }

  return (
    <DraftErrorBoundary roomId={roomId}>
      <DraftRoomProvider initialUser={user.displayName || user.uid}>
        <DraftRoomContent roomId={roomId} />
      </DraftRoomProvider>
    </DraftErrorBoundary>
  );
}
```

**Task 2: A/B Test with Feature Flag**

```typescript
// pages/draft/topdog/[roomId].tsx

export default function DraftRoomPage() {
  const router = useRouter();
  const { roomId, useNew } = router.query;

  // Allow override via query param for testing
  const useNewDraftRoom = useNew === 'true' || FEATURE_FLAGS.USE_REFACTORED_DRAFT_ROOM;

  if (useNewDraftRoom) {
    return <DraftRoomNew roomId={roomId as string} />;
  }

  return <DraftRoomLegacy roomId={roomId as string} />;
}
```

**Task 3: Manual Testing Checklist**

```markdown
## Draft Room Refactor QA Checklist

### Connection
- [ ] Room loads correctly
- [ ] Picks load correctly
- [ ] Real-time updates work (open 2 browsers)
- [ ] Reconnection works after disconnect

### Timer
- [ ] Timer counts down
- [ ] Timer pauses when room is paused
- [ ] Timer resets on new pick
- [ ] Auto-pick triggers when timer expires

### Picking
- [ ] Can select a player
- [ ] Can submit a pick
- [ ] Pick appears immediately
- [ ] Pick syncs to other users
- [ ] Cannot pick when not your turn
- [ ] Cannot pick already-picked player

### Queue
- [ ] Can add player to queue
- [ ] Queue persists on refresh
- [ ] Picked players removed from queue
- [ ] Can reorder queue (drag-drop)

### Filters
- [ ] Search works
- [ ] Position filter works
- [ ] Sorting works
- [ ] Filters combine correctly

### Error Handling
- [ ] Error boundary catches errors
- [ ] Can recover from errors
- [ ] Errors logged to Sentry
```

**Deliverable:** New draft room works identically to old one.

---

### Phase 5: Gradual Rollout (Days 15+) — 3 hours

**Rollout Strategy:**

1. **Internal testing** (Day 15): Team uses `?useNew=true`
2. **Beta users** (Day 16-17): Enable flag for 5% of users
3. **Gradual rollout** (Day 18-21): 25% → 50% → 100%
4. **Remove legacy** (Day 22+): Delete old code after 1 week at 100%

```typescript
// lib/featureFlags.ts

export function shouldUseNewDraftRoom(userId: string): boolean {
  // Deterministic rollout based on user ID
  const hash = simpleHash(userId);
  const rolloutPercentage = Number(process.env.NEW_DRAFT_ROOM_ROLLOUT || 0);
  return hash % 100 < rolloutPercentage;
}
```

---

## Revised Timeline

| Phase | Duration | Hours | Deliverable |
|-------|----------|-------|-------------|
| 0: Safety Net | Day 1 | 4h | Error boundary, feature flag, parallel route |
| 1: Types & Context | Days 2-3 | 8h | Type definitions, DraftRoomContext |
| 2: Extract Hooks | Days 4-7 | 12h | 5 hooks with tests |
| 3: Extract Components | Days 8-11 | 10h | 7 components |
| 4: Integration | Days 12-14 | 8h | Working new draft room |
| 5: Rollout | Days 15+ | 3h | Gradual deployment |

**Total: 45 hours over 3 weeks**

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Breaking draft during refactor | Feature flag, parallel implementation |
| State sync bugs | Context + reducer pattern, not prop drilling |
| Timer race conditions | Tests with fake timers |
| Firebase listener leaks | Cleanup in useEffect return |
| Lost picks | Transaction-based pick service (already exists) |
| Rollout issues | Gradual rollout with instant rollback |

---

## What to Remove from Original Plan

1. **"Test after each phase"** → Test DURING each phase, write tests first
2. **"TypeScript in Phase 4"** → TypeScript from Phase 1
3. **Directory structure in pages/** → Components should be in `components/`, not `pages/`
4. **Week-based phases** → Day-based with clear deliverables
5. **20-30 hour estimate** → 45 hours is realistic

---

## Success Criteria

| Metric | Target | How to Measure |
|--------|--------|----------------|
| Main file size | <100 lines | `wc -l pages/draft/topdog/[roomId].tsx` |
| Largest extracted file | <200 lines | `wc -l` on all new files |
| Test coverage (hooks) | >80% | Jest coverage report |
| Production errors | 0 increase | Sentry dashboard |
| User complaints | 0 | Support tickets |
| Rollout time | <1 week | Feature flag analytics |

---

**Document Status:** Refined and ready  
**Key Changes:** Context-first architecture, TypeScript from start, feature flag rollout  
**Realistic Timeline:** 3 weeks (45 hours)

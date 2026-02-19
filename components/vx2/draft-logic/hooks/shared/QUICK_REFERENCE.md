# Shared Hooks Quick Reference

Fast lookup for using the three shared hooks in draft room implementations.

## 1. useDraftStateMachine

**When to use:** Managing draft lifecycle (loading → connecting → active → completed)

```typescript
const sm = useDraftStateMachine({
  initialState: 'idle',
  onStateChange: (from, to) => console.log(`${from} → ${to}`),
});

if (sm.canTransition('loading')) {
  sm.transition('loading');
}

// Current state
sm.state // 'idle' | 'loading' | 'connecting' | 'active' | 'paused' | 'completing' | 'completed' | 'error'

// Check validity
sm.getTransitionError('invalid-state') // null or error message

// History
sm.history // All transitions with timestamps
sm.lastTransition // Most recent transition
```

**File:** `/components/vx2/draft-logic/hooks/shared/useDraftStateMachine.ts`

---

## 2. useStableCallback

**When to use:** Callbacks in timers, listeners, or effects with empty dependencies

```typescript
const handleTick = useCallback((seconds) => {
  console.log(`Timer: ${seconds}s`);
}, []);

const stable = useStableCallback(handleTick);

// Use in setInterval without recreating it
useEffect(() => {
  const id = setInterval(stable, 1000);
  return () => clearInterval(id);
}, []); // Empty! Interval only created once
```

**File:** `/components/vx2/draft-logic/hooks/shared/useStableCallback.ts`

---

## 3. useFirestoreSubscription

**When to use:** Real-time data from Firestore with auto-cleanup

```typescript
// Document
const { data: room, loading, error, retry } = useFirestoreSubscription({
  reference: doc(db, 'draftRooms', roomId),
  onError: (err) => console.error(err),
  debug: true,
});

// Collection
const { data: picks } = useFirestoreSubscription({
  reference: collection(db, 'draftRooms', roomId, 'picks'),
  constraints: [orderBy('pickNumber', 'desc'), limit(50)],
});

// Conditional (skip if not ready)
const { data: roster } = useFirestoreSubscription({
  reference: doc(db, 'draftRooms', roomId, 'rosters', rosterId),
  skip: !rosterId,
});

// With callback
const { data, retry } = useFirestoreSubscription({
  reference: docRef,
  onUpdate: (data) => console.log('New data:', data),
  onError: (err) => showError(err.message),
});
```

**File:** `/components/vx2/draft-logic/hooks/shared/useFirestoreSubscription.ts`

---

## Common Usage Patterns

### Pattern 1: Complete Draft Setup

```typescript
// Manage lifecycle
const sm = useDraftStateMachine();

// Load room
const { data: room } = useFirestoreSubscription({
  reference: doc(db, 'draftRooms', roomId),
});

// Stable callbacks
const handleExpire = useStableCallback(() => {
  // Auto-pick logic
});

// Transition when ready
useEffect(() => {
  if (room && sm.canTransition('active')) {
    sm.transition('active');
  }
}, [room, sm]);
```

### Pattern 2: Timer with Real-time Sync

```typescript
const handleTick = useCallback(() => {}, []);
const stableTick = useStableCallback(handleTick);

const { data: timerData } = useFirestoreSubscription({
  reference: doc(db, 'draftRooms', roomId),
  onUpdate: (data) => stableTick(data.secondsRemaining),
});

useEffect(() => {
  const id = setInterval(stableTick, 1000);
  return () => clearInterval(id);
}, []); // Empty deps!
```

### Pattern 3: Error Recovery

```typescript
const {
  data,
  error,
  retry,
  isSubscribed,
} = useFirestoreSubscription({
  reference: docRef,
  onError: (err) => {
    if (error) {
      return <button onClick={retry}>Retry</button>;
    }
  },
});
```

---

## State Machine Transitions

```
Valid transitions:
idle          → [loading, error]
loading       → [connecting, error, idle]
connecting    → [active, error, idle]
active        → [paused, completing, error, idle]
paused        → [active, completing, error, idle]
completing    → [completed, error]
completed     → [idle]
error         → [idle, loading]
```

---

## Type Definitions Quick Look

```typescript
type DraftStateType = 
  | 'idle' | 'loading' | 'connecting' | 'active'
  | 'paused' | 'completing' | 'completed' | 'error';

interface StateTransition {
  from: DraftStateType;
  to: DraftStateType;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

interface UseFirestoreSubscriptionResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  isSubscribed: boolean;
  retry: () => void;
}
```

---

## Import Examples

```typescript
// Import hooks
import {
  useDraftStateMachine,
  useStableCallback,
  useFirestoreSubscription,
} from '@/components/vx2/draft-logic/hooks/shared';

// Import types
import type {
  DraftStateType,
  StateTransition,
  UseFirestoreSubscriptionResult,
} from '@/components/vx2/draft-logic/hooks/shared';
```

---

## Debugging

Enable debug mode:

```typescript
// All transitions logged
useDraftStateMachine({ debug: true });

// Subscription changes logged
useFirestoreSubscription({
  reference: ref,
  debug: true,
});
```

Check console for: `[DraftStateMachine]` and `[FirestoreSubscription]` logs

---

## File Structure

```
components/vx2/draft-logic/hooks/shared/
├── index.ts                      # Main exports
├── useDraftStateMachine.ts        # State machine (7.3KB)
├── useStableCallback.ts           # Stable callbacks (3.3KB)
├── useFirestoreSubscription.ts    # Firestore subscriptions (7.9KB)
├── SHARED_HOOKS.md                # Complete documentation
├── INTEGRATION_EXAMPLE.tsx        # Real-world usage example
└── QUICK_REFERENCE.md             # This file
```

---

## Common Issues & Solutions

**Q: My timer keeps recreating on every render**
A: Use `useStableCallback` to wrap your timer callback

**Q: State transition failed silently**
A: Check `canTransition()` first, or call `getTransitionError()` to see why

**Q: Firestore subscription keeps reconnecting**
A: It's auto-retrying (up to 3 times with exponential backoff). Check console for errors.

**Q: Memory leak warnings on unmount**
A: `useFirestoreSubscription` auto-unsubscribes. Make sure you're not storing unsubscribe functions elsewhere.

**Q: Callback not using latest state**
A: Wrap with `useStableCallback` instead of using callback directly in dependencies

---

## Performance Tips

1. Use empty deps with `useStableCallback`
2. Use `skip` in `useFirestoreSubscription` for conditional subscriptions
3. Minimize state machine transitions
4. Memoize state machine reference if passing to children

---

For detailed documentation, see **SHARED_HOOKS.md**
For real-world example, see **INTEGRATION_EXAMPLE.tsx**

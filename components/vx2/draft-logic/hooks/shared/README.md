# Shared Draft Hooks Library

Core hooks used across all 5 parallel draft room implementations in the TopDog web codebase.

## Directory Contents

| File | Size | Purpose |
|------|------|---------|
| `index.ts` | 27 LOC | Main exports and types |
| `useDraftStateMachine.ts` | 248 LOC | Draft lifecycle state machine |
| `useStableCallback.ts` | 99 LOC | Stable callback references |
| `useFirestoreSubscription.ts` | 292 LOC | Real-time Firestore subscriptions |
| `SHARED_HOOKS.md` | 667 LOC | Complete documentation |
| `QUICK_REFERENCE.md` | 279 LOC | Quick lookup guide |
| `INTEGRATION_EXAMPLE.tsx` | 431 LOC | Real-world usage example |
| `README.md` | This file | Overview |

**Total Code:** 1,376 lines | **Total Documentation:** 1,377 lines

## Quick Start

### Installation

Already in your codebase. Just import:

```typescript
import {
  useDraftStateMachine,
  useStableCallback,
  useFirestoreSubscription,
} from '@/components/vx2/draft-logic/hooks/shared';
```

### Basic Usage

```typescript
// 1. Manage draft lifecycle
const sm = useDraftStateMachine({ initialState: 'idle' });

// 2. Load real-time data
const { data: room } = useFirestoreSubscription({
  reference: doc(db, 'draftRooms', roomId),
});

// 3. Stable callbacks for timers/listeners
const handleExpire = useCallback(() => autoPickPlayer(), []);
const stableHandle = useStableCallback(handleExpire);

useEffect(() => {
  const timer = setInterval(stableHandle, 1000);
  return () => clearInterval(timer);
}, []); // Empty deps - stable!
```

## Three Core Hooks

### 1. useDraftStateMachine
Manages draft lifecycle with state machine pattern.

**States:** idle → loading → connecting → active → paused → completing → completed → error

**Key Features:**
- Validates state transitions
- Tracks complete history
- Hooks: onStateChange, onEnterState, onExitState
- Full transition validation and error messages

**Use for:**
- Controlling draft flow
- Analytics tracking
- Conditional UI rendering
- Side effects on state changes

### 2. useStableCallback
Returns a stable reference to a callback that always calls the latest version.

**Key Features:**
- Function reference never changes
- Always calls latest callback
- Safe to use in empty dependency arrays
- Prevents infinite effect loops

**Use for:**
- Timer callbacks (setInterval, setTimeout)
- Event listeners
- Firestore listeners
- Any callback in a closure-heavy context

### 3. useFirestoreSubscription
Manages real-time Firestore subscriptions with cleanup and error handling.

**Key Features:**
- Automatic cleanup on unmount
- Auto-retry with exponential backoff
- Works with documents and collections
- Proper TypeScript generics
- Callback support (onUpdate, onError)
- Debug logging optional

**Use for:**
- Real-time room data
- Picking history (picks board)
- Participant rosters
- Timer synchronization
- User settings

## Integration Patterns

### Pattern 1: Complete Draft Room

```typescript
const sm = useDraftStateMachine();

const { data: room } = useFirestoreSubscription({
  reference: doc(db, 'draftRooms', roomId),
  onError: (err) => sm.transition('error'),
});

const handleExpire = useStableCallback(() => autoPickPlayer());

useEffect(() => {
  if (room && sm.state === 'connecting') {
    sm.transition('active');
  }
}, [room, sm.state]);
```

### Pattern 2: Multi-Room Support

Use all three hooks for each room independently:

```typescript
const roomStates = roomIds.map(id => ({
  id,
  sm: useDraftStateMachine(),
  room: useFirestoreSubscription({ reference: doc(db, 'draftRooms', id) }),
}));
```

### Pattern 3: Conditional Subscriptions

Skip subscriptions until ready:

```typescript
const { data } = useFirestoreSubscription({
  reference: doc(db, 'draftRooms', roomId),
  skip: !roomId || !isReady,
});
```

## Documentation Files

- **QUICK_REFERENCE.md** - Fast lookup for common patterns
- **SHARED_HOOKS.md** - Complete detailed documentation with examples
- **INTEGRATION_EXAMPLE.tsx** - Production-ready example implementation

## Common Use Cases

### Loading Draft Room Data
```typescript
const { data: room, loading, error } = useFirestoreSubscription({
  reference: doc(db, 'draftRooms', roomId),
});
```

### Managing Draft State
```typescript
const sm = useDraftStateMachine({
  initialState: 'idle',
  onStateChange: (from, to) => analytics.track('state_change', { from, to }),
});
```

### Timer Without Re-rendering
```typescript
const tick = useCallback(() => {}, []);
const stable = useStableCallback(tick);

useEffect(() => {
  const id = setInterval(stable, 1000);
  return () => clearInterval(id);
}, []);
```

### Subscribing to Picks
```typescript
const { data: picks, error, retry } = useFirestoreSubscription({
  reference: collection(db, 'draftRooms', roomId, 'picks'),
  constraints: [orderBy('pickNumber', 'desc'), limit(50)],
  onError: (err) => {
    toast.error(`Failed to load picks: ${err.message}`);
    retry();
  },
});
```

## Error Handling

All hooks include error handling:

```typescript
// State machine errors
const error = sm.getTransitionError('invalid-state');

// Firestore errors with retry
const { error, retry } = useFirestoreSubscription({
  reference: ref,
  onError: (err) => {
    console.error('Subscription failed:', err);
    // retry() called automatically up to 3 times
    // or manually: retry()
  },
});
```

## TypeScript Support

Full generic and type support:

```typescript
// Typed state machine
const sm = useDraftStateMachine<DraftStateType>();
sm.state // Strongly typed

// Typed subscription
const { data } = useFirestoreSubscription<DraftRoom>({
  reference: doc(db, 'draftRooms', roomId),
});
// data is DraftRoom | null

// Typed callback
const callback = (x: number): string => x.toString();
const stable = useStableCallback(callback);
// stable has same signature
```

## Performance Considerations

1. **useStableCallback** - No performance cost, enables optimization
2. **useDraftStateMachine** - Light-weight state management
3. **useFirestoreSubscription** - Lazy loads, only subscribes when needed

Use `skip` option for conditional subscriptions to avoid unnecessary connections.

## Testing

Each hook can be tested independently:

```typescript
// Test state machine transitions
const { state, transition, canTransition } = useDraftStateMachine();
expect(state).toBe('idle');
expect(canTransition('loading')).toBe(true);

// Test subscriptions
const { data, loading } = useFirestoreSubscription({
  reference: mockDocRef,
});
```

## Debugging

Enable debug mode in development:

```typescript
const options = {
  debug: process.env.NODE_ENV === 'development',
};

useDraftStateMachine(options);
useFirestoreSubscription(options);
```

Check browser console for:
- `[DraftStateMachine]` logs
- `[FirestoreSubscription]` logs

## Migration Guide

### From Individual Timer Hooks
```typescript
// Old
const timer = useDraftTimer({ onExpire: handleExpire });

// New
const stableExpire = useStableCallback(handleExpire);
// Use in effect with empty deps
```

### From Manual Subscriptions
```typescript
// Old
useEffect(() => {
  const unsub = onSnapshot(ref, setData);
  return () => unsub();
}, [ref]);

// New
const { data } = useFirestoreSubscription({ reference: ref });
```

## Architecture

These hooks are designed to work together:

1. **State Machine** → Orchestrates overall draft flow
2. **Firestore Subscription** → Provides real-time data
3. **Stable Callback** → Enables efficient event handling

They're intentionally decoupled so each can be used independently or together.

## Support

For issues or questions:
- Check QUICK_REFERENCE.md for common patterns
- See SHARED_HOOKS.md for detailed documentation
- Review INTEGRATION_EXAMPLE.tsx for production example

## License

Part of TopDog web codebase. Internal use only.

---

**Created:** February 2025
**Location:** `/components/vx2/draft-logic/hooks/shared/`
**Status:** Production Ready

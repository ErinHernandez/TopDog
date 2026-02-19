# Shared Draft Hooks

Common hooks used across all 5 parallel draft room implementations in the TopDog web codebase.
These hooks provide cross-cutting concerns like state management, callback stability, and real-time data synchronization.

## Overview

The shared hooks library contains three core hooks designed to be used across all draft room implementations:

1. **useDraftStateMachine** - Manages draft lifecycle state transitions
2. **useStableCallback** - Prevents stale closures in callbacks
3. **useFirestoreSubscription** - Handles real-time Firestore subscriptions

## Installation & Imports

```typescript
import {
  useDraftStateMachine,
  useStableCallback,
  useFirestoreSubscription,
  // Types
  type DraftStateType,
  type StateTransition,
  type UseFirestoreSubscriptionOptions,
} from '@/components/vx2/draft-logic/hooks/shared';
```

---

## Hook 1: useDraftStateMachine

### Purpose
Manages the draft lifecycle with a finite state machine pattern. Ensures valid state transitions, handles side effects, and maintains complete history of all state changes.

### State Diagram
```
idle ↔ loading ↔ connecting → active ↔ paused → completing → completed
 ↑                                ↑                              ↓
 └──────────────────── error ────────────────────────────────────┘
```

### Valid States
- `idle` - Initial state, draft not started
- `loading` - Fetching room data from Firestore
- `connecting` - Establishing real-time subscription
- `active` - Draft in progress
- `paused` - Draft temporarily paused
- `completing` - Finalizing draft, waiting for completion confirmation
- `completed` - Draft finished
- `error` - Error state, allows recovery

### Usage Example

```typescript
function DraftRoomComponent({ roomId }) {
  const stateMachine = useDraftStateMachine({
    initialState: 'idle',
    onStateChange: (from, to) => {
      analytics.track('draft_state_changed', { from, to });
    },
    onEnterState: (state) => {
      if (state === 'active') {
        startTimers();
      }
    },
    onExitState: (state) => {
      if (state === 'active') {
        pauseTimers();
      }
    },
    debug: process.env.NODE_ENV === 'development',
  });

  // Safely transition states
  useEffect(() => {
    if (stateMachine.canTransition('loading')) {
      stateMachine.transition('loading');
    }
  }, []);

  // Check before transitioning
  const startDraft = () => {
    if (stateMachine.canTransition('active')) {
      stateMachine.transition('active', { startedAt: Date.now() });
    } else {
      const error = stateMachine.getTransitionError('active');
      console.warn(error);
    }
  };

  return (
    <div>
      <p>State: {stateMachine.state}</p>
      <p>Transitions: {stateMachine.history.length}</p>
      {stateMachine.lastTransition && (
        <p>Last: {stateMachine.lastTransition.from} → {stateMachine.lastTransition.to}</p>
      )}
      <button onClick={startDraft}>Start Draft</button>
    </div>
  );
}
```

### API Reference

#### Options
- `initialState?: DraftStateType` - Starting state (default: 'idle')
- `onStateChange?: (from, to) => void` - Called when state changes
- `onEnterState?: (state) => void` - Called when entering a state
- `onExitState?: (state) => void` - Called when exiting a state
- `debug?: boolean` - Enable debug logging

#### Return Value
- `state: DraftStateType` - Current state
- `transition(nextState, metadata?) => boolean` - Attempt to transition
- `canTransition(nextState) => boolean` - Check if transition is valid
- `getTransitionError(nextState) => string | null` - Get reason for invalid transition
- `history: StateTransition[]` - All transitions since creation
- `lastTransition: StateTransition | null` - Most recent transition
- `reset(initialState?) => void` - Reset to initial state

---

## Hook 2: useStableCallback

### Purpose
Returns a stable callback reference that always calls the latest version of the provided callback.
Prevents stale closures while keeping the function reference constant across renders.

### Problem It Solves

```typescript
// Without useStableCallback: callback reference changes on every render
const handleTick = useCallback((seconds) => {
  setSeconds(seconds);
}, []); // Missing dependency!

useEffect(() => {
  const interval = setInterval(handleTick, 1000);
  // handleTick should be in deps, but then interval recreates every render
  return () => clearInterval(interval);
}, [handleTick]); // ❌ Interval recreated constantly
```

### Solution

```typescript
// With useStableCallback: callback never changes reference
const handleTick = useCallback((seconds) => {
  setSeconds(seconds);
}, []);

const stableCallback = useStableCallback(handleTick);

useEffect(() => {
  const interval = setInterval(stableCallback, 1000);
  return () => clearInterval(interval);
}, []); // ✅ Interval created once, always calls latest handleTick
```

### Usage in Draft Room Timers

```typescript
function DraftTimer({ isMyTurn, onTimerExpire }) {
  const [seconds, setSeconds] = useState(30);

  // Handler that uses component state
  const handleTimerExpire = useCallback(() => {
    // This accesses latest isMyTurn value
    if (isMyTurn) {
      onTimerExpire();
    }
  }, []); // No dependency on isMyTurn!

  // Stable reference to always call latest handleTimerExpire
  const stableExpire = useStableCallback(handleTimerExpire);

  useEffect(() => {
    const interval = setInterval(() => {
      setSeconds(s => {
        if (s === 0) {
          stableExpire(); // Always calls latest handler
          return s;
        }
        return s - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []); // Empty deps - interval never recreates!

  return <div>{seconds}s</div>;
}
```

### Usage in Firestore Listeners

```typescript
function DraftRoom({ roomId, onPickMade }) {
  // Handler that updates draft state
  const handlePickMade = useCallback((pick) => {
    console.log('Pick made:', pick);
    onPickMade(pick);
  }, []); // No dependency on onPickMade!

  const stableHandle = useStableCallback(handlePickMade);

  useEffect(() => {
    // Subscribe once with stable callback
    const unsubscribe = onSnapshot(
      collection(db, 'draftRooms', roomId, 'picks'),
      (snapshot) => {
        snapshot.docChanges().forEach(change => {
          if (change.type === 'added') {
            stableHandle(change.doc.data()); // Always calls latest
          }
        });
      }
    );

    return () => unsubscribe();
  }, [roomId]); // Only depends on roomId, not callbacks!

  return <PickBoard roomId={roomId} />;
}
```

### API Reference

#### Parameters
- `callback: T` - Function to stabilize

#### Return Value
- Stable function reference that always calls the latest version of callback
- Never changes reference across renders
- Use as replacement for callback in dependency arrays

---

## Hook 3: useFirestoreSubscription

### Purpose
Manages Firestore real-time subscriptions with automatic cleanup, error handling, and auto-retry logic.
Prevents memory leaks and ensures proper unsubscribe on unmount or when references change.

### Key Features
- ✅ Automatic cleanup on unmount
- ✅ Proper unsubscribe when reference changes
- ✅ Exponential backoff retry (up to 3 attempts)
- ✅ Error handling with callbacks
- ✅ Works with both documents and collections
- ✅ Query constraint support
- ✅ Debug logging optional

### Usage Example - Document Subscription

```typescript
function DraftRoomHeader({ roomId }) {
  const { data: room, loading, error, isSubscribed } = useFirestoreSubscription({
    reference: doc(db, 'draftRooms', roomId),
    onUpdate: (room) => {
      // Optional: Custom handling when data arrives
      console.log('Room updated:', room);
    },
    onError: (err) => {
      toast.error(`Failed to load room: ${err.message}`);
    },
    debug: process.env.NODE_ENV === 'development',
  });

  if (loading) return <Spinner />;
  if (error) return <Alert type="error">{error}</Alert>;
  if (!isSubscribed) return <Alert>Connecting...</Alert>;

  return (
    <div>
      <h1>{room?.name}</h1>
      <p>Status: {room?.status}</p>
    </div>
  );
}
```

### Usage Example - Collection Subscription

```typescript
function DraftBoard({ roomId }) {
  const { data: picks, loading, error, retry } = useFirestoreSubscription({
    reference: collection(db, 'draftRooms', roomId, 'picks'),
    constraints: [orderBy('pickNumber', 'desc'), limit(20)],
    onUpdate: (picks) => {
      // Picks are auto-converted to objects with id field
      console.log(`Loaded ${picks.length} picks`);
    },
    debug: true,
  });

  if (error) {
    return (
      <div>
        <p>Error: {error}</p>
        <button onClick={retry}>Retry</button>
      </div>
    );
  }

  return (
    <PickList
      picks={picks || []}
      isLoading={loading}
    />
  );
}
```

### Usage Example - Conditional Subscription

```typescript
function ParticipantRosters({ roomId, selectedParticipantId }) {
  // Only subscribe when participant is selected
  const { data: roster, loading } = useFirestoreSubscription({
    reference: doc(
      db,
      'draftRooms',
      roomId,
      'participants',
      selectedParticipantId
    ),
    skip: !selectedParticipantId, // Skip if nothing selected
    onError: (err) => {
      logger.error('Failed to load roster', err);
    },
  });

  if (!selectedParticipantId) return <p>Select a participant</p>;
  if (loading) return <Spinner />;

  return <RosterView roster={roster} />;
}
```

### API Reference

#### Options
- `reference: DocumentReference | CollectionReference` - Firestore reference (required)
- `constraints?: QueryConstraint[]` - Query constraints for collections
- `onUpdate?: (data) => void` - Called when data updates
- `onError?: (error) => void` - Called when error occurs
- `debug?: boolean` - Enable debug logging
- `skip?: boolean` - Skip subscription if false

#### Return Value
- `data: T | null` - Loaded data (null while loading)
- `loading: boolean` - Loading state
- `error: string | null` - Error message if failed
- `isSubscribed: boolean` - Whether actively subscribed
- `retry: () => void` - Manually retry subscription

### Auto-Retry Behavior

Retries automatically with exponential backoff:
- 1st retry: 1 second delay
- 2nd retry: 2 seconds delay
- 3rd retry: 4 seconds delay
- Max 3 retries, then gives up

---

## Integration Patterns

### Pattern 1: Complete Draft Room Setup

```typescript
function DraftRoom({ roomId, userId }) {
  // Manage draft lifecycle
  const stateMachine = useDraftStateMachine({
    initialState: 'idle',
    onEnterState: (state) => {
      if (state === 'loading') {
        loadDraftData();
      }
    },
    debug: true,
  });

  // Subscribe to room data
  const { data: room, loading: roomLoading } = useFirestoreSubscription({
    reference: doc(db, 'draftRooms', roomId),
  });

  // Subscribe to picks with stable callback
  const handlePickUpdate = useCallback((picks) => {
    console.log('Picks updated:', picks);
  }, []);

  const stablePickHandler = useStableCallback(handlePickUpdate);

  const { data: picks } = useFirestoreSubscription({
    reference: collection(db, 'draftRooms', roomId, 'picks'),
    onUpdate: stablePickHandler,
  });

  useEffect(() => {
    if (!roomLoading && room) {
      stateMachine.transition('connecting');
    }
  }, [roomLoading, room]);

  return (
    <div>
      <p>State: {stateMachine.state}</p>
      {/* Render UI */}
    </div>
  );
}
```

### Pattern 2: Timer with Stable Callbacks

```typescript
function DraftPickTimer({ onExpire, initialSeconds = 30 }) {
  const [seconds, setSeconds] = useState(initialSeconds);

  const handleExpire = useCallback(() => {
    console.log('Timer expired');
    onExpire?.();
  }, []);

  // Stable reference that always calls latest handleExpire
  const stableExpire = useStableCallback(handleExpire);

  useEffect(() => {
    if (seconds <= 0) {
      stableExpire();
      return;
    }

    const timer = setInterval(() => {
      setSeconds(s => s - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [seconds, stableExpire]); // Can safely include stableExpire

  return <div className="timer">{seconds}s</div>;
}
```

### Pattern 3: Error Recovery with Retry

```typescript
function RoomSubscription({ roomId }) {
  const {
    data: room,
    error,
    retry,
    isSubscribed,
  } = useFirestoreSubscription({
    reference: doc(db, 'draftRooms', roomId),
    debug: true,
  });

  if (error) {
    return (
      <ErrorBoundary>
        <div className="error">
          <p>Connection lost: {error}</p>
          <button onClick={retry}>Reconnect</button>
        </div>
      </ErrorBoundary>
    );
  }

  if (!isSubscribed) {
    return <div>Connecting to draft room...</div>;
  }

  return <DraftContent room={room} />;
}
```

---

## Common Patterns Across Draft Implementations

### Multi-Room Setup (5 Parallel Drafts)

```typescript
function DraftMultiplexer({ roomIds = [] }) {
  // Manage state for each room independently
  const stateMachines = roomIds.map(id => ({
    id,
    machine: useDraftStateMachine({ initialState: 'idle' }),
  }));

  // Subscribe to each room
  const roomSubscriptions = roomIds.map(id => ({
    id,
    subscription: useFirestoreSubscription({
      reference: doc(db, 'draftRooms', id),
      skip: !id, // Skip if no ID
    }),
  }));

  return (
    <div>
      {roomIds.map(id => (
        <DraftRoomUI
          key={id}
          roomId={id}
          state={stateMachines.find(sm => sm.id === id)?.machine.state}
          room={roomSubscriptions.find(rs => rs.id === id)?.subscription.data}
        />
      ))}
    </div>
  );
}
```

### Analytics Tracking

```typescript
function DraftRoomWithAnalytics({ roomId }) {
  const stateMachine = useDraftStateMachine({
    initialState: 'idle',
    onStateChange: (from, to) => {
      // Track state transitions
      analytics.track('draft_state_change', {
        roomId,
        from,
        to,
        timestamp: new Date().toISOString(),
      });
    },
    onEnterState: (state) => {
      // Track entered states
      analytics.track('draft_state_entered', {
        roomId,
        state,
      });
    },
  });

  return <DraftRoom roomId={roomId} stateMachine={stateMachine} />;
}
```

---

## Migration Guide

### From useDraftTimer to State Machine + useStableCallback

**Before:**
```typescript
const timer = useDraftTimer({
  initialSeconds: 30,
  isActive: isDraftActive,
  onExpire: handleExpire,
});
```

**After:**
```typescript
const stateMachine = useDraftStateMachine({
  initialState: 'idle',
  onStateChange: (from, to) => {
    if (to === 'active') {
      // Timer started
    }
  },
});

const handleExpire = useCallback(() => {
  // Handle expiration
}, []);

const stableExpire = useStableCallback(handleExpire);

// Use stableExpire in useEffect
```

---

## TypeScript Support

All hooks include full TypeScript support with proper generic types:

```typescript
// useDraftStateMachine is strongly typed
const sm = useDraftStateMachine();
// sm.state is type DraftStateType
// sm.transition() expects DraftStateType

// useStableCallback preserves function signature
const callback = (x: number): string => x.toString();
const stable = useStableCallback(callback);
// stable has same signature as callback

// useFirestoreSubscription is generic
const { data } = useFirestoreSubscription<DraftRoom>({
  reference: doc(db, 'draftRooms', id),
});
// data is typed as DraftRoom | null
```

---

## Debugging

Enable debug mode for detailed logging:

```typescript
useDraftStateMachine({
  initialState: 'idle',
  debug: true, // Logs all transitions
});

useStableCallback(fn); // No debug flag needed

useFirestoreSubscription({
  reference: docRef,
  debug: true, // Logs subscriptions and retries
});
```

Check browser console for:
- `[DraftStateMachine]` logs
- `[FirestoreSubscription]` logs

---

## Best Practices

1. **Use stable callbacks for long-lived listeners**
   - Timer intervals
   - Event listeners
   - Firestore subscriptions

2. **Check state transitions before attempting**
   ```typescript
   if (sm.canTransition('active')) {
     sm.transition('active');
   }
   ```

3. **Handle Firestore errors gracefully**
   ```typescript
   const { error, retry } = useFirestoreSubscription({
     onError: (err) => toast.error(err.message),
   });
   ```

4. **Use skip for conditional subscriptions**
   ```typescript
   useFirestoreSubscription({
     reference: docRef,
     skip: !isReady, // Don't subscribe until ready
   });
   ```

5. **Debug in development**
   ```typescript
   const options = {
     debug: process.env.NODE_ENV === 'development',
   };
   ```

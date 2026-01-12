# Draft State Manager Documentation

**Date:** January 12, 2025  
**Status:** ✅ **PHASE 1 COMPLETE** (Foundation Created)  
**File:** `lib/draft/stateManager.js`

---

## Overview

Centralized state management utility for draft rooms with validation, atomic updates, and subscription support. Provides a structured approach to managing draft room state to prevent race conditions and ensure consistency.

**Phase 1:** Foundation created - ready for incremental integration  
**Phase 2:** Full integration into draft room (future work)

---

## Features

### State Management
- **Atomic Updates** - All state changes are atomic to prevent race conditions
- **Immutable State** - State is cloned for safe updates
- **Validation** - Automatic state validation to ensure consistency
- **Subscriptions** - Subscribe to state changes for reactive updates

### State Validation
- Pick number sequence validation
- Draft order consistency checks
- Queue validation (no picked players in queue)
- Current pick number calculation

### Derived State
- Current picker calculation (with snake draft support)
- Current round calculation
- Draft completion status
- On-the-clock status

---

## Usage

### Basic Usage

```javascript
import { DraftStateManager } from '@/lib/draft/stateManager';

// Create state manager
const stateManager = new DraftStateManager({
  roomId: 'room123',
  initialState: {
    room: { id: 'room123', status: 'waiting' },
    participants: ['Alice', 'Bob', 'Charlie'],
    picks: [],
    draftOrder: [],
    draftSettings: { timerSeconds: 30, totalRounds: 18 },
  },
  onStateChange: (state) => {
    console.log('State updated:', state);
  },
});

// Update room
await stateManager.updateRoom({ status: 'active' });

// Add pick
await stateManager.addPick({
  pickNumber: 1,
  player: { name: 'Patrick Mahomes', position: 'QB' },
  pickedBy: 'Alice',
  round: 1,
});

// Subscribe to changes
const unsubscribe = stateManager.subscribe((state) => {
  console.log('State changed:', state);
});

// Get derived state
const derived = stateManager.getDerivedState();
console.log('Current picker:', derived.currentPicker);
```

---

## API Reference

### DraftStateManager Class

#### Constructor

```javascript
new DraftStateManager(options)
```

**Options:**
- `roomId` (string) - Room ID
- `initialState` (object) - Initial state
- `onStateChange` (function) - Callback for state changes
- `validationEnabled` (boolean) - Enable validation (default: true)

#### Methods

##### `getState()`

Get current state (clone to prevent mutations).

```javascript
const state = stateManager.getState();
```

##### `updateState(updater, options)`

Update state atomically.

```javascript
await stateManager.updateState((state) => {
  state.status = 'active';
  state.participants.push('NewUser');
});
```

**Options:**
- `validate` (boolean) - Validate after update (default: true)
- `strictValidation` (boolean) - Throw on validation error (default: false)
- `skipNotify` (boolean) - Skip notifying subscribers (default: false)

##### `updateRoom(roomData)`

Update room data atomically.

```javascript
await stateManager.updateRoom({
  status: 'active',
  participants: ['Alice', 'Bob'],
  settings: { timerSeconds: 60 },
});
```

##### `addPick(pick, options)`

Add a pick with validation.

```javascript
await stateManager.addPick({
  pickNumber: 1,
  player: { name: 'Patrick Mahomes' },
  pickedBy: 'Alice',
  round: 1,
});
```

**Options:**
- `allowGap` (boolean) - Allow pick number gaps (default: false)
- `strictValidation` (boolean) - Throw on validation error (default: false)

##### `removePick(pickNumber)`

Remove pick and recalculate current pick number.

```javascript
await stateManager.removePick(1);
```

##### `updateTimer(seconds)`

Update timer (optimized for frequent updates, skips notifications).

```javascript
await stateManager.updateTimer(25);
```

##### `updateQueue(queue)`

Update queue with validation (removes picked players).

```javascript
await stateManager.updateQueue([
  { name: 'Josh Allen' },
  { name: 'Lamar Jackson' },
]);
```

##### `addToQueue(player)`

Add player to queue.

```javascript
await stateManager.addToQueue({ name: 'Josh Allen' });
```

##### `removeFromQueue(player)`

Remove player from queue.

```javascript
await stateManager.removeFromQueue({ name: 'Josh Allen' });
```

##### `clearPicks()`

Clear all picks (for room reset).

```javascript
await stateManager.clearPicks();
```

##### `getDerivedState()`

Calculate derived state (currentPicker, round, etc.).

```javascript
const derived = stateManager.getDerivedState();
// Returns:
// {
//   currentPickNumber: 5,
//   currentRound: 2,
//   currentPicker: 'Bob',
//   isSnakeRound: true,
//   pickIndex: 1,
//   totalPicks: 54,
//   effectiveDraftOrder: ['Alice', 'Bob', 'Charlie'],
//   isDraftActive: true,
//   isDraftComplete: false,
//   isOnTheClock: true,
// }
```

##### `batchUpdate(updaters)`

Batch multiple updates atomically.

```javascript
await stateManager.batchUpdate([
  (state) => { state.status = 'active'; },
  (state) => { state.timer = 30; },
  (state) => { state.participants.push('NewUser'); },
]);
```

##### `subscribe(callback)`

Subscribe to state changes.

```javascript
const unsubscribe = stateManager.subscribe((state) => {
  console.log('State changed:', state);
});
// Later:
unsubscribe();
```

---

## State Validation

The state manager automatically validates state consistency:

### Pick Number Validation
- Checks that pick numbers are sequential
- Validates current pick number matches picks length

### Draft Order Validation
- Ensures draft order matches participants
- Validates draft order contains all participants

### Queue Validation
- Ensures queue doesn't contain already picked players
- Prevents duplicate players in queue

### Example Validation Error

```javascript
// This will log a warning but not throw (unless strictValidation: true)
await stateManager.addPick({
  pickNumber: 5, // Should be 1 if picks is empty
  player: { name: 'Patrick Mahomes' },
});

// Output: "[DraftStateManager] Pick number mismatch: expected 1, got 5"
```

---

## Integration Example

### With Firebase Sync

```javascript
import { DraftStateManager } from '@/lib/draft/stateManager';
import { onSnapshot } from 'firebase/firestore';

const stateManager = new DraftStateManager({
  roomId: roomId,
});

// Sync Firebase room data to state manager
useEffect(() => {
  if (!roomId) return;

  const unsubscribe = onSnapshot(
    doc(db, 'draftRooms', roomId),
    (docSnap) => {
      const roomData = { id: docSnap.id, ...docSnap.data() };
      stateManager.updateRoom(roomData);
    }
  );

  return unsubscribe;
}, [roomId]);

// Use state manager for operations
const makePick = async (player) => {
  const currentState = stateManager.getState();
  const derived = stateManager.getDerivedState();

  // Add pick to state manager first
  await stateManager.addPick({
    pickNumber: derived.currentPickNumber,
    player,
    pickedBy: currentState.userName,
    round: derived.currentRound,
  });

  // Then sync to Firebase (state manager ensures consistency)
  await updateDoc(doc(db, 'draftRooms', roomId, 'picks', pickId), {
    pickNumber: derived.currentPickNumber,
    player,
    pickedBy: currentState.userName,
    round: derived.currentRound,
  });
};
```

---

## Benefits

### Prevents Race Conditions
- Atomic updates ensure state consistency
- No partial state updates

### Validates State
- Automatic validation catches bugs early
- Consistent state structure

### Easier Testing
- State manager can be tested independently
- Mock state for testing

### Better Debugging
- State changes are tracked
- Validation errors help identify issues

### Derived State
- Centralized calculation of derived values
- Consistent across components

---

## Migration Strategy

### Phase 1: ✅ Foundation (Complete)
- Created state manager utility
- Documented API
- Ready for integration

### Phase 2: Critical Operations (Next)
1. Integrate into `makePick` and `makeAutoPick` functions
2. Use state manager for pick operations
3. Keep Firebase sync alongside

### Phase 3: Gradual Migration
1. Replace other state updates incrementally
2. Use subscriptions for reactive updates
3. Remove direct setState calls

### Phase 4: Full Migration
1. All state managed by state manager
2. Firebase sync through state manager
3. Remove redundant state variables

---

## Related Documentation

- `pages/draft/topdog/[roomId].js` - Draft room component (4800+ lines)
- `P0_P1_IMPLEMENTATION_PROGRESS.md` - Progress tracker

---

**Implementation Date:** January 12, 2025  
**Status:** ✅ **PHASE 1 COMPLETE** - Ready for incremental integration

# Dynamic Island Sandbox

A complete sandbox implementation for Dynamic Island states during draft sessions.

## Overview

This sandbox demonstrates three distinct Dynamic Island states:

1. **In-Draft State**: User is actively in the draft room (app in foreground)
2. **Out-of-Draft State**: User is in app but not in an active draft
3. **Out-of-App-During-Live-Draft State**: User left app but draft is still live (uses Live Activities)

## Files

### React/Web Implementation

- **`DynamicIslandSandbox.tsx`**: React component that visualizes Dynamic Island states
- **`index.ts`**: Export file for easier imports
- **Demo Page**: `/pages/testing-grounds/dynamic-island-sandbox.tsx`

### iOS Native Implementation

- **`ios/DynamicIsland/Widgets/DraftTimerActivityWidget.swift`**: Live Activity widget definition
- **`ios/DynamicIsland/Managers/DraftTimerActivityManager.swift`**: Activity management logic
- **`ios/DynamicIsland/README.md`**: iOS setup and integration guide

## Usage

### Web Demo

Visit `/testing-grounds/dynamic-island-sandbox` to see the interactive demo.

The demo page includes:
- State selector buttons
- Live timer simulation
- Interactive controls for all draft parameters
- Auto-cycle mode to automatically cycle through states

### React Component

```tsx
import { DynamicIslandSandbox } from '@/components/vx2/dynamic-island';

function MyComponent() {
  return (
    <DynamicIslandSandbox
      state="in-draft"
      draftStatus="active"
      timerSeconds={25}
      totalSeconds={30}
      isMyTurn={true}
      currentPickNumber={1}
      totalPicks={216}
      currentDrafter="You"
      roomId="room-123"
      onStateChange={(state) => console.log('State changed:', state)}
    />
  );
}
```

### Props

| Prop | Type | Description |
|------|------|-------------|
| `state` | `DynamicIslandState` | Current state: `'in-draft'`, `'out-of-draft'`, or `'out-of-app-live'` |
| `draftStatus` | `DraftStatus` | Draft status: `'loading'`, `'waiting'`, `'active'`, `'paused'`, `'complete'` |
| `timerSeconds` | `number` | Seconds remaining on timer |
| `totalSeconds` | `number` | Total seconds for pick (default: 30) |
| `isMyTurn` | `boolean` | Whether it's the user's turn |
| `currentPickNumber` | `number` | Current pick number (1-indexed) |
| `totalPicks` | `number` | Total picks in draft (default: 216) |
| `currentDrafter` | `string` | Name of current drafter |
| `roomId` | `string` | Draft room ID |
| `autoCycle` | `boolean` | Auto-cycle through states for demo |
| `cycleDuration` | `number` | Duration for each state when auto-cycling (seconds) |
| `onStateChange` | `(state: DynamicIslandState) => void` | Callback when state changes |

## States Explained

### 1. In-Draft State

**When**: User is actively viewing the draft room in the app.

**Dynamic Island Display**:
- Compact view shows timer and drafter info
- Expanded view shows full timer with progress bar
- Urgency colors: Red (≤5s), Orange (≤10s), Blue/Normal (>10s)
- Paused indicator when draft is paused

**Visualization**: 
- Shows Dynamic Island pill at top of iPhone frame
- Timer counts down in real-time
- Shows "Your Turn!" or current drafter name

### 2. Out-of-Draft State

**When**: User is in the app but not in an active draft.

**Dynamic Island Display**:
- No Dynamic Island shown
- Normal status bar only

**Visualization**:
- Empty status bar area
- Shows "9:41 AM" clock as normal

### 3. Out-of-App-During-Live-Draft State

**When**: User has left the app but the draft is still active.

**Dynamic Island Display**:
- Uses Live Activities API
- Shows expanded view with timer and pick info
- Updates in real-time even when app is closed
- Critical alerts when it's user's turn

**Visualization**:
- Larger Dynamic Island pill
- Shows timer, progress bar, and pick info
- Includes draft room name

## Integration with Draft Room

To integrate with an actual draft room:

```tsx
import { useDraftRoom } from '@/components/vx2/draft-room/hooks/useDraftRoom';
import { DynamicIslandSandbox } from '@/components/vx2/dynamic-island';

function DraftRoomWithDynamicIsland({ roomId }: { roomId: string }) {
  const { 
    room, 
    timer, 
    isMyTurn, 
    currentPickNumber 
  } = useDraftRoom({ roomId });

  // Determine state based on app visibility and draft status
  const [state, setState] = useState<DynamicIslandState>('in-draft');
  
  useEffect(() => {
    // Listen for app visibility changes
    const handleVisibilityChange = () => {
      if (document.hidden && room?.status === 'active') {
        setState('out-of-app-live');
      } else if (room?.status === 'active') {
        setState('in-draft');
      } else {
        setState('out-of-draft');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [room?.status]);

  return (
    <>
      {/* Your draft room UI */}
      <DraftRoomComponent />
      
      {/* Dynamic Island visualization (for demo/dev) */}
      {process.env.NODE_ENV === 'development' && (
        <DynamicIslandSandbox
          state={state}
          draftStatus={room?.status}
          timerSeconds={timer}
          isMyTurn={isMyTurn}
          currentPickNumber={currentPickNumber}
          roomId={roomId}
        />
      )}
    </>
  );
}
```

## iOS Integration

For actual Dynamic Island functionality on iOS devices, see:

- `ios/DynamicIsland/README.md` for setup instructions
- `ios/DynamicIsland/Widgets/DraftTimerActivityWidget.swift` for widget implementation
- `ios/DynamicIsland/Managers/DraftTimerActivityManager.swift` for activity management

The web component is a visualization/demo. Real Dynamic Island requires:
- iOS 16.1+
- iPhone 14 Pro or later (for Dynamic Island)
- Native iOS app or React Native wrapper
- Live Activities capability enabled

## Design Notes

### Urgency Colors

- **Critical** (≤5 seconds): Red (#EF4444)
- **Warning** (≤10 seconds): Orange (#F59E0B)
- **Normal** (>10 seconds): Blue (#3B82F6) or system color

### Dynamic Island Sizes

- **Compact**: ~32px height, ~128px width
- **Expanded**: ~64px height, ~288px width
- **Minimal**: 8px dot indicator

### Timer Display

- Uses monospaced font for consistent digit width
- Updates every second
- Shows progress bar in expanded view
- Color changes based on urgency

## Testing

1. Visit `/testing-grounds/dynamic-island-sandbox`
2. Use state selector buttons to switch between states
3. Adjust timer, pick number, and other parameters
4. Enable auto-cycle to see all states automatically
5. Test with different draft statuses (active, paused, etc.)

## Future Enhancements

- [ ] Integration with actual draft room hooks
- [ ] Push notification support for out-of-app state
- [ ] Background sync for timer updates
- [ ] Sound/haptic feedback for critical timer states
- [ ] Accessibility improvements
- [ ] Dark mode support

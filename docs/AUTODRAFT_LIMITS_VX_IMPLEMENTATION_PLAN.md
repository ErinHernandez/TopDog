# Autodraft Limits - VX Implementation Plan

## What We're Building

A modal within the Profile tab that lets users set maximum position limits for autodraft. When a user can't make picks (timeout, autopilot), the system won't draft more than X players at each position.

**Key Constraints:**
- User stays in Profile tab (modal overlay, no page navigation)
- Fresh build - don't copy existing `pages/autodraft-limits.js` UI
- Design inspired by competitor reference but visually distinct
- Use existing data layer (`lib/autodraftLimits.js`) for Firebase/localStorage

---

## Position Limits

| Position | Min | Max | Default |
|----------|-----|-----|---------|
| QB | 0 | 4 | 4 |
| RB | 0 | 10 | 10 |
| WR | 0 | 11 | 11 |
| TE | 0 | 5 | 5 |

---

## File Structure

```
components/vx/mobile/app/tabs/
├── ProfileTabVX.tsx                    # Add modal state + render
└── modals/
    └── AutodraftLimitsModalVX.tsx      # New component
```

---

## Component: AutodraftLimitsModalVX

### Props

```typescript
interface AutodraftLimitsModalVXProps {
  isOpen: boolean;
  onClose: () => void;
}
```

### State

```typescript
const [limits, setLimits] = useState({ QB: 4, RB: 10, WR: 11, TE: 5 });
const [originalLimits, setOriginalLimits] = useState(limits);
const [isLoading, setIsLoading] = useState(true);
const [isSaving, setIsSaving] = useState(false);

// Derived
const hasChanges = JSON.stringify(limits) !== JSON.stringify(originalLimits);
const isAtDefaults = JSON.stringify(limits) === JSON.stringify(DEFAULT_AUTODRAFT_LIMITS);
```

### Data Layer (from `lib/autodraftLimits.js`)

```typescript
import { 
  getAutodraftLimits, 
  setAutodraftLimits, 
  DEFAULT_AUTODRAFT_LIMITS 
} from '@/lib/autodraftLimits';
```

These handle Firebase + localStorage sync automatically.

---

## UI Layout

```
┌─────────────────────────────────────┐
│  [X]                                │  ← Close button
│                                     │
│       Position Limits               │  ← Title
│                                     │
│  Set the max players at each        │  ← Description
│  position for autodraft             │
│                                     │
│  ┌─────────────────────────────┐    │
│  │ QB          [ - ]  4  [ + ] │    │  ← Position row
│  │ Maximum                     │    │
│  └─────────────────────────────┘    │
│                                     │
│  ┌─────────────────────────────┐    │
│  │ RB          [ - ]  9  [ + ] │    │
│  │ Maximum                     │    │
│  └─────────────────────────────┘    │
│                                     │
│  ┌─────────────────────────────┐    │
│  │ WR          [ - ] 10  [ + ] │    │
│  │ Maximum                     │    │
│  └─────────────────────────────┘    │
│                                     │
│  ┌─────────────────────────────┐    │
│  │ TE          [ - ]  4  [ + ] │    │
│  │ Maximum                     │    │
│  └─────────────────────────────┘    │
│                                     │
│  ┌───────────┐  ┌───────────────┐   │
│  │  Reset    │  │     Save      │   │  ← Actions
│  └───────────┘  └───────────────┘   │
│                                     │
└─────────────────────────────────────┘
```

---

## Design Differentiation

The competitor reference uses circular +/- buttons. To be visually distinct while keeping the same functionality:

**Options (pick one or combine):**
1. Square buttons with rounded corners instead of circles
2. Position label uses VX position colors (QB pink, RB green, WR gold, TE purple)
3. Different spacing/layout proportions
4. Subtle card backgrounds behind each position row
5. Slider alternative (but +/- buttons are more precise)

**Use VX constants:**
- `POSITION_COLORS` for position labels
- `BG_COLORS.secondary` for modal background
- `TEXT_COLORS` for text hierarchy
- VX `Button` component for actions

---

## Implementation Steps

### 1. Create the modal component

```typescript
// components/vx/mobile/app/tabs/modals/AutodraftLimitsModalVX.tsx

export default function AutodraftLimitsModalVX({ 
  isOpen, 
  onClose 
}: AutodraftLimitsModalVXProps) {
  // State
  const [limits, setLimits] = useState(DEFAULT_AUTODRAFT_LIMITS);
  const [originalLimits, setOriginalLimits] = useState(DEFAULT_AUTODRAFT_LIMITS);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Load on mount
  useEffect(() => {
    if (isOpen) {
      loadLimits();
    }
  }, [isOpen]);

  const loadLimits = async () => {
    setIsLoading(true);
    try {
      const saved = await getAutodraftLimits();
      setLimits(saved);
      setOriginalLimits(saved);
    } catch (e) {
      // Fallback handled by lib
    } finally {
      setIsLoading(false);
    }
  };

  // Update single position
  const updateLimit = (position: string, delta: number) => {
    const maxLimits = { QB: 4, RB: 10, WR: 11, TE: 5 };
    setLimits(prev => ({
      ...prev,
      [position]: Math.max(0, Math.min(maxLimits[position], prev[position] + delta))
    }));
  };

  // Save
  const handleSave = async () => {
    setIsSaving(true);
    try {
      await setAutodraftLimits(limits);
      setOriginalLimits(limits);
      onClose(); // Close after save
    } catch (e) {
      // Show error
    } finally {
      setIsSaving(false);
    }
  };

  // Reset to defaults
  const handleReset = () => {
    setLimits(DEFAULT_AUTODRAFT_LIMITS);
  };

  // Render using VX Modal
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Position Limits" size="lg">
      {/* Description */}
      {/* Position rows */}
      {/* Action buttons */}
    </Modal>
  );
}
```

### 2. Position row sub-component

```typescript
interface PositionRowProps {
  position: string;
  value: number;
  maxValue: number;
  onChange: (delta: number) => void;
}

function PositionRow({ position, value, maxValue, onChange }: PositionRowProps) {
  const color = POSITION_COLORS[position];
  const atMin = value <= 0;
  const atMax = value >= maxValue;

  return (
    <div className="flex items-center justify-between py-4">
      <div>
        <div style={{ color }} className="text-lg font-bold">{position}</div>
        <div className="text-sm text-gray-400">Maximum</div>
      </div>
      <div className="flex items-center gap-4">
        <button 
          onClick={() => onChange(-1)} 
          disabled={atMin}
          className="w-10 h-10 rounded-lg bg-gray-700 disabled:opacity-50"
        >
          −
        </button>
        <span className="w-8 text-center text-xl font-bold">{value}</span>
        <button 
          onClick={() => onChange(1)} 
          disabled={atMax}
          className="w-10 h-10 rounded-lg bg-gray-700 disabled:opacity-50"
        >
          +
        </button>
      </div>
    </div>
  );
}
```

### 3. Update ProfileTabVX

```typescript
// In ProfileTabVX.tsx

const [showAutodraftModal, setShowAutodraftModal] = useState(false);

// Update menu item click handler
const handleMenuClick = (path: string, id: string) => {
  if (id === 'autodraft') {
    setShowAutodraftModal(true);
    return;
  }
  // ... other navigation
};

// Render modal
return (
  <>
    {/* Existing profile content */}
    
    <AutodraftLimitsModalVX 
      isOpen={showAutodraftModal} 
      onClose={() => setShowAutodraftModal(false)} 
    />
  </>
);
```

---

## Button States

| Button | Condition | State |
|--------|-----------|-------|
| Decrement (−) | value === 0 | Disabled |
| Increment (+) | value === max | Disabled |
| Reset | limits === defaults | Disabled |
| Save | no changes OR saving | Disabled |
| Save | saving | Show spinner |

---

## Error Handling

1. **Load fails**: Use defaults, continue silently (lib handles fallback)
2. **Save fails**: Show error message, keep modal open so user can retry
3. **Network offline**: localStorage save succeeds, Firebase syncs later

---

## Testing Checklist

- [ ] Modal opens from Profile menu
- [ ] Limits load on open
- [ ] Increment/decrement work
- [ ] Min/max bounds enforced (buttons disable)
- [ ] Save persists changes
- [ ] Reset returns to defaults
- [ ] Modal closes after save
- [ ] Reopening shows saved values
- [ ] Works offline (localStorage)
- [ ] Hidden scrollbars on mobile
- [ ] Touch targets 44px minimum

---

## Summary

**Build:**
1. `AutodraftLimitsModalVX.tsx` - fresh component using VX patterns
2. Update `ProfileTabVX.tsx` - add modal state and render

**Use:**
- Data functions from `lib/autodraftLimits.js`
- VX `Modal` component
- VX `Button` component
- VX color/position constants

**Don't:**
- Copy UI from `pages/autodraft-limits.js`
- Navigate away from Profile tab
- Match competitor design exactly

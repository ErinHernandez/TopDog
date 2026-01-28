# Timer Hooks Documentation

Custom React hooks for managing timer-based state patterns across the application.

## Hooks Overview

| Hook | Purpose | Location |
|------|---------|----------|
| `useCountdown` | Countdown timer (e.g., resend cooldowns) | `components/vx2/hooks/ui/useCountdown.ts` |
| `useTemporaryState` | Auto-resetting state (e.g., "Saved!" feedback) | `components/vx2/hooks/ui/useTemporaryState.ts` |

---

## useCountdown

A countdown timer hook that decrements every second until reaching zero.

### Import

```typescript
import { useCountdown } from '@/components/vx2/hooks/ui';
```

### Interface

```typescript
interface UseCountdownOptions {
  onComplete?: () => void;  // Callback when countdown reaches 0
  autoStart?: boolean;      // Start immediately on mount (default: false)
}

interface UseCountdownReturn {
  seconds: number;          // Current countdown value
  isActive: boolean;        // Whether countdown is running
  start: () => void;        // Start/restart countdown
  stop: () => void;         // Stop countdown
  reset: () => void;        // Reset to 0 without starting
}
```

### Usage

```tsx
function ResendButton() {
  const { seconds, isActive, start } = useCountdown(60, { autoStart: true });

  return (
    <button onClick={start} disabled={isActive}>
      {isActive ? `Resend in ${seconds}s` : 'Resend Code'}
    </button>
  );
}
```

### Use Cases

- OTP resend cooldowns
- Email verification cooldowns
- Rate limiting feedback
- Session timeouts

---

## useTemporaryState

State that automatically resets to a default value after a specified delay.

### Import

```typescript
import { useTemporaryState } from '@/components/vx2/hooks/ui';
```

### Interface

```typescript
type UseTemporaryStateReturn<T> = [
  value: T,                              // Current value
  setValue: (newValue: T) => void,       // Set value (auto-resets after delay)
  setValuePermanent: (newValue: T) => void  // Set without auto-reset
];
```

### Usage

```tsx
function SaveButton() {
  const [saved, setSaved] = useTemporaryState(false, 2000);

  const handleSave = async () => {
    await saveData();
    setSaved(true);  // Automatically resets to false after 2000ms
  };

  return (
    <button onClick={handleSave}>
      {saved ? '✓ Saved!' : 'Save'}
    </button>
  );
}
```

### With Permanent Setter

```tsx
function ShakeInput() {
  const [shakeError, setShakeError, setShakeErrorPermanent] = useTemporaryState(false, 500);

  // Trigger shake animation (auto-resets)
  const triggerShake = () => setShakeError(true);

  // Reset immediately when modal closes (no delay)
  const onClose = () => setShakeErrorPermanent(false);

  return (
    <input className={shakeError ? 'animate-shake' : ''} />
  );
}
```

### Use Cases

- "Saved!" confirmation feedback
- Error shake animations
- Temporary success/error states
- Toast-like notifications
- Copy-to-clipboard feedback

---

## Migration Guide

### Before (manual setTimeout)

```typescript
const [cooldown, setCooldown] = useState(60);

useEffect(() => {
  if (cooldown > 0) {
    const timer = setTimeout(() => setCooldown(c => c - 1), 1000);
    return () => clearTimeout(timer);
  }
}, [cooldown]);

const handleResend = () => {
  setCooldown(60);
  resendCode();
};
```

### After (useCountdown)

```typescript
const { seconds: cooldown, isActive, start } = useCountdown(60, { autoStart: true });

const handleResend = () => {
  start();
  resendCode();
};
```

---

### Before (manual setTimeout for feedback)

```typescript
const [saved, setSaved] = useState(false);

const handleSave = async () => {
  await saveData();
  setSaved(true);
  setTimeout(() => setSaved(false), 2000);
};
```

### After (useTemporaryState)

```typescript
const [saved, setSaved] = useTemporaryState(false, 2000);

const handleSave = async () => {
  await saveData();
  setSaved(true);  // Auto-resets after 2000ms
};
```

---

## Files Using These Hooks

### useCountdown

| File | Purpose |
|------|---------|
| `ForgotPasswordModal.tsx` | Password reset cooldown |
| `SignUpScreenVX2.tsx` | Email verification cooldown |
| `SignUpModal.tsx` | Email verification cooldown |
| `PhoneAuthModal.tsx` | SMS resend cooldown |
| `PaystackWithdrawModalVX2.tsx` | OTP resend cooldown |

### useTemporaryState

| File | Purpose |
|------|---------|
| `LoginScreenVX2.tsx` | Shake animation on error |
| `SignInModal.tsx` | Shake animation on error |
| `ProfileSettingsModal.tsx` | "Saved" feedback, email sent confirmation |
| `MyTeamsTabVX2.tsx` | Custom order saved feedback |

---

## Why These Hooks?

### Problem

The `react-hooks/set-state-in-effect` ESLint rule flags setState calls inside useEffect, even when they're inside async callbacks like `setTimeout`. This leads to:

1. False positive warnings scattered across the codebase
2. Duplicated timer logic in multiple components
3. Potential memory leaks if cleanup isn't handled properly

### Solution

Centralized hooks that:

1. Contain the ESLint disable comment in one place
2. Handle cleanup automatically on unmount
3. Provide a clean, declarative API
4. Are thoroughly tested and documented

---

## Best Practices

1. **Use `autoStart: true`** when the countdown should begin immediately (e.g., after sending a code)

2. **Use `setValuePermanent`** when you need to reset state without triggering the auto-reset timer (e.g., on modal close)

3. **Add setters to dependency arrays** when used in `useCallback` or `useEffect`:
   ```typescript
   const triggerShake = useCallback(() => {
     setShakeError(true);
   }, [setShakeError]);  // Include setter in deps
   ```

4. **Choose appropriate delays**:
   - Shake animations: 300-500ms
   - "Saved" feedback: 2000-3000ms
   - Resend cooldowns: 30-60 seconds

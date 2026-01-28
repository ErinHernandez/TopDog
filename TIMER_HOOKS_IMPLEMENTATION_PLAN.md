# Timer Hooks Implementation Plan

## Overview

This plan outlines the creation of two custom hooks to abstract timer patterns and eliminate ESLint false positives across the codebase.

---

## Phase 1: Create Custom Hooks

### Hook 1: `useCountdown`

**Location:** `components/vx2/hooks/ui/useCountdown.ts`

**Purpose:** Countdown timer that decrements every second until reaching zero.

**Interface:**
```typescript
interface UseCountdownOptions {
  onComplete?: () => void;  // Callback when countdown reaches 0
}

function useCountdown(
  initialSeconds: number,
  options?: UseCountdownOptions
): {
  seconds: number;          // Current countdown value
  isActive: boolean;        // Whether countdown is running
  start: () => void;        // Start/restart countdown
  stop: () => void;         // Stop countdown
  reset: () => void;        // Reset to initial value without starting
}
```

**Implementation Notes:**
- Single ESLint disable comment at the hook level
- Uses `setTimeout` with recursive pattern (not `setInterval`) for accuracy
- Functional state updates to prevent stale closures
- Proper cleanup on unmount

---

### Hook 2: `useTemporaryState`

**Location:** `components/vx2/hooks/ui/useTemporaryState.ts`

**Purpose:** State that automatically resets to default value after a delay.

**Interface:**
```typescript
function useTemporaryState<T>(
  defaultValue: T,
  resetDelayMs: number
): [
  value: T,                           // Current value
  setValue: (newValue: T) => void,    // Set value (auto-resets after delay)
  setValuePermanent: (newValue: T) => void  // Set without auto-reset
]
```

**Implementation Notes:**
- Single ESLint disable comment at the hook level
- Clears previous timeout when setValue called again
- Cleanup on unmount to prevent memory leaks
- Optional permanent setter for edge cases

---

## Phase 2: Migrate Countdown Timer Implementations

### Files to Migrate (5 total)

| File | Current State | New Usage |
|------|---------------|-----------|
| `components/vx2/auth/components/ForgotPasswordModal.tsx` | `cooldown` state + useEffect | `useCountdown(60)` |
| `components/vx2/auth/components/SignUpScreenVX2.tsx` | `cooldown` state + useEffect | `useCountdown(60)` |
| `components/vx2/auth/components/SignUpModal.tsx` | `cooldown` state + useEffect | `useCountdown(60)` |
| `components/vx2/auth/components/PhoneAuthModal.tsx` | `resendCooldown` state + useEffect | `useCountdown(60)` |
| `components/vx2/modals/PaystackWithdrawModalVX2.tsx` | `resendCooldown` state + useEffect | `useCountdown(60)` |

### Migration Pattern

**Before:**
```typescript
const [cooldown, setCooldown] = useState(0);

useEffect(() => {
  if (cooldown > 0) {
    const timer = setTimeout(() => setCooldown(c => c - 1), 1000);
    return () => clearTimeout(timer);
  }
}, [cooldown]);

// Usage: setCooldown(60) to start
// Display: cooldown > 0 ? `${cooldown}s` : 'Resend'
```

**After:**
```typescript
const { seconds, isActive, start } = useCountdown(60);

// Usage: start() to begin countdown
// Display: isActive ? `${seconds}s` : 'Resend'
```

### Detailed Changes Per File

#### 1. ForgotPasswordModal.tsx
- **Remove:** Lines ~358-365 (useState + useEffect)
- **Add:** `import { useCountdown } from '@/components/vx2/hooks/ui/useCountdown'`
- **Replace:** `setCooldown(60)` → `start()`
- **Replace:** `cooldown > 0` → `isActive`
- **Replace:** `cooldown` display → `seconds`

#### 2. SignUpScreenVX2.tsx
- **Remove:** Lines ~699-706 (useState + useEffect)
- **Add:** Import useCountdown
- **Replace:** Same pattern as above

#### 3. SignUpModal.tsx
- **Remove:** Lines ~670-677 (useState + useEffect)
- **Add:** Import useCountdown
- **Replace:** Same pattern as above

#### 4. PhoneAuthModal.tsx
- **Remove:** Lines ~399-406 (useState + useEffect)
- **Add:** Import useCountdown
- **Replace:** `setResendCooldown(60)` → `start()`
- **Replace:** `resendCooldown > 0` → `isActive`

#### 5. PaystackWithdrawModalVX2.tsx
- **Remove:** Lines ~808-815 (useState + useEffect)
- **Add:** Import useCountdown
- **Replace:** Same pattern as PhoneAuthModal

---

## Phase 3: Migrate UI Feedback Timer Implementations

### Files to Migrate (4 total)

| File | Current Pattern | New Usage |
|------|-----------------|-----------|
| `components/vx2/auth/components/LoginScreenVX2.tsx` | `shakeError` + setTimeout | `useTemporaryState(false, 500)` |
| `components/vx2/auth/components/SignInModal.tsx` | `shakeError` + setTimeout | `useTemporaryState(false, 500)` |
| `components/vx2/auth/components/ProfileSettingsModal.tsx` | `saved` + setTimeout | `useTemporaryState(false, 2000)` |
| `components/vx2/tabs/my-teams/MyTeamsTabVX2.tsx` | `justSaved` + setTimeout | `useTemporaryState(false, 2000)` |

### Migration Pattern

**Before:**
```typescript
const [shakeError, setShakeError] = useState(false);

const triggerShake = useCallback(() => {
  setShakeError(true);
  setTimeout(() => setShakeError(false), 500);
}, []);
```

**After:**
```typescript
const [shakeError, setShakeError] = useTemporaryState(false, 500);

const triggerShake = useCallback(() => {
  setShakeError(true);  // Auto-resets after 500ms
}, [setShakeError]);
```

### Detailed Changes Per File

#### 1. LoginScreenVX2.tsx
- **Remove:** setTimeout in triggerShake callback (Line ~308)
- **Add:** Import useTemporaryState
- **Replace:** `useState(false)` → `useTemporaryState(false, 500)`
- **Simplify:** triggerShake to just `setShakeError(true)`

#### 2. SignInModal.tsx
- **Remove:** setTimeout in triggerShake callback (Line ~299)
- **Add:** Import useTemporaryState
- **Replace:** Same pattern as LoginScreenVX2

#### 3. ProfileSettingsModal.tsx
- **Remove:** Multiple setTimeout calls (Lines ~61, ~374, ~401)
- **Add:** Import useTemporaryState
- **Replace:** `useState(false)` for `saved` and `emailSent` → useTemporaryState
- **Note:** `emailSent` uses 30000ms, `saved` uses 2000-3000ms

#### 4. MyTeamsTabVX2.tsx
- **Remove:** setTimeout (Line ~1064)
- **Add:** Import useTemporaryState
- **Replace:** `justSaved` state → useTemporaryState

---

## Phase 4: Update Index Exports

**File:** `components/vx2/hooks/ui/index.ts`

**Add:**
```typescript
export { useCountdown } from './useCountdown';
export type { UseCountdownOptions, UseCountdownReturn } from './useCountdown';

export { useTemporaryState } from './useTemporaryState';
```

---

## Phase 5: Testing & Verification

### Manual Testing Checklist

- [ ] ForgotPasswordModal: Resend cooldown works correctly
- [ ] SignUpScreenVX2: Email verification cooldown works
- [ ] SignUpModal: Resend cooldown works
- [ ] PhoneAuthModal: SMS resend cooldown works
- [ ] PaystackWithdrawModalVX2: OTP resend cooldown works
- [ ] LoginScreenVX2: Shake animation triggers on error
- [ ] SignInModal: Shake animation triggers on error
- [ ] ProfileSettingsModal: "Saved" feedback appears and disappears
- [ ] MyTeamsTabVX2: "Saved" feedback appears and disappears

### Lint Verification

```bash
npm run lint 2>&1 | grep -c "set-state-in-effect"
```

**Expected:** Reduction from ~11 to 2 (only in the new hook files, with intentional disable comments)

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Behavioral regression | Low | Medium | Test each migration manually |
| Import path issues | Low | Low | Use consistent alias paths |
| Edge cases in hook logic | Medium | Low | Handle unmount cleanup |
| Dependency array issues | Low | Medium | Use useCallback for setters |

---

## Rollback Plan

If issues are discovered post-migration:

1. Revert individual file changes (git checkout)
2. Keep hooks for future use
3. Add inline ESLint disables as fallback

---

## Timeline Estimate

| Phase | Estimated Time |
|-------|---------------|
| Phase 1: Create hooks | 15 min |
| Phase 2: Migrate countdown timers | 20 min |
| Phase 3: Migrate UI feedback timers | 15 min |
| Phase 4: Update exports | 2 min |
| Phase 5: Testing | 15 min |
| **Total** | **~1 hour** |

---

## Summary

**New Files Created:**
- `components/vx2/hooks/ui/useCountdown.ts`
- `components/vx2/hooks/ui/useTemporaryState.ts`

**Files Modified:**
- `components/vx2/hooks/ui/index.ts` (add exports)
- 5 files for countdown migration
- 4 files for UI feedback migration

**ESLint Warnings Addressed:** 11 → 2 (contained in hooks with documented disables)

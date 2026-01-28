# Comprehensive Lint Fix Plan

## Executive Summary

**Current Status:** 30 errors, 358 warnings remaining
**Target:** 0 errors, reduced warnings
**Risk Level:** Medium (complex hook interdependencies)

---

## Research Findings

### 1. Circular Dependency Patterns Identified

The codebase has several **legitimate circular dependencies** between callback functions:

| Pattern | Files Affected | Complexity |
|---------|---------------|------------|
| Reconnect loop | `useConnectionStatus.ts` | High |
| Timer callbacks | `useSyncedDraftTimer.ts` | Medium |
| Payment polling | `DepositModalVX2.tsx` | Medium |
| Data fetch loop | `useMyTeams.ts` | Medium |

### 2. Best Practices from Research

Based on [React documentation](https://react.dev/reference/eslint-plugin-react-hooks/lints/exhaustive-deps) and [Kent C. Dodds' guidelines](https://kentcdodds.com/blog/react-hooks-pitfalls):

1. **Never disable the exhaustive-deps rule** - it catches real bugs
2. **Use refs for stable callback references** in circular dependencies
3. **Move functions inside effects** when they're only used there
4. **Use callback form of setState** to remove state dependencies
5. **Wrap callbacks in useCallback** with minimal dependencies

---

## Fix Categories

### Category A: Simple Dependency Fixes (Low Risk)
Remove/add dependencies without structural changes.

### Category B: Function Memoization (Medium Risk)
Wrap functions in useCallback to stabilize references.

### Category C: Ref-Based Pattern (Medium Risk)
Use useRef to break circular dependency chains.

### Category D: Architectural Refactor (High Risk)
Restructure hook internals to eliminate patterns.

---

## Detailed Fix Plan

### Phase 1: Simple Fixes (Immediate)

#### 1.1 Remove Unnecessary Dependencies

| File | Line | Fix | Risk |
|------|------|-----|------|
| `useConnectionStatus.ts` | 299 | Remove `db` | Low |
| `useConnectionStatus.ts` | 337 | Remove `db` | Low |
| `useSyncedDraftTimer.ts` | 191 | Remove `db` | Low |
| `useSyncedDraftTimer.ts` | 293 | Remove `db` | Low |
| `DepositModalVX2.tsx` | 781 | Remove `useNewCard` | Low |
| `useMyTeams.ts` | 343 | Remove `refreshInterval` | Low |
| `useMyTeams.ts` | 415, 420 | Remove `refreshKey` | Low |

#### 1.2 Add Missing Simple Dependencies

| File | Line | Add | Risk |
|------|------|-----|------|
| `useDraftAlerts.ts` | 103 | Add `participants` | Low |
| `VoucherStep.tsx` | 47 | Add `handleSuccessfulPayment` | Medium |
| `VoucherStep.tsx` | 51 | Add `router` | Medium |
| `statistics.tsx` | 65 | Add `fetchUserStats` | Medium |

---

### Phase 2: Function Memoization (Medium)

#### 2.1 DepositModalVX2.tsx - loadSavedMethods

**Current Issue:** Function called in useEffect but not memoized

**Fix:**
```typescript
// Move BEFORE the useEffect and wrap in useCallback
const loadSavedMethods = useCallback(async () => {
  try {
    const response = await fetch(`/api/stripe/payment-methods?userId=${userId}`);
    const data = await response.json();
    if (data.paymentMethods) {
      setSavedMethods(data.paymentMethods);
    }
  } catch (err) {
    logger.error('Failed to load payment methods', err);
  }
}, [userId]);

// Then update useEffect
useEffect(() => {
  if (isOpen && userId) {
    loadSavedMethods();
  }
}, [isOpen, userId, loadSavedMethods, displayCurrency]);
```

#### 2.2 PaystackDepositModalVX2.tsx - pollPaymentStatus

**Current Issue:** Missing dependency on `pollPaymentStatus` in useCallback

**Fix:** Wrap polling function in useCallback with proper dependencies

#### 2.3 AuthContext.tsx - withTimeout

**Current Issue:** Missing dependency on utility function

**Fix:** Move `withTimeout` outside component or wrap in useCallback

---

### Phase 3: Circular Dependency Resolution (High)

#### 3.1 useConnectionStatus.ts - Reconnection Loop

**Pattern:** `scheduleReconnect` ↔ `attemptReconnect` circular call

**Fix Strategy: Ref-based callback pattern**

```typescript
// 1. Create ref for scheduleReconnect
const scheduleReconnectRef = useRef<() => void>();

// 2. Define scheduleReconnect with attemptReconnect dependency
const scheduleReconnect = useCallback(() => {
  // ... existing implementation
  setTimeout(() => {
    attemptReconnect();
  }, delay);
}, [attemptReconnect, ...otherDeps]);

// 3. Update ref when scheduleReconnect changes
useEffect(() => {
  scheduleReconnectRef.current = scheduleReconnect;
}, [scheduleReconnect]);

// 4. Define attemptReconnect using ref (breaks circular dep)
const attemptReconnect = useCallback(async () => {
  // ... existing implementation
  if (shouldRetry) {
    scheduleReconnectRef.current?.();
  }
}, [reconnectAttempts, maxReconnectAttempts]); // No scheduleReconnect!
```

#### 3.2 TeamListView.js - getNFLTeams Function

**Issue:** Function recreated every render, causing useMemo invalidation

**Fix:**
```typescript
// Option A: Move inside useMemo
const getFilteredResults = useMemo(() => {
  const getNFLTeams = () => {
    // Implementation
  };

  // Use getNFLTeams here
  return [...getNFLTeams(), ...players];
}, [debouncedSearchQuery, allPlayers, selectedPlayers, selectedNFLTeams]);

// Option B: Memoize with useCallback
const getNFLTeams = useCallback(() => {
  // Implementation
}, []); // Static function
```

#### 3.3 useMyTeams.ts - Conditional Hook Pattern

**Issue:** Firebase hook called unconditionally but result conditionally used

**Fix:** Early return pattern
```typescript
export function useMyTeams(): UseMyTeamsResult {
  // Feature flag determines implementation
  if (useFirebaseTeams) {
    return useMyTeamsWithFirebase();
  }

  // Mock implementation follows
  const [teams, setTeams] = useState<MyTeam[]>([]);
  // ... rest of mock implementation
}
```

---

### Phase 4: Ref Cleanup Issues

#### 4.1 useSyncedDraftTimer.ts - Stale Ref State

**Issue:** Refs not reset on unmount, causing stale state on remount

**Fix:**
```typescript
// Add cleanup effect
useEffect(() => {
  return () => {
    hasExpiredRef.current = false;
    gracePeriodTriggeredRef.current = false;
  };
}, []);
```

#### 4.2 useStableViewportHeight.ts - timeoutRef Cleanup

**Issue:** Ref value may change before cleanup runs

**Fix:**
```typescript
useEffect(() => {
  // Capture ref value at effect start
  const currentTimeout = timeoutRef.current;

  return () => {
    // Use captured value in cleanup
    if (currentTimeout) {
      clearTimeout(currentTimeout);
    }
  };
}, []);
```

---

## Implementation Order

### Week 1: Low-Risk Fixes
1. ✅ Remove all unnecessary `db` dependencies
2. ✅ Remove `useNewCard`, `refreshInterval`, `refreshKey`
3. ✅ Add simple missing dependencies

### Week 2: Medium-Risk Fixes
1. Memoize `loadSavedMethods` with useCallback
2. Fix `pollPaymentStatus` dependency
3. Move `withTimeout` outside component

### Week 3: High-Risk Fixes
1. Implement ref pattern for `useConnectionStatus.ts`
2. Refactor `useMyTeams.ts` conditional pattern
3. Add ref cleanup to timer hooks

### Week 4: Testing & Verification
1. Run full lint check
2. Manual testing of affected features:
   - Draft room reconnection
   - Payment flows
   - My Teams page
3. Monitor for regressions

---

## Risk Assessment Matrix

| Fix | Impact on Feature | Likelihood of Bug | Recommended Testing |
|-----|------------------|-------------------|---------------------|
| Remove `db` deps | None | Very Low | Unit tests |
| Add simple deps | Potential re-renders | Low | Integration tests |
| Ref pattern | Connection behavior | Medium | E2E reconnection test |
| Hook conditional | Data loading | Medium | E2E My Teams test |
| Memoize callbacks | Performance | Low | Performance benchmarks |

---

## Rollback Strategy

If any fix causes production issues:

1. **Immediate:** Revert specific file to previous commit
2. **Short-term:** Add eslint-disable comment with TODO
3. **Long-term:** Redesign hook architecture

---

## Files Requiring Changes

### Priority 1 (Critical Path)
- `components/vx2/draft-logic/hooks/useConnectionStatus.ts`
- `components/vx2/modals/DepositModalVX2.tsx`
- `components/vx2/hooks/data/useMyTeams.ts`

### Priority 2 (Important)
- `components/vx2/draft-logic/hooks/useSyncedDraftTimer.ts`
- `components/vx2/draft-logic/hooks/useDraftAlerts.ts`
- `components/vx2/auth/context/AuthContext.tsx`

### Priority 3 (Cleanup)
- `components/mobile/tabs/MyTeams/TeamListView.js`
- `components/vx2/modals/PayMongoWithdrawModalVX2.tsx`
- `pages/statistics.tsx`

---

## Success Metrics

- [ ] 0 ESLint errors
- [ ] < 300 ESLint warnings
- [ ] All payment flows functional
- [ ] Draft reconnection working
- [ ] No performance regressions
- [ ] CI/CD pipeline passing

---

## Sources

- [React exhaustive-deps documentation](https://react.dev/reference/eslint-plugin-react-hooks/lints/exhaustive-deps)
- [Kent C. Dodds - React Hooks Pitfalls](https://kentcdodds.com/blog/react-hooks-pitfalls)
- [DhiWise - React Hooks Exhaustive Deps](https://www.dhiwise.com/post/the-complete-roadmap-to-react-hooks-exhaustive-deps)

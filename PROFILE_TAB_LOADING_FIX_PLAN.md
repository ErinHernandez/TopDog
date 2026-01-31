# Profile Tab Loading Fix Plan

**Issue**: Profile tab shows skeleton loaders indefinitely instead of displaying actual content.

**Investigation Date**: January 2026

---

## Executive Summary

The Profile tab's infinite loading is caused by a cascade of loading states that can get stuck when authentication, profile loading, or balance fetching fails to complete properly. This plan addresses the root causes and implements defensive patterns to prevent loading states from getting stuck.

---

## Root Cause Analysis

### Loading State Chain

The `ProfileTabVX2` component shows a skeleton when `isLoading` is `true`. This state is computed in `useUser()`:

```typescript
// useUser.ts line 264-266
const isLoading = authUser?.isAnonymous
  ? false  // Anonymous users: never show loading
  : (authIsLoading || balanceLoading);
```

This means loading is stuck if EITHER:
1. `authIsLoading` stays `true`
2. `balanceLoading` stays `true`

### Issue #1: AuthContext Loading State Cascade

In `AuthContext.tsx`, the `isLoading` exposed to consumers is:

```typescript
// Line 930
isLoading: state.isLoading || state.isInitializing
```

The reducer states:
- Initial: `isLoading: true, isInitializing: true`
- `AUTH_STATE_CHANGED` with user: `isLoading: true` (waiting for profile)
- `PROFILE_LOADED`: `isLoading: false`
- `INITIALIZATION_COMPLETE`: `isLoading: false, isInitializing: false`

**Problem**: If profile loading fails silently without dispatching either `PROFILE_LOADED` or `INITIALIZATION_COMPLETE`, loading stays stuck.

### Issue #2: useSafeDefaults Early Return

```typescript
// Line 318
const useSafeDefaults = isBuildPhase || isSSR || isVercelBuild || !isMounted;

// Line 323-328
useEffect(() => {
  if (useSafeDefaults) return;  // <-- Early return, no INITIALIZATION_COMPLETE dispatched!
  ...
});
```

If `isMounted` never becomes `true` (due to component unmounting before effect runs), the auth effect never runs and `INITIALIZATION_COMPLETE` is never dispatched.

### Issue #3: Profile Data Extraction Can Throw

```typescript
// Lines 350-376
if (profileDoc && profileDoc.exists()) {
  const profileData = profileDoc.data();
  const profile: UserProfile = {
    ...
    createdAt: profileData.createdAt?.toDate() || new Date(),  // Can throw!
    ...
  };
  dispatch({ type: 'PROFILE_LOADED', payload: { profile } });
}
```

If `toDate()` throws (e.g., corrupt Firestore data), the dispatch never happens, and loading stays stuck.

### Issue #4: Balance Loading Timeout

```typescript
// useUser.ts lines 172-178
const timeoutId = setTimeout(() => {
  if (!hasReceivedData) {
    logger.warn('Balance listener timeout - using default balance');
    setBalanceCents(0);
    setBalanceLoading(false);  // Good - this resolves
  }
}, 5000);
```

This is correctly implemented with a 5s timeout. However, if the auth loading is stuck, this doesn't help.

### Issue #5: Race Conditions

The auth effect doesn't use an ignore flag pattern, meaning:
1. User logs in
2. Auth effect starts loading profile
3. User logs out before profile loads
4. Auth effect completes and dispatches `PROFILE_LOADED`
5. State is inconsistent

---

## Best Practices Reference

Based on industry standards (see Sources below):

1. **Always resolve loading states** - Every async operation must eventually set loading to false
2. **Use cleanup/ignore patterns** - Prevent stale updates after unmount or dependency change
3. **Implement defensive timeouts** - Maximum time a loading state can persist
4. **Separate concerns** - `isInitializing` for one-time setup, `isLoading` for ongoing operations
5. **Log stuck states** - Make debugging easier with detailed state logging

---

## Implementation Plan

### Fix 1: Add Global Loading Timeout in useUser (Safety Net)

**Location**: `components/vx2/hooks/data/useUser.ts`

**Change**: Add a 15-second maximum loading timeout that forces `isLoading` to `false` with a warning.

```typescript
// Add after line 266
useEffect(() => {
  if (!isLoading) return;

  const timeoutId = setTimeout(() => {
    logger.warn('Loading state stuck for 15s - forcing resolution');
    // Force auth state to complete if stuck
    if (authIsLoading) {
      logger.warn('Auth is still loading after 15s - this indicates a bug in AuthContext');
    }
    if (balanceLoading) {
      setBalanceLoading(false);
    }
  }, 15000);

  return () => clearTimeout(timeoutId);
}, [isLoading, authIsLoading, balanceLoading]);
```

**Priority**: HIGH - This is a safety net that prevents infinite loading in production.

### Fix 2: Ensure All Code Paths Dispatch in AuthContext

**Location**: `components/vx2/auth/context/AuthContext.tsx`

**Change**: Wrap profile data extraction in try-catch and always dispatch a resolution action.

```typescript
// Replace lines 348-384 with:
try {
  if (profileDoc && profileDoc.exists()) {
    const profileData = profileDoc.data();
    // Safe extraction with fallbacks
    const profile: UserProfile = {
      uid: firebaseUser.uid,
      username: profileData.username || '',
      email: profileData.email || null,
      countryCode: profileData.countryCode || 'US',
      displayName: profileData.displayName || '',
      // Safe date extraction with try-catch per field
      createdAt: safeToDate(profileData.createdAt, new Date()),
      updatedAt: safeToDate(profileData.updatedAt, new Date()),
      // ... rest of fields
    };
    dispatch({ type: 'PROFILE_LOADED', payload: { profile } });
  } else {
    logger.debug('[AuthContext] No profile document, completing initialization');
    dispatch({ type: 'INITIALIZATION_COMPLETE' });
  }
} catch (error) {
  logger.error('Error parsing profile data', error);
  dispatch({ type: 'INITIALIZATION_COMPLETE' });  // ALWAYS resolve
}

// Add helper function before the provider:
function safeToDate(timestamp: unknown, fallback: Date): Date {
  try {
    if (timestamp && typeof timestamp === 'object' && 'toDate' in timestamp) {
      return (timestamp as { toDate: () => Date }).toDate();
    }
    if (timestamp instanceof Date) return timestamp;
    return fallback;
  } catch {
    return fallback;
  }
}
```

**Priority**: HIGH - This is the most likely cause of the bug.

### Fix 3: Add Ignore Flag Pattern to Auth Effect

**Location**: `components/vx2/auth/context/AuthContext.tsx`

**Change**: Implement the React-recommended ignore flag pattern to prevent race conditions.

```typescript
// Replace lines 323-396 with:
useEffect(() => {
  if (useSafeDefaults) return;
  if (!auth) {
    dispatch({ type: 'INITIALIZATION_COMPLETE' });
    return;
  }

  let ignore = false;  // Race condition prevention

  const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
    if (ignore) return;  // Prevent stale updates

    if (firebaseUser) {
      const authUser = firebaseUserToAuthUser(firebaseUser);
      dispatch({ type: 'AUTH_STATE_CHANGED', payload: { user: authUser } });
      onAuthStateChange?.(authUser);

      // Load profile with timeout and ignore check
      if (db && !ignore) {
        try {
          const profileDoc = await withTimeout(
            getDoc(doc(db, 'users', firebaseUser.uid)),
            10000,
            'Profile load timed out'
          ).catch((error) => {
            logger.warn(`Profile load failed or timed out: ${error.message}`);
            return null;
          });

          if (ignore) return;  // Check again after async operation

          // ... rest of profile loading
        } catch (error) {
          if (ignore) return;
          logger.error('Error loading profile', error);
          dispatch({ type: 'INITIALIZATION_COMPLETE' });
        }
      } else if (!ignore) {
        dispatch({ type: 'INITIALIZATION_COMPLETE' });
      }
    } else {
      if (ignore) return;
      dispatch({ type: 'AUTH_STATE_CHANGED', payload: { user: null } });
      dispatch({ type: 'INITIALIZATION_COMPLETE' });
      onAuthStateChange?.(null);
    }
  });

  return () => {
    ignore = true;  // Mark as stale
    unsubscribe();
  };
}, [auth, db, onAuthStateChange, useSafeDefaults]);
```

**Priority**: MEDIUM - Prevents race conditions that could cause state inconsistencies.

### Fix 4: Add Loading State Debug Mode

**Location**: `components/vx2/hooks/data/useUser.ts`

**Change**: Add development-only logging to track what's blocking loading.

```typescript
// Add after isLoading calculation
if (process.env.NODE_ENV === 'development' && isLoading) {
  console.debug('[useUser] Loading state breakdown:', {
    authIsLoading,
    balanceLoading,
    isAnonymous: authUser?.isAnonymous,
    hasUser: !!authUser,
    authState: {
      isLoading: authIsLoading,
      isInitializing: /* need to expose from context */
    }
  });
}
```

**Priority**: LOW - Helps with debugging but not a fix.

### Fix 5: Handle useSafeDefaults Edge Case

**Location**: `components/vx2/auth/context/AuthContext.tsx`

**Change**: Dispatch `INITIALIZATION_COMPLETE` even when using safe defaults, but only after mount.

```typescript
// Add new effect after the main auth effect (around line 397):
useEffect(() => {
  // If we're using safe defaults but mounted, ensure we eventually resolve
  // This handles the edge case where auth is never initialized
  if (useSafeDefaults && isMounted) {
    const timeoutId = setTimeout(() => {
      if (state.isInitializing) {
        logger.warn('Auth never initialized - dispatching fallback INITIALIZATION_COMPLETE');
        dispatch({ type: 'INITIALIZATION_COMPLETE' });
      }
    }, 10000);

    return () => clearTimeout(timeoutId);
  }
}, [useSafeDefaults, isMounted, state.isInitializing]);
```

**Priority**: MEDIUM - Handles edge case where Firebase never initializes.

---

## Implementation Order

1. **Fix 2** (Ensure all code paths dispatch) - Most likely cause, immediate impact
2. **Fix 1** (Global loading timeout) - Safety net for production
3. **Fix 3** (Ignore flag pattern) - Prevents race conditions
4. **Fix 5** (useSafeDefaults edge case) - Handles Firebase init failures
5. **Fix 4** (Debug mode) - Helps with future debugging

---

## Testing Plan

### Unit Tests

1. Test that `useUser` returns `isLoading: false` within 20 seconds for all scenarios
2. Test that profile parsing errors don't block loading
3. Test that auth state changes mid-load don't cause race conditions

### Integration Tests

1. Test Profile tab renders content within 5 seconds on normal auth flow
2. Test Profile tab renders content within 20 seconds when Firestore is slow
3. Test Profile tab renders error state when profile can't be loaded

### Manual Testing

1. Sign in with valid credentials - Profile tab should load within 2 seconds
2. Sign in with user that has no Firestore profile - Should show defaults within 5 seconds
3. Sign in while offline - Should timeout and show defaults within 15 seconds
4. Rapidly switch tabs during loading - Should not cause stuck loading

---

## Monitoring

After implementation, add monitoring for:

1. Loading state duration histogram (target: p99 < 3s)
2. Count of loading timeout triggers (should be < 0.1% of loads)
3. Profile loading errors by type

---

## Sources

- [Handling user authentication with Firebase in React](https://blog.logrocket.com/user-authentication-firebase-react-apps/)
- [Authentication State Persistence | Firebase](https://firebase.google.com/docs/auth/web/auth-state-persistence)
- [Fixing Race Conditions in React with useEffect](https://maxrozen.com/race-conditions-fetching-data-react-with-useeffect)
- [Race conditions in useEffect with async: modern patterns for ReactJS 2025](https://medium.com/@sureshdotariya/race-conditions-in-useeffect-with-async-modern-patterns-for-reactjs-2025-9efe12d727b0)
- [Avoiding race conditions and memory leaks in React useEffect](https://dev.to/saranshk/avoiding-race-conditions-and-memory-leaks-in-react-useeffect-3mme)
- [useEffect – React Documentation](https://react.dev/reference/react/useEffect)

---

## Appendix: File Locations

| File | Purpose |
|------|---------|
| `components/vx2/tabs/profile/ProfileTabVX2.tsx` | Profile tab UI component |
| `components/vx2/hooks/data/useUser.ts` | User data hook with balance loading |
| `components/vx2/auth/context/AuthContext.tsx` | Authentication context and state |
| `components/vx2/auth/hooks/useAuth.ts` | Auth hook wrapper |
| `components/vx2/shell/AppShellVX2.tsx` | App shell with auth gate |
| `components/vx2/auth/components/AuthGateVX2.tsx` | Authentication gate component |

/**
 * useAuthToken Hook Tests
 *
 * Tests the Firebase ID token provider hook that supplies auth tokens
 * for WebSocket connections.
 *
 * @vitest-environment jsdom
 * @module __tests__/unit/api/use-auth-token
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

// ============================================================================
// HOISTED MOCKS
// ============================================================================

const { mockGetAuth, mockOnAuthStateChanged, mockGetIdToken, mockCurrentUser } = vi.hoisted(() => {
  const mockGetIdToken = vi.fn();

  const mockCurrentUser = {
    uid: 'test-user-123',
    email: 'test@example.com',
    getIdToken: mockGetIdToken,
  };

  return {
    mockGetAuth: vi.fn(() => ({ currentUser: mockCurrentUser })),
    mockOnAuthStateChanged: vi.fn(),
    mockGetIdToken,
    mockCurrentUser,
  };
});

vi.mock('firebase/auth', () => ({
  getAuth: mockGetAuth,
  onAuthStateChanged: mockOnAuthStateChanged,
}));

// ============================================================================
// IMPORT
// ============================================================================

import { useAuthToken } from '@/lib/auth/useAuthToken';

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Flush microtasks so resolved promises and React state updates propagate.
 */
const flushMicrotasks = () => new Promise<void>((r) => setTimeout(r, 0));

/**
 * Render the hook and flush the initial effect cycle.
 * React 19 defers useEffect; this ensures the effect runs before assertions.
 */
async function renderAndFlush() {
  let hook: ReturnType<typeof renderHook<ReturnType<typeof useAuthToken>>>;

  await act(async () => {
    hook = renderHook(() => useAuthToken());
    await flushMicrotasks();
  });

  return hook!;
}

/**
 * Same as renderAndFlush but works correctly when fake timers are active.
 * Uses vi.advanceTimersByTimeAsync instead of setTimeout-based flushing.
 */
async function renderAndFlushFakeTimers() {
  let hook: ReturnType<typeof renderHook<ReturnType<typeof useAuthToken>>>;

  await act(async () => {
    hook = renderHook(() => useAuthToken());
    await vi.advanceTimersByTimeAsync(1);
  });

  return hook!;
}

// ============================================================================
// TESTS — core auth behavior (real timers)
// ============================================================================

describe('useAuthToken', () => {
  let authStateCallback: ((user: unknown) => void) | null = null;

  beforeEach(() => {
    vi.clearAllMocks();
    authStateCallback = null;

    // Capture the auth state listener when the effect fires
    mockOnAuthStateChanged.mockImplementation((_auth: unknown, callback: (user: unknown) => void) => {
      authStateCallback = callback;
      return vi.fn(); // unsubscribe
    });

    mockGetIdToken.mockResolvedValue('mock-firebase-id-token-abc123');
  });

  it('should fetch token when user is authenticated', async () => {
    const { result } = await renderAndFlush();

    // Effect has fired — authStateCallback should be captured
    expect(authStateCallback).not.toBe(null);

    // Simulate Firebase reporting an authenticated user
    await act(async () => {
      authStateCallback?.(mockCurrentUser);
      await flushMicrotasks();
    });

    expect(result.current.isReady).toBe(true);
    expect(result.current.token).toBe('mock-firebase-id-token-abc123');
    expect(result.current.error).toBe(null);
    expect(mockGetIdToken).toHaveBeenCalledWith(false);
  });

  it('should set token=null when user signs out', async () => {
    const { result } = await renderAndFlush();

    // Sign in
    await act(async () => {
      authStateCallback?.(mockCurrentUser);
      await flushMicrotasks();
    });

    expect(result.current.token).toBe('mock-firebase-id-token-abc123');

    // Sign out
    await act(async () => {
      authStateCallback?.(null);
      await flushMicrotasks();
    });

    expect(result.current.token).toBe(null);
    expect(result.current.isReady).toBe(true);
    expect(result.current.error).toBe(null);
  });

  it('should set error when getIdToken fails', async () => {
    mockGetIdToken.mockRejectedValueOnce(new Error('Token refresh failed'));

    const { result } = await renderAndFlush();

    await act(async () => {
      authStateCallback?.(mockCurrentUser);
      await flushMicrotasks();
    });

    expect(result.current.isReady).toBe(true);
    expect(result.current.token).toBe(null);
    expect(result.current.error).toBe('Token refresh failed');
  });

  it('should provide a refresh function that forces token refresh', async () => {
    const { result } = await renderAndFlush();

    // Initial auth
    await act(async () => {
      authStateCallback?.(mockCurrentUser);
      await flushMicrotasks();
    });

    expect(result.current.token).toBe('mock-firebase-id-token-abc123');

    // Force refresh
    mockGetIdToken.mockResolvedValueOnce('refreshed-token-xyz789');

    let refreshedToken: string | null = null;
    await act(async () => {
      refreshedToken = await result.current.refresh();
    });

    expect(refreshedToken).toBe('refreshed-token-xyz789');
    expect(mockGetIdToken).toHaveBeenLastCalledWith(true); // forceRefresh=true
  });

  it('should register an auth state change listener on mount', async () => {
    await renderAndFlush();

    expect(mockOnAuthStateChanged).toHaveBeenCalledTimes(1);
    expect(mockOnAuthStateChanged).toHaveBeenCalledWith(
      expect.anything(), // auth instance
      expect.any(Function) // callback
    );
  });

  it('should unsubscribe from auth state on unmount', async () => {
    const unsubscribeMock = vi.fn();
    mockOnAuthStateChanged.mockImplementationOnce((_auth: unknown, callback: (user: unknown) => void) => {
      authStateCallback = callback;
      return unsubscribeMock;
    });

    const { unmount } = await renderAndFlush();
    unmount();

    expect(unsubscribeMock).toHaveBeenCalledTimes(1);
  });

  it('should handle Firebase not being initialized', async () => {
    // Only mockGetAuth needs to throw — the hook calls getAuth() first,
    // and if it throws, onAuthStateChanged is never reached.
    // IMPORTANT: do NOT add mockOnAuthStateChanged.mockImplementationOnce here;
    // unconsumed once-implementations leak into subsequent describe blocks.
    mockGetAuth.mockImplementationOnce(() => {
      throw new Error('Firebase: No Firebase App');
    });

    const { result } = await renderAndFlush();

    expect(result.current.error).toBe('Firebase auth not available');
    expect(result.current.isReady).toBe(true);
    expect(result.current.token).toBe(null);
  });
});

// ============================================================================
// TESTS — timer-based behavior (fake timers with shouldAdvanceTime)
// ============================================================================

describe('useAuthToken — timer behavior', () => {
  let authStateCallback: ((user: unknown) => void) | null = null;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers({ shouldAdvanceTime: true });
    authStateCallback = null;

    mockOnAuthStateChanged.mockImplementation((_auth: unknown, callback: (user: unknown) => void) => {
      authStateCallback = callback;
      return vi.fn();
    });

    mockGetIdToken.mockResolvedValue('mock-firebase-id-token-abc123');
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should schedule proactive token refresh at 55 minutes', async () => {
    const { result } = await renderAndFlushFakeTimers();

    await act(async () => {
      authStateCallback?.(mockCurrentUser);
      await vi.advanceTimersByTimeAsync(1);
    });

    expect(result.current.token).toBe('mock-firebase-id-token-abc123');

    const callsBeforeRefresh = mockGetIdToken.mock.calls.length;
    mockGetIdToken.mockResolvedValueOnce('proactively-refreshed-token');

    // Advance 55 minutes (TOKEN_LIFETIME - REFRESH_MARGIN)
    await act(async () => {
      await vi.advanceTimersByTimeAsync(55 * 60 * 1000);
    });

    // Should have triggered a forced refresh
    expect(mockGetIdToken.mock.calls.length).toBeGreaterThan(callsBeforeRefresh);
    expect(mockGetIdToken).toHaveBeenCalledWith(true);
  });

  it('should clear refresh timer on unmount', async () => {
    const { result, unmount } = await renderAndFlushFakeTimers();

    await act(async () => {
      authStateCallback?.(mockCurrentUser);
      await vi.advanceTimersByTimeAsync(1);
    });

    expect(result.current.token).toBe('mock-firebase-id-token-abc123');

    const callsBefore = mockGetIdToken.mock.calls.length;

    unmount();

    // Advance past refresh time — should NOT trigger a refresh
    await vi.advanceTimersByTimeAsync(60 * 60 * 1000);

    expect(mockGetIdToken.mock.calls.length).toBe(callsBefore);
  });

  it('should clear refresh timer when user signs out', async () => {
    const { result } = await renderAndFlushFakeTimers();

    await act(async () => {
      authStateCallback?.(mockCurrentUser);
      await vi.advanceTimersByTimeAsync(1);
    });

    expect(result.current.token).toBe('mock-firebase-id-token-abc123');

    const callsAfterLogin = mockGetIdToken.mock.calls.length;

    await act(async () => {
      authStateCallback?.(null);
      await vi.advanceTimersByTimeAsync(1);
    });

    // Advance past refresh time
    await vi.advanceTimersByTimeAsync(60 * 60 * 1000);

    // No new token fetches after sign-out
    expect(mockGetIdToken.mock.calls.length).toBe(callsAfterLogin);
  });
});

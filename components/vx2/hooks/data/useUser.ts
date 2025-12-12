/**
 * useUser - Data hook for current user data
 * 
 * Provides current user information and authentication state.
 * Currently uses mock data, designed for easy auth integration.
 * 
 * @example
 * ```tsx
 * const { user, isLoading, isAuthenticated } = useUser();
 * ```
 */

import { useState, useEffect, useCallback } from 'react';

// ============================================================================
// TYPES
// ============================================================================

/**
 * User profile data
 */
export interface UserProfile {
  /** Unique identifier */
  id: string;
  /** Display name */
  displayName: string;
  /** Email address */
  email: string;
  /** Account balance in cents */
  balanceCents: number;
  /** Formatted balance */
  balanceFormatted: string;
  /** Avatar URL (optional) */
  avatarUrl?: string;
  /** Account creation date */
  createdAt: string;
  /** Whether email is verified */
  emailVerified: boolean;
  /** Whether phone is verified */
  phoneVerified: boolean;
  /** Phone number (if set) */
  phone?: string;
}

/**
 * Hook return type
 */
export interface UseUserResult {
  /** Current user (null if not authenticated) */
  user: UserProfile | null;
  /** Whether data is loading */
  isLoading: boolean;
  /** Whether user is authenticated */
  isAuthenticated: boolean;
  /** Error message if fetch failed */
  error: string | null;
  /** Refetch user data */
  refetch: () => Promise<void>;
  /** Log out user */
  logout: () => void;
}

// ============================================================================
// MOCK DATA
// ============================================================================

const MOCK_USER: UserProfile = {
  id: 'user-123',
  displayName: 'TopDogPlayer',
  email: 'player@topdog.dog',
  balanceCents: 125000,
  balanceFormatted: '$1,250.00',
  createdAt: new Date(Date.now() - 86400000 * 90).toISOString(),
  emailVerified: true,
  phoneVerified: false,
};

// ============================================================================
// MOCK FETCH
// ============================================================================

async function fetchUser(): Promise<UserProfile | null> {
  await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 100));
  // Simulate authenticated user
  return MOCK_USER;
}

// ============================================================================
// HOOK
// ============================================================================

/**
 * Hook for fetching and managing current user data
 */
export function useUser(): UseUserResult {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const data = await fetchUser();
      setUser(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refetch = useCallback(async () => {
    await fetchData();
  }, [fetchData]);

  const logout = useCallback(() => {
    setUser(null);
  }, []);

  return {
    user,
    isLoading,
    isAuthenticated: user !== null,
    error,
    refetch,
    logout,
  };
}

export default useUser;


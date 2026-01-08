/**
 * useUser - Data hook for current user data
 * 
 * Provides current user information and authentication state.
 * Integrates with the VX2 AuthContext for authentication and
 * fetches balance data from Firestore.
 * 
 * @example
 * ```tsx
 * const { user, isLoading, isAuthenticated } = useUser();
 * 
 * if (!isAuthenticated) {
 *   return <LoginPrompt />;
 * }
 * 
 * return <div>Balance: {user.balanceFormatted}</div>;
 * ```
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../../auth';
import { getFirestore, doc, onSnapshot } from 'firebase/firestore';

// ============================================================================
// TYPES
// ============================================================================

/**
 * User profile data for UI consumption
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
// HELPERS
// ============================================================================

/**
 * Format cents to currency string
 */
function formatCurrency(cents: number): string {
  const dollars = cents / 100;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(dollars);
}

/**
 * Get Firestore instance safely
 */
function getFirestoreInstance(): ReturnType<typeof getFirestore> | null {
  try {
    return getFirestore();
  } catch {
    // Firebase not initialized
    return null;
  }
}

// ============================================================================
// HOOK
// ============================================================================

/**
 * Hook for fetching and managing current user data
 * 
 * Integrates with VX2 AuthContext for authentication state
 * and fetches balance from Firestore in real-time.
 */
export function useUser(): UseUserResult {
  // Get auth state from AuthContext
  const { 
    user: authUser, 
    profile: authProfile, 
    isAuthenticated: authIsAuthenticated, 
    isLoading: authIsLoading,
    signOut,
  } = useAuth();
  
  // Balance state (fetched separately from Firestore)
  const [balanceCents, setBalanceCents] = useState<number>(0);
  const [balanceLoading, setBalanceLoading] = useState(false);
  const [balanceError, setBalanceError] = useState<string | null>(null);
  
  // Set up real-time balance listener when authenticated (non-anonymous)
  useEffect(() => {
    // Reset balance when not authenticated or anonymous
    // Anonymous users don't have balance, so skip the Firestore listener
    if (!authUser?.uid || authUser.isAnonymous) {
      setBalanceCents(0);
      setBalanceLoading(false);
      setBalanceError(null);
      return;
    }
    
    const db = getFirestoreInstance();
    if (!db) {
      // Firebase not available - use 0 balance
      setBalanceCents(0);
      setBalanceLoading(false);
      return;
    }
    
    setBalanceLoading(true);
    setBalanceError(null);
    
    // Listen to user document for balance changes
    const userDocRef = doc(db, 'users', authUser.uid);
    const unsubscribe = onSnapshot(
      userDocRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          // Balance is stored in dollars, convert to cents
          // Support both 'balance' (dollars) and 'balanceCents' (cents) fields
          if (typeof data.balanceCents === 'number') {
            setBalanceCents(data.balanceCents);
          } else if (typeof data.balance === 'number') {
            setBalanceCents(Math.round(data.balance * 100));
          } else {
            setBalanceCents(0);
          }
        } else {
          setBalanceCents(0);
        }
        setBalanceLoading(false);
      },
      (error) => {
        console.warn('[useUser] Balance fetch error:', error.message);
        setBalanceError('Failed to load balance');
        setBalanceCents(0);
        setBalanceLoading(false);
      }
    );
    
    return () => {
      unsubscribe();
    };
  }, [authUser?.uid, authUser?.isAnonymous]);
  
  // Determine if user is "fully" authenticated (not anonymous)
  // Anonymous users can't make payments, so they're treated as unauthenticated
  // for tournament entry and payment-related features
  const isFullyAuthenticated = authIsAuthenticated && authUser && !authUser.isAnonymous;
  
  // Build the user profile from auth data + balance
  const user = useMemo<UserProfile | null>(() => {
    // Return null for unauthenticated or anonymous users
    if (!isFullyAuthenticated || !authUser) {
      return null;
    }
    
    return {
      id: authUser.uid,
      displayName: authProfile?.displayName || authUser.displayName || 'User',
      email: authUser.email || '',
      balanceCents: balanceCents,
      balanceFormatted: formatCurrency(balanceCents),
      avatarUrl: authUser.photoURL || undefined,
      createdAt: authUser.createdAt?.toISOString() || new Date().toISOString(),
      emailVerified: authUser.emailVerified,
      phoneVerified: !!authUser.phoneNumber,
      phone: authUser.phoneNumber || undefined,
    };
  }, [isFullyAuthenticated, authUser, authProfile, balanceCents]);
  
  // Refetch triggers a profile refresh from auth context
  const refetch = useCallback(async () => {
    // Balance is already real-time via onSnapshot
    // Auth state is managed by AuthContext
    // This is mainly for compatibility - force a re-render
    setBalanceLoading(true);
    await new Promise(resolve => setTimeout(resolve, 100));
    setBalanceLoading(false);
  }, []);
  
  // Logout delegates to auth context
  const logout = useCallback(() => {
    signOut();
  }, [signOut]);
  
  // Combined loading state
  // For anonymous users, don't wait for auth profile loading since they don't have profiles
  // This prevents the infinite loading state when Firestore profile fetch times out
  const isLoading = authUser?.isAnonymous 
    ? false  // Anonymous users: never show loading
    : (authIsLoading || balanceLoading);
  
  // Combined error (balance error takes precedence if auth is fine)
  const error = balanceError;
  
  return {
    user,
    isLoading,
    isAuthenticated: isFullyAuthenticated,
    error,
    refetch,
    logout,
  };
}

export default useUser;

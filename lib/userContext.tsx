/**
 * User Context Provider
 *
 * Provides user authentication state and balance to the application.
 * Uses Firebase Auth for authentication and Firestore for user data.
 */

import type { User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, onSnapshot, updateDoc, type Unsubscribe } from 'firebase/firestore';
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  type ReactNode,
} from 'react';

import { auth, db as firestore } from './firebase';

// ============================================================================
// TYPES
// ============================================================================

/**
 * User balance data
 */
export interface UserBalance {
  balance: number;
}

/**
 * User context value
 */
export interface UserContextValue {
  /** Firebase user object (null if not authenticated) */
  user: FirebaseUser | null;
  /** User balance data */
  userBalance: UserBalance;
  /** Update user data in Firestore */
  updateUserData: (updates: Record<string, unknown>) => Promise<void>;
  /** Loading state */
  loading: boolean;
}

/**
 * User data updates for Firestore
 */
export type UserDataUpdates = Record<string, unknown>;

// ============================================================================
// CONTEXT
// ============================================================================

const UserContext = createContext<UserContextValue | undefined>(undefined);

// ============================================================================
// PROVIDER
// ============================================================================

/**
 * User Provider Component
 *
 * Provides user authentication state and balance to child components.
 * Listens to Firebase Auth state changes and user balance updates.
 */
export function UserProvider({ children }: { children: ReactNode }): React.ReactElement {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userBalance, setUserBalance] = useState<UserBalance>({ balance: 0 });
  const [loading, setLoading] = useState<boolean>(true);

  // Ref to store balance listener unsubscribe function
  const unsubscribeBalanceRef = useRef<Unsubscribe | null>(null);

  useEffect(() => {
    // Guard: If Firebase auth is not initialized, skip auth listener
    if (!auth) {
      setUser(null);
      setUserBalance({ balance: 0 });
      setLoading(false);
      return () => {}; // Return empty cleanup function
    }

    const unsubscribe = auth.onAuthStateChanged(async (user: FirebaseUser | null) => {
      setUser(user);

      // Clean up previous balance listener if it exists
      if (unsubscribeBalanceRef.current) {
        unsubscribeBalanceRef.current();
        unsubscribeBalanceRef.current = null;
      }

      if (user && firestore) {
        try {
          // Listen to user balance changes
          const userDocRef = doc(firestore, 'users', user.uid);
          unsubscribeBalanceRef.current = onSnapshot(
            userDocRef,
            doc => {
              if (doc.exists()) {
                const data = doc.data();
                setUserBalance({
                  balance: data.balance || 0,
                });
              } else {
                setUserBalance({ balance: 0 });
              }
            },
            () => {
              setUserBalance({ balance: 0 });
            },
          );
        } catch {
          setUserBalance({ balance: 0 });
        }
      } else {
        setUserBalance({ balance: 0 });
      }

      setLoading(false);
    });

    // Add a timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      setLoading(false);
    }, 2000); // 2 second timeout - reasonable for user experience

    return () => {
      unsubscribe();
      if (unsubscribeBalanceRef.current) {
        unsubscribeBalanceRef.current();
        unsubscribeBalanceRef.current = null;
      }
      clearTimeout(timeoutId);
    };
  }, []);

  /**
   * Update user data in Firestore
   * @param {UserDataUpdates} updates - Updates to apply
   */
  const updateUserData = async (updates: UserDataUpdates): Promise<void> => {
    if (!user) return;

    // If no updates provided, return early (useful for refresh calls)
    if (!updates || (typeof updates === 'object' && Object.keys(updates).length === 0)) {
      return;
    }

    if (!firestore) {
      throw new Error('Firebase db not initialized');
    }

    const userDocRef = doc(firestore, 'users', user.uid);
    await updateDoc(userDocRef, updates);
  };

  const value: UserContextValue = {
    user,
    userBalance,
    updateUserData,
    loading,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

// ============================================================================
// HOOK
// ============================================================================

/**
 * Hook to access user context
 *
 * @returns {UserContextValue} User context value
 * @throws {Error} If used outside UserProvider
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { user, userBalance, loading } = useUser();
 *
 *   if (loading) return <div>Loading...</div>;
 *   if (!user) return <div>Please sign in</div>;
 *
 *   return <div>Balance: ${userBalance.balance}</div>;
 * }
 * ```
 */
export function useUser(): UserContextValue {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}

/**
 * VX2 useAuth Hook
 * 
 * Primary authentication hook providing:
 * - Current user state
 * - Auth actions (sign in, sign up, sign out)
 * - Profile management
 * - Loading and error states
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { user, isAuthenticated, signOut } = useAuth();
 *   
 *   if (!isAuthenticated) {
 *     return <SignInPrompt />;
 *   }
 *   
 *   return <button onClick={signOut}>Sign Out</button>;
 * }
 * ```
 */

import { useAuthContext } from '../context/AuthContext';
import type { UseAuthReturn } from '../types';

/**
 * Hook to access authentication state and actions
 * 
 * Must be used within an AuthProvider
 */
export function useAuth(): UseAuthReturn {
  return useAuthContext();
}

export default useAuth;


/**
 * Authentication Type Definitions
 *
 * Extracted to separate module to avoid circular dependencies between
 * AuthModal.tsx and RegistrationModal.tsx
 */

/**
 * Authenticated user information
 */
export interface AuthUser {
  uid: string;
  email: string | null;
}

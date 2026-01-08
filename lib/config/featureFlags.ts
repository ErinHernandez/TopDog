/**
 * Feature Flags Configuration
 * 
 * Centralized feature flag utilities for toggling features.
 * Uses environment variables for configuration.
 */

/**
 * Check if Firebase Teams Tab should be used
 * 
 * Set NEXT_PUBLIC_USE_FIREBASE_TEAMS=true to enable Firebase,
 * or leave unset/false to use mock data (default).
 */
export const useFirebaseTeams = 
  process.env.NEXT_PUBLIC_USE_FIREBASE_TEAMS === 'true';


/**
 * Username Suggestions Generator
 * 
 * Generates alternative username suggestions when a username is taken.
 * Uses number appending strategy: johndoe1, johndoe2, etc.
 * 
 * @example
 * ```ts
 * const suggestions = await generateUsernameSuggestions('johndoe', 3);
 * // Returns: ['johndoe1', 'johndoe2', 'johndoe3'] (if available)
 * ```
 */

import {
  collection,
  query,
  where,
  getDocs,
  Timestamp,
} from 'firebase/firestore';

import { db } from './firebase';
import { serverLogger } from './logger/serverLogger';

// ============================================================================
// CONSTANTS
// ============================================================================

const MAX_USERNAME_LENGTH = 18;

// ============================================================================
// FUNCTIONS
// ============================================================================

/**
 * Generate username suggestions by appending numbers
 */
export function generateSuggestions(
  baseUsername: string,
  count: number = 3,
  startNumber: number = 1
): string[] {
  const suggestions: string[] = [];
  const normalized = baseUsername.toLowerCase().trim();
  
  // Check if username is at max length (18 chars)
  const availableLength = MAX_USERNAME_LENGTH - normalized.length;
  
  // If we can't fit even a single digit, try shorter base
  if (availableLength < 1) {
    // Truncate base username to fit at least one digit
    const truncated = normalized.slice(0, MAX_USERNAME_LENGTH - 1);
    for (let i = startNumber; i < startNumber + count; i++) {
      suggestions.push(`${truncated}${i}`);
    }
    return suggestions;
  }
  
  // Generate suggestions with numbers
  for (let i = startNumber; i < startNumber + count; i++) {
    const suggestion = `${normalized}${i}`;
    
    // Check if suggestion exceeds max length
    if (suggestion.length > MAX_USERNAME_LENGTH) {
      // Truncate base to fit number
      const numStr = String(i);
      const truncated = normalized.slice(0, MAX_USERNAME_LENGTH - numStr.length);
      suggestions.push(`${truncated}${i}`);
    } else {
      suggestions.push(suggestion);
    }
  }
  
  return suggestions;
}

/**
 * Check which suggestions are available
 */
export async function checkSuggestionsAvailability(
  suggestions: string[]
): Promise<string[]> {
  if (suggestions.length === 0) {
    return [];
  }
  
  if (!db) {
    return [];
  }

  const available: string[] = [];
  const usersRef = collection(db, 'users');
  const vipRef = collection(db, 'vip_reservations');
  
  // Check each suggestion
  for (const suggestion of suggestions) {
    const normalized = suggestion.toLowerCase();
    
    try {
      // Check users collection
      const usersQuery = query(usersRef, where('username', '==', normalized));
      const usersSnapshot = await getDocs(usersQuery);
      
      if (!usersSnapshot.empty) {
        continue; // Username taken
      }
      
      // Check VIP reservations
      const vipQuery = query(
        vipRef,
        where('usernameLower', '==', normalized),
        where('claimed', '==', false)
      );
      const vipSnapshot = await getDocs(vipQuery);
      
      if (!vipSnapshot.empty) {
        const reservation = vipSnapshot.docs[0]!.data();
        const expiresAt = reservation.expiresAt instanceof Timestamp
          ? reservation.expiresAt.toDate()
          : reservation.expiresAt instanceof Date
          ? reservation.expiresAt
          : null;
        
        // If not expired, skip this suggestion
        if (!expiresAt || new Date(expiresAt) > new Date()) {
          continue;
        }
      }
      
      // Username is available
      available.push(suggestion);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      serverLogger.error(`Error checking suggestion ${suggestion}`, error instanceof Error ? error : new Error(errorMessage));
      // Continue to next suggestion on error
    }
  }
  
  return available;
}

/**
 * Generate and check availability of username suggestions
 */
export async function generateUsernameSuggestions(
  baseUsername: string,
  maxSuggestions: number = 3
): Promise<string[]> {
  // First try: johndoe1, johndoe2, johndoe3
  const suggestions = generateSuggestions(baseUsername, maxSuggestions, 1);
  let available = await checkSuggestionsAvailability(suggestions);
  
  // If we got enough suggestions, return them
  if (available.length >= maxSuggestions) {
    return available.slice(0, maxSuggestions);
  }
  
  // If not enough, try higher numbers: johndoe10, johndoe11, etc.
  if (available.length < maxSuggestions) {
    const needed = maxSuggestions - available.length;
    const nextSuggestions = generateSuggestions(baseUsername, needed * 2, 10);
    const nextAvailable = await checkSuggestionsAvailability(nextSuggestions);
    
    available = [...available, ...nextAvailable].slice(0, maxSuggestions);
  }
  
  return available;
}

const usernameSuggestionsExports = {
  generateSuggestions,
  checkSuggestionsAvailability,
  generateUsernameSuggestions,
};

export default usernameSuggestionsExports;

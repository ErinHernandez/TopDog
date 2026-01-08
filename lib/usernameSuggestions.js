/**
 * Username Suggestions Generator
 * 
 * Generates alternative username suggestions when a username is taken.
 * Uses number appending strategy: johndoe1, johndoe2, etc.
 * 
 * @example
 * ```js
 * const suggestions = await generateUsernameSuggestions('johndoe', 3);
 * // Returns: ['johndoe1', 'johndoe2', 'johndoe3'] (if available)
 * ```
 */

import { 
  getFirestore,
  collection, 
  query, 
  where, 
  getDocs 
} from 'firebase/firestore';
import { initializeApp, getApps } from 'firebase/app';

// Initialize Firebase if not already initialized
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);

// ============================================================================
// SUGGESTION GENERATION
// ============================================================================

/**
 * Generate username suggestions by appending numbers
 * @param {string} baseUsername - The base username that was taken
 * @param {number} count - Number of suggestions to generate (default: 3)
 * @param {number} startNumber - Starting number (default: 1)
 * @returns {string[]} Array of suggested usernames
 */
export function generateSuggestions(baseUsername, count = 3, startNumber = 1) {
  const suggestions = [];
  const normalized = baseUsername.toLowerCase().trim();
  
  // Check if username is at max length (18 chars)
  const maxLength = 18;
  const availableLength = maxLength - normalized.length;
  
  // If we can't fit even a single digit, try shorter base
  if (availableLength < 1) {
    // Truncate base username to fit at least one digit
    const truncated = normalized.slice(0, maxLength - 1);
    for (let i = startNumber; i < startNumber + count; i++) {
      suggestions.push(`${truncated}${i}`);
    }
    return suggestions;
  }
  
  // Generate suggestions with numbers
  for (let i = startNumber; i < startNumber + count; i++) {
    const suggestion = `${normalized}${i}`;
    
    // Check if suggestion exceeds max length
    if (suggestion.length > maxLength) {
      // Truncate base to fit number
      const numStr = String(i);
      const truncated = normalized.slice(0, maxLength - numStr.length);
      suggestions.push(`${truncated}${i}`);
    } else {
      suggestions.push(suggestion);
    }
  }
  
  return suggestions;
}

/**
 * Check which suggestions are available
 * @param {string[]} suggestions - Array of suggested usernames
 * @returns {Promise<string[]>} Array of available usernames
 */
export async function checkSuggestionsAvailability(suggestions) {
  if (suggestions.length === 0) {
    return [];
  }
  
  const available = [];
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
        const reservation = vipSnapshot.docs[0].data();
        const expiresAt = reservation.expiresAt?.toDate?.() || reservation.expiresAt;
        
        // If not expired, skip this suggestion
        if (!expiresAt || new Date(expiresAt) > new Date()) {
          continue;
        }
      }
      
      // Username is available
      available.push(suggestion);
    } catch (error) {
      console.error(`Error checking suggestion ${suggestion}:`, error);
      // Continue to next suggestion on error
    }
  }
  
  return available;
}

/**
 * Generate and check availability of username suggestions
 * @param {string} baseUsername - The base username that was taken
 * @param {number} maxSuggestions - Maximum number of suggestions to return (default: 3)
 * @returns {Promise<string[]>} Array of available suggested usernames
 */
export async function generateUsernameSuggestions(baseUsername, maxSuggestions = 3) {
  // First try: johndoe1, johndoe2, johndoe3
  let suggestions = generateSuggestions(baseUsername, maxSuggestions, 1);
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

export default {
  generateSuggestions,
  checkSuggestionsAvailability,
  generateUsernameSuggestions,
};


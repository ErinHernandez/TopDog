/**
 * Username Similarity Detection
 * 
 * Detects usernames that are similar to existing usernames.
 * Used to warn users about potential confusion (e.g., O vs 0, l vs 1).
 * 
 * @example
 * ```js
 * const similar = await findSimilarUsernames('johndoe');
 * // Returns: ['j0hndoe', 'johnd0e'] if they exist
 * ```
 */

import { 
  getFirestore,
  collection, 
  query, 
  where, 
  getDocs, 
  limit 
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
// SIMILARITY DETECTION
// ============================================================================

/**
 * Character substitution map for lookalike detection
 * Maps characters to their lookalike equivalents
 */
const LOOKALIKE_MAP = {
  '0': ['O', 'o'],
  'O': ['0', 'o'],
  'o': ['0', 'O'],
  '1': ['l', 'I', 'i'],
  'l': ['1', 'I', 'i'],
  'I': ['1', 'l', 'i'],
  'i': ['1', 'l', 'I'],
  '5': ['S', 's'],
  'S': ['5', 's'],
  's': ['5', 'S'],
  '2': ['Z', 'z'],
  'Z': ['2', 'z'],
  'z': ['2', 'Z'],
  '8': ['B', 'b'],
  'B': ['8', 'b'],
  'b': ['8', 'B'],
};

/**
 * Generate similar username variants by character substitution
 * @param {string} username - Base username
 * @returns {string[]} Array of similar username variants
 */
export function generateSimilarVariants(username) {
  const variants = new Set();
  const normalized = username.toLowerCase();
  
  // Generate variants by substituting each character with lookalikes
  for (let i = 0; i < normalized.length; i++) {
    const char = normalized[i];
    const lookalikes = LOOKALIKE_MAP[char] || [];
    
    for (const lookalike of lookalikes) {
      const variant = normalized.slice(0, i) + lookalike + normalized.slice(i + 1);
      variants.add(variant);
    }
  }
  
  // Also try uppercase variants
  const upperVariants = Array.from(variants).map(v => v.toUpperCase());
  upperVariants.forEach(v => variants.add(v));
  
  return Array.from(variants);
}

/**
 * Calculate Levenshtein distance between two strings
 * @param {string} str1 - First string
 * @param {string} str2 - Second string
 * @returns {number} Edit distance
 */
export function levenshteinDistance(str1, str2) {
  const len1 = str1.length;
  const len2 = str2.length;
  
  // Create matrix
  const matrix = Array(len1 + 1).fill(null).map(() => Array(len2 + 1).fill(0));
  
  // Initialize first row and column
  for (let i = 0; i <= len1; i++) {
    matrix[i][0] = i;
  }
  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }
  
  // Fill matrix
  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,      // deletion
        matrix[i][j - 1] + 1,      // insertion
        matrix[i - 1][j - 1] + cost // substitution
      );
    }
  }
  
  return matrix[len1][len2];
}

/**
 * Check if two usernames are similar
 * @param {string} username1 - First username
 * @param {string} username2 - Second username
 * @param {number} maxDistance - Maximum Levenshtein distance (default: 2)
 * @returns {boolean} True if usernames are similar
 */
export function areSimilar(username1, username2, maxDistance = 2) {
  const normalized1 = username1.toLowerCase();
  const normalized2 = username2.toLowerCase();
  
  // Exact match (case-insensitive) - not similar, it's the same
  if (normalized1 === normalized2) {
    return false;
  }
  
  // Check Levenshtein distance
  const distance = levenshteinDistance(normalized1, normalized2);
  if (distance <= maxDistance) {
    return true;
  }
  
  // Check if one is a variant of the other (character substitution)
  const variants1 = generateSimilarVariants(normalized1);
  if (variants1.includes(normalized2)) {
    return true;
  }
  
  const variants2 = generateSimilarVariants(normalized2);
  if (variants2.includes(normalized1)) {
    return true;
  }
  
  return false;
}

/**
 * Find similar usernames in the database
 * @param {string} username - Username to check
 * @param {number} maxResults - Maximum number of similar usernames to return (default: 3)
 * @returns {Promise<string[]>} Array of similar existing usernames
 */
export async function findSimilarUsernames(username, maxResults = 3) {
  const normalized = username.toLowerCase();
  const similar = [];
  
  try {
    const usersRef = collection(db, 'users');
    
    // Get a sample of usernames to check (Firestore doesn't support full-text search)
    // We'll check usernames that start with the same first character
    const firstChar = normalized[0];
    const startQuery = query(
      usersRef,
      where('username', '>=', firstChar),
      where('username', '<=', firstChar + '\uf8ff'),
      limit(100) // Limit to avoid too many reads
    );
    
    const snapshot = await getDocs(startQuery);
    
    // Check each username for similarity
    for (const doc of snapshot.docs) {
      const existingUsername = doc.data().username;
      
      if (areSimilar(normalized, existingUsername)) {
        similar.push(existingUsername);
        
        if (similar.length >= maxResults) {
          break;
        }
      }
    }
    
    return similar;
  } catch (error) {
    console.error('Error finding similar usernames:', error);
    return [];
  }
}

/**
 * Generate warning message for similar usernames
 * @param {string[]} similarUsernames - Array of similar usernames
 * @returns {string[]} Array of warning messages
 */
export function generateSimilarityWarnings(similarUsernames) {
  if (similarUsernames.length === 0) {
    return [];
  }
  
  const warnings = [];
  
  if (similarUsernames.length === 1) {
    warnings.push(`This username is similar to '${similarUsernames[0]}'`);
  } else if (similarUsernames.length === 2) {
    warnings.push(`This username is similar to '${similarUsernames[0]}' and '${similarUsernames[1]}'`);
  } else {
    warnings.push(`This username is similar to existing usernames (e.g., '${similarUsernames[0]}')`);
  }
  
  return warnings;
}

export default {
  generateSimilarVariants,
  levenshteinDistance,
  areSimilar,
  findSimilarUsernames,
  generateSimilarityWarnings,
};


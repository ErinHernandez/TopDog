/**
 * Username Similarity Detection
 * 
 * Detects usernames that are similar to existing usernames.
 * Used to warn users about potential confusion (e.g., O vs 0, l vs 1).
 * 
 * @example
 * ```ts
 * const similar = await findSimilarUsernames('johndoe');
 * // Returns: ['j0hndoe', 'johnd0e'] if they exist
 * ```
 */

import {
  collection,
  query,
  where,
  getDocs,
  limit
} from 'firebase/firestore';
import { db } from './firebase';
import { serverLogger } from './logger/serverLogger';

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Character substitution map for lookalike detection
 * Maps characters to their lookalike equivalents
 */
const LOOKALIKE_MAP: Record<string, string[]> = {
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

// ============================================================================
// FUNCTIONS
// ============================================================================

/**
 * Generate similar username variants by character substitution
 */
export function generateSimilarVariants(username: string): string[] {
  const variants = new Set<string>();
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
 */
export function levenshteinDistance(str1: string, str2: string): number {
  const len1 = str1.length;
  const len2 = str2.length;
  
  // Create matrix
  const matrix: number[][] = Array(len1 + 1).fill(null).map(() => Array(len2 + 1).fill(0));
  
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
 */
export function areSimilar(
  username1: string,
  username2: string,
  maxDistance: number = 2
): boolean {
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
 */
export async function findSimilarUsernames(
  username: string,
  maxResults: number = 3
): Promise<string[]> {
  const normalized = username.toLowerCase();
  const similar: string[] = [];
  
  if (!db) {
    return [];
  }

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
      const existingUsername = doc.data().username as string;
      
      if (areSimilar(normalized, existingUsername)) {
        similar.push(existingUsername);
        
        if (similar.length >= maxResults) {
          break;
        }
      }
    }
    
    return similar;
  } catch (error) {
    serverLogger.error('Error finding similar usernames', error instanceof Error ? error : new Error(String(error)));
    return [];
  }
}

/**
 * Generate warning message for similar usernames
 */
export function generateSimilarityWarnings(similarUsernames: string[]): string[] {
  if (similarUsernames.length === 0) {
    return [];
  }
  
  const warnings: string[] = [];
  
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

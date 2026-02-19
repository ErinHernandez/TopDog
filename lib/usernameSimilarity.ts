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
 * Character substitution map for lookalike detection.
 * Maps characters to their lookalike equivalents.
 *
 * Includes Latin ↔ Cyrillic confusables to prevent homoglyph attacks
 * where an attacker registers a visually identical username using
 * characters from a different script (e.g., Cyrillic "а" vs Latin "a").
 */
const LOOKALIKE_MAP: Record<string, string[]> = {
  // Digit ↔ Latin confusables
  '0': ['O', 'o', '\u041E', '\u043E'], // + Cyrillic О, о
  'O': ['0', 'o', '\u041E', '\u043E'],
  'o': ['0', 'O', '\u041E', '\u043E'],
  '1': ['l', 'I', 'i', '\u0406', '\u0456'], // + Cyrillic І, і
  'l': ['1', 'I', 'i', '\u0406', '\u0456'],
  'I': ['1', 'l', 'i', '\u0406', '\u0456'],
  'i': ['1', 'l', 'I', '\u0456'],
  '5': ['S', 's'],
  'S': ['5', 's', '\u0405'], // + Cyrillic Ѕ
  's': ['5', 'S', '\u0455'], // + Cyrillic ѕ
  '2': ['Z', 'z'],
  'Z': ['2', 'z'],
  'z': ['2', 'Z'],
  '8': ['B', 'b', '\u0412'], // + Cyrillic В
  'B': ['8', 'b', '\u0412'],
  'b': ['8', 'B'],

  // Latin ↔ Cyrillic visual confusables
  'a': ['\u0430'],           // Cyrillic а
  'A': ['\u0410'],           // Cyrillic А
  'c': ['\u0441'],           // Cyrillic с
  'C': ['\u0421'],           // Cyrillic С
  'e': ['\u0435'],           // Cyrillic е
  'E': ['\u0415'],           // Cyrillic Е
  'H': ['\u041D'],           // Cyrillic Н
  'K': ['\u041A'],           // Cyrillic К
  'M': ['\u041C'],           // Cyrillic М
  'p': ['\u0440'],           // Cyrillic р
  'P': ['\u0420'],           // Cyrillic Р
  'T': ['\u0422'],           // Cyrillic Т
  'x': ['\u0445'],           // Cyrillic х
  'X': ['\u0425'],           // Cyrillic Х
  'y': ['\u0443'],           // Cyrillic у
  'Y': ['\u0423'],           // Cyrillic У

  // Reverse: Cyrillic → Latin (bidirectional detection)
  '\u0430': ['a'],            // а → a
  '\u0410': ['A'],            // А → A
  '\u0441': ['c'],            // с → c
  '\u0421': ['C'],            // С → C
  '\u0435': ['e'],            // е → e
  '\u0415': ['E'],            // Е → E
  '\u041D': ['H'],            // Н → H
  '\u041A': ['K'],            // К → K
  '\u041C': ['M'],            // М → M
  '\u041E': ['O', '0'],       // О → O, 0
  '\u043E': ['o', '0'],       // о → o, 0
  '\u0440': ['p'],            // р → p
  '\u0420': ['P'],            // Р → P
  '\u0405': ['S'],            // Ѕ → S
  '\u0455': ['s'],            // ѕ → s
  '\u0422': ['T'],            // Т → T
  '\u0425': ['X'],            // Х → X
  '\u0445': ['x'],            // х → x
  '\u0423': ['Y'],            // У → Y
  '\u0443': ['y'],            // у → y
  '\u0406': ['I', '1'],       // І → I, 1
  '\u0456': ['i', '1'],       // і → i, 1
  '\u0412': ['B', '8'],       // В → B, 8
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
    const char = normalized[i]!;
    const lookalikes = LOOKALIKE_MAP[char] ?? [];

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
    matrix[i]![0] = i;
  }
  for (let j = 0; j <= len2; j++) {
    matrix[0]![j] = j;
  }

  // Fill matrix
  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      const row = matrix[i]!;
      const prevRow = matrix[i - 1]!;
      row[j] = Math.min(
        prevRow[j]! + 1,      // deletion
        row[j - 1]! + 1,      // insertion
        prevRow[j - 1]! + cost // substitution
      );
    }
  }

  return matrix[len1]![len2]!;
}

/**
 * Detect mixed-script homoglyph attacks.
 *
 * Returns true if the string contains characters from multiple Unicode scripts
 * (e.g., mixing Latin and Cyrillic). This is a strong signal of a spoofing
 * attempt because legitimate usernames rarely mix scripts.
 *
 * Common attack: "аdmin" where "а" is Cyrillic U+0430, not Latin "a".
 */
export function containsMixedScripts(username: string): boolean {
  let hasLatin = false;
  let hasCyrillic = false;

  for (const char of username) {
    const code = char.codePointAt(0)!;
    // Basic Latin + Latin Extended
    if ((code >= 0x0041 && code <= 0x024F)) {
      hasLatin = true;
    }
    // Cyrillic block
    if ((code >= 0x0400 && code <= 0x04FF)) {
      hasCyrillic = true;
    }
    // Early exit: both scripts detected
    if (hasLatin && hasCyrillic) {
      return true;
    }
  }

  return false;
}

/**
 * Normalize confusable characters to their Latin equivalents.
 * Used to create a canonical form for comparison.
 */
const CONFUSABLE_TO_LATIN: Record<string, string> = {
  '\u0430': 'a', '\u0410': 'A',
  '\u0441': 'c', '\u0421': 'C',
  '\u0435': 'e', '\u0415': 'E',
  '\u041D': 'H', '\u041A': 'K',
  '\u041C': 'M', '\u041E': 'O',
  '\u043E': 'o', '\u0440': 'p',
  '\u0420': 'P', '\u0405': 'S',
  '\u0455': 's', '\u0422': 'T',
  '\u0425': 'X', '\u0445': 'x',
  '\u0423': 'Y', '\u0443': 'y',
  '\u0406': 'I', '\u0456': 'i',
  '\u0412': 'B',
};

/**
 * Normalize a username by replacing Cyrillic confusables with Latin equivalents.
 * Returns the canonical Latin form for comparison.
 */
export function normalizeConfusables(username: string): string {
  let result = '';
  for (const char of username) {
    result += CONFUSABLE_TO_LATIN[char] ?? char;
  }
  return result;
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

  // Confusable-normalized comparison: catches Cyrillic homoglyph attacks
  // e.g., "аdmin" (Cyrillic а) matches "admin" (Latin a)
  const canonical1 = normalizeConfusables(normalized1);
  const canonical2 = normalizeConfusables(normalized2);
  if (canonical1 === canonical2) {
    return true;
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
      where('username', '<=', `${firstChar  }\uf8ff`),
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

const usernameSimilarityExports = {
  generateSimilarVariants,
  levenshteinDistance,
  areSimilar,
  containsMixedScripts,
  normalizeConfusables,
  findSimilarUsernames,
  generateSimilarityWarnings,
};

export default usernameSimilarityExports;

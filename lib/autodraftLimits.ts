/**
 * Autodraft Limits Firebase Integration
 * 
 * Manages user's autodraft position limits with Firebase sync
 */

import { db, safeFirebaseOperation, isAuthEnabled, auth } from './firebase';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { POSITIONS } from './constants/positions';

// ============================================================================
// TYPES
// ============================================================================

export type Position = 'QB' | 'RB' | 'WR' | 'TE';

export interface AutodraftLimits {
  QB: number;
  RB: number;
  WR: number;
  TE: number;
}

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Default autodraft limits
 */
export const DEFAULT_AUTODRAFT_LIMITS: AutodraftLimits = {
  QB: 4,
  RB: 10,
  WR: 11,
  TE: 5
};

// ============================================================================
// FUNCTIONS
// ============================================================================

/**
 * Get autodraft limits for a user (Firebase + localStorage fallback)
 */
export const getAutodraftLimits = async (userId: string | null = null): Promise<AutodraftLimits> => {
  // Use current user if no userId provided
  const uid = userId || (auth?.currentUser?.uid || null);
  
  if (!uid || !isAuthEnabled()) {
    // Fallback to localStorage if no Firebase auth
    return getLocalAutodraftLimits();
  }

  const result = await safeFirebaseOperation(async () => {
    if (!db) {
      throw new Error('Firebase db not initialized');
    }
    const userRef = doc(db, 'users', uid);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      const userData = userDoc.data();
      if (userData.autodraftLimits) {
        console.log('📥 AUTODRAFT: Loaded limits from Firebase:', userData.autodraftLimits);
        return validateAutodraftLimits(userData.autodraftLimits);
      }
    }
    
    // If no Firebase data, try localStorage and sync to Firebase
    const localLimits = getLocalAutodraftLimits();
    if (JSON.stringify(localLimits) !== JSON.stringify(DEFAULT_AUTODRAFT_LIMITS)) {
      await setAutodraftLimits(localLimits, uid);
    }
    
    return localLimits;
  }, getLocalAutodraftLimits());
  
  return result || getLocalAutodraftLimits();
};

/**
 * Set autodraft limits for a user (Firebase + localStorage)
 */
export const setAutodraftLimits = async (
  limits: Partial<AutodraftLimits>,
  userId: string | null = null
): Promise<AutodraftLimits> => {
  // Validate limits
  const validatedLimits = validateAutodraftLimits(limits);
  
  // Always save to localStorage for immediate access
  setLocalAutodraftLimits(validatedLimits);
  
  // Use current user if no userId provided
  const uid = userId || (auth?.currentUser?.uid || null);
  
  if (!uid || !isAuthEnabled()) {
    console.log('💾 AUTODRAFT: Saved limits to localStorage only (no Firebase auth)');
    return validatedLimits;
  }

  const result = await safeFirebaseOperation(async () => {
    if (!db) {
      throw new Error('Firebase db not initialized');
    }
    const userRef = doc(db, 'users', uid);
    
    // Check if user document exists
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      // Update existing user document
      await updateDoc(userRef, {
        autodraftLimits: validatedLimits,
        updatedAt: new Date()
      });
    } else {
      // Create new user document with autodraft limits
      await setDoc(userRef, {
        uid: uid,
        autodraftLimits: validatedLimits,
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true
      });
    }
    
    console.log('☁️ AUTODRAFT: Synced limits to Firebase:', validatedLimits);
    return validatedLimits;
  }, validatedLimits);
  
  return result || validatedLimits;
};

/**
 * Get autodraft limits from localStorage
 */
export const getLocalAutodraftLimits = (): AutodraftLimits => {
  if (typeof window === 'undefined') {
    return DEFAULT_AUTODRAFT_LIMITS;
  }
  
  try {
    const savedLimits = localStorage.getItem('autodraftLimits');
    if (savedLimits) {
      const parsed = JSON.parse(savedLimits) as Partial<AutodraftLimits>;
      return validateAutodraftLimits(parsed);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Error loading autodraft limits from localStorage:', errorMessage);
  }
  
  return DEFAULT_AUTODRAFT_LIMITS;
};

/**
 * Set autodraft limits to localStorage
 */
export const setLocalAutodraftLimits = (limits: Partial<AutodraftLimits>): AutodraftLimits => {
  if (typeof window === 'undefined') {
    return DEFAULT_AUTODRAFT_LIMITS;
  }
  
  try {
    const validatedLimits = validateAutodraftLimits(limits);
    localStorage.setItem('autodraftLimits', JSON.stringify(validatedLimits));
    console.log('💾 AUTODRAFT: Saved limits to localStorage:', validatedLimits);
    return validatedLimits;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Error saving autodraft limits to localStorage:', errorMessage);
    return DEFAULT_AUTODRAFT_LIMITS;
  }
};

/**
 * Validate and sanitize autodraft limits
 */
export const validateAutodraftLimits = (limits: Partial<AutodraftLimits> | null | undefined): AutodraftLimits => {
  const validated: AutodraftLimits = { ...DEFAULT_AUTODRAFT_LIMITS };
  
  // Position-specific maximums (from the UI)
  const maxLimits: AutodraftLimits = {
    QB: 4,
    RB: 10,
    WR: 11,
    TE: 5
  };
  
  // Validate each position
  for (const position of POSITIONS) {
    const pos = position as Position;
    if (limits && typeof limits[pos] === 'number') {
      validated[pos] = Math.max(0, Math.min(maxLimits[pos], limits[pos]));
    }
  }
  
  return validated;
};

/**
 * Clear autodraft limits (reset to defaults)
 */
export const clearAutodraftLimits = async (userId: string | null = null): Promise<AutodraftLimits> => {
  return await setAutodraftLimits(DEFAULT_AUTODRAFT_LIMITS, userId);
};

/**
 * Set autodraft limits for dev user (for testing)
 */
export const setDevUserAutodraftLimits = async (limits: Partial<AutodraftLimits> | null = null): Promise<AutodraftLimits> => {
  const testLimits: AutodraftLimits = limits ? {
    QB: limits.QB ?? DEFAULT_AUTODRAFT_LIMITS.QB,
    RB: limits.RB ?? DEFAULT_AUTODRAFT_LIMITS.RB,
    WR: limits.WR ?? DEFAULT_AUTODRAFT_LIMITS.WR,
    TE: limits.TE ?? DEFAULT_AUTODRAFT_LIMITS.TE,
  } : {
    QB: 2,
    RB: 8,
    WR: 9,
    TE: 3
  };
  
  console.log('🧪 AUTODRAFT: Setting dev user limits:', testLimits);
  
  // Set for current user (dev user)
  return await setAutodraftLimits(testLimits);
};

// ============================================================================
// GLOBAL EXPORTS (for console testing)
// ============================================================================

// Make it available globally for console testing
if (typeof window !== 'undefined') {
  (window as unknown as {
    setDevUserAutodraftLimits: typeof setDevUserAutodraftLimits;
    getAutodraftLimits: typeof getAutodraftLimits;
    setAutodraftLimits: typeof setAutodraftLimits;
    clearAutodraftLimits: typeof clearAutodraftLimits;
  }).setDevUserAutodraftLimits = setDevUserAutodraftLimits;
  (window as unknown as {
    getAutodraftLimits: typeof getAutodraftLimits;
  }).getAutodraftLimits = getAutodraftLimits;
  (window as unknown as {
    setAutodraftLimits: typeof setAutodraftLimits;
  }).setAutodraftLimits = setAutodraftLimits;
  (window as unknown as {
    clearAutodraftLimits: typeof clearAutodraftLimits;
  }).clearAutodraftLimits = clearAutodraftLimits;
}

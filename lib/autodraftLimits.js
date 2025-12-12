import { db, safeFirebaseOperation, isAuthEnabled, auth } from './firebase';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { POSITIONS } from '../components/draft/v3/constants/positions';

/**
 * Autodraft Limits Firebase Integration
 * 
 * Manages user's autodraft position limits with Firebase sync
 */

// Default autodraft limits
export const DEFAULT_AUTODRAFT_LIMITS = {
  QB: 4,
  RB: 10,
  WR: 11,
  TE: 5
};

/**
 * Get autodraft limits for a user (Firebase + localStorage fallback)
 */
export const getAutodraftLimits = async (userId = null) => {
  // Use current user if no userId provided
  const uid = userId || (auth.currentUser?.uid);
  
  if (!uid || !isAuthEnabled()) {
    // Fallback to localStorage if no Firebase auth
    return getLocalAutodraftLimits();
  }

  return await safeFirebaseOperation(async () => {
    const userRef = doc(db, 'users', uid);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists() && userDoc.data().autodraftLimits) {
      console.log('📥 AUTODRAFT: Loaded limits from Firebase:', userDoc.data().autodraftLimits);
      return userDoc.data().autodraftLimits;
    }
    
    // If no Firebase data, try localStorage and sync to Firebase
    const localLimits = getLocalAutodraftLimits();
    if (localLimits !== DEFAULT_AUTODRAFT_LIMITS) {
      await setAutodraftLimits(localLimits, uid);
    }
    
    return localLimits;
  }, getLocalAutodraftLimits());
};

/**
 * Set autodraft limits for a user (Firebase + localStorage)
 */
export const setAutodraftLimits = async (limits, userId = null) => {
  // Validate limits
  const validatedLimits = validateAutodraftLimits(limits);
  
  // Always save to localStorage for immediate access
  setLocalAutodraftLimits(validatedLimits);
  
  // Use current user if no userId provided
  const uid = userId || (auth.currentUser?.uid);
  
  if (!uid || !isAuthEnabled()) {
    console.log('💾 AUTODRAFT: Saved limits to localStorage only (no Firebase auth)');
    return validatedLimits;
  }

  return await safeFirebaseOperation(async () => {
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
};

/**
 * Get autodraft limits from localStorage
 */
export const getLocalAutodraftLimits = () => {
  if (typeof window === 'undefined') {
    return DEFAULT_AUTODRAFT_LIMITS;
  }
  
  try {
    const savedLimits = localStorage.getItem('autodraftLimits');
    if (savedLimits) {
      const parsed = JSON.parse(savedLimits);
      return validateAutodraftLimits(parsed);
    }
  } catch (error) {
    console.error('Error loading autodraft limits from localStorage:', error);
  }
  
  return DEFAULT_AUTODRAFT_LIMITS;
};

/**
 * Set autodraft limits to localStorage
 */
export const setLocalAutodraftLimits = (limits) => {
  if (typeof window === 'undefined') {
    return;
  }
  
  try {
    const validatedLimits = validateAutodraftLimits(limits);
    localStorage.setItem('autodraftLimits', JSON.stringify(validatedLimits));
    console.log('💾 AUTODRAFT: Saved limits to localStorage:', validatedLimits);
    return validatedLimits;
  } catch (error) {
    console.error('Error saving autodraft limits to localStorage:', error);
    return DEFAULT_AUTODRAFT_LIMITS;
  }
};

/**
 * Validate and sanitize autodraft limits
 */
export const validateAutodraftLimits = (limits) => {
  const validated = { ...DEFAULT_AUTODRAFT_LIMITS };
  
  // Position-specific maximums (from the UI)
  const maxLimits = {
    QB: 4,
    RB: 10,
    WR: 11,
    TE: 5
  };
  
  // Validate each position
  for (const position of POSITIONS) {
    if (limits && typeof limits[position] === 'number') {
      validated[position] = Math.max(0, Math.min(maxLimits[position], limits[position]));
    }
  }
  
  return validated;
};

/**
 * Clear autodraft limits (reset to defaults)
 */
export const clearAutodraftLimits = async (userId = null) => {
  return await setAutodraftLimits(DEFAULT_AUTODRAFT_LIMITS, userId);
};

/**
 * Set autodraft limits for dev user (for testing)
 */
export const setDevUserAutodraftLimits = async (limits = null) => {
  const testLimits = limits || {
    QB: 2,
    RB: 8,
    WR: 9,
    TE: 3
  };
  
  console.log('🧪 AUTODRAFT: Setting dev user limits:', testLimits);
  
  // Set for current user (dev user)
  return await setAutodraftLimits(testLimits);
};

// Make it available globally for console testing
if (typeof window !== 'undefined') {
  window.setDevUserAutodraftLimits = setDevUserAutodraftLimits;
  window.getAutodraftLimits = getAutodraftLimits;
  window.setAutodraftLimits = setAutodraftLimits;
  window.clearAutodraftLimits = clearAutodraftLimits;
}

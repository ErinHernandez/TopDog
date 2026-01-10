/**
 * Location Service
 * 
 * Manages location tracking and storage in Firebase.
 * Only tracks when user has granted consent.
 */

import { 
  doc, 
  getDoc, 
  updateDoc, 
  arrayUnion, 
  serverTimestamp,
  Timestamp 
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getCurrentLocation, formatLocationCode, isValidLocation } from './geolocationProvider';
import type { 
  GeoLocation, 
  UserLocations, 
  KnownLocation,
  UserLocationDocument 
} from './types';

const COLLECTION = 'userLocations';

/**
 * Track user's current location (requires consent)
 * Returns the detected location or null if tracking failed/not allowed
 */
export async function trackLocation(userId: string): Promise<GeoLocation | null> {
  try {
    // Check consent first
    const docRef = doc(db, COLLECTION, userId);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      return null; // No document = no consent
    }
    
    const data = docSnap.data() as UserLocationDocument;
    
    if (data.consent?.status !== 'granted') {
      return null; // Consent not granted
    }
    
    // Get current location
    const location = await getCurrentLocation();
    
    if (!isValidLocation(location)) {
      return null; // Invalid or no location
    }
    
    // Update stored locations
    const updates: Record<string, unknown> = {
      'locations.countries': arrayUnion(location.countryCode),
      'security.lastLoginLocation': {
        code: formatLocationCode(location),
        timestamp: serverTimestamp(),
      },
      updatedAt: serverTimestamp(),
    };
    
    // Add state if US
    if (location.countryCode === 'US' && location.stateCode) {
      updates['locations.states'] = arrayUnion(location.stateCode);
    }
    
    await updateDoc(docRef, updates);
    
    // Update known locations for security
    await updateKnownLocation(userId, location);
    
    return location;
  } catch (error) {
    console.error('Error tracking location:', error);
    return null;
  }
}

/**
 * Update known locations for security tracking
 */
async function updateKnownLocation(
  userId: string, 
  location: GeoLocation
): Promise<void> {
  try {
    const docRef = doc(db, COLLECTION, userId);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) return;
    
    const data = docSnap.data() as UserLocationDocument;
    const code = formatLocationCode(location);
    
    const knownLocations: KnownLocation[] = data.security?.knownLocations || [];
    const existingIndex = knownLocations.findIndex(l => l.code === code);
    const now = Timestamp.now();
    
    if (existingIndex >= 0) {
      // Update existing location
      knownLocations[existingIndex] = {
        ...knownLocations[existingIndex],
        lastSeen: now,
        loginCount: (knownLocations[existingIndex].loginCount || 0) + 1,
      };
    } else {
      // Add new location
      knownLocations.push({
        code,
        firstSeen: now,
        lastSeen: now,
        loginCount: 1,
        isTrusted: false,
      });
    }
    
    await updateDoc(docRef, {
      'security.knownLocations': knownLocations,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error updating known location:', error);
  }
}

/**
 * Get user's location history
 */
export async function getUserLocations(userId: string): Promise<UserLocations> {
  try {
    const docRef = doc(db, COLLECTION, userId);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      return { countries: [], states: [] };
    }
    
    const data = docSnap.data() as UserLocationDocument;
    
    return {
      countries: data.locations?.countries || [],
      states: data.locations?.states || [],
    };
  } catch (error) {
    console.error('Error getting user locations:', error);
    return { countries: [], states: [] };
  }
}

/**
 * Get user's known locations (for security)
 */
export async function getKnownLocations(userId: string): Promise<KnownLocation[]> {
  try {
    const docRef = doc(db, COLLECTION, userId);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      return [];
    }
    
    const data = docSnap.data() as UserLocationDocument;
    return data.security?.knownLocations || [];
  } catch (error) {
    console.error('Error getting known locations:', error);
    return [];
  }
}

/**
 * Mark a location as trusted
 */
export async function markLocationTrusted(
  userId: string, 
  locationCode: string
): Promise<void> {
  try {
    const docRef = doc(db, COLLECTION, userId);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) return;
    
    const data = docSnap.data() as UserLocationDocument;
    const knownLocations: KnownLocation[] = data.security?.knownLocations || [];
    
    const index = knownLocations.findIndex(l => l.code === locationCode);
    
    if (index >= 0) {
      knownLocations[index].isTrusted = true;
      
      await updateDoc(docRef, {
        'security.knownLocations': knownLocations,
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    console.error('Error marking location trusted:', error);
  }
}

/**
 * Remove a location from trusted list
 */
export async function untrustLocation(
  userId: string, 
  locationCode: string
): Promise<void> {
  try {
    const docRef = doc(db, COLLECTION, userId);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) return;
    
    const data = docSnap.data() as UserLocationDocument;
    const knownLocations: KnownLocation[] = data.security?.knownLocations || [];
    
    const index = knownLocations.findIndex(l => l.code === locationCode);
    
    if (index >= 0) {
      knownLocations[index].isTrusted = false;
      
      await updateDoc(docRef, {
        'security.knownLocations': knownLocations,
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    console.error('Error untrusting location:', error);
  }
}

/**
 * Get unlocked flag codes for a user
 * Returns country codes and US-STATE codes for states
 */
export async function getUnlockedFlags(userId: string): Promise<string[]> {
  const locations = await getUserLocations(userId);
  
  const flags: string[] = [];
  
  // Add country flags
  flags.push(...locations.countries);
  
  // Add state flags with US- prefix
  locations.states.forEach(state => {
    flags.push(`US-${state}`);
  });
  
  return flags;
}

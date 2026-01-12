/**
 * Location Security Service
 * 
 * Provides security checks based on location data:
 * - Suspicious login detection
 * - Account sharing indicators
 */

import { 
  doc, 
  getDoc, 
  updateDoc, 
  arrayUnion, 
  serverTimestamp,
  Timestamp 
} from 'firebase/firestore';
import { getDb } from '@/lib/firebase-utils';
import { formatLocationCode } from './geolocationProvider';
import type { 
  GeoLocation, 
  KnownLocation, 
  SecurityCheck, 
  SuspiciousAttempt,
  UserLocationDocument 
} from './types';

const COLLECTION = 'userLocations';

// ============================================================================
// SECURITY CHECKS
// ============================================================================

/**
 * Check login security based on location
 */
export async function checkLoginSecurity(
  userId: string,
  currentLocation: GeoLocation
): Promise<SecurityCheck> {
  try {
    const db = getDb();
    const docRef = doc(db, COLLECTION, userId);
    const docSnap = await getDoc(docRef);
    
    // No location history = allow but flag as new
    if (!docSnap.exists()) {
      return {
        isNewLocation: true,
        isSuspicious: false,
        riskScore: 20,
        action: 'allow',
      };
    }
    
    const data = docSnap.data() as UserLocationDocument;
    const knownLocations: KnownLocation[] = data.security?.knownLocations || [];
    
    const currentCode = formatLocationCode(currentLocation);
    
    // Check if location is known
    const isKnown = knownLocations.some(l => l.code === currentCode);
    const isTrusted = knownLocations.some(
      l => l.code === currentCode && l.isTrusted
    );
    
    // Calculate risk score
    let riskScore = 0;
    
    if (!isKnown) riskScore += 30;
    if (!isTrusted && isKnown) riskScore += 10;
    
    // Check for rapid location changes (account sharing indicator)
    if (knownLocations.length > 0) {
      const recentLocations = getRecentLocationChanges(knownLocations);
      if (recentLocations > 3) {
        riskScore += 20;
      }
    }
    
    // Determine action based on risk score
    let action: SecurityCheck['action'] = 'allow';
    
    if (riskScore >= 60) {
      action = 'verify';
    } else if (riskScore >= 30) {
      action = 'warn';
    }
    
    return {
      isNewLocation: !isKnown,
      isSuspicious: riskScore >= 50,
      riskScore: Math.min(riskScore, 100),
      action,
    };
  } catch (error: unknown) {
    console.error('Error checking login security:', error);
    // On error, allow but flag
    return {
      isNewLocation: false,
      isSuspicious: false,
      riskScore: 0,
      action: 'allow',
    };
  }
}

/**
 * Count recent location changes in the last 24 hours
 */
function getRecentLocationChanges(locations: KnownLocation[]): number {
  const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
  
  return locations.filter((loc: KnownLocation) => {
    const lastSeen = loc.lastSeen instanceof Timestamp
      ? loc.lastSeen.toDate()
      : new Date(loc.lastSeen as unknown as string);
    
    return lastSeen.getTime() > oneDayAgo;
  }).length;
}

// ============================================================================
// LOGGING AND REPORTING
// ============================================================================

/**
 * Log a suspicious attempt
 */
export async function logSuspiciousAttempt(
  userId: string,
  locationCode: string,
  action: 'blocked' | 'warned' | 'allowed',
  reason: string
): Promise<void> {
  try {
    const db = getDb();
    const docRef = doc(db, COLLECTION, userId);
    
    const attempt: SuspiciousAttempt = {
      code: locationCode,
      timestamp: Timestamp.now(),
      action,
      reason,
    };
    
    await updateDoc(docRef, {
      'security.suspiciousAttempts': arrayUnion(attempt),
      updatedAt: serverTimestamp(),
    });
  } catch (error: unknown) {
    console.error('Error logging suspicious attempt:', error);
  }
}

/**
 * Get suspicious attempts for a user
 */
export async function getSuspiciousAttempts(
  userId: string
): Promise<SuspiciousAttempt[]> {
  try {
    const db = getDb();
    const docRef = doc(db, COLLECTION, userId);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      return [];
    }
    
    const data = docSnap.data() as UserLocationDocument;
    return data.security?.suspiciousAttempts || [];
  } catch (error: unknown) {
    console.error('Error getting suspicious attempts:', error);
    return [];
  }
}

// ============================================================================
// ACCOUNT SHARING DETECTION
// ============================================================================

export interface AccountSharingIndicators {
  multipleSimultaneousLocations: boolean;
  frequentLocationSwitching: boolean;
  riskScore: number;
  recommendation: 'allow' | 'warn' | 'investigate' | 'suspend';
}

/**
 * Analyze account for potential sharing indicators
 */
export async function analyzeAccountSharing(
  userId: string
): Promise<AccountSharingIndicators> {
  try {
    const db = getDb();
    const docRef = doc(db, COLLECTION, userId);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      return {
        multipleSimultaneousLocations: false,
        frequentLocationSwitching: false,
        riskScore: 0,
        recommendation: 'allow',
      };
    }
    
    const data = docSnap.data() as UserLocationDocument;
    const knownLocations = data.security?.knownLocations || [];
    const suspiciousAttempts = data.security?.suspiciousAttempts || [];
    
    // Check for rapid location switching
    const recentChanges = getRecentLocationChanges(knownLocations);
    const frequentLocationSwitching = recentChanges >= 5;
    
    // Calculate risk score
    let riskScore = 0;
    
    if (frequentLocationSwitching) riskScore += 40;
    if (suspiciousAttempts.length > 3) riskScore += 20;
    
    // Determine recommendation
    let recommendation: AccountSharingIndicators['recommendation'] = 'allow';
    
    if (riskScore >= 80) {
      recommendation = 'suspend';
    } else if (riskScore >= 60) {
      recommendation = 'investigate';
    } else if (riskScore >= 30) {
      recommendation = 'warn';
    }
    
    return {
      multipleSimultaneousLocations: false, // Would need real-time session tracking
      frequentLocationSwitching,
      riskScore: Math.min(riskScore, 100),
      recommendation,
    };
  } catch (error: unknown) {
    console.error('Error analyzing account sharing:', error);
    return {
      multipleSimultaneousLocations: false,
      frequentLocationSwitching: false,
      riskScore: 0,
      recommendation: 'allow',
    };
  }
}

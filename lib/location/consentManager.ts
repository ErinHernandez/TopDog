/**
 * Location Consent Manager
 * 
 * Manages user consent for location tracking with Firebase persistence.
 * Implements consent state machine with prompt rate limiting.
 */

import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { getDb } from '@/lib/firebase-utils';
import { createScopedLogger } from '@/lib/clientLogger';

const logger = createScopedLogger('[ConsentManager]');
import type { 
  LocationConsent, 
  ConsentStatus, 
  UserLocationDocument,
  DEFAULT_CONSENT 
} from './types';

const COLLECTION = 'userLocations';

// Maximum number of times to prompt user before giving up
const MAX_PROMPT_COUNT = 3;

// Minimum hours between prompts (if not "don't ask again")
const MIN_HOURS_BETWEEN_PROMPTS = 24;

/**
 * Get current consent state for a user
 */
export async function getConsent(userId: string): Promise<LocationConsent> {
  try {
    const db = getDb();
    const docRef = doc(db, COLLECTION, userId);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      return {
        status: 'pending',
        promptCount: 0,
        dontAskAgain: false,
      };
    }
    
    const data = docSnap.data();
    const consent = data?.consent;
    
    if (!consent) {
      return {
        status: 'pending',
        promptCount: 0,
        dontAskAgain: false,
      };
    }
    
    return {
      status: consent.status || 'pending',
      grantedAt: consent.grantedAt?.toDate?.() ?? consent.grantedAt,
      revokedAt: consent.revokedAt?.toDate?.() ?? consent.revokedAt,
      promptCount: consent.promptCount || 0,
      lastPromptAt: consent.lastPromptAt?.toDate?.() ?? consent.lastPromptAt,
      dontAskAgain: consent.dontAskAgain || false,
    };
  } catch (error: unknown) {
    logger.error('Error getting consent', error instanceof Error ? error : new Error(String(error)));
    return {
      status: 'pending',
      promptCount: 0,
      dontAskAgain: false,
    };
  }
}

/**
 * Update consent status
 */
export async function updateConsent(
  userId: string, 
  status: ConsentStatus,
  dontAskAgain = false
): Promise<void> {
  const db = getDb();
  const docRef = doc(db, COLLECTION, userId);
  const now = serverTimestamp();
  
  const consentUpdate: Record<string, unknown> = {
    'consent.status': status,
    'consent.dontAskAgain': dontAskAgain,
    updatedAt: now,
  };
  
  if (status === 'granted') {
    consentUpdate['consent.grantedAt'] = now;
  } else if (status === 'revoked') {
    consentUpdate['consent.revokedAt'] = now;
  }
  
  // Check if document exists
  const docSnap = await getDoc(docRef);
  
  if (docSnap.exists()) {
    await updateDoc(docRef, consentUpdate);
  } else {
    // Create new document with full structure
    await setDoc(docRef, {
      consent: {
        status,
        grantedAt: status === 'granted' ? now : null,
        revokedAt: status === 'revoked' ? now : null,
        promptCount: 0,
        lastPromptAt: null,
        dontAskAgain,
      },
      locations: {
        countries: [],
        states: [],
      },
      security: {
        knownLocations: [],
        suspiciousAttempts: [],
      },
      createdAt: now,
      updatedAt: now,
    });
  }
}

/**
 * Increment prompt count (when user sees but dismisses consent modal)
 */
export async function incrementPromptCount(userId: string): Promise<void> {
  const db = getDb();
  const docRef = doc(db, COLLECTION, userId);
  const docSnap = await getDoc(docRef);
  const now = serverTimestamp();
  
  if (docSnap.exists()) {
    const currentCount = docSnap.data()?.consent?.promptCount || 0;
    await updateDoc(docRef, {
      'consent.promptCount': currentCount + 1,
      'consent.lastPromptAt': now,
      updatedAt: now,
    });
  } else {
    // Create new document
    await setDoc(docRef, {
      consent: {
        status: 'pending',
        promptCount: 1,
        lastPromptAt: now,
        dontAskAgain: false,
      },
      locations: {
        countries: [],
        states: [],
      },
      security: {
        knownLocations: [],
        suspiciousAttempts: [],
      },
      createdAt: now,
      updatedAt: now,
    });
  }
}

/**
 * Check if we should show the consent prompt to the user
 */
export function shouldShowPrompt(consent: LocationConsent): boolean {
  // Never show if already granted
  if (consent.status === 'granted') {
    return false;
  }
  
  // Never show if user explicitly chose "don't ask again"
  if (consent.dontAskAgain) {
    return false;
  }
  
  // Rate limit: max prompts reached
  if (consent.promptCount >= MAX_PROMPT_COUNT) {
    return false;
  }
  
  // Rate limit: check time since last prompt
  if (consent.lastPromptAt) {
    const lastPromptTime = consent.lastPromptAt instanceof Date 
      ? consent.lastPromptAt 
      : (consent.lastPromptAt as Timestamp).toDate();
    
    const hoursSinceLastPrompt = 
      (Date.now() - lastPromptTime.getTime()) / (1000 * 60 * 60);
    
    if (hoursSinceLastPrompt < MIN_HOURS_BETWEEN_PROMPTS) {
      return false;
    }
  }
  
  return true;
}

/**
 * Check if consent has been granted
 */
export function isConsentGranted(consent: LocationConsent): boolean {
  return consent.status === 'granted';
}

/**
 * Revoke previously granted consent
 */
export async function revokeConsent(userId: string): Promise<void> {
  await updateConsent(userId, 'revoked', true);
}

/**
 * Reset consent state (for testing/admin purposes)
 */
export async function resetConsent(userId: string): Promise<void> {
  const db = getDb();
  const docRef = doc(db, COLLECTION, userId);
  const now = serverTimestamp();
  
  await updateDoc(docRef, {
    consent: {
      status: 'pending',
      promptCount: 0,
      lastPromptAt: null,
      dontAskAgain: false,
    },
    updatedAt: now,
  });
}

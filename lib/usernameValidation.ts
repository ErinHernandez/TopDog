/**
 * Username Validation Utilities
 * 
 * Provides username validation, availability checking, and VIP reservation management.
 */

import { getAllowedCharacters, getLocaleDescription } from './localeCharacters';
import { 
  getFirestore,
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  deleteDoc,
  query, 
  where, 
  getDocs,
  serverTimestamp,
  Timestamp,
  type Firestore,
  type Query,
  type CollectionReference,
} from 'firebase/firestore';
import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { db } from './firebase';

// ============================================================================
// CONSTANTS
// ============================================================================

// Username validation rules
const USERNAME_MIN_LENGTH = 3;
const USERNAME_MAX_LENGTH = 18;

// Reserved usernames that cannot be used (system/platform names)
const RESERVED_USERNAMES = [
  'admin', 'administrator', 'mod', 'moderator', 'support', 'help', 'info',
  'system', 'root', 'guest', 'anonymous', 'user', 'test', 'demo',
  'newuser', 'newusername', 'user123', 'test123', 'demo123',
  'topdog', 'topdogdog', 'official', 'staff', 'team',
  'underdog', 'draftkings', 'fanduel', 'sleeper', 'yahoo',
] as const;

const VIP_RESERVATIONS_COLLECTION = 'vip_reservations';

// ============================================================================
// TYPES
// ============================================================================

/**
 * VIP Reservation Entry
 */
export interface VIPReservation {
  id: string;
  username: string;
  usernameLower: string;
  reservedFor: string;
  reservedBy: string;
  reservedAt: Date | Timestamp;
  expiresAt: Date | Timestamp | null;
  notes: string;
  claimed: boolean;
  claimedByUid: string | null;
  claimedAt: Date | Timestamp | null;
}

/**
 * Options for reserving a username for VIP
 */
export interface ReserveUsernameForVIPOptions {
  username: string;
  reservedFor: string;
  reservedBy: string;
  notes?: string;
  expiresAt?: Date | null;
}

/**
 * Result of VIP reservation operation
 */
export interface ReserveUsernameResult {
  success: boolean;
  error?: string;
  reservation?: VIPReservation;
}

/**
 * Bulk reservation entry
 */
export interface BulkReservationEntry {
  username: string;
  reservedFor: string;
  notes?: string;
  expiresAt?: Date;
}

/**
 * Bulk reservation result
 */
export interface BulkReservationResult {
  success: number;
  failed: Array<{ username: string; error: string }>;
}

/**
 * VIP reservation check result
 */
export interface VIPReservationCheckResult {
  isReserved: boolean;
  reservation?: VIPReservation;
  isExpired?: boolean;
}

/**
 * Username validation result
 */
export interface UsernameValidationResult {
  isValid: boolean;
  errors: string[];
  isVIPReserved?: boolean;
}

/**
 * Options for username validation
 */
export interface ValidateUsernameOptions {
  skipVIPCheck?: boolean;
}

/**
 * Options for checking username availability
 */
export interface CheckUsernameAvailabilityOptions {
  skipVIPCheck?: boolean;
  vipClaimUid?: string;
}

/**
 * Username availability check result
 */
export interface UsernameAvailabilityResult {
  isAvailable: boolean;
  message: string;
  isVIPReserved?: boolean;
  vipReservation?: VIPReservation;
}

/**
 * VIP reservation filters
 */
export interface VIPReservationFilters {
  claimedOnly?: boolean;
  unclaimedOnly?: boolean;
  expiredOnly?: boolean;
}

/**
 * VIP reservation statistics
 */
export interface VIPReservationStats {
  total: number;
  claimed: number;
  unclaimed: number;
  expired: number;
}

/**
 * Cleanup result
 */
export interface CleanupResult {
  removed: number;
  usernames: string[];
}

/**
 * Import result
 */
export interface ImportResult {
  imported: number;
  failed: number;
  error?: string;
}

/**
 * Username requirements
 */
export interface UsernameRequirements {
  minLength: number;
  maxLength: number;
  allowedCharacters: string;
  description: string;
  rules: string[];
}

// ============================================================================
// VIP RESERVATION FUNCTIONS
// ============================================================================

/**
 * Reserve a username for a VIP/influencer
 */
export async function reserveUsernameForVIP({
  username,
  reservedFor,
  reservedBy,
  notes = '',
  expiresAt = null,
}: ReserveUsernameForVIPOptions): Promise<ReserveUsernameResult> {
  if (!username || !reservedFor || !reservedBy) {
    return { success: false, error: 'Missing required fields: username, reservedFor, reservedBy' };
  }

  const normalizedUsername = username.toLowerCase().trim();
  
  // Validate username format
  const validation = validateUsername(normalizedUsername, 'US');
  if (!validation.isValid) {
    return { success: false, error: `Invalid username: ${validation.errors.join(', ')}` };
  }
  
  // Check if it's a system reserved name
  if (RESERVED_USERNAMES.includes(normalizedUsername.toLowerCase() as typeof RESERVED_USERNAMES[number])) {
    return { success: false, error: 'This username is a system reserved name' };
  }
  
  if (!db) {
    throw new Error('Firebase db not initialized');
  }
  
  try {
    // Check if already reserved in Firestore
    const vipRef = collection(db, VIP_RESERVATIONS_COLLECTION);
    const vipQuery = query(
      vipRef,
      where('usernameLower', '==', normalizedUsername),
      where('claimed', '==', false)
    );
    const vipSnapshot = await getDocs(vipQuery);
    
    if (!vipSnapshot.empty) {
      const existing = vipSnapshot.docs[0].data();
      return { 
        success: false, 
        error: `Username already reserved for: ${existing.reservedFor}` 
      };
    }
    
    // Create reservation in Firestore
    const reservationId = `vip_${normalizedUsername}_${Date.now()}`;
    const reservationRef = doc(db, VIP_RESERVATIONS_COLLECTION, reservationId);
    
    const reservation = {
      id: reservationId,
      username: normalizedUsername,
      usernameLower: normalizedUsername,
      reservedFor: reservedFor.trim(),
      reservedBy: reservedBy.trim(),
      reservedAt: serverTimestamp(),
      expiresAt: expiresAt ? Timestamp.fromDate(expiresAt) : null,
      notes: notes.trim(),
      claimed: false,
      claimedByUid: null,
      claimedAt: null,
    };
    
    await setDoc(reservationRef, reservation);
    
    return { 
      success: true, 
      reservation: {
        ...reservation,
        reservedAt: new Date(),
        expiresAt: expiresAt || null,
      } as VIPReservation
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Error reserving VIP username:', errorMessage);
    return { success: false, error: errorMessage };
  }
}

/**
 * Reserve multiple usernames for VIPs in bulk
 */
export async function bulkReserveUsernamesForVIP(
  reservations: BulkReservationEntry[],
  reservedBy: string
): Promise<BulkReservationResult> {
  const results: BulkReservationResult = { success: 0, failed: [] };
  
  for (const r of reservations) {
    const result = await reserveUsernameForVIP({
      username: r.username,
      reservedFor: r.reservedFor,
      reservedBy,
      notes: r.notes || '',
      expiresAt: r.expiresAt || null,
    });
    
    if (result.success) {
      results.success++;
    } else {
      results.failed.push({ username: r.username, error: result.error || 'Unknown error' });
    }
  }
  
  return results;
}

/**
 * Remove a VIP reservation
 */
export async function removeVIPReservation(
  username: string,
  removedBy: string
): Promise<{ success: boolean; error?: string }> {
  if (!db) {
    throw new Error('Firebase db not initialized');
  }
  const normalizedUsername = username.toLowerCase().trim();
  
  try {
    // Find reservation in Firestore
    const vipRef = collection(db, VIP_RESERVATIONS_COLLECTION);
    const vipQuery = query(
      vipRef,
      where('usernameLower', '==', normalizedUsername),
      where('claimed', '==', false)
    );
    const vipSnapshot = await getDocs(vipQuery);
    
    if (vipSnapshot.empty) {
      return { success: false, error: 'Username is not reserved' };
    }
    
    const reservationDoc = vipSnapshot.docs[0];
    const reservation = reservationDoc.data() as VIPReservation;
    
    if (reservation.claimed) {
      return { 
        success: false, 
        error: `Cannot remove - username already claimed by UID: ${reservation.claimedByUid}` 
      };
    }
    
    // Delete reservation
    await deleteDoc(reservationDoc.ref);
    console.log(`VIP reservation removed: ${normalizedUsername} by ${removedBy}`);
    
    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Error removing VIP reservation:', errorMessage);
    return { success: false, error: errorMessage };
  }
}

/**
 * Check if a username is reserved for a VIP
 */
export async function checkVIPReservation(username: string): Promise<VIPReservationCheckResult> {
  if (!db) {
    throw new Error('Firebase db not initialized');
  }
  const normalizedUsername = username.toLowerCase().trim();
  
  try {
    const vipRef = collection(db, VIP_RESERVATIONS_COLLECTION);
    const vipQuery = query(
      vipRef,
      where('usernameLower', '==', normalizedUsername),
      where('claimed', '==', false)
    );
    const vipSnapshot = await getDocs(vipQuery);
    
    if (vipSnapshot.empty) {
      return { isReserved: false };
    }
    
    const reservationDoc = vipSnapshot.docs[0];
    const data = reservationDoc.data();
    
    // Convert Firestore timestamps to Date objects
    const reservedAtValue = data.reservedAt;
    const expiresAtValue = data.expiresAt;
    const claimedAtValue = data.claimedAt;
    
    const reservation: VIPReservation = {
      ...data,
      reservedAt: reservedAtValue instanceof Timestamp ? reservedAtValue.toDate() : (reservedAtValue as Date),
      expiresAt: expiresAtValue ? (expiresAtValue instanceof Timestamp ? expiresAtValue.toDate() : (expiresAtValue as Date)) : null,
      claimedAt: claimedAtValue ? (claimedAtValue instanceof Timestamp ? claimedAtValue.toDate() : (claimedAtValue as Date)) : null,
    } as VIPReservation;
    
    // Check if reservation has expired
    if (reservation.expiresAt) {
      const expiresAtDate = reservation.expiresAt instanceof Date 
        ? reservation.expiresAt 
        : reservation.expiresAt instanceof Timestamp 
          ? reservation.expiresAt.toDate()
          : new Date(reservation.expiresAt);
      if (new Date() > expiresAtDate) {
        return { isReserved: false, isExpired: true, reservation };
      }
    }
    
    return { isReserved: true, reservation };
  } catch (error) {
    console.error('Error checking VIP reservation:', error);
    return { isReserved: false };
  }
}

/**
 * Claim a reserved username for a VIP
 */
export async function claimVIPUsername(
  username: string,
  uid: string,
  verificationCode: string | null = null
): Promise<{ success: boolean; error?: string }> {
  const normalizedUsername = username.toLowerCase().trim();
  
  try {
    const check = await checkVIPReservation(normalizedUsername);
    
    if (!check.isReserved) {
      return { success: false, error: 'Username is not reserved for VIP' };
    }
    
    if (check.reservation?.claimed) {
      return { success: false, error: 'Username has already been claimed' };
    }
    
    if (!db) {
      throw new Error('Firebase db not initialized');
    }
    
    // Update the reservation in Firestore
    const vipRef = collection(db, VIP_RESERVATIONS_COLLECTION);
    const vipQuery = query(
      vipRef,
      where('usernameLower', '==', normalizedUsername),
      where('claimed', '==', false)
    );
    const vipSnapshot = await getDocs(vipQuery);
    
    if (vipSnapshot.empty) {
      return { success: false, error: 'Reservation not found' };
    }
    
    const reservationRef = vipSnapshot.docs[0].ref;
    await setDoc(reservationRef, {
      claimed: true,
      claimedByUid: uid,
      claimedAt: serverTimestamp(),
    }, { merge: true });
    
    console.log(`VIP username claimed: ${normalizedUsername} by UID: ${uid}`);
    
    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Error claiming VIP username:', errorMessage);
    return { success: false, error: errorMessage };
  }
}

/**
 * Get all VIP reservations
 */
export async function getAllVIPReservations(
  filters: VIPReservationFilters = {}
): Promise<VIPReservation[]> {
  if (!db) {
    throw new Error('Firebase db not initialized');
  }
  try {
    const vipRef = collection(db, VIP_RESERVATIONS_COLLECTION);
    let vipQuery: Query | CollectionReference = vipRef;
    
    // Apply filters
    if (filters.claimedOnly) {
      vipQuery = query(vipRef, where('claimed', '==', true));
    } else if (filters.unclaimedOnly) {
      vipQuery = query(vipRef, where('claimed', '==', false));
    }
    
    const vipSnapshot = await getDocs(vipQuery);
    const now = new Date();
    
    const reservations = vipSnapshot.docs.map(doc => {
      const data = doc.data();
      const reservedAtValue = data.reservedAt;
      const expiresAtValue = data.expiresAt;
      const claimedAtValue = data.claimedAt;
      
      return {
        ...data,
        reservedAt: reservedAtValue instanceof Timestamp ? reservedAtValue.toDate() : (reservedAtValue as Date),
        expiresAt: expiresAtValue ? (expiresAtValue instanceof Timestamp ? expiresAtValue.toDate() : (expiresAtValue as Date)) : null,
        claimedAt: claimedAtValue ? (claimedAtValue instanceof Timestamp ? claimedAtValue.toDate() : (claimedAtValue as Date)) : null,
      } as VIPReservation;
    });
    
    return reservations.filter(r => {
      if (filters.expiredOnly) {
        if (!r.expiresAt) return false;
        const expiresAtDate = r.expiresAt instanceof Date 
          ? r.expiresAt 
          : r.expiresAt instanceof Timestamp 
            ? r.expiresAt.toDate()
            : new Date(r.expiresAt);
        if (now <= expiresAtDate) return false;
      }
      return true;
    });
  } catch (error) {
    console.error('Error getting VIP reservations:', error);
    return [];
  }
}

/**
 * Get VIP reservation statistics
 */
export async function getVIPReservationStats(): Promise<VIPReservationStats> {
  try {
    const reservations = await getAllVIPReservations();
    const now = new Date();
    
    return {
      total: reservations.length,
      claimed: reservations.filter(r => r.claimed).length,
      unclaimed: reservations.filter(r => !r.claimed).length,
      expired: reservations.filter(r => {
        if (!r.expiresAt || r.claimed) return false;
        const expiresAtDate = r.expiresAt instanceof Date 
          ? r.expiresAt 
          : r.expiresAt instanceof Timestamp 
            ? r.expiresAt.toDate()
            : new Date(r.expiresAt);
        return now > expiresAtDate;
      }).length,
    };
  } catch (error) {
    console.error('Error getting VIP reservation stats:', error);
    return {
      total: 0,
      claimed: 0,
      unclaimed: 0,
      expired: 0,
    };
  }
}

/**
 * Clean up expired unclaimed reservations
 */
export async function cleanupExpiredVIPReservations(): Promise<CleanupResult> {
  if (!db) {
    throw new Error('Firebase db not initialized');
  }
  try {
    const unclaimed = await getAllVIPReservations({ unclaimedOnly: true });
    const now = new Date();
    const removed: string[] = [];
    
    for (const reservation of unclaimed) {
      if (reservation.expiresAt) {
        const expiresAtDate = reservation.expiresAt instanceof Date 
          ? reservation.expiresAt 
          : reservation.expiresAt instanceof Timestamp 
            ? reservation.expiresAt.toDate()
            : new Date(reservation.expiresAt);
        if (now > expiresAtDate) {
          if (!db) {
            throw new Error('Firebase db not initialized');
          }
          // Delete from Firestore
          const vipRef = collection(db, VIP_RESERVATIONS_COLLECTION);
          const vipQuery = query(
            vipRef,
            where('usernameLower', '==', reservation.usernameLower),
            where('claimed', '==', false)
          );
          const vipSnapshot = await getDocs(vipQuery);
          
          if (!vipSnapshot.empty) {
            await deleteDoc(vipSnapshot.docs[0].ref);
            removed.push(reservation.username);
          }
        }
      }
    }
    
    return { removed: removed.length, usernames: removed };
  } catch (error) {
    console.error('Error cleaning up expired VIP reservations:', error);
    return { removed: 0, usernames: [] };
  }
}

/**
 * Export VIP reservations to JSON (for backup/migration)
 */
export async function exportVIPReservations(): Promise<string> {
  try {
    const reservations = await getAllVIPReservations();
    return JSON.stringify(reservations, null, 2);
  } catch (error) {
    console.error('Error exporting VIP reservations:', error);
    return JSON.stringify([], null, 2);
  }
}

/**
 * Import VIP reservations from JSON (for backup/migration)
 */
export async function importVIPReservations(json: string): Promise<ImportResult> {
  try {
    const entries = JSON.parse(json) as VIPReservation[];
    let imported = 0;
    let failed = 0;
    
    for (const reservation of entries) {
      try {
        // Check if already exists
        const check = await checkVIPReservation(reservation.username || reservation.usernameLower);
        if (check.isReserved) {
          failed++;
          continue;
        }
        
        // Import reservation
        const result = await reserveUsernameForVIP({
          username: reservation.username || reservation.usernameLower,
          reservedFor: reservation.reservedFor,
          reservedBy: reservation.reservedBy || 'import',
          notes: reservation.notes || '',
          expiresAt: reservation.expiresAt ? (
            reservation.expiresAt instanceof Date 
              ? reservation.expiresAt 
              : reservation.expiresAt instanceof Timestamp 
                ? reservation.expiresAt.toDate()
                : new Date(reservation.expiresAt)
          ) : null,
        });
        
        if (result.success) {
          imported++;
        } else {
          failed++;
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`Error importing reservation for ${reservation.username}:`, errorMessage);
        failed++;
      }
    }
    
    return { imported, failed };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Error importing VIP reservations:', errorMessage);
    return { imported: 0, failed: 0, error: errorMessage };
  }
}

// ============================================================================
// USERNAME VALIDATION
// ============================================================================

/**
 * Validate username format (client-side validation)
 * Does NOT check availability or VIP reservations - those require server calls
 */
export function validateUsername(
  username: string,
  countryCode: string = 'US',
  options: ValidateUsernameOptions = {}
): UsernameValidationResult {
  const errors: string[] = [];
  let isVIPReserved = false;
  
  // Check length
  if (!username || username.length < USERNAME_MIN_LENGTH) {
    errors.push(`Username must be at least ${USERNAME_MIN_LENGTH} characters long`);
  }
  
  if (username && username.length > USERNAME_MAX_LENGTH) {
    errors.push(`Username must be no more than ${USERNAME_MAX_LENGTH} characters long`);
  }
  
  // Check if username is system reserved
  if (username && RESERVED_USERNAMES.includes(username.toLowerCase() as typeof RESERVED_USERNAMES[number])) {
    errors.push('This username is reserved and cannot be used');
  }
  
  // Get allowed characters for the country
  const allowedChars = getAllowedCharacters(countryCode);
  
  // Check each character
  if (username) {
    for (let i = 0; i < username.length; i++) {
      const char = username[i];
      if (!allowedChars.includes(char)) {
        errors.push(`Character '${char}' is not allowed in usernames for your country`);
        break; // Only show first invalid character error
      }
    }
  }
  
  // Check for any spaces (not allowed)
  if (username && username.includes(' ')) {
    errors.push('Username cannot contain any spaces');
  }
  
  return {
    isValid: errors.length === 0,
    errors: errors,
    isVIPReserved,
  };
}

/**
 * Check if username is available (database + VIP reservation check)
 */
export async function checkUsernameAvailability(
  username: string,
  options: CheckUsernameAvailabilityOptions = {}
): Promise<UsernameAvailabilityResult> {
  try {
    const normalizedUsername = username.toLowerCase().trim();
    
    // Check VIP reservations first (unless skipped)
    if (!options.skipVIPCheck) {
      const vipCheck = await checkVIPReservation(normalizedUsername);
      
      if (vipCheck.isReserved && !vipCheck.reservation?.claimed) {
        // Username is reserved for a VIP
        // If a vipClaimUid is provided, this might be the VIP claiming their username
        if (options.vipClaimUid) {
          // Allow VIP to proceed - actual claim happens during registration
          return {
            isAvailable: true,
            message: 'Username is reserved for you',
            isVIPReserved: true,
            vipReservation: vipCheck.reservation,
          };
        }
        
        return {
          isAvailable: false,
          message: 'This username is reserved',
          isVIPReserved: true,
        };
      }
    }
    
    // Check database for existing users
    if (!db) {
      return {
        isAvailable: false,
        message: 'Database not available',
      };
    }
    
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('username', '==', normalizedUsername));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      return {
        isAvailable: false,
        message: 'Username is already taken'
      };
    }
    
    // Also check the usernames collection (for reserved usernames)
    const usernamesRef = collection(db, 'usernames');
    const usernameDoc = await getDocs(query(usernamesRef, where('username', '==', normalizedUsername)));
    
    if (!usernameDoc.empty) {
      return {
        isAvailable: false,
        message: 'Username is already taken'
      };
    }
    
    return {
      isAvailable: true,
      message: 'Username is available'
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Error checking username availability:', errorMessage);
    return {
      isAvailable: false,
      message: 'Error checking username availability'
    };
  }
}

/**
 * Get username requirements for a country
 */
export function getUsernameRequirements(countryCode: string = 'US'): UsernameRequirements {
  const description = getLocaleDescription(countryCode);
  return {
    minLength: USERNAME_MIN_LENGTH,
    maxLength: USERNAME_MAX_LENGTH,
    allowedCharacters: getAllowedCharacters(countryCode),
    description: description,
    rules: [
      `Must be ${USERNAME_MIN_LENGTH}-${USERNAME_MAX_LENGTH} characters long`,
      'Cannot contain any spaces',
      'Cannot be a reserved username',
      `Character set: ${description}`
    ]
  };
}

/**
 * Sanitize username (remove extra spaces, etc.)
 */
export function sanitizeUsername(username: string): string {
  if (!username) return '';
  
  // Remove leading/trailing spaces and replace multiple spaces with single space
  return username.trim().replace(/\s+/g, ' ');
}

/**
 * Format username for display (capitalize first letter)
 */
export function formatUsername(username: string): string {
  if (!username) return '';
  
  const sanitized = sanitizeUsername(username);
  return sanitized.charAt(0).toUpperCase() + sanitized.slice(1).toLowerCase();
}
